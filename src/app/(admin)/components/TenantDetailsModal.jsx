import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  Divider,
  Box,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TenantExtensionHistory from "./TenantExtensionHistory";
import { getTenantBillingHistory, formatPHP } from "../utils/billingService";
import { getBillingSettings } from "../utils/billingSettingsService";

export default function TenantDetailsModal({
  open,
  onClose,
  client,
  onExtend,
  onEdit
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getBillingSettings();
      setVatEnabled(settings.vatEnabled);
    };
    loadSettings();
  }, [open]); // Reload when modal opens to get latest settings

  // Load billing history when client changes
  useEffect(() => {
    if (client?.id) {
      loadBillingHistory();
    }
  }, [client?.id]);

  const loadBillingHistory = async () => {
    if (!client?.id) return;

    setLoadingBillingHistory(true);
    try {
      const history = await getTenantBillingHistory(client.id);
      setBillingHistory(history);
    } catch (error) {
      console.error('Error loading billing history:', error);
    } finally {
      setLoadingBillingHistory(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon fontSize="small" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      case 'overdue':
        return <WarningIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (!client) return null;

  // Debug: Log client data to see available fields
  console.log('Client data in TenantDetailsModal:', client);

  const extensionHistory =
    client.extensionHistory ||
    (client.billing && client.billing.extensionHistory) ||
    [];

  // Generate invoice number based on client ID and date
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const clientId = client.id || client.email?.split('@')[0] || 'CLIENT';
    return `INV-${year}${month}${day}-${clientId.toUpperCase()}`;
  };

  // Calculate 30-day due date from current date
  const calculateDueDate = () => {
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return dueDate.toLocaleDateString();
  };

  // --- Notification for 30 days left ---
  let show30DayNotif = false;
  let daysLeft = null;
  if (client?.billing?.billingEndDate) {
    const now = new Date();
    const end = new Date(client.billing.billingEndDate);
    daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft === 30) {
      show30DayNotif = true;
    }
  }

  // Calculate billing breakdown
  const calculateBillingBreakdown = () => {
    const rate = parseFloat(client?.billing?.rate) || 0;
    const months = parseInt(client?.billing?.monthsToAvail) || 1;
    const cusaFee = parseFloat(client?.billing?.cusaFee) || 0;
    const parkingFee = parseFloat(client?.billing?.parkingFee) || 0;

    // Determine item description based on selected items and plan type
    let itemDescription = "Rental Fee";
    let quantity = 1;

    if (client?.selectedSeats && client.selectedSeats.length > 0) {
      itemDescription = "Seat Rental";
      quantity = client.selectedSeats.length;
    } else if (client?.selectedOffices && client.selectedOffices.length > 0) {
      itemDescription = "Private Office Rental";
      quantity = client.selectedOffices.length;
    } else if (client?.billing?.plan?.toLowerCase().includes('virtual')) {
      itemDescription = "Virtual Office Service";
      quantity = 1;
    }

    const baseAmount = rate * quantity * months;
    const cusaAmount = cusaFee * months;
    const parkingAmount = parkingFee * months;
    const subtotal = baseAmount + cusaAmount + parkingAmount;
    const vat = vatEnabled ? subtotal * 0.12 : 0;
    const total = subtotal + vat;

    return {
      items: [
        {
          description: `${itemDescription} (${quantity} ${quantity > 1 ? 'units' : 'unit'} × ${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: quantity * months,
          rate: rate,
          amount: baseAmount
        },
        ...(cusaFee > 0 ? [{
          description: `CUSA Fee (${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: months,
          rate: cusaFee,
          amount: cusaAmount
        }] : []),
        ...(parkingFee > 0 ? [{
          description: `Parking Fee (${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: months,
          rate: parkingFee,
          amount: parkingAmount
        }] : [])
      ],
      subtotal,
      vat,
      total
    };
  };

  const billingBreakdown = calculateBillingBreakdown();

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          pb: 0,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Invoice Details
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            {client?.company} • {generateInvoiceNumber()}
          </Typography>
        </Box>
        <Box>
          <IconButton
            onClick={onClose}
            aria-label="close"
            size="large"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>



      <DialogContent dividers sx={{ p: 3 }}>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tenant Details" />
          <Tab label="Billing History" />
          <Tab label="Extension History" />
        </Tabs>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* 30 days left notification */}
            {show30DayNotif && (
              <Alert severity="warning" sx={{ fontWeight: 600 }}>
                ⚠️ This tenant has only 30 days left in their current monthly availability. Please notify them or extend their availability soon.
              </Alert>
            )}

            {/* Invoice Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                INSPIRE HUB
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Professional Workspace Solutions
              </Typography>
            </Box>

            {/* Client and Invoice Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary' }}>
                      <PersonIcon />
                      BILL TO
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>{client?.name || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">{client?.company || 'N/A'}</Typography>
                    <Typography variant="body2">{client?.email || 'N/A'}</Typography>
                    <Typography variant="body2">{client?.phone || client?.billing?.phone || 'N/A'}</Typography>
                    <Typography variant="body2">{client?.address || client?.billing?.address || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary' }}>
                      <BusinessIcon />
                      INVOICE DETAILS
                    </Typography>
                    <Typography variant="body2"><strong>Invoice #:</strong> {generateInvoiceNumber()}</Typography>
                    <Typography variant="body2"><strong>Date:</strong> {new Date().toLocaleDateString()}</Typography>
                    <Typography variant="body2"><strong>Due Date:</strong> {calculateDueDate()}</Typography>
                    <Typography variant="body2"><strong>Plan:</strong> {client?.billing?.plan || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Payment Method:</strong> {client?.billing?.paymentMethod || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Billing Breakdown */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                  BILLING BREAKDOWN
                </Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                      {billingBreakdown.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ border: 'none', py: 1 }}>
                            <Typography variant="body2">{item.description}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                            <Typography variant="body2">
                              {item.description.includes('Seat Rental')
                                ? `${client?.selectedSeats?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                                : item.description.includes('Private Office Rental')
                                  ? `${client?.selectedOffices?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                                  : item.description.includes('Virtual Office Service')
                                    ? `1 × ${client?.billing?.monthsToAvail || 1}`
                                    : item.quantity
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                            <Typography variant="body2">{formatCurrency(item.rate)}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                            <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
                          <Typography variant="body1" fontWeight={600}>Subtotal</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
                          <Typography variant="body1" fontWeight={600}>{formatCurrency(billingBreakdown.subtotal)}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ pt: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {vatEnabled ? "VAT (12%)" : "VAT"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pt: 1 }}>
                          <Typography variant="body1" fontWeight={600}>{formatCurrency(billingBreakdown.vat)}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
                          <Typography variant="h6" fontWeight={700} color="primary">TOTAL</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
                          <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(billingBreakdown.total)}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                      RENTAL PERIOD
                    </Typography>
                    <Typography variant="body2"><strong>Start Date:</strong> {client?.billing?.startDate ? new Date(client.billing.startDate).toLocaleDateString() : 'N/A'}</Typography>
                    <Typography variant="body2"><strong>End Date:</strong> {client?.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {client?.billing?.monthsToAvail || 'N/A'} {parseInt(client?.billing?.monthsToAvail) > 1 ? 'months' : 'month'}</Typography>
                    <Typography variant="body2"><strong>Remaining Days:</strong> {daysLeft !== null ? `${daysLeft} days` : 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                      ASSIGNED SPACE
                    </Typography>
                    <Typography variant="body2"><strong>Plan Type:</strong> {client?.billing?.plan || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Selected Items:</strong> {
                      client?.selectedSeats?.length > 0
                        ? client.selectedSeats.join(", ")
                        : client?.selectedOffices?.length > 0
                          ? client.selectedOffices.join(", ")
                          : "Virtual Office"
                    }</Typography>
                    <Typography variant="body2"><strong>Base Rate:</strong> {formatCurrency(client?.billing?.rate)}</Typography>
                    <Typography variant="body2"><strong>Currency:</strong> {client?.billing?.currency || 'PHP'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Extension History Section */}
            {extensionHistory.length > 0 && (
              <TenantExtensionHistory history={extensionHistory} />
            )}
          </Stack>
        )}

        {/* Billing History Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Billing History
            </Typography>

            {loadingBillingHistory ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : billingHistory.length === 0 ? (
              <Alert severity="info">
                No billing history found for this tenant.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Billing Month</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Paid Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingHistory.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {bill.billingMonth}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {formatPHP(bill.total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(bill.status)}
                            label={bill.status.toUpperCase()}
                            color={getStatusColor(bill.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {bill.paidAt ? new Date(bill.paidAt.toDate ? bill.paidAt.toDate() : bill.paidAt).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Extension History Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Extension History
            </Typography>

            {extensionHistory.length === 0 ? (
              <Alert severity="info">
                No extension history found for this tenant.
              </Alert>
            ) : (
              <TenantExtensionHistory history={extensionHistory} />
            )}
          </Box>
        )}


      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
        <Button
          onClick={() => {
            onClose();
            onEdit(client);
          }}
          startIcon={<EditIcon />}
          color="secondary"
          variant="contained"
        >
          Edit Details
        </Button>
        <Button
          onClick={() => onExtend(client)}
          startIcon={<EventAvailableIcon />}
          color="primary"
          variant="contained"
        >
          Extend Availability
        </Button>
      </DialogActions>
    </Dialog>
  );
}