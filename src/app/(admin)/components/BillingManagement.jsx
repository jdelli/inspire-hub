"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  BusinessCenter as BusinessCenterIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  generateMonthlyBilling,
  getBillingStatistics,
  getMonthlyBillingRecords,
  updateBillingStatus,
  checkAndUpdateOverdueBills,
  formatPHP,
} from "../utils/billingService";

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

const getTenantTypeIcon = (type) => {
  switch (type) {
    case 'dedicated-desk':
      return <PersonIcon />;
    case 'private-office':
      return <BusinessIcon />;
    case 'virtual-office':
      return <BusinessCenterIcon />;
    default:
      return <PersonIcon />;
  }
};

export default function BillingManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const printRef = useRef();
  
  const [billingStats, setBillingStats] = useState(null);
  const [currentMonthBills, setCurrentMonthBills] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showGenerateBillingDialog, setShowGenerateBillingDialog] = useState(false);
  const [billingTargetMonth, setBillingTargetMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'credit',
    reference: '',
    notes: ''
  });
  const [alert, setAlert] = useState(null);

  // Load billing data
  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const [stats, bills] = await Promise.all([
        getBillingStatistics(selectedMonth),
        getMonthlyBillingRecords(selectedMonth)
      ]);
      
      setBillingStats(stats);
      setCurrentMonthBills(bills);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load billing data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [selectedMonth]);

  // Generate monthly billing
  const handleGenerateBilling = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyBilling(billingTargetMonth);
      
      if (result.success) {
        if (result.totalGenerated > 0) {
          setAlert({
            type: 'success',
            message: `Successfully generated ${result.totalGenerated} billing records for ${result.billingMonth}`
          });
        } else {
          setAlert({
            type: 'info',
            message: `No new billing records generated for ${result.billingMonth}. All tenants already have billing records for this month.`
          });
        }
        
        if (result.errors.length > 0) {
          console.warn('Billing generation completed with some errors:', result.errors);
        }
        
        setShowGenerateBillingDialog(false);
        loadBillingData(); // Refresh data
      } else {
        setAlert({
          type: 'error',
          message: `Failed to generate billing: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Error generating billing:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate monthly billing'
      });
    } finally {
      setIsGenerating(false);
    }
  };



  // Check and update overdue bills
  const handleCheckOverdueBills = async () => {
    try {
      const results = await checkAndUpdateOverdueBills();
      if (results.length > 0) {
        setAlert({
          type: 'warning',
          message: `Marked ${results.length} bills as overdue`
        });
        loadBillingData(); // Refresh data
      } else {
        setAlert({
          type: 'info',
          message: 'No overdue bills found'
        });
      }
    } catch (error) {
      console.error('Error checking overdue bills:', error);
      setAlert({
        type: 'error',
        message: 'Failed to check overdue bills'
      });
    }
  };

  // Mark bill as paid
  const handleMarkAsPaid = async () => {
    if (!selectedBill) return;
    
    try {
      await updateBillingStatus(selectedBill.id, 'paid', paymentDetails);
      setAlert({
        type: 'success',
        message: 'Payment recorded successfully'
      });
      setShowPaymentDialog(false);
      setSelectedBill(null);
      setPaymentDetails({ method: 'credit', reference: '', notes: '' });
      loadBillingData(); // Refresh data
    } catch (error) {
      console.error('Error updating payment status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to record payment'
      });
    }
  };

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  // Generate invoice number based on bill ID and date
  const generateInvoiceNumber = (bill) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const tenantId = bill?.tenantName?.split(' ')[0] || 'TENANT';
    return `INV-${year}${month}${day}-${tenantId.toUpperCase()}`;
  };

  // Format currency for print
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };



  // Handle print functionality
  const handlePrint = () => {
    if (!selectedBill) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedBill.tenantCompany || selectedBill.tenantName || 'N/A'}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1976d2;
            }
            .company-logo {
              font-size: 28px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .invoice-subtitle {
              font-size: 14px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-details, .client-details {
              flex: 1;
            }
            .invoice-details {
              text-align: right;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 2px solid #e0e0e0;
            }
            .billing-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .billing-table th {
              background-color: #f5f5f5;
              padding: 12px 8px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
            }
            .billing-table td {
              padding: 12px 8px;
              border-bottom: 1px solid #ddd;
            }
            .billing-table .amount {
              text-align: right;
            }
            .billing-table .total-row {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .billing-table .total-row td {
              border-top: 2px solid #ddd;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .summary-box {
              flex: 1;
              margin: 0 10px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .summary-box h4 {
              margin: 0 0 10px 0;
              color: #1976d2;
              font-size: 14px;
            }
            .summary-box p {
              margin: 5px 0;
              font-size: 13px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid {
              background-color: #d4edda;
              color: #155724;
            }
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-overdue {
              background-color: #f8d7da;
              color: #721c24;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              text-align: center; 
              font-size: 12px;
              color: #777;
            }
            .terms {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-logo">INSPIRE HUB</div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-subtitle">Professional Workspace Solutions</div>
            </div>
            
            <div class="invoice-info">
              <div class="client-details">
                <div class="section-title">BILL TO</div>
                <p><strong>${selectedBill.tenantName || 'N/A'}</strong></p>
                <p>${selectedBill.tenantCompany || 'N/A'}</p>
                <p>${selectedBill.tenantEmail || 'N/A'}</p>
                <p>${selectedBill.tenantPhone || 'N/A'}</p>
                <p>${selectedBill.tenantAddress || 'N/A'}</p>
              </div>
              <div class="invoice-details">
                <div class="section-title">INVOICE DETAILS</div>
                <p><strong>Invoice #:</strong> ${generateInvoiceNumber(selectedBill)}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                <p><strong>Billing Month:</strong> ${selectedBill.billingMonth}</p>
                <p><strong>Plan:</strong> ${selectedBill.tenantType.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${selectedBill.status}">${selectedBill.status.toUpperCase()}</span></p>
              </div>
            </div>
            
            <div class="section-title">BILLING BREAKDOWN</div>
            <table class="billing-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Qty</th>
                  <th class="amount">Unit Price</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${selectedBill.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="amount">${item.quantity}</td>
                    <td class="amount">${formatCurrency(item.unitPrice)}</td>
                    <td class="amount">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>Subtotal</strong></td>
                  <td class="amount"><strong>${formatCurrency(selectedBill.subtotal)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>VAT (12%)</strong></td>
                  <td class="amount"><strong>${formatCurrency(selectedBill.vat)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>TOTAL</strong></td>
                  <td class="amount"><strong>${formatCurrency(selectedBill.total)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-box">
                <h4>BILLING INFORMATION</h4>
                <p><strong>Billing Month:</strong> ${selectedBill.billingMonth}</p>
                <p><strong>Due Date:</strong> ${new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${selectedBill.paymentMethod || 'N/A'}</p>
                <p><strong>Status:</strong> ${selectedBill.status.toUpperCase()}</p>
              </div>
              <div class="summary-box">
                <h4>TENANT INFORMATION</h4>
                <p><strong>Name:</strong> ${selectedBill.tenantName}</p>
                <p><strong>Company:</strong> ${selectedBill.tenantCompany || 'N/A'}</p>
                <p><strong>Type:</strong> ${selectedBill.tenantType.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                <p><strong>Email:</strong> ${selectedBill.tenantEmail}</p>
              </div>
            </div>
            
            <div class="terms">
              <strong>Terms & Conditions:</strong><br>
              • Payment is due upon receipt of this invoice<br>
              • Late payments may incur additional charges<br>
              • This invoice is valid for 30 days from the date of issue<br>
              • For questions regarding this invoice, please contact our billing department
            </div>
            
            <div class="footer">
              <strong>INSPIRE HUB</strong><br>
              Professional Workspace Solutions<br>
              This is an official invoice generated by the Billing Management System<br>
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Hidden div for print content */}
      <div ref={printRef} style={{ display: 'none' }}></div>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Billing Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage monthly billing, payments, and overdue accounts
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadBillingData}
            disabled={isGenerating}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AttachMoneyIcon />}
            onClick={() => setShowGenerateBillingDialog(true)}
            disabled={isGenerating}
            sx={{ bgcolor: 'success.main' }}
          >
            Generate Monthly Billing
          </Button>
        </Stack>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Bills
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {billingStats?.totalBills || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ReceiptIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatPHP(billingStats?.totalAmount || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Paid Amount
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {formatPHP(billingStats?.paidAmount || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Overdue Amount
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {formatPHP(billingStats?.overdueAmount || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Month Selector and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            label="Select Month"
          >
            {generateMonthOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<WarningIcon />}
          onClick={handleCheckOverdueBills}
          disabled={isGenerating}
        >
          Check Overdue Bills
        </Button>
      </Box>

      {/* Billing Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Billing Records - {selectedMonth}
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentMonthBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        No billing records found for {selectedMonth}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMonthBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {bill.tenantName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bill.tenantCompany}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTenantTypeIcon(bill.tenantType)}
                          <Typography variant="body2">
                            {bill.tenantType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
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
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowBillDetails(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {bill.status !== 'paid' && (
                            <Tooltip title="Mark as Paid">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setShowPaymentDialog(true);
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog
        open={showBillDetails}
        onClose={() => setShowBillDetails(false)}
        maxWidth="md"
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
              Billing Details
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              {selectedBill?.tenantCompany || selectedBill?.tenantName} • {selectedBill && generateInvoiceNumber(selectedBill)}
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Print Invoice">
              <IconButton 
                onClick={handlePrint} 
                aria-label="print" 
                size="large" 
                sx={{ mr: 1, color: 'white' }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={() => setShowBillDetails(false)} 
              aria-label="close" 
              size="large"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Tenant Information</Typography>
                  <Typography><strong>Name:</strong> {selectedBill.tenantName}</Typography>
                  <Typography><strong>Company:</strong> {selectedBill.tenantCompany}</Typography>
                  <Typography><strong>Email:</strong> {selectedBill.tenantEmail}</Typography>
                  <Typography><strong>Type:</strong> {selectedBill.tenantType}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Billing Information</Typography>
                  <Typography><strong>Billing Month:</strong> {selectedBill.billingMonth}</Typography>
                  <Typography><strong>Due Date:</strong> {new Date(selectedBill.dueDate).toLocaleDateString()}</Typography>
                  <Typography><strong>Status:</strong> {selectedBill.status}</Typography>
                  <Typography><strong>Payment Method:</strong> {selectedBill.paymentMethod}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Items Breakdown</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBill.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatPHP(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatPHP(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right"><strong>Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>{formatPHP(selectedBill.subtotal)}</strong></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right"><strong>VAT (12%):</strong></TableCell>
                          <TableCell align="right"><strong>{formatPHP(selectedBill.vat)}</strong></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right"><strong>Total:</strong></TableCell>
                          <TableCell align="right"><strong>{formatPHP(selectedBill.total)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBillDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentDetails.method}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, method: e.target.value }))}
                label="Payment Method"
              >
                <MenuItem value="credit">Credit Card</MenuItem>
                <MenuItem value="bank">Bank Transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Payment Reference"
              value={paymentDetails.reference}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, reference: e.target.value }))}
              fullWidth
              placeholder="Transaction ID, check number, etc."
            />
            
            <TextField
              label="Notes"
              value={paymentDetails.notes}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Additional payment notes..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleMarkAsPaid} variant="contained" color="success">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Billing Dialog */}
      <Dialog
        open={showGenerateBillingDialog}
        onClose={() => setShowGenerateBillingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Generate Monthly Billing
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              This will generate billing records for all active tenants for the selected month. 
              Billing records that already exist will not be duplicated.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Target Month</InputLabel>
              <Select
                value={billingTargetMonth}
                onChange={(e) => setBillingTargetMonth(e.target.value)}
                label="Target Month"
              >
                {generateMonthOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Only tenants who don't already have billing records for {billingTargetMonth} will have new records generated.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateBillingDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateBilling} 
            variant="contained" 
            color="success"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Billing'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
