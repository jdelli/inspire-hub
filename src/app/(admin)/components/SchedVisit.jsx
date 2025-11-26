"use client";
import { db } from "../../../../script/firebaseConfig";
import {
  collection,
  getDocs,
  where,
  query,
  doc,
  updateDoc,
  getDoc, // Kept this getDoc import
} from "firebase/firestore";

import { Monitor } from "lucide-react";
import seatMap1 from "../../(admin)/seatMap1.json";
import seatMap2 from "../../(admin)/seatMap2.json";
import seatMap3 from "../../(admin)/seatMap3.json";
import seatMap4 from "../../(admin)/seatMap4.json";
import seatMap5 from "../../(admin)/seatMap5.json";
import {
  sendAcceptanceEmail,
  sendRejectionEmail,
} from "../../(admin)/utils/email";
import RejectReasonModal from "./RejectReason";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Event as EventIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  MeetingRoom as OfficeIcon,
  Chair as SeatIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useState, useEffect } from "react";

// Accept utility function for updating visit status and sending email
export async function accept(visitId, collectionName) {
  if (!visitId) throw new Error("Missing visitId");
  try {
    const visitRef = doc(db, collectionName, visitId);
    const visitDoc = await getDoc(visitRef);

    if (!visitDoc.exists()) throw new Error("Visit not found");

    const clientData = { ...visitDoc.data(), id: visitId };

    await updateDoc(visitRef, { status: "accepted" });

    const emailResult = await sendAcceptanceEmail(clientData);

    if (!emailResult.success) {
      throw emailResult.error;
    }
    return { success: true };
  } catch (error) {
    console.error("Error in accept:", error);
    throw error;
  }
}

// Reject utility function for updating visit status, adding a reason, and sending email
export async function reject(visitId, collectionName, reason) {
  if (!visitId) throw new Error("Missing visitId");
  try {
    const visitRef = doc(db, collectionName, visitId);
    const visitDoc = await getDoc(visitRef);

    if (!visitDoc.exists()) throw new Error("Visit not found");

    const clientData = { ...visitDoc.data(), id: visitId };

    await updateDoc(visitRef, { status: "rejected", rejectionReason: reason });

    const emailResult = await sendRejectionEmail(clientData, reason);

    if (!emailResult.success) {
      throw emailResult.error;
    }
    return { success: true };
  } catch (error) {
    console.error("Error in reject:", error);
    throw error;
  }
}

// Utility functions
function groupIntoPairs(entries) {
  const groups = [];
  for (let i = 0; i < entries.length; i += 2) {
    groups.push(entries.slice(i, i + 2));
  }
  return groups;
}

function groupSeatsByRow(seatMap) {
  return seatMap.reduce((acc, seat) => {
    const row = seat.number[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});
}

const groupedSeats1 = groupSeatsByRow(seatMap1);
const groupedSeats2 = groupSeatsByRow(seatMap2);
const groupedSeats3 = groupSeatsByRow(seatMap3);
const groupedSeats4 = groupSeatsByRow(seatMap4);
const groupedSeats5 = groupSeatsByRow(seatMap5);

const rowEntries1 = Object.entries(groupedSeats1).sort(([a], [b]) => a.localeCompare(b));
const rowEntries2 = Object.entries(groupedSeats2).sort(([a], [b]) => a.localeCompare(b));
const rowEntries3 = Object.entries(groupedSeats3).sort(([a], [b]) => a.localeCompare(b));
const rowEntries4 = Object.entries(groupedSeats4).sort(([a], [b]) => a.localeCompare(b));
const rowEntries5 = Object.entries(groupedSeats5).sort(([a], [b]) => a.localeCompare(b));

const groupPairs1 = groupIntoPairs(rowEntries1);
const groupPairs2 = groupIntoPairs(rowEntries2);
const groupPairs3 = groupIntoPairs(rowEntries3);
const groupPairs4 = groupIntoPairs(rowEntries4);
const groupPairs5 = groupIntoPairs(rowEntries5);

export default function ClientsPage() {
  const [clients, setClients] = useState([]); // This seems to be for occupied seats data
  const [visitClients, setVisitClients] = useState([]); // For seat visit requests (visitMap)
  const [officeVisitClients, setOfficeVisitClients] = useState([]); // For private office visit requests (privateOfficeVisits)
  const [virtualOfficeInquiryClients, setVirtualOfficeInquiryClients] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // --- Pagination states ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed
  // -------------------------

  useEffect(() => {
    async function fetchOccupiedSeats() {
      const querySnapshot = await getDocs(collection(db, "seatMap"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(docs);
    }
    fetchOccupiedSeats();
  }, []);

  // Helper function to format Firestore Timestamp or ISO string
  const formatTimestampToDateString = (timestamp) => {
    if (!timestamp) return "N/A";
    let date;
    if (timestamp.seconds) { // Firestore Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') { // ISO string
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) { // Already a Date object
      date = timestamp;
    } else {
      console.warn("Unexpected date format:", timestamp); // Log unexpected formats
      return "N/A";
    }
    return date.toLocaleDateString('en-US'); // Format as desired
  };

  const fetchVisitData = async () => {
    const q = query(collection(db, "visitMap"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Add requestDate field, converting Firestore Timestamp if necessary
      requestDate: doc.data().requestDate ? formatTimestampToDateString(doc.data().requestDate) : "N/A",
    }));
    setVisitClients(docs);
  };

  const fetchOfficeVisitData = async () => {
    const q = query(collection(db, "privateOfficeVisits"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Add requestDate field, converting Firestore Timestamp if necessary
      requestDate: doc.data().requestDate ? formatTimestampToDateString(doc.data().requestDate) : "N/A",
    }));
    setOfficeVisitClients(docs);
  };

  const fetchVirtualOfficeInquiryData = async () => {
    const q = query(collection(db, "virtualOfficeInquiry"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Add requestDate field, converting Firestore Timestamp if necessary
      requestDate: doc.data().requestDate ? formatTimestampToDateString(doc.data().requestDate) : "N/A",
    }));
    setVirtualOfficeInquiryClients(docs);
  };

  useEffect(() => {
    fetchVisitData();
    fetchOfficeVisitData();
    fetchVirtualOfficeInquiryData();
  }, []);

  // --- Pagination handlers ---
  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
    setSelectedClientId(null); // Clear selected client on page change
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    setSelectedClientId(null); // Clear selected client on page change
  };

  // Reset page to 1 and clear selected client when changing tabs
  useEffect(() => {
    setCurrentPage(1);
    setSelectedClientId(null);
  }, [activeTab]);
  // -------------------------

  const handleAcceptVisit = async (visitId) => {
    if (!visitId || isAccepting) return;
    setIsAccepting(true);

    try {
      let collectionName;
      if (activeTab === 0) {
        collectionName = "visitMap";
      } else if (activeTab === 1) {
        collectionName = "privateOfficeVisits";
      } else if (activeTab === 2) {
        collectionName = "virtualOfficeInquiry";
      }

      await accept(visitId, collectionName);

      if (activeTab === 0) {
        await fetchVisitData();
      } else if (activeTab === 1) {
        await fetchOfficeVisitData();
      } else if (activeTab === 2) {
        await fetchVirtualOfficeInquiryData();
      }
      setSelectedClientId(null);
      alert("Request accepted and client notified!");
    } catch (error) {
      console.error("Error in acceptVisit:", error);
      alert(error.message || "Request was accepted but failed to notify client.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectClick = () => {
    if (isRejecting) return;
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (reason) => {
    setShowRejectModal(false);
    if (!selectedClientId || isRejecting) return;

    setIsRejecting(true);

    try {
      let collectionName;
      if (activeTab === 0) {
        collectionName = "visitMap";
      } else if (activeTab === 1) {
        collectionName = "privateOfficeVisits";
      } else if (activeTab === 2) {
        collectionName = "virtualOfficeInquiry";
      }

      await reject(selectedClientId, collectionName, reason);

      if (activeTab === 0) {
        await fetchVisitData();
      } else if (activeTab === 1) {
        await fetchOfficeVisitData();
      } else if (activeTab === 2) {
        await fetchVirtualOfficeInquiryData();
      }
      setSelectedClientId(null);
      alert("Request rejected and client notified!");
    } catch (error) {
      console.error("Error in rejectVisit:", error);
      alert(error.message || "Failed to reject request.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedClientId(null); // Clear selected client when changing tabs
  };

  // --- Pagination Logic: Filter and slice clients based on current page ---
  const allClientsForCurrentTab =
    activeTab === 0
      ? visitClients
      : activeTab === 1
      ? officeVisitClients
      : virtualOfficeInquiryClients;

  const totalPages = Math.ceil(allClientsForCurrentTab.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = allClientsForCurrentTab.slice(startIndex, endIndex);
  // -----------------------------------------------------------------------


  const selectedClient = allClientsForCurrentTab.find((c) => c.id === selectedClientId) || null; // Ensure this looks at allClientsForCurrentTab

  const allReservedSeats = selectedClient?.reservedSeats || selectedClient?.selectedSeats || [];
  const allSelectedSeats = clients.flatMap((c) => c.selectedSeats || []);

  const isReservedSeat = (seat, mapType) => {
    const seatKey = `${mapType}-${seat.number}`;
    return allReservedSeats.includes(seatKey);
  };

  const isSelectedSeat = (seat, mapType) => {
    const seatKey = `${mapType}-${seat.number}`;
    return allSelectedSeats.includes(seatKey);
  };

  const responsiveSeatBoxSx = {
    minWidth: { xs: 28, sm: 36, md: 40 },
    width: { xs: "8vw", sm: "4vw", md: "40px" },
    maxWidth: { xs: 40, sm: 44, md: 50 },
    height: { xs: 20, sm: 22, md: 24 },
    p: 0,
    fontSize: { xs: '0.55rem', sm: '0.6rem' },
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0.5,
    transition: "all .15s"
  };

  const responsiveMapCardSx = {
    flexGrow: 1,
    minWidth: { xs: 250, sm: 320, md: 360 },
    maxWidth: { xs: "90vw", md: 420 }, // Added maxWidth for smaller screens
    flexBasis: { xs: "90vw", sm: "auto" },
    flexShrink: 1,
    width: "100%",
    m: 0,
    overflowX: "auto" // Crucial for horizontal scrolling of maps on small screens
  };

  const renderSeatMap = (groupPairs, mapType, title) => (
    <Card variant="outlined" sx={responsiveMapCardSx}>
      <CardContent>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={2}>
          {groupPairs.map((group, i) => (
            <Box key={i}>
              {group.map(([rowLabel, seats]) => (
                <Box key={rowLabel} mb={1} sx={{ width: "100%" }}>
                  <Typography variant="caption" fontWeight="medium">
                    {rowLabel} Row
                  </Typography>
                  <Stack direction="row" spacing={0.5} mt={0.5} sx={{ width: "100%" }}> {/* Reduced spacing */}
                    {seats.map((seat) => {
                      const seatKey = `${mapType}-${seat.number}`;
                      const reserved = isReservedSeat(seat, mapType);
                      const selected = isSelectedSeat(seat, mapType);

                      let seatColor = reserved ? 'primary.main' :
                        selected ? 'error.light' :
                          seat.type === "window" ? 'grey.100' : 'grey.50';

                      let barColor = reserved ? 'primary.dark' :
                        selected ? 'error.main' :
                          seat.type === "window" ? 'grey.400' : 'grey.300';

                      const hoverTitle = reserved ? "This seat is scheduled for a visit" :
                        selected ? "This seat is currently occupied" :
                          seat.type === "window" ? "Window seat (vacant)" : "Vacant seat";

                      return (
                        <Tooltip key={seat.id} title={hoverTitle} arrow>
                          <Box position="relative" mr={seat.type === "window" ? 1 : 0.5}>
                            <Button
                              disabled={reserved || selected}
                              variant="contained"
                              sx={{
                                ...responsiveSeatBoxSx,
                                bgcolor: seatColor,
                                color: reserved || selected ? 'common.white' : 'text.primary',
                                '&:hover': {
                                  bgcolor: reserved ? 'primary.dark' :
                                    selected ? 'error.main' :
                                      seat.type === "window" ? 'grey.200' : 'grey.100',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: seatColor,
                                  color: reserved || selected ? 'common.white' : 'text.primary',
                                }
                              }}
                            >
                              <Monitor size={10} style={{ marginBottom: 2 }} />
                              <Typography variant="caption" ml={0.5} fontSize="0.6rem">
                                {seat.number}
                              </Typography>
                            </Button>
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              width="100%"
                              height={2}
                              bgcolor={barColor}
                            />
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
              {i < groupPairs.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderOfficeDetails = (office) => {
    if (!office) return null;
    return (
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Office Information
        </Typography>
        <TableContainer component={Paper} sx={{ maxWidth: { xs: '100%', sm: 500 }, borderRadius: 2, boxShadow: 0, mb: 2 }}> {/* Added maxWidth */}
          <Table
            sx={{
              borderCollapse: "collapse",
              "& .MuiTableCell-root": { border: "1px solid #bdbdbd" }
            }}
            size="small"
          >
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: { xs: 120, sm: 180 } }}>Office</TableCell> {/* Adjusted width */}
                <TableCell>{office.office || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                <TableCell>{office.company || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell>{office.email || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell>{office.phone || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Visit Details</TableCell>
                <TableCell>{office.details || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Visit Date</TableCell>
                <TableCell>
                  {office.date
                    ? office.date.seconds
                      ? new Date(office.date.seconds * 1000).toLocaleString()
                      : office.date.toLocaleString()
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
                <TableCell>
                  {office.requestDate || "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderVirtualOfficeInquiryDetails = (inquiry) => {
    if (!inquiry) return null;
    return (
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Virtual Office Inquiry Details
        </Typography>
        <TableContainer component={Paper} sx={{ maxWidth: { xs: '100%', sm: 500 }, borderRadius: 2, boxShadow: 0, mb: 2 }}> {/* Added maxWidth */}
          <Table
            sx={{
              borderCollapse: "collapse",
              "& .MuiTableCell-root": { border: "1px solid #bdbdbd" }
            }}
            size="small"
          >
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: { xs: 120, sm: 180 } }}>Company</TableCell> {/* Adjusted width */}
                <TableCell>{inquiry.company || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                <TableCell>{inquiry.position || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                <TableCell>{inquiry.address || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell>{inquiry.email || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell>{inquiry.phone || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Inquiry Date</TableCell>
                <TableCell>
                  {inquiry.date
                    ? inquiry.date.seconds
                      ? new Date(inquiry.date.seconds * 1000).toLocaleDateString()
                      : new Date(inquiry.date).toLocaleDateString()
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Inquiry Time</TableCell>
                <TableCell>{inquiry.time || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
                <TableCell>
                  {inquiry.requestDate || "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };


  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' }, // Stacks vertically on small screens, horizontally on medium and up
      minHeight: '100vh',
      bgcolor: 'grey.50'
    }}>
      {/* Sidebar */}
      <Paper sx={{
        width: { xs: '100%', md: 280 }, // Full width on xs, fixed width on md and up
        minHeight: { xs: 'auto', md: '100vh' }, // Auto height on xs, full viewport height on md and up
        flexShrink: 0,
        overflow: 'auto',
        boxShadow: 2,
        position: { xs: 'static', md: 'sticky' }, // Static on xs, sticky on md and up
        top: { xs: 'auto', md: 0 }, // Sticks to top on md and up
        zIndex: 1 // Ensure sidebar is above main content if any z-index issues
      }}>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography fontWeight="medium">
            Visit Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 0
              ? `${allClientsForCurrentTab.length} seat requests`
              : activeTab === 1
                ? `${allClientsForCurrentTab.length} office requests`
                : `${allClientsForCurrentTab.length} virtual office inquiries`}
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SeatIcon fontSize="small" />} label="Seats" />
          <Tab icon={<OfficeIcon fontSize="small" />} label="Offices" />
          <Tab icon={<BusinessIcon fontSize="small" />} label="Virtual" />
        </Tabs>

        <List disablePadding>
          {currentClients.length > 0 ? (
            currentClients.map((client) => (
              <ListItem
                key={client.id}
                disablePadding
                sx={{
                  bgcolor: selectedClientId === client.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: selectedClientId === client.id ? 'primary.light' : 'action.hover'
                  }
                }}
              >
                <ListItemButton onClick={() => setSelectedClientId(client.id)}>
                  <ListItemText
                    primary={
                      <Typography component="span" fontWeight="medium" noWrap sx={{ display: 'block' }}>
                        {client.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {client.company}
                        </Typography>
                        {/* Display Request Date in the sidebar list */}
                        {client.requestDate && (
                          <Typography component="span" variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            Requested: {client.requestDate}
                          </Typography>
                        )}
                      </>
                    }
                    primaryTypographyProps={{ component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                  {client.reservedSeats?.length > 0 && activeTab === 0 && (
                    <Chip
                      label={`${client.reservedSeats.length} seats`}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {activeTab === 1 && client.officeNumber && (
                    <Chip
                      label={client.officeNumber}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {activeTab === 2 && (
                    <Chip
                      label="Inquiry"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <Box p={2} textAlign="center" color="text.secondary">
              <Typography variant="body2">No pending requests for this category.</Typography>
            </Box>
          )}
        </List>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box p={2} borderTop={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage} of {totalPages}
            </Typography>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        )}
      </Paper>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}> {/* Responsive padding */}
        {selectedClient ? (
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' }, // Stacks on xs, row on sm and up
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 3,
                  gap: 2 // Gap between stacked items
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {selectedClient.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body1" color="text.secondary">
                      {selectedClient.company}
                    </Typography>
                  </Stack>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}> {/* Stacks buttons on xs, row on sm */}
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleAcceptVisit(selectedClient.id)}
                    sx={{ textTransform: 'none' }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isAccepting ? 'Accepting...' : 'Accept Request'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={handleRejectClick}
                    sx={{ textTransform: 'none' }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </Button>
                </Stack>
              </Box>

              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}> {/* Full width on xs, half on md */}
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Contact Information
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body1">
                        {selectedClient.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body1">
                        {selectedClient.phone}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}> {/* Full width on xs, half on md */}
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Request Overview
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Visit Date:{" "}
                        {selectedClient.date
                          ? selectedClient.date.seconds
                            ? new Date(selectedClient.date.seconds * 1000).toLocaleDateString()
                            : new Date(selectedClient.date).toLocaleDateString()
                          : "N/A"}
                        {activeTab === 2 && selectedClient.time && `, Time: ${selectedClient.time}`}
                      </Typography>
                    </Stack>
                    {/* Add Request Date here for Seat Tab */}
                    {activeTab === 0 && selectedClient.requestDate && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Request Date: {selectedClient.requestDate}
                        </Typography>
                      </Stack>
                    )}
                    {activeTab === 0 && selectedClient.reservedSeats?.length > 0 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SeatIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Reserved seats: {selectedClient.reservedSeats.join(", ")}
                        </Typography>
                      </Stack>
                    )}
                    {activeTab === 1 && selectedClient.officeNumber && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OfficeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Requested office: {selectedClient.officeNumber}
                        </Typography>
                      </Stack>
                    )}
                    {activeTab === 2 && selectedClient.address && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HomeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Address: {selectedClient.address}
                        </Typography>
                      </Stack>
                    )}
                    {activeTab === 2 && selectedClient.position && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Position: {selectedClient.position}
                        </Typography>
                      </Stack>
                    )}
                    {(activeTab === 0 || activeTab === 1) && selectedClient.details && (
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <InfoIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Typography variant="body2">
                          Details: {selectedClient.details}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Grid>
              </Grid>

              {activeTab === 0 && (
                <Grid container spacing={2} justifyContent="center">
                  <Grid item xs={12} sm={6} lg={4}> {/* Responsive grid for seat maps */}
                    {renderSeatMap(groupPairs1, "map1", "Map 1")}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    {renderSeatMap(groupPairs2, "map2", "Map 2")}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    {renderSeatMap(groupPairs3, "map3", "Map 3")}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    {renderSeatMap(groupPairs4, "map4", "Map 4")}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={4}>
                    {renderSeatMap(groupPairs5, "map5", "Map 5")}
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && renderOfficeDetails(selectedClient)}
              {activeTab === 2 && renderVirtualOfficeInquiryDetails(selectedClient)}

            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '80%',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="h6">
              Select a client from the sidebar to view their details.
            </Typography>
          </Box>
        )}
      </Box>

      <RejectReasonModal
        open={showRejectModal}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
      />
    </Box>
  );
}