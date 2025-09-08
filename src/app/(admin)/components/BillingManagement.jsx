"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from 'xlsx';
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
  PictureAsPdf as PictureAsPdfIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  TableChart as TableChartIcon,
} from "@mui/icons-material";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../script/firebaseConfig";
import {
  generateMonthlyBilling,
  getBillingStatistics,
  getMonthlyBillingRecords,
  getAllBillingRecords,
  updateBillingStatus,
  checkAndUpdateOverdueBills,
  updateBillingFees,
  checkTenantBillingConfiguration,
  updateTenantBillingDefaults,
  formatPHP,
  testExports,
} from "../utils/billingService";
import EditTenantModal from './EditTenantModal';

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
  

  
  // UI states
  const [alert, setAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [loadingStates, setLoadingStates] = useState({
    bulkAction: false,
    email: false,
    export: false
  });
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Add state for EditTenantModal
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null);

  // Add state for storing all billing records for export summary
  const [allBillsForExportSummary, setAllBillsForExportSummary] = useState([]);

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



  useEffect(() => {
    loadBillingData();
  }, [selectedMonth]);

  useEffect(() => {
    if (currentMonthBills.length > 0) {
      processAndFilterBills(currentMonthBills);
    }
  }, [currentMonthBills, processAndFilterBills]);

  // Fetch all billing data for export summary when dialog opens
  useEffect(() => {
    if (showExportDialog) {
      const loadAllBillsForSummary = async () => {
        try {
          const allBills = await getAllBillingRecords();
          setAllBillsForExportSummary(allBills);
        } catch (error) {
          console.error('Error loading all bills for export summary:', error);
          // Fallback to current month bills if API fails
          setAllBillsForExportSummary(currentMonthBills);
        }
      };
      loadAllBillsForSummary();
    }
  }, [showExportDialog, currentMonthBills]);

  // Enhanced bulk actions
  const handleBulkAction = async () => {
    if (selectedBills.length === 0 || !bulkAction) return;
    
    setLoadingStates(prev => ({ ...prev, bulkAction: true }));
    try {
      console.log('Starting bulk action:', bulkAction, 'for bills:', selectedBills);
      
      switch (bulkAction) {
        case 'mark_paid':
          // Validate that updateBillingStatus function exists
          if (typeof updateBillingStatus !== 'function') {
            throw new Error('updateBillingStatus function is not available');
          }
          
          console.log('Updating billing status for bills:', selectedBills);
          await Promise.all(selectedBills.map(async (billId) => {
            try {
              console.log('Updating bill:', billId);
              return await updateBillingStatus(billId, 'paid', { method: 'bulk', reference: 'Bulk Payment' });
            } catch (billError) {
              console.error('Error updating bill:', billId, billError);
              throw billError;
            }
          }));
          
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
          console.warn('Unknown bulk action:', bulkAction);
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
        message: `Failed to perform bulk action: ${error.message}`,
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

  // Fetch all billing data from all months
  const fetchAllBillingData = async () => {
    try {
      const allBills = await getAllBillingRecords();
      return allBills;
    } catch (error) {
      console.error('Error fetching all billing data:', error);
      // Fallback to current bills if API fails
      return bills;
    }
  };

  // Enhanced export functionality
  const handleExport = async (format = 'csv') => {
    setLoadingStates(prev => ({ ...prev, export: true }));
    try {
      let dataToExport;
      
      if (format === 'excel') {
        // For Excel export, fetch all billing data from all months
        const allBills = await fetchAllBillingData();
        dataToExport = allBills;
      } else {
        // For CSV and PDF, use the current filtered data
        dataToExport = selectedBills.length > 0 
        ? filteredBills.filter(bill => selectedBills.includes(bill.id))
        : filteredBills;
      }
      
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

  // Export to Excel with professional formatting and separate sheets for each month
  const exportToExcel = async (data) => {
    const headers = [
      'ID',
      'Tenant Name',
      'Company',
      'Email',
      'Type',
      'Status',
      'Amount (₱)',
      'Due Date',
      'Billing Month',
      'Created Date',
      'Payment Method'
    ];

    // Group data by billing month
    const groupedData = data.reduce((acc, bill) => {
      const month = bill.billingMonth || 'Unknown';
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(bill);
      return acc;
    }, {});

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Helper function to create professional worksheet
    const createProfessionalSheet = (sheetName, data, isSummary = false) => {
      // Prepare data with ID column
      const sheetData = data.map((bill, index) => [
        bill.id || `BILL-${String(index + 1).padStart(4, '0')}`,
        bill.tenantName || '',
        bill.tenantCompany || '',
        bill.tenantEmail || '',
        bill.tenantType || '',
        bill.status || '',
        bill.total || 0,
        bill.dueDate ? new Date(bill.dueDate) : null,
        bill.billingMonth || '',
        bill.createdAt ? new Date(bill.createdAt) : (bill.dueDate ? new Date(bill.dueDate) : null),
        bill.paymentMethod || 'credit'
      ]);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sheetData]);

      // Define column widths
      const columnWidths = [
        { wch: 15 }, // ID
        { wch: 25 }, // Tenant Name
        { wch: 30 }, // Company
        { wch: 35 }, // Email
        { wch: 18 }, // Type
        { wch: 12 }, // Status
        { wch: 15 }, // Amount
        { wch: 12 }, // Due Date
        { wch: 15 }, // Billing Month
        { wch: 12 }, // Created Date
        { wch: 15 }  // Payment Method
      ];
      worksheet['!cols'] = columnWidths;

      // Add professional styling
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2E7D32" } }, // Dark green background
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Style data rows
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;
          
          const isEvenRow = row % 2 === 0;
          const cell = worksheet[cellAddress];
          
          // Base styling
          cell.s = {
            ...cell.s,
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            },
            alignment: { vertical: "center" }
          };

          // Alternating row colors
          if (isEvenRow) {
            cell.s.fill = { fgColor: { rgb: "F8F9FA" } };
          }

          // Special formatting for specific columns
          if (col === 6) { // Amount column
            cell.s.numFmt = '"₱"#,##0.00';
            cell.s.alignment = { horizontal: "right", vertical: "center" };
          } else if (col === 7 || col === 9) { // Date columns
            cell.s.numFmt = 'mm/dd/yyyy';
            cell.s.alignment = { horizontal: "center", vertical: "center" };
          } else if (col === 5) { // Status column
            cell.s.alignment = { horizontal: "center", vertical: "center" };
            // Color code status
            const status = cell.v;
            if (status === 'paid') {
              cell.s.font = { color: { rgb: "2E7D32" }, bold: true };
            } else if (status === 'overdue') {
              cell.s.font = { color: { rgb: "D32F2F" }, bold: true };
            } else if (status === 'pending') {
              cell.s.font = { color: { rgb: "F57C00" }, bold: true };
            }
          } else if (col === 4) { // Type column
            cell.s.alignment = { horizontal: "center", vertical: "center" };
          }
        }
      }

      // Add summary statistics at the bottom if it's a summary sheet
      if (isSummary && data.length > 0) {
        const summaryStartRow = range.e.r + 3;
        
        // Calculate statistics
        const totalAmount = data.reduce((sum, bill) => sum + (bill.total || 0), 0);
        const paidAmount = data.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + (bill.total || 0), 0);
        const pendingAmount = data.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + (bill.total || 0), 0);
        const overdueAmount = data.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + (bill.total || 0), 0);
        
        const summaryData = [
          ['SUMMARY STATISTICS', '', '', '', '', '', '', '', '', '', ''],
          ['Total Records:', data.length, '', '', '', '', '', '', '', '', ''],
          ['Total Amount:', totalAmount, '', '', '', '', '', '', '', '', ''],
          ['Paid Amount:', paidAmount, '', '', '', '', '', '', '', '', ''],
          ['Pending Amount:', pendingAmount, '', '', '', '', '', '', '', '', ''],
          ['Overdue Amount:', overdueAmount, '', '', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', '', '', '', ''],
          ['Generated on:', new Date(), '', '', '', '', '', '', '', '', '']
        ];

        // Add summary data to worksheet
        XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: `A${summaryStartRow}` });

        // Style summary section
        for (let i = 0; i < summaryData.length; i++) {
          const row = summaryStartRow + i;
          for (let col = 0; col < headers.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;
            
            const cell = worksheet[cellAddress];
            if (i === 0) { // Header row
              cell.s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1976D2" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "medium", color: { rgb: "000000" } },
                  bottom: { style: "medium", color: { rgb: "000000" } },
                  left: { style: "medium", color: { rgb: "000000" } },
                  right: { style: "medium", color: { rgb: "000000" } }
                }
              };
            } else if (col === 1 && (i === 2 || i === 3 || i === 4 || i === 5)) { // Amount columns
              cell.s = {
                numFmt: '"₱"#,##0.00',
                alignment: { horizontal: "right", vertical: "center" },
                font: { bold: true }
              };
            } else if (col === 0) { // Label columns
              cell.s = {
                font: { bold: true },
                alignment: { horizontal: "left", vertical: "center" }
              };
            }
          }
        }
      }

      return worksheet;
    };

    // Create summary sheet with all data
    const summarySheet = createProfessionalSheet('All Data', data, true);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'All Data');

    // Create separate sheets for each month
    Object.keys(groupedData).sort().forEach(month => {
      const monthData = groupedData[month];
      const monthSheet = createProfessionalSheet(month, monthData, false);
      
      // Clean sheet name (Excel sheet names have restrictions)
      const cleanMonthName = month.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, monthSheet, cleanMonthName);
    });

    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellHTML: false
    });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Billing_Report_All_Months_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Enhanced PDF export with professional styling, charts, and executive summary
  const handleEnhancedPDFExport = async () => {
    setLoadingStates(prev => ({ ...prev, export: true }));
    try {
      // Get data to export - use all data if no specific bills selected
      let dataToExport;
      if (selectedBills.length > 0) {
        dataToExport = filteredBills.filter(bill => selectedBills.includes(bill.id));
      } else {
        // For overall export, fetch all billing data
        dataToExport = await fetchAllBillingData();
      }
      
      if (dataToExport.length === 0) {
        setSnackbar({
          open: true,
          message: 'No data to export',
          severity: 'warning'
        });
        return;
      }

      // Calculate statistics for the executive summary
      const totalAmount = dataToExport.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const paidAmount = dataToExport
        .filter(bill => bill.status === 'paid')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      const pendingAmount = dataToExport
        .filter(bill => bill.status === 'pending')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      const overdueAmount = dataToExport
        .filter(bill => bill.status === 'overdue')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      
      const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount * 100).toFixed(1) : 0;
      const pendingPercentage = totalAmount > 0 ? (pendingAmount / totalAmount * 100).toFixed(1) : 0;
      const overduePercentage = totalAmount > 0 ? (overdueAmount / totalAmount * 100).toFixed(1) : 0;

      // Group data by status for better organization
      const groupedByStatus = dataToExport.reduce((acc, bill) => {
        const status = bill.status || 'unknown';
        if (!acc[status]) acc[status] = [];
        acc[status].push(bill);
        return acc;
      }, {});

      // Create enhanced HTML content with professional styling
      const enhancedHTMLContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>INSPIRE HUB - Professional Billing Report</title>
            <meta charset="UTF-8">
            <style>
              @page { 
                size: A4; 
                margin: 20mm 15mm; 
                @top-center { content: "INSPIRE HUB - Billing Report"; font-size: 10px; color: #666; }
                @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 10px; color: #666; }
              }
              
              * { box-sizing: border-box; }
              
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 0; 
                color: #2c3e50; 
                line-height: 1.6; 
                font-size: 11px; 
                background: #ffffff;
              }
              
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; }
              
              /* Enhanced Header */
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                padding: 25px 20px; 
                background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
                color: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);
              }
              
              .company-logo { 
                font-size: 32px; 
                font-weight: 900; 
                margin-bottom: 10px; 
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                letter-spacing: 2px;
              }
              
              .report-title { 
                font-size: 24px; 
                font-weight: 600; 
                margin-bottom: 8px; 
                opacity: 0.95;
              }
              
              .report-subtitle {
                font-size: 14px;
                opacity: 0.8;
                margin-bottom: 5px;
              }
              
              .report-meta {
                font-size: 12px;
                opacity: 0.7;
                margin-top: 10px;
              }
              
              /* Executive Summary */
              .executive-summary {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 30px;
                border-left: 5px solid #1976d2;
              }
              
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin-top: 20px;
              }
              
              .summary-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border: 1px solid #e9ecef;
              }
              
              .summary-box h3 {
                margin: 0 0 10px 0;
                color: #1976d2;
                font-size: 16px;
                font-weight: 600;
              }
              
              .summary-box .value {
                font-size: 24px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 5px;
              }
              
              .summary-box .label {
                font-size: 12px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              /* Revenue Distribution Chart */
              .chart-section {
                background: white;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                border: 1px solid #e9ecef;
              }
              
              .chart-title {
                font-size: 18px;
                font-weight: 600;
                color: #1976d2;
                margin-bottom: 15px;
                text-align: center;
              }
              
              .progress-bar {
                width: 100%;
                height: 20px;
                background-color: #e9ecef;
                border-radius: 10px;
                overflow: hidden;
                margin: 10px 0;
              }
              
              .progress-fill {
                height: 100%;
                border-radius: 10px;
              }
              
              .progress-paid { background: linear-gradient(90deg, #28a745 0%, #20c997 100%); }
              .progress-pending { background: linear-gradient(90deg, #ffc107 0%, #fd7e14 100%); }
              .progress-overdue { background: linear-gradient(90deg, #dc3545 0%, #e83e8c 100%); }
              
              /* Enhanced Tables */
              .data-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 25px; 
                font-size: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              
              .data-table th { 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 12px 8px; 
                text-align: left; 
                border-bottom: 2px solid #dee2e6; 
                font-weight: 700;
                color: #495057;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 10px;
              }
              
              .data-table td { 
                padding: 10px 8px; 
                border-bottom: 1px solid #e9ecef; 
                vertical-align: middle;
              }
              
              .data-table tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              
              /* Status Badges */
              .status-badge { 
                display: inline-block; 
                padding: 4px 8px; 
                border-radius: 20px; 
                font-size: 9px; 
                font-weight: 700; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 60px;
                text-align: center;
              }
              
              .status-paid { 
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                color: white;
                box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
              }
              
              .status-pending { 
                background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); 
                color: white;
                box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
              }
              
              .status-overdue { 
                background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%); 
                color: white;
                box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
              }
              
              /* Utility Classes */
              .text-center { text-align: center; }
              .text-success { color: #28a745; }
              .text-warning { color: #ffc107; }
              .text-danger { color: #dc3545; }
              .font-bold { font-weight: 700; }
              
              @media print { 
                body { margin: 0; font-size: 10px; } 
                .page-break { page-break-before: always; } 
                .no-break { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <!-- Professional Header -->
            <div class="header">
              <div class="company-logo">INSPIRE HUB</div>
              <div class="report-title">PROFESSIONAL BILLING REPORT</div>
              <div class="report-subtitle">Enhanced Financial Analysis & Export</div>
              <div class="report-meta">
                Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | 
                Total Records: ${dataToExport.length} | 
                Month: ${selectedMonth}
              </div>
            </div>
            
            <!-- Executive Summary -->
            <div class="executive-summary">
              <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">
                📊 Executive Summary
              </h2>
              <div class="summary-grid">
                <div class="summary-box">
                  <h3>Total Revenue</h3>
                  <div class="value text-success">${formatPHP(totalAmount)}</div>
                  <div class="label">This Month</div>
                </div>
                <div class="summary-box">
                  <h3>Total Bills</h3>
                  <div class="value text-primary">${dataToExport.length}</div>
                  <div class="label">Records</div>
                </div>
                <div class="summary-box">
                  <h3>Collection Rate</h3>
                  <div class="value text-success">${paidPercentage}%</div>
                  <div class="label">Paid</div>
                </div>
                <div class="summary-box">
                  <h3>Pending Amount</h3>
                  <div class="value text-warning">${formatPHP(pendingAmount)}</div>
                  <div class="label">Outstanding</div>
                </div>
              </div>
            </div>
            
            <!-- Revenue Distribution Chart -->
            <div class="chart-section">
              <div class="chart-title">💰 Revenue Distribution by Status</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Paid</span>
                    <span class="text-success">${formatPHP(paidAmount)}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-paid" style="width: ${paidPercentage}%"></div>
                  </div>
                  <div class="text-center text-success font-bold">${paidPercentage}%</div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Pending</span>
                    <span class="text-warning">${formatPHP(pendingAmount)}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-pending" style="width: ${pendingPercentage}%"></div>
                  </div>
                  <div class="text-center text-warning font-bold">${pendingPercentage}%</div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Overdue</span>
                    <span class="text-danger">${formatPHP(overdueAmount)}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-overdue" style="width: ${overduePercentage}%"></div>
                  </div>
                  <div class="text-center text-danger font-bold">${overduePercentage}%</div>
                </div>
              </div>
            </div>
            
            <!-- Detailed Data Table -->
            <div class="chart-section">
              <div class="chart-title">📋 Detailed Billing Records</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tenant Name</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount (₱)</th>
                    <th>Due Date</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  ${dataToExport.map(bill => `
                    <tr>
                      <td>${bill.tenantName || ''}</td>
                      <td>${bill.tenantCompany || ''}</td>
                      <td>${bill.tenantType || ''}</td>
                      <td><span class="status-badge status-${bill.status}">${bill.status.toUpperCase()}</span></td>
                      <td>${formatPHP(bill.total || 0)}</td>
                      <td>${new Date(bill.dueDate).toLocaleDateString()}</td>
                      <td>${bill.paymentMethod || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <!-- Status Breakdown -->
            <div class="chart-section">
              <div class="chart-title">📊 Status Breakdown</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                ${Object.entries(groupedByStatus).map(([status, bills]) => {
                  const statusAmount = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
                  const statusCount = bills.length;
                  const statusPercentage = totalAmount > 0 ? (statusAmount / totalAmount * 100).toFixed(1) : 0;
                  
                  return `
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                      <div style="font-size: 24px; font-weight: 700; color: #1976d2; margin-bottom: 5px;">
                        ${statusCount}
                      </div>
                      <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                        ${status}
                      </div>
                      <div style="font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 5px;">
                        ${formatPHP(statusAmount)}
                      </div>
                      <div style="font-size: 12px; color: #6c757d;">
                        ${statusPercentage}% of total
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding: 25px; border-top: 2px solid #e9ecef; text-align: center; font-size: 11px; color: #6c757d; background: #f8f9fa; border-radius: 8px;">
              <strong>INSPIRE HUB</strong><br>
              Professional Workspace Solutions<br>
              This report was generated by the Enhanced Billing Management System<br>
              Report includes ${dataToExport.length} billing records for ${selectedMonth}
            </div>
          </body>
        </html>
      `;

      // Create a new window and print it with enhanced styling
      const printWindow = window.open('', '_blank');
      printWindow.document.write(enhancedHTMLContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        
        // Add print styles and trigger print
        const style = printWindow.document.createElement('style');
        style.textContent = `
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }
        `;
        printWindow.document.head.appendChild(style);
        
        setTimeout(() => {
          printWindow.print();
          
          // Close window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1500);
        }, 500);
      }, 1000);

      setSnackbar({
        open: true,
        message: `Successfully exported ${dataToExport.length} records in Enhanced PDF format`,
        severity: 'success'
      });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting to Enhanced PDF:', error);
      setSnackbar({
        open: true,
        message: `Failed to export Enhanced PDF: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, export: false }));
    }
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

  // Handle edit tenant from billing record
  const handleEditTenant = async (bill) => {
    try {
      // Determine the collection based on tenant type
      let collectionName;
      switch (bill.tenantType) {
        case 'dedicated-desk':
          collectionName = 'seatMap';
          break;
        case 'private-office':
          collectionName = 'privateOffice';
          break;
        case 'virtual-office':
          collectionName = 'virtualOffice';
          break;
        default:
          throw new Error(`Unknown tenant type: ${bill.tenantType}`);
      }

      // Fetch the tenant data from the appropriate collection
      const tenantDoc = await getDoc(doc(db, collectionName, bill.tenantId));
      
      if (tenantDoc.exists()) {
        const tenantData = { id: tenantDoc.id, ...tenantDoc.data() };
        setSelectedTenantForEdit(tenantData);
        setShowEditTenantModal(true);
      } else {
        setSnackbar({
          open: true,
          message: 'Tenant not found in database',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch tenant data',
        severity: 'error'
      });
    }
  };

  // Handle save edited tenant
  const handleSaveEditedTenant = async (updatedTenantData) => {
    try {
      // The EditTenantModal already handles the billing update
      // We just need to refresh the billing data
      await loadBillingData();
      
      setSnackbar({
        open: true,
        message: 'Tenant and billing information updated successfully',
        severity: 'success'
      });
      
      setShowEditTenantModal(false);
      setSelectedTenantForEdit(null);
    } catch (error) {
      console.error('Error saving edited tenant:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save tenant changes',
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
                          
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditTenant(bill)}
                            sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                          >
                            Edit Tenant
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
            onClick={() => {
              console.log('Button clicked, bulkAction:', bulkAction, 'selectedBills:', selectedBills);
              handleBulkAction();
            }} 
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

      {/* Enhanced Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <FileDownloadIcon />
            <Typography variant="h6">Enhanced Export Options</Typography>
          </Box>
          <IconButton onClick={() => setShowExportDialog(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {/* Overall Export Notice */}
          <Box mb={2} p={2} bgcolor="info.light" borderRadius={2} border={1} borderColor="info.main">
            <Typography variant="body1" color="info.contrastText" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon />
              <strong>Overall Export:</strong> This export will include ALL billing records from ALL months, providing a comprehensive view of your complete billing data.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Export Summary */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Export Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} bgcolor="white" borderRadius={2} border={1} borderColor="divider">
                                            <Typography variant="h4" color="primary" fontWeight="bold">
                        {allBillsForExportSummary.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Records
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} bgcolor="white" borderRadius={2} border={1} borderColor="divider">
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {(() => {
                          const months = [...new Set(allBillsForExportSummary.map(bill => {
                            if (bill.billingMonth) {
                              const date = new Date(bill.billingMonth);
                              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                            }
                            return 'N/A';
                          }))];
                          return months.filter(m => m !== 'N/A').length || 1;
                        })()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Months
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2} bgcolor="white" borderRadius={2} border={1} borderColor="divider">
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {formatPHP(allBillsForExportSummary.reduce((sum, bill) => sum + (bill.total || 0), 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box mt={2} p={2} bgcolor="white" borderRadius={2} border={1} borderColor="divider">
                  <Typography variant="body2" color="text.secondary">
                    <strong>Export Details:</strong> {(() => {
                      const months = [...new Set(allBillsForExportSummary.map(bill => {
                        if (bill.billingMonth) {
                          const date = new Date(bill.billingMonth);
                          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        }
                        return 'N/A';
                      }))];
                      const validMonths = months.filter(m => m !== 'N/A');
                      if (validMonths.length > 0) {
                        return `Overall export: ${allBillsForExportSummary.length} total records from ${validMonths.length} month(s): ${validMonths.join(', ')}`;
                      } else {
                        return `Overall export: ${allBillsForExportSummary.length} total records`;
                      }
                    })()}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            {/* Export Options */}
           
            
            {/* Excel Export */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  borderColor: '#4caf50',
                  '&:hover': { 
                    borderColor: '#2e7d32',
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleExport('excel')}
              >
                <Box textAlign="center">
                  <TableChartIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h6" color="primary" gutterBottom>
                    Overall Excel Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export ALL billing data with multiple sheets, data validation, and formatting
                  </Typography>
              <Button
                    variant="contained"
                    color="success"
                disabled={loadingStates.export}
                startIcon={loadingStates.export ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                    fullWidth
              >
                    {loadingStates.export ? 'Exporting...' : 'Export ALL Data to Excel'}
              </Button>
                </Box>
              </Card>
            </Grid>
            
            {/* Enhanced PDF Export */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined"
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  borderColor: '#d32f2f',
                  '&:hover': { 
                    borderColor: '#b71c1c',
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleEnhancedPDFExport()}
              >
                <Box textAlign="center">
                  <PictureAsPdfIcon sx={{ fontSize: 48, color: '#d32f2f', mb: 1 }} />
                  <Typography variant="h6" color="error" gutterBottom>
                    Enhanced PDF Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export ALL billing data with charts, executive summary, and monthly breakdowns
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                disabled={loadingStates.export}
                    startIcon={loadingStates.export ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                    fullWidth
              >
                    {loadingStates.export ? 'Exporting...' : 'Export ALL Data to PDF'}
              </Button>
                </Box>
              </Card>
            </Grid>
            
            {/* Export Features */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  🚀 Enhanced Export Features
            </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      ✅ Overall Excel Export:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Exports ALL billing data<br />
                      • Data validation & corruption prevention<br />
                      • Multiple sheets by month<br />
                      • Professional formatting<br />
                      • Safe file naming<br />
                      • Summary sheets
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      ✅ Overall PDF Export:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Exports ALL billing data<br />
                      • Executive summary dashboard<br />
                      • Revenue charts & progress bars<br />
                      • Monthly data separation<br />
                      • Professional styling<br />
                      • Print-optimized layout
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            
            {/* Export Progress */}
            {loadingStates.export && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Export Progress
                  </Typography>
                  <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Processing your export request...
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowExportDialog(false)} 
            variant="outlined"
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
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



      {/* Edit Tenant Modal */}
      <EditTenantModal
        open={showEditTenantModal}
        onClose={() => {
          setShowEditTenantModal(false);
          setSelectedTenantForEdit(null);
        }}
        client={selectedTenantForEdit}
        onSave={handleSaveEditedTenant}
      />

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
