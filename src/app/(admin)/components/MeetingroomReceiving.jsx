import React, { useEffect, useState, useRef } from "react";
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
  Button,
  TextField,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Zoom,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar
} from "@mui/material";
import { 
  Save,
  Event,
  Schedule,
  Close,
  MeetingRoom,
  TrendingUp,
  People,
  CheckCircle,
  Warning,
  Error,
  AccessTime
} from "@mui/icons-material";
import { grey } from "@mui/material/colors";

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

  const getChipProps = (status, isCurrent) => {
    const statusMap = {
      accepted: { label: isCurrent ? "Ongoing" : "Accepted", color: isCurrent ? "info" : "success" },
      pending: { label: "Pending", color: "warning" },
      done: { label: "Done", color: "primary" },
      rejected: { label: "Rejected", color: "error" }
    };
    
    const props = statusMap[status] || { label: "-", color: "default" };
    return { ...props, variant: "filled" };
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, width: "100%" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <MeetingRoom sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Meeting Room Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and monitor all meeting room reservations
            </Typography>
          </Box>
        </Stack>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reservations
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <TrendingUp sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.accepted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accepted
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <CheckCircle sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <Warning sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.ongoing}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ongoing
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <AccessTime sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.done}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <CheckCircle sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card 
              elevation={0} 
              sx={{ 
                backgroundColor: 'background.paper',
                border: `1px solid ${grey[200]}`,
                borderRadius: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: grey[100], width: 40, height: 40 }}>
                    <Error sx={{ fontSize: 20, color: grey[800] }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Tabs */}
      <Card elevation={0} sx={{ border: `1px solid ${grey[200]}`, borderRadius: 1, mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ 
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': {
                fontWeight: 600,
              }
            }
          }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Schedule fontSize="small" />
                <span>Accepted Meetings</span>
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Event fontSize="small" />
                <span>Meeting Requests</span>
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTime fontSize="small" />
                <span>Ongoing Meeting</span>
              </Stack>
            } 
          />
        </Tabs>
      </Card>

      {/* Enhanced Table */}
      <Card elevation={0} sx={{ border: `1px solid ${grey[200]}`, borderRadius: 1, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: grey[50] }}>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Client Name
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Contact Info
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Phone
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Company
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Room
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Date
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Time
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Duration
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Guests
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Purpose
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Equipment
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Refreshments
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Special Request
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Notes
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Priority
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Category
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Setup Type
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Follow-up
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Status
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3, borderBottom: `1px solid ${grey[200]}` }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {currentItems.map((res) => {
              const getChipProps = (status, isCurrent) => {
                const statusMap = {
                  accepted: { label: isCurrent ? "Ongoing" : "Accepted", color: isCurrent ? "info" : "success" },
                  pending: { label: "Pending", color: "warning" },
                  done: { label: "Done", color: "primary" },
                  rejected: { label: "Rejected", color: "error" }
                };
                
                const props = statusMap[status] || { label: "-", color: "default" };
                return { ...props, variant: "filled" };
              };

              const chipProps = getChipProps(res.status, isCurrentMeeting(res, nowLocalRef.current));

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
                        value={editedData.phone || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, phone: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 120 }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {res.phone || "Not provided"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        value={editedData.company || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, company: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Chip 
                        label={res.company || "Individual"} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                      />
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
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        value={editedData.purpose || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, purpose: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Chip 
                        label={res.purpose || "Not specified"}
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
                        value={editedData.equipment || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, equipment: e.target.value })
                        }
                        size="small"
                        multiline
                        rows={2}
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={res.equipment || "No equipment needed"}
                      >
                        {res.equipment || "No equipment needed"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        value={editedData.refreshments || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, refreshments: e.target.value })
                        }
                        size="small"
                        multiline
                        rows={2}
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={res.refreshments || "No refreshments requested"}
                      >
                        {res.refreshments || "No refreshments requested"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        value={editedData.specialRequest || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, specialRequest: e.target.value })
                        }
                        size="small"
                        multiline
                        rows={2}
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={res.specialRequest || "No special request"}
                      >
                        {res.specialRequest || "No special request"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        value={editedData.notes || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, notes: e.target.value })
                        }
                        size="small"
                        multiline
                        rows={2}
                        sx={{ minWidth: 150 }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={res.notes || "No notes"}
                      >
                        {res.notes || "No notes"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        select
                        value={editedData.priority || "Medium"}
                        onChange={(e) =>
                          setEditedData({ ...editedData, priority: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </TextField>
                    ) : (
                      <Chip 
                        label={res.priority || "Medium"}
                        size="small" 
                        variant="filled"
                        color={
                          res.priority === "Urgent" ? "error" :
                          res.priority === "High" ? "warning" :
                          res.priority === "Low" ? "default" : "info"
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        select
                        value={editedData.category || "General"}
                        onChange={(e) =>
                          setEditedData({ ...editedData, category: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <option value="General">General</option>
                        <option value="Business">Business</option>
                        <option value="Training">Training</option>
                        <option value="Interview">Interview</option>
                        <option value="Presentation">Presentation</option>
                        <option value="Conference">Conference</option>
                      </TextField>
                    ) : (
                      <Chip 
                        label={res.category || "General"}
                        size="small" 
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        select
                        value={editedData.setupType || "Standard"}
                        onChange={(e) =>
                          setEditedData({ ...editedData, setupType: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Theater">Theater</option>
                        <option value="Classroom">Classroom</option>
                        <option value="U-Shape">U-Shape</option>
                        <option value="Boardroom">Boardroom</option>
                        <option value="Cocktail">Cocktail</option>
                      </TextField>
                    ) : (
                      <Chip 
                        label={res.setupType || "Standard"}
                        size="small" 
                        variant="outlined"
                        color="success"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editId === res.id ? (
                      <TextField
                        variant="outlined"
                        select
                        value={editedData.followUp || "No"}
                        onChange={(e) =>
                          setEditedData({ ...editedData, followUp: e.target.value })
                        }
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                        <option value="Pending">Pending</option>
                      </TextField>
                    ) : (
                      <Chip 
                        label={res.followUp || "No"}
                        size="small" 
                        variant="filled"
                        color={
                          res.followUp === "Yes" ? "success" :
                          res.followUp === "Pending" ? "warning" : "default"
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={chipProps.label}
                      color={chipProps.color}
                      variant={chipProps.variant}
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
                              <MeetingRoom />
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
                <TableCell colSpan={20} align="center" sx={{ py: 8 }}>
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
      
      {/* Pagination */}
      {filteredReservations.length > 0 && (
        <Box sx={{ p: 2, borderTop: `1px solid ${grey[200]}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of {filteredReservations.length} reservations
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, val) => setCurrentPage(val)}
              color="primary"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1,
                  fontWeight: 500,
                }
              }}
            />
          </Stack>
        </Box>
      )}
    </Card>



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
          <MeetingRoom />
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
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {detailsDialog.data.phone || "Not provided"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Company
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.company || "Individual"} 
                    color="secondary" 
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
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
                    Purpose
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.purpose || "Not specified"}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Equipment Needed
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontStyle: detailsDialog.data.equipment ? 'normal' : 'italic',
                    color: detailsDialog.data.equipment ? 'text.primary' : 'text.secondary'
                  }}>
                    {detailsDialog.data.equipment || "No equipment needed"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Refreshments
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontStyle: detailsDialog.data.refreshments ? 'normal' : 'italic',
                    color: detailsDialog.data.refreshments ? 'text.primary' : 'text.secondary'
                  }}>
                    {detailsDialog.data.refreshments || "No refreshments requested"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Special Request
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontStyle: detailsDialog.data.specialRequest ? 'normal' : 'italic',
                    color: detailsDialog.data.specialRequest ? 'text.primary' : 'text.secondary'
                  }}>
                    {detailsDialog.data.specialRequest || "No special request"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontStyle: detailsDialog.data.notes ? 'normal' : 'italic',
                    color: detailsDialog.data.notes ? 'text.primary' : 'text.secondary'
                  }}>
                    {detailsDialog.data.notes || "No notes"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Priority Level
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.priority || "Medium"}
                    color={
                      detailsDialog.data.priority === "Urgent" ? "error" :
                      detailsDialog.data.priority === "High" ? "warning" :
                      detailsDialog.data.priority === "Low" ? "default" : "info"
                    }
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Meeting Category
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.category || "General"}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Setup Type
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.setupType || "Standard"}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Follow-up Required
                  </Typography>
                  <Chip 
                    label={detailsDialog.data.followUp || "No"}
                    color={
                      detailsDialog.data.followUp === "Yes" ? "success" :
                      detailsDialog.data.followUp === "Pending" ? "warning" : "default"
                    }
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
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