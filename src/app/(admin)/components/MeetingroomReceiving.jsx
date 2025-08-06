import React, { useEffect, useState, useRef } from "react"; // Import useRef
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./../../../../script/firebaseConfig";
import { sendMeetingAcceptanceEmail, sendRejectionEmail } from "../utils/email";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Chip,
  Grid,
  Card,
  CardContent,
  Fade,
  Zoom,
  LinearProgress,
  Alert,
  Divider
} from "@mui/material";
import { 
  Save, 
  Close, 
  Event, 
  Schedule, 
  InfoOutlined,
  MeetingRoom,
  Refresh,
  TrendingUp,
  People,
  CheckCircle,
  Warning,
  Error,
  AccessTime
} from "@mui/icons-material";

import RejectReasonModal from "./RejectReason";

// Utility to truncate a Date to minutes (zero out seconds and ms)
function truncateToMinutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

// Normalize Firestore Timestamp or string to "YYYY-MM-DD"
function normalizeDateField(date) {
  if (!date) return "";
  if (typeof date === "object" && "seconds" in date) {
    const d = new Date(date.seconds * 1000);
    return d.toISOString().split("T")[0];
  }
  if (typeof date === "string") return date;
  return "";
}

// Normalize Firestore Timestamp or string to "HH:mm" (24-hour format)
function normalizeTimeField(time) {
  if (!time) return "";
  if (typeof time === "object" && "seconds" in time) {
    const d = new Date(time.seconds * 1000);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof time === "string") return time;
  return "";
}

// Helper: create a local Date from date string (YYYY-MM-DD) and time string (HH:MM)
function getLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, min] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, min, 0, 0);
}

// Helper to check if now between from_time and to_time (all in local time and at minute precision)
const isCurrentMeeting = (res, nowLocal) => {
  if (res.status !== "accepted" || !res.date || !res.from_time || !res.to_time) return false;
  const dateStr = res.date;
  const fromTimeStr = res.from_time;
  const toTimeStr = res.to_time;

  const start = getLocalDateTime(dateStr, fromTimeStr);
  const end = getLocalDateTime(dateStr, toTimeStr);

  if (!start || !end) return false;

  const nowMin = truncateToMinutes(nowLocal);
  const startMin = truncateToMinutes(start);
  const endMin = truncateToMinutes(end);

  return nowMin >= startMin && nowMin < endMin;
};

// Helper to check if a meeting should be marked as done (now >= end time)
function shouldBeDone(res, nowLocal) {
  if (res.status !== "accepted" || !res.date || !res.from_time || !res.to_time) return false;
  const dateStr = res.date;
  const toTimeStr = res.to_time;

  const end = getLocalDateTime(dateStr, toTimeStr);
  const nowMin = truncateToMinutes(nowLocal);
  return nowMin >= end;
}

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);
  const [reservationToReject, setReservationToReject] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, data: null });
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use a ref to store the "current" local time, updated periodically
  const nowLocalRef = useRef(truncateToMinutes(new Date()));

  const itemsPerPage = 10;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Function to fetch and update reservations
  const fetchAndUpdateReservations = async () => {
    setIsRefreshing(true);
    try {
    const snapshot = await getDocs(collection(db, "meeting room"));
    const docs = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        date: normalizeDateField(d.date),
        from_time: normalizeTimeField(d.from_time),
        to_time: normalizeTimeField(d.to_time),
        // Normalize requestDate here
        requestDate: d.requestDate ? new Date(d.requestDate.seconds * 1000).toLocaleString() : "-",
      };
    });

    const updates = [];
    docs.forEach((res) => {
      // Check against the current time from the ref
      if (shouldBeDone(res, nowLocalRef.current) && res.status === "accepted") {
        updates.push(
          updateDoc(doc(db, "meeting room", res.id), { status: "done" })
        );
        res.status = "done";
      }
    });
    if (updates.length > 0) await Promise.all(updates);

    setReservations(docs);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAndUpdateReservations();

    // Set up a timer to update current time and refetch data periodically
    // For example, every minute to check for ongoing/done meetings
    const intervalId = setInterval(() => {
      nowLocalRef.current = truncateToMinutes(new Date()); // Update the ref
      // Re-run the fetch and update to re-evaluate meeting statuses
      fetchAndUpdateReservations();
    }, 60 * 1000); // Every 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this effect runs once on mount

  const handleEdit = (res) => {
    setEditId(res.id);
    setEditedData(res);
  };

  const handleSave = async () => {
    await updateDoc(doc(db, "meeting room", editId), editedData);
    setReservations((prev) =>
      prev.map((r) => (r.id === editId ? { ...editedData, id: editId } : r))
    );
    setEditId(null);
    setEditedData({});
  };

  const handleCancel = () => {
    setEditId(null);
    setEditedData({});
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  // Filter reservations using the current time from the ref
  const filteredReservations = reservations.filter((res) => {
    if (tabValue === 0) {
      return res.status === "accepted" && !isCurrentMeeting(res, nowLocalRef.current) && res.status !== "done";
    } else if (tabValue === 1) {
      return res.status === "pending";
    } else if (tabValue === 2) {
      return res.status === "accepted" && isCurrentMeeting(res, nowLocalRef.current);
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const handleAccept = async (res) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "meeting room", res.id), { status: "accepted" });
      await sendMeetingAcceptanceEmail(res);
      setReservations((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, status: "accepted" } : r))
      );
      alert("Meeting accepted and client notified!");
    } catch (error) {
      console.error("Error accepting meeting:", error);
      alert(error.message || "Failed to accept meeting or send notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejectReasonModal = (res) => {
    setReservationToReject(res);
    setRejectReasonModalOpen(true);
  };

  const handleCloseRejectReasonModal = () => {
    setRejectReasonModalOpen(false);
    setReservationToReject(null);
  };

  const handleConfirmReject = async (reason) => {
    if (!reservationToReject) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "meeting room", reservationToReject.id), {
        status: "rejected",
        rejectionReason: reason
      });
      await sendRejectionEmail(reservationToReject, reason);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationToReject.id
            ? { ...r, status: "rejected", rejectionReason: reason }
            : r
        )
      );
      alert("Meeting rejected and client notified with reason.");
    } catch (error) {
      console.error("Error rejecting meeting:", error);
      alert(error.message || "Failed to reject meeting or send notification.");
    } finally {
      handleCloseRejectReasonModal();
      setIsSubmitting(false);
    }
  };

  // New function to handle cancellation
  const handleOpenCancelConfirmation = (res) => {
    setReservationToCancel(res);
    setCancelConfirmationOpen(true);
  };

  const handleCloseCancelConfirmation = () => {
    setCancelConfirmationOpen(false);
    setReservationToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!reservationToCancel) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "meeting room", reservationToCancel.id), { status: "pending" });
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationToCancel.id ? { ...r, status: "pending" } : r
        )
      );
      alert("Meeting status changed to pending.");
    } catch (error) {
      console.error("Error canceling meeting:", error);
      alert(error.message || "Failed to change meeting status to pending.");
    } finally {
      handleCloseCancelConfirmation();
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = (data) => setDetailsDialog({ open: true, data });
  const handleCloseDetails = () => setDetailsDialog({ open: false, data: null });

  // Calculate statistics
  const stats = {
    total: reservations.length,
    accepted: reservations.filter(r => r.status === "accepted" && !isCurrentMeeting(r, nowLocalRef.current) && r.status !== "done").length,
    pending: reservations.filter(r => r.status === "pending").length,
    ongoing: reservations.filter(r => r.status === "accepted" && isCurrentMeeting(r, nowLocalRef.current)).length,
    done: reservations.filter(r => r.status === "done").length,
    rejected: reservations.filter(r => r.status === "rejected").length
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MeetingRoom sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Meeting Room Management
      </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Manage and monitor all meeting room reservations
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAndUpdateReservations}
            disabled={isRefreshing}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 2
              }
            }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Stack>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={300}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Reservations
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={400}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.accepted}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Accepted
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={500}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Warning sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={600}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  color: 'text.primary',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <AccessTime sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.ongoing}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Ongoing
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={700}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  color: 'text.primary',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.done}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Fade in timeout={800}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Error sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Tabs */}
      <Paper 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: 2,
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          sx={{
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Schedule />
                <Box>
                  <Typography variant="body2">Accepted Meetings</Typography>
                  <Chip 
                    label={stats.accepted} 
                    size="small" 
                    color="primary" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Stack>
            }
            iconPosition="start"
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Event />
                <Box>
                  <Typography variant="body2">Meeting Requests</Typography>
                  <Chip 
                    label={stats.pending} 
                    size="small" 
                    color="warning" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Stack>
            }
            iconPosition="start"
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTime />
                <Box>
                  <Typography variant="body2">Ongoing Meeting</Typography>
                  <Chip 
                    label={stats.ongoing} 
                    size="small" 
                    color="info" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </Stack>
            }
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Enhanced Table */}
      <Zoom in timeout={300}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            boxShadow: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
        <Table
          sx={{
            borderCollapse: "collapse",
              minWidth: isMobile ? 300 : 900,
              "& .MuiTableCell-root": { 
                border: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem'
              },
              "& .MuiTableHead-root .MuiTableCell-root": { 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center'
              },
              "& .MuiTableRow-root:hover": {
                backgroundColor: theme.palette.action.hover,
                transition: 'background-color 0.2s ease'
              }
          }}
        >
          <TableHead>
            <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Guests</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((res) => {
              let chipLabel = "-";
              let chipColor = "default";
                let chipVariant = "outlined";
                
              if (res.status === "accepted" && !isCurrentMeeting(res, nowLocalRef.current)) {
                chipLabel = "Accepted";
                chipColor = "success";
                  chipVariant = "filled";
              } else if (res.status === "pending") {
                chipLabel = "Pending";
                chipColor = "warning";
                  chipVariant = "filled";
              } else if (res.status === "accepted" && isCurrentMeeting(res, nowLocalRef.current)) {
                chipLabel = "Ongoing";
                chipColor = "info";
                  chipVariant = "filled";
                } else if (res.status === "done") {
                chipLabel = "Done";
                chipColor = "primary";
                  chipVariant = "filled";
              } else if (res.status === "rejected") {
                chipLabel = "Rejected";
                chipColor = "error";
                  chipVariant = "filled";
              }

              return (
                  <Zoom in timeout={200} key={res.id}>
                    <TableRow hover selected={editId === res.id}>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        value={editedData.name || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, name: e.target.value })
                        }
                        size="small"
                            sx={{ minWidth: 120 }}
                      />
                    ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {res.name}
                          </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        value={editedData.email || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, email: e.target.value })
                        }
                        size="small"
                            sx={{ minWidth: 150 }}
                      />
                    ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {res.email}
                          </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        value={editedData.room || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, room: e.target.value })
                        }
                        size="small"
                            sx={{ minWidth: 100 }}
                      />
                    ) : (
                          <Chip 
                            label={res.room || "-"} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        type="date"
                        value={editedData.date || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, date: e.target.value })
                        }
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : res.date ? (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(res.date + 'T00:00:00').toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                            })}
                          </Typography>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        type="time"
                        value={editedData.from_time || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, from_time: e.target.value })
                        }
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {res.from_time || "-"}
                          </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        type="time"
                        value={editedData.to_time || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, to_time: e.target.value })
                        }
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {res.to_time || "-"}
                          </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        value={editedData.duration || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, duration: e.target.value })
                        }
                        size="small"
                      />
                    ) : res.duration ? (
                          <Chip 
                            label={res.duration} 
                            size="small" 
                            variant="outlined"
                            color="secondary"
                          />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                            variant="outlined"
                        value={editedData.guests || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, guests: e.target.value })
                        }
                        size="small"
                      />
                    ) : (
                          <Chip 
                            label={
                      Array.isArray(res.guests)
                        ? res.guests.length
                        : (typeof res.guests === "string"
                          ? res.guests.split(",").filter(Boolean).length
                          : 0)
                            } 
                            size="small" 
                            variant="outlined"
                            color="default"
                            icon={<People sx={{ fontSize: 16 }} />}
                          />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={chipLabel}
                      color={chipColor}
                          variant={chipVariant}
                      size="small"
                          sx={{ 
                            fontWeight: 600,
                            minWidth: 80
                          }}
                    />
                  </TableCell>
                  <TableCell align="center">
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    {res.requestDate || "-"}
                        </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Save Changes">
                          <IconButton
                            color="success"
                            onClick={handleSave}
                            size="small"
                                sx={{ 
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'success.dark' }
                                }}
                          >
                            <Save />
                          </IconButton>
                        </Tooltip>
                            <Tooltip title="Cancel Edit">
                          <IconButton
                                color="error"
                            onClick={handleCancel}
                            size="small"
                                sx={{ 
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'error.dark' }
                                }}
                          >
                            <Close />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {tabValue === 1 && res.status === "pending" && (
                          <>
                              <Button
                                color="success"
                                onClick={() => handleAccept(res)}
                                size="small"
                                variant="contained"
                                  startIcon={<CheckCircle />}
                                  sx={{ 
                                    minWidth: 0, 
                                    px: 2, 
                                    fontSize: "0.75rem", 
                                    textTransform: "none",
                                    borderRadius: 2,
                                    fontWeight: 600
                                  }}
                                disabled={isSubmitting}
                              >
                                Accept
                              </Button>
                              <Button
                                color="error"
                                onClick={() => handleOpenRejectReasonModal(res)}
                                size="small"
                                variant="contained"
                                  startIcon={<Error />}
                                sx={{
                                  minWidth: 0,
                                  px: 2,
                                    fontSize: "0.75rem",
                                  textTransform: "none",
                                    borderRadius: 2,
                                    fontWeight: 600
                                }}
                                disabled={isSubmitting}
                              >
                                Reject
                              </Button>
                          </>
                        )}
                        {tabValue === 0 && res.status === "accepted" && !isCurrentMeeting(res, nowLocalRef.current) && (
                            <Button
                              color="error"
                              onClick={() => handleOpenCancelConfirmation(res)}
                              size="small"
                              variant="contained"
                                startIcon={<Close />}
                                sx={{ 
                                  minWidth: 0, 
                                  px: 2, 
                                  fontSize: "0.75rem", 
                                  textTransform: "none",
                                  borderRadius: 2,
                                  fontWeight: 600
                                }}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                        )}
                        {(tabValue === 0 || tabValue === 1) && (
                              <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDetails(res)}
                              size="small"
                                  sx={{ 
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' }
                                  }}
                            >
                              <InfoOutlined />
                            </IconButton>
                          </Tooltip>
                        )}
                          <Button
                            color="warning"
                            onClick={() => handleEdit(res)}
                            size="small"
                            variant="contained"
                              startIcon={<Save />}
                              sx={{ 
                                minWidth: 0, 
                                px: 2, 
                                fontSize: "0.75rem", 
                                textTransform: "none",
                                borderRadius: 2,
                                fontWeight: 600
                              }}
                          >
                            Edit
                          </Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
                  </Zoom>
              );
            })}
            {currentItems.length === 0 && (
              <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <Stack spacing={2} alignItems="center">
                      <Event sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        No reservations found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                    No reservations found for this category.
                  </Typography>
                    </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Zoom>

      {/* Enhanced Pagination */}
      {filteredReservations.length > 0 && (
        <Stack direction="row" justifyContent="center" mt={4}>
          <Paper sx={{ borderRadius: 3, px: 2, py: 1 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, val) => setCurrentPage(val)}
            color="primary"
            showFirstButton
            showLastButton
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 600
                }
              }}
            />
          </Paper>
        </Stack>
      )}

      {/* Enhanced Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={handleCloseDetails} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 6
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <InfoOutlined />
          Reservation Details
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {detailsDialog.data && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Name
              </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.name || "-"}
              </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
              </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.email || "-"}
              </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Room
              </Typography>
                  <Chip 
                    label={detailsDialog.data.room || "-"} 
                    color="primary" 
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date
              </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.date ? new Date(detailsDialog.data.date + 'T00:00:00').toLocaleDateString("en-US") : "-"}
              </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    From Time
              </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.from_time || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    To Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.to_time || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Duration
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.duration || "-"} 
                    color="secondary" 
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cost
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {detailsDialog.data.totalCost || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Guests
                  </Typography>
                  <Typography variant="body1">
                    {
                  Array.isArray(detailsDialog.data.guests)
                    ? detailsDialog.data.guests.join(", ")
                    : (typeof detailsDialog.data.guests === "string"
                      ? detailsDialog.data.guests
                      : "-")
                }
              </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
              </Typography>
                  <Chip 
                    label={detailsDialog.data.status || "-"} 
                    color={
                      detailsDialog.data.status === "accepted" ? "success" :
                      detailsDialog.data.status === "pending" ? "warning" :
                      detailsDialog.data.status === "rejected" ? "error" :
                      "default"
                    }
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Request Date
              </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {detailsDialog.data.requestDate || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDetails} 
            color="primary" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Cancel Confirmation Dialog */}
      <Dialog
        open={cancelConfirmationOpen}
        onClose={handleCloseCancelConfirmation}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 6
          }
        }}
      >
        <DialogTitle 
          id="cancel-dialog-title"
          sx={{ 
            bgcolor: 'warning.main', 
            color: 'white',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Warning />
          Confirm Cancellation
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText id="cancel-dialog-description" sx={{ fontSize: '1rem' }}>
            Are you sure you want to change this meeting's status to "Pending"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseCancelConfirmation} 
            color="primary" 
            variant="outlined"
            disabled={isSubmitting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            No, Keep
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained"
            autoFocus 
            disabled={isSubmitting}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Yes, Change to Pending
          </Button>
        </DialogActions>
      </Dialog>

      <RejectReasonModal
        open={rejectReasonModalOpen}
        onClose={handleCloseRejectReasonModal}
        onConfirm={handleConfirmReject}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

export default AdminDashboard;