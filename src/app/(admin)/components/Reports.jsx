import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { db } from "../../../../script/firebaseConfig"; // Ensure this path is correct
import { collection, getDocs, where, query } from "firebase/firestore";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Tabs,
  Tab,
  Pagination,
  Grid,
  Fade,
  Zoom,
  LinearProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { green, red, blue, orange, grey } from "@mui/material/colors";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import BusinessIcon from "@mui/icons-material/Business";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";

// --- Common status chip props ---
const statusChipProps = {
  Accepted: {
    label: "Accepted",
    style: { backgroundColor: green[100], color: green[800], fontWeight: 600 },
  },
  Rejected: {
    label: "Rejected",
    style: { backgroundColor: red[100], color: red[800], fontWeight: 600 },
  },
  done: {
    label: "Done",
    style: { backgroundColor: blue[100], color: blue[800], fontWeight: 600 },
  },
  accepted: {
    label: "Accepted",
    style: { backgroundColor: green[100], color: green[800], fontWeight: 600 },
  },
  rejected: {
    label: "Rejected",
    style: { backgroundColor: red[100], color: red[800], fontWeight: 600 },
  },
  pending: {
    label: "Pending",
    style: { backgroundColor: orange[100], color: orange[800], fontWeight: 600 },
  },
  deactivated: {
    label: "Deactivated",
    style: { backgroundColor: grey[300], color: grey[800], fontWeight: 600 },
  },
  // Add a fallback for unknown statuses
  UNKNOWN: {
    label: "Unknown Status",
    style: { backgroundColor: grey[100], color: grey[600], fontWeight: 600 },
  },
};

/**
 * Converts a Firebase Timestamp object or a valid date string/number into a JavaScript Date object.
 * Returns null if the input is falsy or results in an invalid date.
 * @param {object|string|number} firebaseTimestampOrDate - The date value, potentially a Firebase Timestamp.
 * @returns {Date|null} A Date object or null.
 */
function toDate(firebaseTimestampOrDate) {
  if (!firebaseTimestampOrDate) {
    return null;
  }
  // If it's a Firebase Timestamp, convert it
  if (typeof firebaseTimestampOrDate === "object" && "seconds" in firebaseTimestampOrDate) {
    return new Date(firebaseTimestampOrDate.seconds * 1000);
  }
  // If it's already a Date object
  if (firebaseTimestampOrDate instanceof Date) {
    return firebaseTimestampOrDate;
  }
  // Try to parse as a string or number
  const date = new Date(firebaseTimestampOrDate);
  // Check if the parsed date is valid
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date value using date-fns's "PPP" format.
 * Handles Firebase Timestamps and returns "N/A" for invalid dates.
 * @param {object|string|number} dateValue - The date value to format.
 * @returns {string} Formatted date string or "N/A".
 */
function formatDateForDisplay(dateValue) {
  const date = toDate(dateValue);
  return date ? format(date, "PPP") : "N/A";
}

/**
 * Formats a time value (Firebase Timestamp or HH:mm string) to HH:mm.
 * @param {object|string} timeValue - The time value.
 * @returns {string} Formatted time string or "-".
 */
function formatTime24h(timeValue) {
  if (!timeValue) return "-";

  let date;
  if (typeof timeValue === "object" && "seconds" in timeValue) {
    date = new Date(timeValue.seconds * 1000);
  } else if (typeof timeValue === "string" && timeValue.includes(":")) {
    const [h, m] = timeValue.split(":");
    date = new Date(); // Use a dummy date, we only care about time
    date.setHours(parseInt(h, 10));
    date.setMinutes(parseInt(m, 10));
  } else {
    return "-"; // Unrecognized format
  }

  if (isNaN(date.getTime())) {
    return "-"; // Invalid date/time
  }

  return format(date, "HH:mm");
}

const ITEMS_PER_PAGE = 10;

export default function ReservationMeetingReportTabs() {
  const [tab, setTab] = useState(0);

  // --- State for Dedicated Desk Visit Schedule ---
  const [reservations, setReservations] = useState([]);
  const [isLoadingRes, setIsLoadingRes] = useState(true);
  const [modalOpenRes, setModalOpenRes] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [resPage, setResPage] = useState(1);

  // --- State for Meeting Room ---
  const [meetings, setMeetings] = useState([]);
  const [isLoadingMeet, setIsLoadingMeet] = useState(true);
  const [modalOpenMeet, setModalOpenMeet] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetPage, setMeetPage] = useState(1);

  // --- State for Private Office Visits ---
  const [officeVisits, setOfficeVisits] = useState([]);
  const [isLoadingOffice, setIsLoadingOffice] = useState(true);
  const [modalOpenOffice, setModalOpenOffice] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [officePage, setOfficePage] = useState(1);

  // --- State for Virtual Office Visits ---
  const [virtualOfficeVisits, setVirtualOfficeVisits] = useState([]);
  const [isLoadingVirtualOffice, setIsLoadingVirtualOffice] = useState(true);
  const [modalOpenVirtualOffice, setModalOpenVirtualOffice] = useState(false);
  const [selectedVirtualOffice, setSelectedVirtualOffice] = useState(null);
  const [virtualOfficePage, setVirtualOfficePage] = useState(1);

  // --- State for Deactivated Tenants & Private Offices & Virtual Offices ---
  const [deactivatedTenants, setDeactivatedTenants] = useState([]);
  const [isLoadingDeactivated, setIsLoadingDeactivated] = useState(true);
  const [modalOpenDeactivated, setModalOpenDeactivated] = useState(false);
  const [selectedDeactivatedTenant, setSelectedDeactivatedTenant] = useState(null);
  const [deactivatedPage, setDeactivatedPage] = useState(1);

  // --- Helper function to get status properties safely ---
  const getStatusProps = (status) => {
    // Convert status to a consistent case if needed, or ensure your Firebase data matches keys
    const key = status ? status.toLowerCase() : 'UNKNOWN'; // Default to UNKNOWN if status is falsy
    return statusChipProps[key] || statusChipProps.UNKNOWN;
  };

  // --- Fetch visitMap reports (Dedicated Desk) ---
  useEffect(() => {
    let unsubscribed = false;
    const fetchReservations = async () => {
      setIsLoadingRes(true);
      try {
        const q = query(
          collection(db, "visitMap"),
          where("status", "in", ["accepted", "rejected", "pending"]) // Included "pending" for completeness
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const allReservations = docs.map((doc) => ({
          ...doc,
          name: doc.name || "N/A",
          email: doc.email || "N/A",
          phone: doc.phone || "N/A",
          company: doc.company || "N/A",
          details: doc.details || "N/A",
          reservedSeats: doc.reservedSeats || [],
          // Use the toDate helper for consistency
          date: toDate(doc.date),
          status: doc.status || "UNKNOWN", // Ensure status is never undefined
        }));
        allReservations.sort(
          (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
        );
        if (!unsubscribed) {
          setReservations(allReservations);
        }
      } catch (error) {
        console.error("Error fetching dedicated desk reservations:", error);
        // Optionally set an error state here
      } finally {
        if (!unsubscribed) {
          setIsLoadingRes(false);
        }
      }
    };
    fetchReservations();
    return () => {
      unsubscribed = true;
    };
  }, []);

  // --- Fetch privateOfficeVisits reports ---
  useEffect(() => {
    let unsubscribed = false;
    const fetchOfficeVisits = async () => {
      setIsLoadingOffice(true);
      try {
        const q = query(
          collection(db, "privateOfficeVisits"),
          where("status", "in", ["accepted", "rejected", "pending"]) // Included "pending"
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const allOfficeVisits = docs.map((doc) => ({
          ...doc,
          name: doc.name || "N/A",
          email: doc.email || "N/A",
          phone: doc.phone || "N/A",
          company: doc.company || "N/A",
          details: doc.details || "N/A",
          office: doc.office || "N/A",
          officeSelected: doc.officeSelected || "N/A",
          capacity: doc.capacity || "N/A",
          amenities: doc.amenities || [],
          // Use the toDate helper for consistency
          date: toDate(doc.date),
          status: doc.status || "UNKNOWN", // Ensure status is never undefined
        }));
        allOfficeVisits.sort(
          (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
        );
        if (!unsubscribed) {
          setOfficeVisits(allOfficeVisits);
        }
      } catch (error) {
        console.error("Error fetching private office visits:", error);
      } finally {
        if (!unsubscribed) {
          setIsLoadingOffice(false);
        }
      }
    };
    fetchOfficeVisits();
    return () => {
      unsubscribed = true;
    };
  }, []);

  // --- Fetch meeting room reports, status: "done" or "rejected" ---
  useEffect(() => {
    let unsubscribed = false;
    const fetchMeetings = async () => {
      setIsLoadingMeet(true);
      try {
        const q = query(
          collection(db, "meeting room"),
          where("status", "in", ["done", "rejected", "pending", "accepted"]) // Included "pending", "accepted"
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const allMeetings = docs.map((doc) => ({
          ...doc,
          name: doc.name || "N/A",
          email: doc.email || "N/A",
          guests: doc.guests || [],
          // Convert from_time and to_time using the helper
          from_time: toDate(doc.from_time),
          to_time: toDate(doc.to_time),
          // Convert date using the helper
          date: toDate(doc.date),
          status: doc.status || "UNKNOWN", // Ensure status is never undefined
          duration: doc.duration || "N/A",
          details: doc.details || "N/A",
        }));
        // Sort latest date first
        allMeetings.sort((a, b) => {
          const dateA = a.date ? a.date.getTime() : 0;
          const dateB = b.date ? b.date.getTime() : 0;
          return dateB - dateA;
        });
        if (!unsubscribed) {
          setMeetings(allMeetings);
        }
      } catch (error) {
        console.error("Error fetching meeting room reports:", error);
      } finally {
        if (!unsubscribed) {
          setIsLoadingMeet(false);
        }
      }
    };
    fetchMeetings();
    return () => {
      unsubscribed = true;
    };
  }, []);

  // --- Fetch virtualOfficeInquiry reports ---
  useEffect(() => {
    let unsubscribed = false;
    const fetchVirtualOfficeVisits = async () => {
      setIsLoadingVirtualOffice(true);
      try {
        const q = query(
          collection(db, "virtualOfficeInquiry"),
          where("status", "in", ["accepted", "rejected", "pending"]) // Included "pending"
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const allVirtualOfficeVisits = docs.map((doc) => ({
          ...doc,
          name: doc.name || "N/A",
          email: doc.email || "N/A",
          phone: doc.phone || "N/A",
          company: doc.company || "N/A",
          details: doc.details || "N/A",
          service: doc.service || "N/A", // Assuming a 'service' field for virtual office
          // Use the toDate helper for consistency
          date: toDate(doc.date),
          status: doc.status || "UNKNOWN", // Ensure status is never undefined
        }));
        allVirtualOfficeVisits.sort(
          (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
        );
        if (!unsubscribed) {
          setVirtualOfficeVisits(allVirtualOfficeVisits);
        }
      } catch (error) {
        console.error("Error fetching virtual office inquiries:", error);
      } finally {
        if (!unsubscribed) {
          setIsLoadingVirtualOffice(false);
        }
      }
    };
    fetchVirtualOfficeVisits();
    return () => {
      unsubscribed = true;
    };
  }, []);

  // --- NEW: Fetch Deactivated Tenants, Private Offices, and Virtual Offices ---
  useEffect(() => {
    let unsubscribed = false;
    const fetchDeactivatedData = async () => {
      setIsLoadingDeactivated(true);
      try {
        const allDeactivated = [];

        // 1. Fetch from 'seatMap' collection for deactivated tenants (Dedicated Desk)
        const tenantsQuery = query(
          collection(db, "seatMap"),
          where("status", "==", "deactivated")
        );
        const tenantsSnapshot = await getDocs(tenantsQuery);
        tenantsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allDeactivated.push({
            id: doc.id,
            ...data,
            name: data.name || "N/A",
            email: data.email || "N/A",
            phone: data.phone || "N/A",
            company: data.company || "N/A",
            deactivatedAt: toDate(data.deactivatedAt), // Convert deactivatedAt using the new toDate helper
            status: "deactivated", // Explicitly set status for consistency
            lastActiveDate: formatDateForDisplay(data.lastActiveDate), // Use helper
            reasonForDeactivation: data.reasonForDeactivation || "N/A",
            type: "Dedicated Desk Tenant", // Add a type to distinguish source
          });
        });

        // 2. Fetch from 'privateOffice' collection for deactivated private offices
        const privateOfficeQuery = query(
          collection(db, "privateOffice"),
          where("status", "==", "deactivated")
        );
        const privateOfficeSnapshot = await getDocs(privateOfficeQuery);
        privateOfficeSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allDeactivated.push({
            id: doc.id,
            ...data,
            name: data.name || "N/A", // Assuming a name field for the deactivated office record
            email: data.email || "N/A",
            phone: data.phone || "N/A",
            company: data.company || "N/A",
            deactivatedAt: toDate(data.deactivatedAt || data.dateCreated), // Prefer deactivatedAt, fall back to dateCreated
            status: data.status, // Keep original status like 'deactivated'
            type: "Private Office", // Add a type to distinguish source
            office: data.office || data.officeName || "N/A", // Adjust field names as per your DB
            details: data.details || "N/A",
            reasonForDeactivation: data.reasonForDeactivation || "N/A",
            // Add other relevant privateOffice fields you want to display
          });
        });

        // 3. Fetch from 'virtualOffice' collection for deactivated virtual offices
        const virtualOfficeQuery = query(
          collection(db, "virtualOffice"), // Using the correct collection name: virtualOffice
          where("status", "==", "deactivated")
        );
        const virtualOfficeSnapshot = await getDocs(virtualOfficeQuery);
        virtualOfficeSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allDeactivated.push({
            id: doc.id,
            ...data,
            name: data.name || "N/A",
            email: data.email || "N/A",
            phone: data.phone || "N/A",
            company: data.company || "N/A",
            deactivatedAt: toDate(data.deactivatedAt || data.dateCreated),
            status: data.status,
            type: "Virtual Office", // Add a type to distinguish source
            service: data.service || "N/A", // Assuming a 'service' field for virtual office
            details: data.details || "N/A",
            reasonForDeactivation: data.reasonForDeactivation || "N/A",
          });
        });

        // Sort all combined data by deactivatedAt (or primary relevant date)
        allDeactivated.sort(
          (a, b) => (b.deactivatedAt?.getTime?.() || 0) - (a.deactivatedAt?.getTime?.() || 0)
        );

        if (!unsubscribed) {
          setDeactivatedTenants(allDeactivated);
        }
      } catch (error) {
        console.error("Error fetching deactivated data:", error);
      } finally {
        if (!unsubscribed) {
          setIsLoadingDeactivated(false);
        }
      }
    };
    fetchDeactivatedData();
    return () => {
      unsubscribed = true;
    };
  }, []);

  // --- Handlers ---
  const handleOpenModalRes = (client) => {
    setSelectedClient(client);
    setModalOpenRes(true);
  };
  const handleCloseModalRes = () => {
    setModalOpenRes(false);
    setSelectedClient(null);
  };
  const handleOpenModalMeet = (meeting) => {
    setSelectedMeeting(meeting);
    setModalOpenMeet(true);
  };
  const handleCloseModalMeet = () => {
    setModalOpenMeet(false);
    setSelectedMeeting(null);
  };
  const handleOpenModalOffice = (office) => {
    setSelectedOffice(office);
    setModalOpenOffice(true);
  };
  const handleCloseModalOffice = () => {
    setModalOpenOffice(false);
    setSelectedOffice(null);
  };
  const handleOpenModalVirtualOffice = (virtualOffice) => {
    setSelectedVirtualOffice(virtualOffice);
    setModalOpenVirtualOffice(true);
  };
  const handleCloseModalVirtualOffice = () => {
    setModalOpenVirtualOffice(false);
    setSelectedVirtualOffice(null);
  };
  // --- Handlers for Deactivated Tenants Modal ---
  const handleOpenModalDeactivated = (tenant) => {
    setSelectedDeactivatedTenant(tenant);
    setModalOpenDeactivated(true);
  };
  const handleCloseModalDeactivated = () => {
    setModalOpenDeactivated(false);
    setSelectedDeactivatedTenant(null);
  };

  // --- Pagination logic ---
  const paginatedReservations = reservations.slice(
    (resPage - 1) * ITEMS_PER_PAGE,
    resPage * ITEMS_PER_PAGE
  );
  const paginatedMeetings = meetings.slice(
    (meetPage - 1) * ITEMS_PER_PAGE,
    meetPage * ITEMS_PER_PAGE
  );
  const paginatedOfficeVisits = officeVisits.slice(
    (officePage - 1) * ITEMS_PER_PAGE,
    officePage * ITEMS_PER_PAGE
  );
  const paginatedVirtualOfficeVisits = virtualOfficeVisits.slice(
    (virtualOfficePage - 1) * ITEMS_PER_PAGE,
    virtualOfficePage * ITEMS_PER_PAGE
  );
  // --- Pagination for Deactivated Tenants ---
  const paginatedDeactivatedTenants = deactivatedTenants.slice(
    (deactivatedPage - 1) * ITEMS_PER_PAGE,
    deactivatedPage * ITEMS_PER_PAGE
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      bgcolor: 'background.default',
      py: { xs: 2, sm: 3, md: 4 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Professional Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1
              }}
            >
              <AssessmentIcon sx={{ fontSize: 32 }} />
              Reports & Analytics
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              Comprehensive workspace analytics and reporting dashboard
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              // Refresh all data
              fetchReservations();
              fetchOfficeVisits();
              fetchMeetings();
              fetchVirtualOfficeVisits();
              fetchDeactivatedData();
            }}
            disabled={isLoadingRes || isLoadingOffice || isLoadingMeet || isLoadingVirtualOffice || isLoadingDeactivated}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.50'
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2
            }}>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800, mb: 1 }}>
                {reservations.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.700', fontWeight: 600 }}>
                Total Reservations
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: 'success.50',
              border: '1px solid',
              borderColor: 'success.200',
              borderRadius: 2
            }}>
              <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 800, mb: 1 }}>
                {meetings.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.700', fontWeight: 600 }}>
                Meeting Bookings
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.200',
              borderRadius: 2
            }}>
              <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 800, mb: 1 }}>
                {officeVisits.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'warning.700', fontWeight: 600 }}>
                Office Visits
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: 'info.50',
              border: '1px solid',
              borderColor: 'info.200',
              borderRadius: 2
            }}>
              <Typography variant="h3" sx={{ color: 'info.main', fontWeight: 800, mb: 1 }}>
                {virtualOfficeVisits.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'info.700', fontWeight: 600 }}>
                Virtual Office Inquiries
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setResPage(1);
            setMeetPage(1);
            setOfficePage(1);
            setVirtualOfficePage(1);
            setDeactivatedPage(1);
          }}
          sx={{ 
            bgcolor: 'primary.50',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'none',
              minHeight: 64,
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: 'white'
              }
            }
          }}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dedicated Desk Visit Schedule Report" />
          <Tab label="Private Office Visit Report" />
          <Tab label="Meeting Room Report" />
          <Tab label="Virtual Office Report" />
          <Tab label="Deactivated Tenants" />
        </Tabs>
      </Paper>

      {/* --- Dedicated Desk Visit Schedule Report Tab --- */}
      {tab === 0 && (
        <Fade in={true} timeout={500}>
          <Card variant="outlined" sx={{ 
            boxShadow: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
              sx={{
                pb: 2,
                borderBottom: '2px solid',
                borderColor: 'primary.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="primary.main"
                  gutterBottom
                >
                  Dedicated Desk Visit Schedule Report
                </Typography>
              </Box>
              <Chip 
                label={`${reservations.length} Total Records`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {isLoadingRes ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight={256}
                gap={2}
              >
                <CircularProgress color="primary" size={56} thickness={4} />
                <Typography variant="h6" color="text.secondary">
                  Loading reservation data...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <TableContainer component={Paper}>
                  <Table
                    size="medium"
                    sx={{
                      borderCollapse: "collapse",
                      "& .MuiTableCell-root": { border: "1px solid #bdbdbd" },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Client
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Date &amp; Time
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedReservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">
                              No dedicated desk reservations found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedReservations.map((reservation) => {
                          const statusProps = getStatusProps(reservation.status); // Use the helper
                          return (
                            <TableRow
                              key={reservation.id}
                              hover
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {reservation.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {reservation.date
                                    ? format(reservation.date, "PPPpp")
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusProps.label}
                                  sx={{
                                    ...statusProps.style,
                                    fontSize: "0.875rem",
                                    borderRadius: "999px",
                                    px: 1.5,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenModalRes(reservation)}
                                  startIcon={<InfoOutlinedIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    borderColor: blue[100],
                                    color: blue[700],
                                    "&:hover": {
                                      backgroundColor: blue[50],
                                    },
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="center" mt={3}>
                  <Pagination
                    count={Math.ceil(reservations.length / ITEMS_PER_PAGE)}
                    page={resPage}
                    onChange={(_, val) => setResPage(val)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
        </Fade>
      )}

      {/* --- Private Office Visit Report Tab --- */}
      {tab === 1 && (
        <Fade in={true} timeout={500}>
          <Card variant="outlined" sx={{ 
            boxShadow: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
              sx={{
                pb: 2,
                borderBottom: '2px solid',
                borderColor: 'warning.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MeetingRoomIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="warning.main"
                  gutterBottom
                >
                  Private Office Visit Report
                </Typography>
              </Box>
              <Chip 
                label={`${officeVisits.length} Total Records`}
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {isLoadingOffice ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight={256}
                gap={2}
              >
                <CircularProgress color="warning" size={56} thickness={4} />
                <Typography variant="h6" color="text.secondary">
                  Loading office visit data...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <TableContainer component={Paper}>
                  <Table
                    size="medium"
                    sx={{
                      borderCollapse: "collapse",
                      "& .MuiTableCell-root": { border: "1px solid #bdbdbd" },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Client
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Office
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Date &amp; Time
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOfficeVisits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              No private office visits found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOfficeVisits.map((office) => {
                          const statusProps = getStatusProps(office.status); // Use the helper
                          return (
                            <TableRow
                              key={office.id}
                              hover
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {office.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {office.office || office.officeSelected || "-"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {office.date
                                    ? format(office.date, "PPPpp")
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusProps.label}
                                  sx={{
                                    ...statusProps.style,
                                    fontSize: "0.875rem",
                                    borderRadius: "999px",
                                    px: 1.5,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenModalOffice(office)}
                                  startIcon={<InfoOutlinedIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    borderColor: blue[100],
                                    color: blue[700],
                                    "&:hover": {
                                      backgroundColor: blue[50],
                                    },
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="center" mt={3}>
                  <Pagination
                    count={Math.ceil(officeVisits.length / ITEMS_PER_PAGE)}
                    page={officePage}
                    onChange={(_, val) => setOfficePage(val)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
        </Fade>
      )}

      {/* --- Meeting Room Report Tab --- */}
      {tab === 2 && (
        <Card variant="outlined" sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                gutterBottom
              >
                Meeting Room Report
              </Typography>
            </Box>

            {isLoadingMeet ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={256}
              >
                <CircularProgress color="primary" size={56} thickness={4} />
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <TableContainer component={Paper}>
                  <Table
                    size="medium"
                    sx={{
                      borderCollapse: "collapse",
                      "& .MuiTableCell-root": { border: "1px solid #bdbdbd" },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Client
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Date
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Time
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Duration
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedMeetings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">
                              No meeting room reports found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedMeetings.map((meeting) => {
                          const statusProps = getStatusProps(meeting.status); // Use the helper
                          return (
                            <TableRow
                              key={meeting.id}
                              hover
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {meeting.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateForDisplay(meeting.date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatTime24h(meeting.from_time)} -{" "}
                                  {formatTime24h(meeting.to_time)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {meeting.duration}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusProps.label}
                                  sx={{
                                    ...statusProps.style,
                                    fontSize: "0.875rem",
                                    borderRadius: "999px",
                                    px: 1.5,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenModalMeet(meeting)}
                                  startIcon={<InfoOutlinedIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    borderColor: blue[100],
                                    color: blue[700],
                                    "&:hover": {
                                      backgroundColor: blue[50],
                                    },
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="center" mt={3}>
                  <Pagination
                    count={Math.ceil(meetings.length / ITEMS_PER_PAGE)}
                    page={meetPage}
                    onChange={(_, val) => setMeetPage(val)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Virtual Office Report Tab --- */}
      {tab === 3 && (
        <Card variant="outlined" sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                gutterBottom
              >
                Virtual Office Report
              </Typography>
            </Box>

            {isLoadingVirtualOffice ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={256}
              >
                <CircularProgress color="primary" size={56} thickness={4} />
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <TableContainer component={Paper}>
                  <Table
                    size="medium"
                    sx={{
                      borderCollapse: "collapse",
                      "& .MuiTableCell-root": { border: "1px solid #bdbdbd" },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Client
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Service
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Date
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedVirtualOfficeVisits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              No virtual office inquiries found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedVirtualOfficeVisits.map((virtualOffice) => {
                          const statusProps = getStatusProps(virtualOffice.status); // Use the helper
                          return (
                            <TableRow
                              key={virtualOffice.id}
                              hover
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {virtualOffice.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {virtualOffice.service}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateForDisplay(virtualOffice.date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusProps.label}
                                  sx={{
                                    ...statusProps.style,
                                    fontSize: "0.875rem",
                                    borderRadius: "999px",
                                    px: 1.5,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    handleOpenModalVirtualOffice(virtualOffice)
                                  }
                                  startIcon={<InfoOutlinedIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    borderColor: blue[100],
                                    color: blue[700],
                                    "&:hover": {
                                      backgroundColor: blue[50],
                                    },
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="center" mt={3}>
                  <Pagination
                    count={Math.ceil(virtualOfficeVisits.length / ITEMS_PER_PAGE)}
                    page={virtualOfficePage}
                    onChange={(_, val) => setVirtualOfficePage(val)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Deactivated Tenants Tab --- */}
      {tab === 4 && (
        <Card variant="outlined" sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                gutterBottom
              >
                Deactivated Tenants, Private Offices, & Virtual Offices
              </Typography>
            </Box>

            {isLoadingDeactivated ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={256}
              >
                <CircularProgress color="primary" size={56} thickness={4} />
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <TableContainer component={Paper}>
                  <Table
                    size="medium"
                    sx={{
                      borderCollapse: "collapse",
                      "& .MuiTableCell-root": { border: "1px solid #bdbdbd" },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Name
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Type
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Deactivated On
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedDeactivatedTenants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              No deactivated records found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDeactivatedTenants.map((item) => {
                          const statusProps = getStatusProps(item.status); // Use the helper
                          return (
                            <TableRow
                              key={item.id}
                              hover
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {item.type}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateForDisplay(item.deactivatedAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusProps.label}
                                  sx={{
                                    ...statusProps.style,
                                    fontSize: "0.875rem",
                                    borderRadius: "999px",
                                    px: 1.5,
                                  }}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenModalDeactivated(item)}
                                  startIcon={<InfoOutlinedIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    borderColor: blue[100],
                                    color: blue[700],
                                    "&:hover": {
                                      backgroundColor: blue[50],
                                    },
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="center" mt={3}>
                  <Pagination
                    count={Math.ceil(deactivatedTenants.length / ITEMS_PER_PAGE)}
                    page={deactivatedPage}
                    onChange={(_, val) => setDeactivatedPage(val)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Modals for Details (omitted for brevity, assume they are correct) --- */}
      {/* Dedicated Desk Reservation Details Modal */}
      <Dialog open={modalOpenRes} onClose={handleCloseModalRes} maxWidth="sm" fullWidth>
        <DialogTitle>Dedicated Desk Reservation Details</DialogTitle>
        <DialogContent dividers>
          {selectedClient && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">Client Information:</Typography>
              <Typography>Name: {selectedClient.name}</Typography>
              <Typography>Email: {selectedClient.email}</Typography>
              <Typography>Phone: {selectedClient.phone}</Typography>
              <Typography>Company: {selectedClient.company}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Reservation Details:</Typography>
              <Typography>Date & Time: {selectedClient.date ? format(selectedClient.date, "PPPpp") : "N/A"}</Typography>
              <Typography>Reserved Seats: {selectedClient.reservedSeats.join(", ") || "N/A"}</Typography>
              <Typography>Status: <Chip label={getStatusProps(selectedClient.status).label} sx={{...getStatusProps(selectedClient.status).style}} size="small" /></Typography>
              <Typography>Details: {selectedClient.details}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalRes}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Private Office Visit Details Modal */}
      <Dialog open={modalOpenOffice} onClose={handleCloseModalOffice} maxWidth="sm" fullWidth>
        <DialogTitle>Private Office Visit Details</DialogTitle>
        <DialogContent dividers>
          {selectedOffice && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">Client Information:</Typography>
              <Typography>Name: {selectedOffice.name}</Typography>
              <Typography>Email: {selectedOffice.email}</Typography>
              <Typography>Phone: {selectedOffice.phone}</Typography>
              <Typography>Company: {selectedOffice.company}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Office Details:</Typography>
              <Typography>Office: {selectedOffice.office || selectedOffice.officeSelected || "N/A"}</Typography>
              <Typography>Capacity: {selectedOffice.capacity}</Typography>
              <Typography>Amenities: {selectedOffice.amenities.join(", ") || "N/A"}</Typography>
              <Typography>Date & Time: {selectedOffice.date ? format(selectedOffice.date, "PPPpp") : "N/A"}</Typography>
              <Typography>Status: <Chip label={getStatusProps(selectedOffice.status).label} sx={{...getStatusProps(selectedOffice.status).style}} size="small" /></Typography>
              <Typography>Details: {selectedOffice.details}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalOffice}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Room Details Modal */}
      <Dialog open={modalOpenMeet} onClose={handleCloseModalMeet} maxWidth="sm" fullWidth>
        <DialogTitle>Meeting Room Report Details</DialogTitle>
        <DialogContent dividers>
          {selectedMeeting && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">Client Information:</Typography>
              <Typography>Name: {selectedMeeting.name}</Typography>
              <Typography>Email: {selectedMeeting.email}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Meeting Details:</Typography>
              <Typography>Date: {formatDateForDisplay(selectedMeeting.date)}</Typography>
              <Typography>Time: {formatTime24h(selectedMeeting.from_time)} - {formatTime24h(selectedMeeting.to_time)}</Typography>
              <Typography>Duration: {selectedMeeting.duration}</Typography>
              <Typography>Guests: {selectedMeeting.guests.join(", ") || "None"}</Typography>
              <Typography>Status: <Chip label={getStatusProps(selectedMeeting.status).label} sx={{...getStatusProps(selectedMeeting.status).style}} size="small" /></Typography>
              <Typography>Details: {selectedMeeting.details}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalMeet}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Virtual Office Details Modal */}
      <Dialog open={modalOpenVirtualOffice} onClose={handleCloseModalVirtualOffice} maxWidth="sm" fullWidth>
        <DialogTitle>Virtual Office Inquiry Details</DialogTitle>
        <DialogContent dividers>
          {selectedVirtualOffice && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">Client Information:</Typography>
              <Typography>Name: {selectedVirtualOffice.name}</Typography>
              <Typography>Email: {selectedVirtualOffice.email}</Typography>
              <Typography>Phone: {selectedVirtualOffice.phone}</Typography>
              <Typography>Company: {selectedVirtualOffice.company}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Inquiry Details:</Typography>
              <Typography>Service: {selectedVirtualOffice.service}</Typography>
              <Typography>Date: {formatDateForDisplay(selectedVirtualOffice.date)}</Typography>
              <Typography>Status: <Chip label={getStatusProps(selectedVirtualOffice.status).label} sx={{...getStatusProps(selectedVirtualOffice.status).style}} size="small" /></Typography>
              <Typography>Details: {selectedVirtualOffice.details}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalVirtualOffice}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Deactivated Tenant/Office Details Modal */}
      <Dialog open={modalOpenDeactivated} onClose={handleCloseModalDeactivated} maxWidth="sm" fullWidth>
        <DialogTitle>Deactivated Record Details</DialogTitle>
        <DialogContent dividers>
          {selectedDeactivatedTenant && (
            <>
              <Typography variant="subtitle1" fontWeight="bold">General Information:</Typography>
              <Typography>Name: {selectedDeactivatedTenant.name}</Typography>
              <Typography>Type: {selectedDeactivatedTenant.type}</Typography>
              <Typography>Deactivated On: {formatDateForDisplay(selectedDeactivatedTenant.deactivatedAt)}</Typography>
              <Typography>Reason for Deactivation: {selectedDeactivatedTenant.reasonForDeactivation}</Typography>
              <Typography>Deactivated by: {selectedDeactivatedTenant.deactivatedBy}</Typography>
              <Typography>Status: <Chip label={getStatusProps(selectedDeactivatedTenant.status).label} sx={{...getStatusProps(selectedDeactivatedTenant.status).style}} size="small" /></Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Contact Information:</Typography>
              <Typography>Email: {selectedDeactivatedTenant.email}</Typography>
              <Typography>Phone: {selectedDeactivatedTenant.phone}</Typography>
              <Typography>Company: {selectedDeactivatedTenant.company}</Typography>
              {selectedDeactivatedTenant.type === "Dedicated Desk Tenant" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Dedicated Desk Specifics:</Typography>
                  <Typography>Last Active Date: {selectedDeactivatedTenant.lastActiveDate}</Typography>
                </>
              )}
              {selectedDeactivatedTenant.type === "Private Office" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Private Office Specifics:</Typography>
                  <Typography>Office: {selectedDeactivatedTenant.office}</Typography>
                  <Typography>Details: {selectedDeactivatedTenant.details}</Typography>
                </>
              )}
              {selectedDeactivatedTenant.type === "Virtual Office" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Virtual Office Specifics:</Typography>
                  <Typography>Service: {selectedDeactivatedTenant.service}</Typography>
                  <Typography>Details: {selectedDeactivatedTenant.details}</Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalDeactivated}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}