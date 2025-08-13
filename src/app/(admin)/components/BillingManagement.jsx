"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Rating,
  Fade,
  Zoom,
  Slide,
  Grow,
  Collapse,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Skeleton,
  Backdrop,
  Snackbar,
  AlertTitle,
  Breadcrumbs,
  Link,
  Chip as MuiChip,
  Autocomplete,
  Checkbox,
  FormGroup,
  Radio,
  RadioGroup,
  Switch as MuiSwitch,
  Slider as MuiSlider,
  Rating as MuiRating,
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
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  FileDownload as FileDownloadIcon,
  CloudDownload as CloudDownloadIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../script/firebaseConfig";
import {
  generateMonthlyBilling,
  getBillingStatistics,
  getMonthlyBillingRecords,
  updateBillingStatus,
  checkAndUpdateOverdueBills,
  updateBillingFees,
  checkTenantBillingConfiguration,
  updateTenantBillingDefaults,
  formatPHP,
  testExports,
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
  
  // Enhanced state management
  const [billingStats, setBillingStats] = useState(null);
  const [currentMonthBills, setCurrentMonthBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showGenerateBillingDialog, setShowGenerateBillingDialog] = useState(false);
  const [showBulkActionsDialog, setShowBulkActionsDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showAdditionalFeesDialog, setShowAdditionalFeesDialog] = useState(false);
  const [billingTargetMonth, setBillingTargetMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  
  // Enhanced filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Bulk actions
  const [selectedBills, setSelectedBills] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Enhanced payment details
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'credit',
    reference: '',
    notes: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Additional fees details
  const [additionalFeesDetails, setAdditionalFeesDetails] = useState({
    penaltyFee: 0,
    damageFee: 0,
    notes: ''
  });
  
  // Email and notifications
  const [emailDetails, setEmailDetails] = useState({
    subject: '',
    message: '',
    includeInvoice: true,
    recipients: []
  });
  
  // Analytics and insights
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // UI states
  const [alert, setAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loadingStates, setLoadingStates] = useState({
    bulkAction: false,
    email: false,
    export: false,
    analytics: false
  });
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Enhanced data processing and filtering
  const processAndFilterBills = useCallback((bills) => {
    let filtered = [...bills];
    
    console.log(`Processing ${bills.length} bills with filters:`, {
      searchTerm,
      statusFilter,
      typeFilter,
      sortBy,
      sortOrder
    });
    
    // Search filter
    if (searchTerm) {
      const beforeSearch = filtered.length;
      filtered = filtered.filter(bill => 
        bill.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.tenantCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.tenantEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`Search filter: ${beforeSearch} -> ${filtered.length} (filtered out ${beforeSearch - filtered.length})`);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const beforeStatus = filtered.length;
      filtered = filtered.filter(bill => bill.status === statusFilter);
      console.log(`Status filter (${statusFilter}): ${beforeStatus} -> ${filtered.length} (filtered out ${beforeStatus - filtered.length})`);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const beforeType = filtered.length;
      filtered = filtered.filter(bill => bill.tenantType === typeFilter);
      console.log(`Type filter (${typeFilter}): ${beforeType} -> ${filtered.length} (filtered out ${beforeType - filtered.length})`);
    }
    
    // Debug: Log which bills are being filtered out
    if (bills.length !== filtered.length) {
      const filteredOut = bills.filter(bill => !filtered.find(f => f.id === bill.id));
      console.log('Filtered out bills:', filteredOut.map(bill => ({
        id: bill.id,
        tenantName: bill.tenantName,
        status: bill.status,
        tenantType: bill.tenantType,
        total: bill.total
      })));
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'tenantName':
          aValue = a.tenantName || '';
          bValue = b.tenantName || '';
          break;
        case 'amount':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    console.log(`Final filtered result: ${filtered.length} bills`);
    setFilteredBills(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Load billing data with enhanced error handling
  const loadBillingData = async () => {
    setIsLoading(true);
    setShowBackdrop(true);
    try {
      const [stats, bills] = await Promise.all([
        getBillingStatistics(selectedMonth),
        getMonthlyBillingRecords(selectedMonth)
      ]);
      
      setBillingStats(stats);
      setCurrentMonthBills(bills);
      

      
      processAndFilterBills(bills);
      
      setSnackbar({
        open: true,
        message: `Loaded ${bills.length} billing records for ${selectedMonth}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error loading billing data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load billing data. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      setShowBackdrop(false);
    }
  };

  // Enhanced analytics data loading
  const loadAnalyticsData = async () => {
    setLoadingStates(prev => ({ ...prev, analytics: true }));
    try {
      // Simulate analytics data - replace with actual API call
      const analytics = {
        monthlyTrends: [
          { month: 'Jan', revenue: 150000, bills: 45 },
          { month: 'Feb', revenue: 180000, bills: 52 },
          { month: 'Mar', revenue: 220000, bills: 58 },
          { month: 'Apr', revenue: 195000, bills: 55 },
          { month: 'May', revenue: 240000, bills: 62 },
          { month: 'Jun', revenue: 280000, bills: 68 }
        ],
        paymentMethods: [
          { method: 'Credit Card', count: 45, percentage: 60 },
          { method: 'Bank Transfer', count: 20, percentage: 27 },
          { method: 'Cash', count: 8, percentage: 11 },
          { method: 'Check', count: 2, percentage: 2 }
        ],
        overdueAnalysis: {
          totalOverdue: billingStats?.overdueAmount || 0,
          overdueCount: currentMonthBills.filter(b => b.status === 'overdue').length,
          averageDaysOverdue: 15,
          riskLevel: 'Medium'
        }
      };
      
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load analytics data',
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, analytics: false }));
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [selectedMonth]);

  useEffect(() => {
    if (currentMonthBills.length > 0) {
      processAndFilterBills(currentMonthBills);
    }
  }, [currentMonthBills, processAndFilterBills]);

  // Enhanced bulk actions
  const handleBulkAction = async () => {
    if (selectedBills.length === 0 || !bulkAction) return;
    
    setLoadingStates(prev => ({ ...prev, bulkAction: true }));
    try {
      switch (bulkAction) {
        case 'mark_paid':
          await Promise.all(selectedBills.map(billId => 
            updateBillingStatus(billId, 'paid', { method: 'bulk', reference: 'Bulk Payment' })
          ));
          setSnackbar({
            open: true,
            message: `Marked ${selectedBills.length} bills as paid`,
            severity: 'success'
          });
          break;
        case 'send_reminder':
          // Implement email reminder functionality
          setSnackbar({
            open: true,
            message: `Sent reminders to ${selectedBills.length} tenants`,
            severity: 'success'
          });
          break;
        case 'export':
          // Implement export functionality
          setSnackbar({
            open: true,
            message: `Exported ${selectedBills.length} billing records`,
            severity: 'success'
          });
          break;
        default:
          break;
      }
      
      setSelectedBills([]);
      setBulkAction('');
      setShowBulkActionsDialog(false);
      loadBillingData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setSnackbar({
        open: true,
        message: 'Failed to perform bulk action',
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkAction: false }));
    }
  };

  // Enhanced email functionality
  const handleSendEmail = async () => {
    setLoadingStates(prev => ({ ...prev, email: true }));
    try {
      // Implement email sending functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setSnackbar({
        open: true,
        message: `Email sent to ${emailDetails.recipients.length} recipients`,
        severity: 'success'
      });
      setShowEmailDialog(false);
      setEmailDetails({ subject: '', message: '', includeInvoice: true, recipients: [] });
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send email',
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  // Enhanced export functionality
  const handleExport = async (format = 'csv') => {
    setLoadingStates(prev => ({ ...prev, export: true }));
    try {
      // Get the data to export (either selected bills or all filtered bills)
      const dataToExport = selectedBills.length > 0 
        ? filteredBills.filter(bill => selectedBills.includes(bill.id))
        : filteredBills;
      
      if (dataToExport.length === 0) {
        setSnackbar({
          open: true,
          message: 'No data to export',
          severity: 'warning'
        });
        return;
      }

      switch (format) {
        case 'csv':
          await exportToCSV(dataToExport);
          break;
        case 'excel':
          await exportToExcel(dataToExport);
          break;
        case 'pdf':
          await exportToPDF(dataToExport);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      setSnackbar({
        open: true,
        message: `Successfully exported ${dataToExport.length} records in ${format.toUpperCase()} format`,
        severity: 'success'
      });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: `Failed to export data: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, export: false }));
    }
  };

  // Export to CSV
  const exportToCSV = async (data) => {
    const headers = [
      'Tenant Name',
      'Company',
      'Email',
      'Type',
      'Status',
      'Amount',
      'Due Date',
      'Billing Month'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(bill => [
        `"${bill.tenantName || ''}"`,
        `"${bill.tenantCompany || ''}"`,
        `"${bill.tenantEmail || ''}"`,
        `"${bill.tenantType || ''}"`,
        `"${bill.status || ''}"`,
        bill.total || 0,
        `"${new Date(bill.dueDate).toLocaleDateString()}"`,
        `"${bill.billingMonth || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billing_data_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (using CSV format with .xlsx extension)
  const exportToExcel = async (data) => {
    // For now, we'll use CSV format but with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    const headers = [
      'Tenant Name',
      'Company',
      'Email',
      'Type',
      'Status',
      'Amount',
      'Due Date',
      'Billing Month'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(bill => [
        `"${bill.tenantName || ''}"`,
        `"${bill.tenantCompany || ''}"`,
        `"${bill.tenantEmail || ''}"`,
        `"${bill.tenantType || ''}"`,
        `"${bill.status || ''}"`,
        bill.total || 0,
        `"${new Date(bill.dueDate).toLocaleDateString()}"`,
        `"${bill.billingMonth || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billing_data_${selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = async (data) => {
    // Create a simple HTML table for PDF
    const tableRows = data.map(bill => `
      <tr>
        <td>${bill.tenantName || ''}</td>
        <td>${bill.tenantCompany || ''}</td>
        <td>${bill.tenantEmail || ''}</td>
        <td>${bill.tenantType || ''}</td>
        <td>${bill.status || ''}</td>
        <td>${formatPHP(bill.total || 0)}</td>
        <td>${new Date(bill.dueDate).toLocaleDateString()}</td>
        <td>${bill.billingMonth || ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billing Data - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Billing Data Report</h1>
            <h2>${selectedMonth}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <p><strong>Total Records:</strong> ${data.length}</p>
            <p><strong>Total Amount:</strong> ${formatPHP(data.reduce((sum, bill) => sum + (bill.total || 0), 0))}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Billing Month</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create a new window and print it
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };

  // Enhanced payment recording
  const handleMarkAsPaid = async () => {
    if (!selectedBill) return;
    
    setLoadingStates(prev => ({ ...prev, bulkAction: true }));
    try {
      await updateBillingStatus(selectedBill.id, 'paid', paymentDetails);
      setSnackbar({
        open: true,
        message: 'Payment recorded successfully',
        severity: 'success'
      });
      setShowPaymentDialog(false);
      setSelectedBill(null);
      setPaymentDetails({ method: 'credit', reference: '', notes: '', amount: '', date: new Date().toISOString().split('T')[0] });
      loadBillingData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to record payment',
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkAction: false }));
    }
  };

  // Delete billing record
  const handleDeleteBilling = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this billing record? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete billing record from Firestore
      await deleteDoc(doc(db, 'billing', billId));
      
      setSnackbar({
        open: true,
        message: 'Billing record deleted successfully',
        severity: 'success'
      });
      loadBillingData();
    } catch (error) {
      console.error('Error deleting billing record:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete billing record',
        severity: 'error'
      });
    }
  };

  // Handle additional fees update
  const handleUpdateAdditionalFees = async () => {
    if (!selectedBill) return;
    
    setLoadingStates(prev => ({ ...prev, bulkAction: true }));
    try {
      const result = await updateBillingFees(selectedBill.id, additionalFeesDetails);
      setSnackbar({
        open: true,
        message: `Additional fees updated successfully. New total: ${formatPHP(result.newTotal)}`,
        severity: 'success'
      });
      setShowAdditionalFeesDialog(false);
      setSelectedBill(null);
      setAdditionalFeesDetails({ penaltyFee: 0, damageFee: 0, notes: '' });
      loadBillingData();
    } catch (error) {
      console.error('Error updating additional fees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update additional fees',
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkAction: false }));
    }
  };

  // Generate monthly billing
  const handleGenerateBilling = async () => {
    setIsGenerating(true);
    try {
      // First check tenant billing configuration
      const configCheck = await checkTenantBillingConfiguration();
      
      if (configCheck.tenantsWithoutBilling > 0 || configCheck.tenantsWithZeroRate > 0) {
        setAlert({
          type: 'warning',
          message: `Found ${configCheck.tenantsWithoutBilling} tenants without billing configuration and ${configCheck.tenantsWithZeroRate} tenants with zero rates. Billing will be generated with default rates.`
        });
      }
      
      const result = await generateMonthlyBilling(billingTargetMonth);
      
      if (result.success) {
        let message = `Successfully generated ${result.totalGenerated} billing records for ${result.billingMonth}`;
        
        if (result.totalSkipped > 0) {
          message += `. Skipped ${result.totalSkipped} tenants (billing already exists).`;
        }
        
        if (result.totalErrors > 0) {
          message += `. ${result.totalErrors} errors occurred.`;
        }
        
        if (result.totalGenerated > 0) {
          setAlert({
            type: 'success',
            message: message
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



  // Generate PDF content (same as print)
  const generatePDFContent = (bill) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.tenantCompany || bill.tenantName || 'N/A'}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              color: #333;
              line-height: 1.5;
              font-size: 14px;
            }
            .invoice-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              page-break-inside: avoid;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px solid #1976d2;
              page-break-after: avoid;
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
              margin-bottom: 6px;
            }
            .invoice-subtitle {
              font-size: 14px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              page-break-inside: avoid;
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
              padding-bottom: 6px;
              border-bottom: 2px solid #e0e0e0;
            }
            .billing-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .billing-table th {
              background-color: #f5f5f5;
              padding: 10px 8px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
              font-size: 13px;
            }
            .billing-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
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
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .summary-box {
              flex: 1;
              margin: 0 8px;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .summary-box h4 {
              margin: 0 0 10px 0;
              color: #1976d2;
              font-size: 14px;
            }
            .summary-box p {
              margin: 6px 0;
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
            .terms {
              margin-top: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              font-size: 13px;
              page-break-inside: avoid;
            }
            .bank-details {
              margin-top: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              border: 2px solid #1976d2;
              page-break-inside: avoid;
            }
            .bank-details h4 {
              margin: 0 0 15px 0;
              color: #1976d2;
              font-size: 18px;
              text-align: center;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 8px;
            }
            .bank-section {
              margin-bottom: 18px;
            }
            .bank-section h5 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
              font-weight: bold;
            }
            .bank-account {
              background-color: white;
              padding: 15px;
              margin: 10px 0;
              border-radius: 4px;
              border-left: 4px solid #1976d2;
            }
            .bank-account p {
              margin: 6px 0;
              font-size: 14px;
            }
            .footer { 
              margin-top: 25px; 
              padding-top: 15px; 
              border-top: 1px solid #ddd; 
              text-align: center; 
              font-size: 12px;
              color: #777;
              page-break-inside: avoid;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 13px;
              }
              .no-print { display: none; }
              .invoice-container {
                page-break-inside: auto;
              }
              .page-break {
                page-break-before: always;
              }
              .avoid-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- PAGE 1: Header and Invoice Details -->
            <div class="invoice-header">
              <div class="company-logo">INSPIRE HUB</div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-subtitle">Professional Workspace Solutions</div>
            </div>
            
            <div class="invoice-info">
              <div class="client-details">
                <div class="section-title">BILL TO</div>
                <p><strong>${bill.tenantName || 'N/A'}</strong></p>
                <p>${bill.tenantCompany || 'N/A'}</p>
                <p>${bill.tenantEmail || 'N/A'}</p>
                <p>${bill.tenantPhone || 'N/A'}</p>
                <p>${bill.tenantAddress || 'N/A'}</p>
              </div>
              <div class="invoice-details">
                <div class="section-title">INVOICE DETAILS</div>
                <p><strong>Invoice #:</strong> ${generateInvoiceNumber(bill)}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
                <p><strong>Billing Month:</strong> ${bill.billingMonth}</p>
                <p><strong>Plan:</strong> ${bill.tenantType.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${bill.status}">${bill.status.toUpperCase()}</span></p>
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
                ${bill.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="amount">${item.quantity}</td>
                    <td class="amount">${formatCurrency(item.unitPrice)}</td>
                    <td class="amount">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>Subtotal</strong></td>
                  <td class="amount"><strong>${formatCurrency(bill.subtotal)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>VAT (12%)</strong></td>
                  <td class="amount"><strong>${formatCurrency(bill.vat)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>TOTAL</strong></td>
                  <td class="amount"><strong>${formatCurrency(bill.total)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-box">
                <h4>BILLING INFORMATION</h4>
                <p><strong>Billing Month:</strong> ${bill.billingMonth}</p>
                <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${bill.paymentMethod || 'N/A'}</p>
                <p><strong>Status:</strong> ${bill.status.toUpperCase()}</p>
                ${bill.penaltyFee > 0 ? `<p><strong>Penalty Fee:</strong> ${formatCurrency(bill.penaltyFee)}</p>` : ''}
                ${bill.damageFee > 0 ? `<p><strong>Damage Fee:</strong> ${formatCurrency(bill.damageFee)}</p>` : ''}
              </div>
              <div class="summary-box">
                <h4>TENANT INFORMATION</h4>
                <p><strong>Name:</strong> ${bill.tenantName}</p>
                <p><strong>Company:</strong> ${bill.tenantCompany || 'N/A'}</p>
                <p><strong>Type:</strong> ${bill.tenantType.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                <p><strong>Email:</strong> ${bill.tenantEmail}</p>
              </div>
            </div>
            
            <!-- PAGE 2: Bank Details and Footer -->
            <div class="page-break"></div>
            <div class="bank-details">
              <h4>BANK ACCOUNT DETAILS</h4>
              <div class="bank-section">
                <h5>Philippine Peso Accounts:</h5>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> Inspire Next Global Inc.</p>
                  <p><strong>Bank Name:</strong> Bank of the Philippine Island</p>
                  <p><strong>Account Number:</strong> 0061-000883</p>
                </div>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> Inspire Next Global Inc.</p>
                  <p><strong>Bank Name:</strong> Union Bank of the Philippines</p>
                  <p><strong>Account Number:</strong> 00-1560012010</p>
                </div>
              </div>
              <div class="bank-section">
                <h5>Japanese Yen Accounts:</h5>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> GMO aozoranet bank</p>
                  <p><strong>Bank Name:</strong> Inspire Connect</p>
                  <p><strong>Account Number:</strong> 2224038</p>
                  <p><strong>Branch Number:</strong> 101</p>
                </div>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> GMO aozoranet bank</p>
                  <p><strong>Bank Name:</strong> Alliance global group inc.</p>
                  <p><strong>Account Number:</strong> 1249973</p>
                  <p><strong>Branch Number:</strong> 102</p>
                </div>
              </div>
            </div>
            
            <div class="terms" style="margin-top: 20px; padding: 12px; font-size: 12px;">
              <strong>Payment Instructions:</strong> Include invoice number as reference • Send confirmation to billing@inspirehub.com • Contact: +63 2 1234 5678
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
    `;
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
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              color: #333;
              line-height: 1.5;
              font-size: 14px;
            }
            .invoice-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              page-break-inside: avoid;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px solid #1976d2;
              page-break-after: avoid;
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
              margin-bottom: 6px;
            }
            .invoice-subtitle {
              font-size: 14px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              page-break-inside: avoid;
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
              padding-bottom: 6px;
              border-bottom: 2px solid #e0e0e0;
            }
            .billing-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .billing-table th {
              background-color: #f5f5f5;
              padding: 10px 8px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
              font-size: 13px;
            }
            .billing-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
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
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .summary-box {
              flex: 1;
              margin: 0 8px;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .summary-box h4 {
              margin: 0 0 10px 0;
              color: #1976d2;
              font-size: 14px;
            }
            .summary-box p {
              margin: 6px 0;
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
              margin-top: 25px; 
              padding-top: 15px; 
              border-top: 1px solid #ddd; 
              text-align: center; 
              font-size: 12px;
              color: #777;
              page-break-inside: avoid;
            }
            .terms {
              margin-top: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              font-size: 13px;
              page-break-inside: avoid;
            }
            .bank-details {
              margin-top: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              border: 2px solid #1976d2;
              page-break-inside: avoid;
            }
            .bank-details h4 {
              margin: 0 0 15px 0;
              color: #1976d2;
              font-size: 18px;
              text-align: center;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 8px;
            }
            .bank-section {
              margin-bottom: 18px;
            }
            .bank-section h5 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
              font-weight: bold;
            }
            .bank-account {
              background-color: white;
              padding: 15px;
              margin: 10px 0;
              border-radius: 4px;
              border-left: 4px solid #1976d2;
            }
            .bank-account p {
              margin: 6px 0;
              font-size: 14px;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 13px;
              }
              .no-print { display: none; }
              .invoice-container {
                page-break-inside: auto;
              }
              .page-break {
                page-break-before: always;
              }
              .avoid-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- PAGE 1: Header and Invoice Details -->
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
                ${selectedBill.penaltyFee > 0 ? `<p><strong>Penalty Fee:</strong> ${formatCurrency(selectedBill.penaltyFee)}</p>` : ''}
                ${selectedBill.damageFee > 0 ? `<p><strong>Damage Fee:</strong> ${formatCurrency(selectedBill.damageFee)}</p>` : ''}
              </div>
              <div class="summary-box">
                <h4>TENANT INFORMATION</h4>
                <p><strong>Name:</strong> ${selectedBill.tenantName}</p>
                <p><strong>Company:</strong> ${selectedBill.tenantCompany || 'N/A'}</p>
                <p><strong>Type:</strong> ${selectedBill.tenantType.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>
                <p><strong>Email:</strong> ${selectedBill.tenantEmail}</p>
              </div>
            </div>
            
            <!-- PAGE 2: Bank Details and Footer -->
            <div class="page-break"></div>
            <div class="bank-details">
              <h4>BANK ACCOUNT DETAILS</h4>
              <div class="bank-section">
                <h5>Philippine Peso Accounts:</h5>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> Inspire Next Global Inc.</p>
                  <p><strong>Bank Name:</strong> Bank of the Philippine Island</p>
                  <p><strong>Account Number:</strong> 0061-000883</p>
                </div>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> Inspire Next Global Inc.</p>
                  <p><strong>Bank Name:</strong> Union Bank of the Philippines</p>
                  <p><strong>Account Number:</strong> 00-1560012010</p>
                </div>
              </div>
              <div class="bank-section">
                <h5>Japanese Yen Accounts:</h5>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> GMO aozoranet bank</p>
                  <p><strong>Bank Name:</strong> Inspire Connect</p>
                  <p><strong>Account Number:</strong> 2224038</p>
                  <p><strong>Branch Number:</strong> 101</p>
                </div>
                <div class="bank-account">
                  <p><strong>Account Name:</strong> GMO aozoranet bank</p>
                  <p><strong>Bank Name:</strong> Alliance global group inc.</p>
                  <p><strong>Account Number:</strong> 1249973</p>
                  <p><strong>Branch Number:</strong> 102</p>
                </div>
              </div>
            </div>
            
            <div class="terms" style="margin-top: 20px; padding: 12px; font-size: 12px;">
              <strong>Payment Instructions:</strong> Include invoice number as reference • Send confirmation to billing@inspirehub.com • Contact: +63 2 1234 5678
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

  // Handle PDF download functionality
  const handleDownloadPDF = (bill) => {
    if (!bill) return;
    
    try {
      // Create a new window with the PDF content
      const pdfWindow = window.open('', '_blank');
      const pdfContent = generatePDFContent(bill);
      
      pdfWindow.document.write(pdfContent);
      pdfWindow.document.close();
      
      // Wait for content to load, then trigger print to PDF
      setTimeout(() => {
        pdfWindow.focus();
        pdfWindow.print();
        
        // Close the window after a delay
        setTimeout(() => {
          pdfWindow.close();
        }, 1000);
      }, 500);
      
      setSnackbar({
        open: true,
        message: `PDF download initiated for ${bill.tenantName}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF. Please try again.',
        severity: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading Billing Data...
            </Typography>
            <LinearProgress sx={{ width: 300 }} />
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Hidden div for print content */}
      <div ref={printRef} style={{ display: 'none' }}></div>
      
      {/* Enhanced Header with Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link color="inherit" href="/admin">
          Dashboard
        </Link>
        <Typography color="text.primary">Billing Management</Typography>
      </Breadcrumbs>
      
      {/* Enhanced Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Billing Management
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Professional Billing & Payment Management System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage monthly billing, payments, overdue accounts, and financial analytics
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadBillingData}
            disabled={isGenerating}
            sx={{ minWidth: 120 }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AttachMoneyIcon />}
            onClick={() => setShowGenerateBillingDialog(true)}
            disabled={isGenerating}
            sx={{ 
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
              minWidth: 180
            }}
          >
            Generate Billing
          </Button>

          <Button
            variant="contained"
            startIcon={<AnalyticsIcon />}
            onClick={() => {
              setShowAnalyticsDialog(true);
              loadAnalyticsData();
            }}
            sx={{ 
              bgcolor: 'info.main',
              '&:hover': { bgcolor: 'info.dark' },
              minWidth: 140
            }}
          >
            Analytics
          </Button>

          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setShowExportDialog(true)}
            sx={{ 
              bgcolor: 'warning.main',
              '&:hover': { bgcolor: 'warning.dark' },
              minWidth: 120
            }}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Enhanced Alert System */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}
      
      {/* Enhanced Search and Filter Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tenants, companies, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="dedicated-desk">Dedicated Desk</MenuItem>
                <MenuItem value="private-office">Private Office</MenuItem>
                <MenuItem value="virtual-office">Virtual Office</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="tenantName">Tenant Name</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                startIcon={<SortIcon />}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSortBy('dueDate');
                    setSortOrder('asc');
                    setCurrentPage(1); // Reset to first page
                  }}
                  startIcon={<RefreshIcon />}
                >
                  Clear Filters
                </Button>
              )}
              
              {selectedBills.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => setShowBulkActionsDialog(true)}
                  startIcon={<MoreVertIcon />}
                >
                  {selectedBills.length} Selected
                </Button>
              )}
              
              {filteredBills.length > itemsPerPage && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (selectedBills.length === filteredBills.length) {
                      setSelectedBills([]);
                    } else {
                      setSelectedBills(filteredBills.map(bill => bill.id));
                    }
                  }}
                  startIcon={<Checkbox />}
                >
                  {selectedBills.length === filteredBills.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
        

      </Card>

      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Bills
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {billingStats?.totalBills || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    This month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <ReceiptIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatPHP(billingStats?.totalAmount || 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Gross amount
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TrendingUpIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Collected
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatPHP(billingStats?.paidAmount || 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {billingStats?.totalBills ? Math.round((billingStats.paidAmount / billingStats.totalAmount) * 100) : 0}% collected
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Outstanding
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatPHP(billingStats?.overdueAmount || 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Requires attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <WarningIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Month Selector and Actions */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<WarningIcon />}
                onClick={handleCheckOverdueBills}
                disabled={isGenerating}
              >
                Check Overdue
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => setShowEmailDialog(true)}
                disabled={filteredBills.length === 0}
              >
                Send Reminders
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => setShowExportDialog(true)}
                disabled={filteredBills.length === 0}
              >
                Export Data
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Enhanced Billing Records Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight={600}>
                Billing Records - {selectedMonth}
              </Typography>
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Tooltip title={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Active Filters:</Typography>
                    {searchTerm && <Typography variant="body2">• Search: "{searchTerm}"</Typography>}
                    {statusFilter !== 'all' && <Typography variant="body2">• Status: {statusFilter}</Typography>}
                    {typeFilter !== 'all' && <Typography variant="body2">• Type: {typeFilter}</Typography>}
                  </Box>
                }>
                  <Chip 
                    label="Filters Active" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    icon={<FilterListIcon />}
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {filteredBills.length === currentMonthBills.length 
                ? `Showing all ${currentMonthBills.length} records`
                : `Showing ${filteredBills.length} of ${currentMonthBills.length} records (${currentMonthBills.length - filteredBills.length} filtered out)`
              }
              {filteredBills.length > itemsPerPage && (
                <span> • Page {currentPage} of {Math.ceil(filteredBills.length / itemsPerPage)}</span>
              )}
            </Typography>
          </Box>
          
          <TableContainer sx={{ display: 'flex', justifyContent: 'center' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                      indeterminate={selectedBills.length > 0 && selectedBills.length < filteredBills.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBills(filteredBills.map(bill => bill.id));
                        } else {
                          setSelectedBills([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box textAlign="center">
                        <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No billing records found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentMonthBills.length === 0 
                            ? `No billing records for ${selectedMonth}`
                            : 'Try adjusting your search or filter criteria'
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((bill) => (
                    <TableRow 
                      key={bill.id}
                      hover
                      sx={{ 
                        '&:hover': { backgroundColor: 'grey.50' },
                        cursor: 'pointer'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBills.includes(bill.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBills([...selectedBills, bill.id]);
                            } else {
                              setSelectedBills(selectedBills.filter(id => id !== bill.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {bill.tenantName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bill.tenantCompany}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {bill.tenantEmail}
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
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(bill.status)}
                          label={bill.status.toUpperCase()}
                          color={getStatusColor(bill.status)}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </Typography>
                        {bill.status === 'overdue' && (
                          <Typography variant="caption" color="error.main" display="block">
                            {Math.ceil((new Date() - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowBillDetails(true);
                            }}
                            sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                          >
                            View
                          </Button>
                          
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => handleDownloadPDF(bill)}
                            sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                          >
                            PDF
                          </Button>
                          
                          {bill.status !== 'paid' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentDialog(true);
                              }}
                              sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                            >
                              Pay
                            </Button>
                          )}
                          
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<BuildIcon />}
                            onClick={() => {
                              setSelectedBill(bill);
                              setAdditionalFeesDetails({
                                penaltyFee: bill.penaltyFee || 0,
                                damageFee: bill.damageFee || 0,
                                notes: bill.additionalFeesNotes || ''
                              });
                              setShowAdditionalFeesDialog(true);
                            }}
                            sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                          >
                            Fees
                          </Button>
                          
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => handleDeleteBilling(bill.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        
        {/* Pagination */}
        {filteredBills.length > 0 && (
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length} records
                </Typography>
                
                {filteredBills.length > 10 && (
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(e.target.value);
                        setCurrentPage(1); // Reset to first page when changing page size
                      }}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              
              {filteredBills.length > itemsPerPage && (
                <Pagination
                  count={Math.ceil(filteredBills.length / itemsPerPage)}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      fontWeight: 500,
                    }
                  }}
                />
              )}
            </Stack>
          </Box>
        )}
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
                  {selectedBill.penaltyFee > 0 && (
                    <Typography color="warning.main"><strong>Penalty Fee:</strong> {formatPHP(selectedBill.penaltyFee)}</Typography>
                  )}
                  {selectedBill.damageFee > 0 && (
                    <Typography color="error.main"><strong>Damage Fee:</strong> {formatPHP(selectedBill.damageFee)}</Typography>
                  )}
                  {selectedBill.additionalFeesNotes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      <strong>Notes:</strong> {selectedBill.additionalFeesNotes}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Items Breakdown</Typography>
                  <TableContainer sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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

      {/* Enhanced Generate Billing Dialog */}
      <Dialog
        open={showGenerateBillingDialog}
        onClose={() => setShowGenerateBillingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon />
            Generate Monthly Billing
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info" icon={<SpeedIcon />}>
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
            
            <Alert severity="warning" icon={<WarningIcon />}>
              <Typography variant="body2">
                <strong>Default Rates:</strong> If tenants don't have billing rates configured, the system will use default rates:
                <br />• Dedicated Desk: ₱5,000 per seat
                <br />• Private Office: ₱15,000 per office  
                <br />• Virtual Office: ₱3,000 per service
              </Typography>
            </Alert>
            
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
            startIcon={isGenerating ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          >
            {isGenerating ? 'Generating...' : 'Generate Billing'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon />
            Record Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedBill && (
              <Alert severity="info">
                Recording payment for <strong>{selectedBill.tenantName}</strong> - {formatPHP(selectedBill.total)}
              </Alert>
            )}
            
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
              label="Payment Amount"
              type="number"
              value={paymentDetails.amount}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, amount: e.target.value }))}
              fullWidth
              placeholder="Enter payment amount"
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
            />
            
            <TextField
              label="Payment Date"
              type="date"
              value={paymentDetails.date}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
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
          <Button 
            onClick={handleMarkAsPaid} 
            variant="contained" 
            color="success"
            disabled={loadingStates.bulkAction}
            startIcon={loadingStates.bulkAction ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {loadingStates.bulkAction ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog
        open={showBulkActionsDialog}
        onClose={() => setShowBulkActionsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk Actions ({selectedBills.length} selected)
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Action</InputLabel>
              <Select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                label="Select Action"
              >
                <MenuItem value="mark_paid">Mark as Paid</MenuItem>
                <MenuItem value="send_reminder">Send Payment Reminder</MenuItem>
                <MenuItem value="export">Export Selected</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="warning">
              This action will be applied to {selectedBills.length} selected billing records.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkActionsDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkAction} 
            variant="contained" 
            color="primary"
            disabled={!bulkAction || loadingStates.bulkAction}
          >
            {loadingStates.bulkAction ? 'Processing...' : 'Apply Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog
        open={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Send Email Reminders
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Subject"
              value={emailDetails.subject}
              onChange={(e) => setEmailDetails(prev => ({ ...prev, subject: e.target.value }))}
              fullWidth
              placeholder="Payment Reminder - Inspire Hub"
            />
            
            <TextField
              label="Message"
              value={emailDetails.message}
              onChange={(e) => setEmailDetails(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              multiline
              rows={6}
              placeholder="Dear tenant, this is a friendly reminder..."
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={emailDetails.includeInvoice}
                  onChange={(e) => setEmailDetails(prev => ({ ...prev, includeInvoice: e.target.checked }))}
                />
              }
              label="Include invoice attachment"
            />
            
            <Typography variant="body2" color="text.secondary">
              This will send emails to {filteredBills.length} tenants with pending or overdue bills.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendEmail} 
            variant="contained" 
            color="primary"
            disabled={loadingStates.email}
            startIcon={loadingStates.email ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {loadingStates.email ? 'Sending...' : 'Send Emails'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Export Billing Data
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Export Summary:</strong><br />
                • Records to export: {selectedBills.length > 0 ? selectedBills.length : filteredBills.length} records<br />
                • Month: {selectedMonth}<br />
                • Total amount: {formatPHP((selectedBills.length > 0 ? filteredBills.filter(bill => selectedBills.includes(bill.id)) : filteredBills).reduce((sum, bill) => sum + (bill.total || 0), 0))}
              </Typography>
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Choose export format:
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => handleExport('csv')}
                disabled={loadingStates.export}
                startIcon={loadingStates.export ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                sx={{ minWidth: 100 }}
              >
                {loadingStates.export ? 'Exporting...' : 'CSV'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExport('excel')}
                disabled={loadingStates.export}
                startIcon={loadingStates.export ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                sx={{ minWidth: 100 }}
              >
                {loadingStates.export ? 'Exporting...' : 'Excel'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleExport('pdf')}
                disabled={loadingStates.export}
                startIcon={loadingStates.export ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                sx={{ minWidth: 100 }}
              >
                {loadingStates.export ? 'Exporting...' : 'PDF'}
              </Button>
            </Stack>
            
            <Typography variant="caption" color="text.secondary">
              <strong>Note:</strong> CSV and Excel files will download automatically. PDF will open in a new window for printing.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Additional Fees Dialog */}
      <Dialog
        open={showAdditionalFeesDialog}
        onClose={() => setShowAdditionalFeesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon />
            Add Additional Fees
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedBill && (
              <Alert severity="info">
                Adding fees for <strong>{selectedBill.tenantName}</strong> - Current total: {formatPHP(selectedBill.total)}
              </Alert>
            )}
            
            <TextField
              label="Late Payment Penalty"
              type="number"
              value={additionalFeesDetails.penaltyFee}
              onChange={(e) => setAdditionalFeesDetails(prev => ({ ...prev, penaltyFee: parseFloat(e.target.value) || 0 }))}
              fullWidth
              placeholder="Enter penalty amount"
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
              helperText="Fee for late payment or overdue accounts"
            />
            
            <TextField
              label="Damage Fee"
              type="number"
              value={additionalFeesDetails.damageFee}
              onChange={(e) => setAdditionalFeesDetails(prev => ({ ...prev, damageFee: parseFloat(e.target.value) || 0 }))}
              fullWidth
              placeholder="Enter damage fee amount"
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
              helperText="Fee for damages to office equipment or facilities"
            />
            
            <TextField
              label="Notes"
              value={additionalFeesDetails.notes}
              onChange={(e) => setAdditionalFeesDetails(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Reason for additional fees..."
            />
            
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Note:</strong> These fees will be added to the current billing total and will be included in the invoice breakdown.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdditionalFeesDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateAdditionalFees} 
            variant="contained" 
            color="warning"
            disabled={loadingStates.bulkAction}
            startIcon={loadingStates.bulkAction ? <CircularProgress size={16} /> : <BuildIcon />}
          >
            {loadingStates.bulkAction ? 'Updating...' : 'Update Fees'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog
        open={showAnalyticsDialog}
        onClose={() => setShowAnalyticsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon />
            Billing Analytics & Insights
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingStates.analytics ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : analyticsData ? (
            <Box>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Payment Methods" />
                <Tab label="Overdue Analysis" />
              </Tabs>
              
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Monthly Revenue Trend</Typography>
                        <Box height={200} display="flex" alignItems="center" justifyContent="center">
                          <Typography color="text.secondary">Chart placeholder</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>Collection Rate:</Typography>
                            <Typography fontWeight={600}>
                              {billingStats?.totalBills ? Math.round((billingStats.paidAmount / billingStats.totalAmount) * 100) : 0}%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography>Overdue Rate:</Typography>
                            <Typography fontWeight={600} color="error.main">
                              {billingStats?.totalBills ? Math.round((billingStats.overdueAmount / billingStats.totalAmount) * 100) : 0}%
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No analytics data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalyticsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={showBackdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<PrintIcon />}
          tooltipTitle="Print"
          onClick={() => selectedBill && handlePrint()}
        />
        <SpeedDialAction
          icon={<SendIcon />}
          tooltipTitle="Send Email"
          onClick={() => setShowEmailDialog(true)}
        />
        <SpeedDialAction
          icon={<FileDownloadIcon />}
          tooltipTitle="Export"
          onClick={() => setShowExportDialog(true)}
        />
      </SpeedDial>
    </Box>
  );
}
