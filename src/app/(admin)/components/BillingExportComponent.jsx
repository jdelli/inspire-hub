"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  Divider,
  Paper,
  Switch,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Fade,
  Zoom,
  Slide,
  Grow,
} from "@mui/material";
import {
  CloudDownload as CloudDownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../../script/firebaseConfig";
import { formatPHP } from "../utils/billingService";
import * as XLSX from 'xlsx';

export default function BillingExportComponent({ open, onClose, onExportComplete }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Enhanced state management
  const [exportType, setExportType] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [groupByMonth, setGroupByMonth] = useState(true);
  
  // New enhanced features
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [customizeColumns, setCustomizeColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'tenantName', 'tenantCompany', 'tenantEmail', 'tenantType', 
    'status', 'total', 'dueDate', 'billingMonth', 'paymentMethod', 'createdAt'
  ]);
  const [sortBy, setSortBy] = useState('billingMonth');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  const [exportSchedule, setExportSchedule] = useState('monthly');
  
  // Data and loading states
  const [billingData, setBillingData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [exportHistory, setExportHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Auto-load data when component opens
  useEffect(() => {
    if (open) {
      // Auto-load all billing data when dialog opens
      loadBillingData();
    }
  }, [open]);

  // Enhanced utility functions
  const generateMonthOptions = useCallback(() => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Enhanced data filtering and sorting
  const processAndFilterData = useCallback((data) => {
    let processed = [...data];
    
    // Apply sorting
    processed.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'total') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortBy === 'dueDate' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredData(processed);
    return processed;
  }, [sortBy, sortOrder]);

  // Get available columns for customization
  const getAvailableColumns = () => [
    { key: 'tenantName', label: 'Tenant Name', required: true },
    { key: 'tenantCompany', label: 'Company', required: false },
    { key: 'tenantEmail', label: 'Email', required: false },
    { key: 'tenantType', label: 'Type', required: false },
    { key: 'status', label: 'Status', required: true },
    { key: 'total', label: 'Amount (₱)', required: true },
    { key: 'dueDate', label: 'Due Date', required: true },
    { key: 'billingMonth', label: 'Billing Month', required: true },
    { key: 'paymentMethod', label: 'Payment Method', required: false },
    { key: 'createdAt', label: 'Created Date', required: false }
  ];

  // Calculate export statistics
  const getExportStats = useCallback(() => {
    if (!billingData.length) return null;
    
    const totalAmount = billingData.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const paidAmount = billingData
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + (bill.total || 0), 0);
    const pendingAmount = billingData
      .filter(bill => bill.status === 'pending')
      .reduce((sum, bill) => sum + (bill.total || 0), 0);
    const overdueAmount = billingData
      .filter(bill => bill.status === 'overdue')
      .reduce((sum, bill) => sum + (bill.total || 0), 0);
    
    return {
      totalRecords: billingData.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      paidPercentage: (paidAmount / totalAmount * 100).toFixed(1),
      pendingPercentage: (pendingAmount / totalAmount * 100).toFixed(1),
      overduePercentage: (overdueAmount / totalAmount * 100).toFixed(1)
    };
  }, [billingData]);

  // Load billing data based on selected criteria
  const loadBillingData = async () => {
    setIsLoading(true);
    setExportProgress(0);
    
    try {
      let billingQuery;
      
      if (exportType === 'all') {
        billingQuery = query(
          collection(db, 'billing'),
          orderBy('billingMonth', 'desc')
        );
      } else if (exportType === 'dateRange') {
        if (!customStartDate || !customEndDate) {
          throw new Error('Please select both start and end dates');
        }
        
        billingQuery = query(
          collection(db, 'billing'),
          where('billingMonth', '>=', customStartDate),
          where('billingMonth', '<=', customEndDate),
          orderBy('billingMonth', 'desc')
        );
      } else if (exportType === 'selectedMonths') {
        if (selectedMonths.length === 0) {
          throw new Error('Please select at least one month');
        }
        
        const allRecords = [];
        for (let i = 0; i < selectedMonths.length; i++) {
          const monthQuery = query(
            collection(db, 'billing'),
            where('billingMonth', '==', selectedMonths[i])
          );
          const monthSnapshot = await getDocs(monthQuery);
          const monthRecords = monthSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allRecords.push(...monthRecords);
          setExportProgress(((i + 1) / selectedMonths.length) * 50);
        }
        
        setBillingData(allRecords);
        processDataByMonth(allRecords);
        setIsLoading(false);
        return;
      } else if (exportType === 'last12months') {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const startMonth = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        billingQuery = query(
          collection(db, 'billing'),
          where('billingMonth', '>=', startMonth),
          where('billingMonth', '<=', currentMonth),
          orderBy('billingMonth', 'desc')
        );
      }
      
      if (billingQuery) {
        const querySnapshot = await getDocs(billingQuery);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setBillingData(records);
        processDataByMonth(records);
        processAndFilterData(records);
      }
      
      setExportProgress(100);
      setSuccess(`Successfully loaded ${records.length} billing records`);
      setError(null);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setError(`Failed to load billing data: ${error.message}`);
      setSuccess(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Process data by month for grouping
  const processDataByMonth = (data) => {
    const monthly = {};
    
    data.forEach(bill => {
      const month = bill.billingMonth;
      if (!monthly[month]) {
        monthly[month] = [];
      }
      monthly[month].push(bill);
    });
    
    setMonthlyData(monthly);
  };

  // Enhanced Excel export with data validation and corruption prevention
  const exportToExcel = async () => {
    try {
      setExportProgress(0);
      
      // Data validation and cleaning function
      const cleanDataForExcel = (data) => {
        return data.map(bill => {
          // Clean and validate each field
          const cleanBill = {};
          
          // Clean text fields - remove special characters and limit length
          cleanBill.tenantName = (bill.tenantName || '').toString().substring(0, 100).replace(/[^\w\s\-\.]/g, '');
          cleanBill.tenantCompany = (bill.tenantCompany || '').toString().substring(0, 100).replace(/[^\w\s\-\.]/g, '');
          cleanBill.tenantEmail = (bill.tenantEmail || '').toString().substring(0, 100).replace(/[^\w\s\-\.@]/g, '');
          cleanBill.tenantType = (bill.tenantType || '').toString().substring(0, 50).replace(/[^\w\s\-]/g, '');
          cleanBill.status = (bill.status || '').toString().substring(0, 20).replace(/[^\w]/g, '');
          cleanBill.paymentMethod = (bill.paymentMethod || '').toString().substring(0, 50).replace(/[^\w\s\-]/g, '');
          
          // Clean numeric fields
          cleanBill.total = parseFloat(bill.total) || 0;
          if (isNaN(cleanBill.total) || cleanBill.total < 0) cleanBill.total = 0;
          
          // Clean date fields with validation
          try {
            if (bill.dueDate) {
              const dueDate = new Date(bill.dueDate);
              cleanBill.dueDate = isNaN(dueDate.getTime()) ? 'Invalid Date' : dueDate.toLocaleDateString('en-US');
            } else {
              cleanBill.dueDate = 'N/A';
            }
          } catch (e) {
            cleanBill.dueDate = 'Invalid Date';
          }
          
          try {
            if (bill.createdAt) {
              const createdDate = bill.createdAt?.toDate?.() || new Date(bill.createdAt);
              cleanBill.createdAt = isNaN(createdDate.getTime()) ? 'Invalid Date' : createdDate.toLocaleDateString('en-US');
            } else {
              cleanBill.createdAt = 'N/A';
            }
          } catch (e) {
            cleanBill.createdAt = 'Invalid Date';
          }
          
          cleanBill.billingMonth = (bill.billingMonth || '').toString().substring(0, 20);
          
          return cleanBill;
        });
      };
      
      // Create a new workbook with proper options
      const workbook = XLSX.utils.book_new();
      workbook.Props = {
        Title: 'INSPIRE HUB - Billing Report',
        Subject: 'Professional Billing Data Export',
        Author: 'INSPIRE HUB System',
        CreatedDate: new Date()
      };
      
      if (groupByMonth) {
        // Create professional sheets for each month
        const months = Object.keys(monthlyData).sort();
        
        months.forEach((month, monthIndex) => {
          try {
            const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            });
            const monthData = monthlyData[month];
            
            // Clean the data before creating worksheet
            const cleanMonthData = cleanDataForExcel(monthData);
            
            // Create worksheet data with proper validation
            const worksheetData = [
              // Header row
              ['INSPIRE HUB - BILLING REPORT', '', '', '', '', '', '', '', '', ''],
              [monthName, '', '', '', '', '', '', '', '', ''],
              ['Generated on: ' + new Date().toLocaleDateString(), '', '', '', '', '', '', '', '', ''],
              ['Total Records: ' + cleanMonthData.length, '', '', '', '', '', '', '', '', ''],
              ['', '', '', '', '', '', '', '', '', ''],
              // Column headers
              ['Tenant Name', 'Company', 'Email', 'Type', 'Status', 'Amount (₱)', 'Due Date', 'Billing Month', 'Payment Method', 'Created Date'],
              // Data rows
              ...cleanMonthData.map(bill => [
                bill.tenantName,
                bill.tenantCompany,
                bill.tenantEmail,
                bill.tenantType,
                bill.status,
                bill.total,
                bill.dueDate,
                bill.billingMonth,
                bill.paymentMethod,
                bill.createdAt
              ]),
              ['', '', '', '', '', '', '', '', '', ''],
              // Summary row
              ['MONTH TOTAL', '', '', '', '', cleanMonthData.reduce((sum, bill) => sum + bill.total, 0), '', '', '', '']
            ];
            
            // Create worksheet with error handling
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set column widths and properties
            worksheet['!cols'] = [
              { wch: 20, hidden: false }, // Tenant Name
              { wch: 25, hidden: false }, // Company
              { wch: 30, hidden: false }, // Email
              { wch: 15, hidden: false }, // Type
              { wch: 12, hidden: false }, // Status
              { wch: 15, hidden: false }, // Amount
              { wch: 12, hidden: false }, // Due Date
              { wch: 15, hidden: false }, // Billing Month
              { wch: 18, hidden: false }, // Payment Method
              { wch: 15, hidden: false }  // Created Date
            ];
            
            // Add the worksheet to workbook with safe sheet name
            const safeSheetName = monthName.replace(/[\[\]*?:/\\]/g, '').substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
            
            setExportProgress(((monthIndex + 1) / months.length) * 70);
          } catch (monthError) {
            console.error(`Error processing month ${month}:`, monthError);
            // Continue with other months
          }
        });
        
        // Create professional summary sheet
        try {
          const summaryData = [
            ['INSPIRE HUB - BILLING SUMMARY REPORT', '', '', '', '', ''],
            ['Generated on: ' + new Date().toLocaleDateString(), '', '', '', '', ''],
            ['Total Months: ' + months.length, '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Month', 'Total Bills', 'Total Amount (₱)', 'Paid Amount (₱)', 'Pending Amount (₱)', 'Overdue Amount (₱)'],
            ...months.map(month => {
              const monthData = monthlyData[month];
              const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              });
              
              const totalBills = monthData.length;
              const totalAmount = monthData.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
              const paidAmount = monthData
                .filter(bill => bill.status === 'paid')
                .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
              const pendingAmount = monthData
                .filter(bill => bill.status === 'pending')
                .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
              const overdueAmount = monthData
                .filter(bill => bill.status === 'overdue')
                .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
              
              return [
                monthName,
                totalBills,
                totalAmount,
                paidAmount,
                pendingAmount,
                overdueAmount
              ];
            }),
            ['', '', '', '', '', ''],
            ['GRAND TOTAL', 
             months.reduce((sum, month) => sum + monthlyData[month].length, 0),
             months.reduce((sum, month) => sum + monthlyData[month].reduce((s, bill) => s + (parseFloat(bill.total) || 0), 0), 0),
             months.reduce((sum, month) => sum + monthlyData[month].filter(bill => bill.status === 'paid').reduce((s, bill) => s + (parseFloat(bill.total) || 0), 0), 0),
             months.reduce((sum, month) => sum + monthlyData[month].filter(bill => bill.status === 'pending').reduce((s, bill) => s + (parseFloat(bill.total) || 0), 0), 0),
             months.reduce((sum, month) => sum + monthlyData[month].filter(bill => bill.status === 'overdue').reduce((s, bill) => s + (parseFloat(bill.total) || 0), 0), 0)
            ]
          ];
          
          const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
          summaryWorksheet['!cols'] = [
            { wch: 20, hidden: false }, // Month
            { wch: 15, hidden: false }, // Total Bills
            { wch: 18, hidden: false }, // Total Amount
            { wch: 18, hidden: false }, // Paid Amount
            { wch: 18, hidden: false }, // Pending Amount
            { wch: 18, hidden: false }  // Overdue Amount
          ];
          
          XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
        } catch (summaryError) {
          console.error('Error creating summary sheet:', summaryError);
        }
        
      } else {
        // Single sheet with all data - professional format
        try {
          // Clean all data before creating worksheet
          const cleanAllData = cleanDataForExcel(billingData);
          
          const allData = [
            ['INSPIRE HUB - COMPLETE BILLING REPORT', '', '', '', '', '', '', '', '', ''],
            ['Generated on: ' + new Date().toLocaleDateString(), '', '', '', '', '', '', '', '', ''],
            ['Total Records: ' + cleanAllData.length, '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['Tenant Name', 'Company', 'Email', 'Type', 'Status', 'Amount (₱)', 'Due Date', 'Billing Month', 'Payment Method', 'Created Date'],
            // Data rows
            ...cleanAllData.map(bill => [
              bill.tenantName,
              bill.tenantCompany,
              bill.tenantEmail,
              bill.tenantType,
              bill.status,
              bill.total,
              bill.dueDate,
              bill.billingMonth,
              bill.paymentMethod,
              bill.createdAt
            ]),
            ['', '', '', '', '', '', '', '', '', ''],
            ['TOTAL', '', '', '', '', cleanAllData.reduce((sum, bill) => sum + bill.total, 0), '', '', '', '']
          ];
          
          const worksheet = XLSX.utils.aoa_to_sheet(allData);
          worksheet['!cols'] = [
            { wch: 20, hidden: false }, // Tenant Name
            { wch: 25, hidden: false }, // Company
            { wch: 30, hidden: false }, // Email
            { wch: 15, hidden: false }, // Type
            { wch: 12, hidden: false }, // Status
            { wch: 15, hidden: false }, // Amount
            { wch: 12, hidden: false }, // Due Date
            { wch: 15, hidden: false }, // Billing Month
            { wch: 18, hidden: false }, // Payment Method
            { wch: 15, hidden: false }  // Created Date
          ];
          
          XLSX.utils.book_append_sheet(workbook, worksheet, 'All Billing Data');
        } catch (singleSheetError) {
          console.error('Error creating single sheet:', singleSheetError);
          throw singleSheetError;
        }
      }
      
      setExportProgress(80);
      
      // Generate Excel file with proper options to prevent corruption
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true,
        cellStyles: false,
        cellDates: true,
        cellNF: false,
        cellHTML: false
      });
      
      setExportProgress(90);
      
      // Create blob with proper MIME type and download
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Generate safe filename
      const timestamp = new Date().toISOString().split('T')[0];
      const safeFilename = `INSPIRE_HUB_Billing_Report_${timestamp}.xlsx`;
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', safeFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blob);
      
      setExportProgress(100);
      addToExportHistory(exportType, 'excel', billingData.length);
      onExportComplete && onExportComplete('excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      addToExportHistory(exportType, 'excel', billingData.length, 'failed');
      throw error;
    }
  };

  // Enhanced PDF export with better formatting, charts, and professional styling
  const exportToPDF = async () => {
    try {
      setExportProgress(0);
      setExportProgress(20);
      
      const pdfContent = generateEnhancedPDFContent();
      setExportProgress(60);
      
      // Create a more professional PDF experience
      const printWindow = window.open('', '_blank');
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      setExportProgress(80);
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        setExportProgress(90);
        
        // Add print styles and trigger print
        const style = printWindow.document.createElement('style');
        style.textContent = `
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            .chart-container { page-break-inside: avoid; }
          }
        `;
        printWindow.document.head.appendChild(style);
        
        setTimeout(() => {
          printWindow.print();
          setExportProgress(95);
          
          // Close window after printing
          setTimeout(() => {
            printWindow.close();
            setExportProgress(100);
          }, 1500);
        }, 500);
      }, 1000);
      
      addToExportHistory(exportType, 'pdf', billingData.length);
      onExportComplete && onExportComplete('pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      addToExportHistory(exportType, 'pdf', billingData.length, 'failed');
      throw error;
    }
  };



  // Generate enhanced PDF content with charts, better styling, and professional layout
  const generateEnhancedPDFContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const stats = getExportStats();
    
    let pdfContent = `
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
            .chart-container { page-break-inside: avoid; margin: 20px 0; }
            
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
            
            /* Month Headers */
            .month-header { 
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
              color: white; 
              padding: 20px; 
              margin: 30px 0 20px 0; 
              border-radius: 12px; 
              text-align: center;
              box-shadow: 0 4px 15px rgba(25, 118, 210, 0.2);
            }
            
            .month-title { 
              font-size: 22px; 
              font-weight: 700; 
              margin-bottom: 8px; 
              text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            }
            
            .month-subtitle { 
              font-size: 16px; 
              opacity: 0.9; 
              font-weight: 500;
            }
            
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
            
            .data-table tr:hover {
              background-color: #e3f2fd;
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
            
            /* Charts and Visual Elements */
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
              transition: width 0.3s ease;
            }
            
            .progress-paid { background: linear-gradient(90deg, #28a745 0%, #20c997 100%); }
            .progress-pending { background: linear-gradient(90deg, #ffc107 0%, #fd7e14 100%); }
            .progress-overdue { background: linear-gradient(90deg, #dc3545 0%, #e83e8c 100%); }
            
            /* Footer */
            .footer { 
              margin-top: 40px; 
              padding: 25px; 
              border-top: 2px solid #e9ecef; 
              text-align: center; 
              font-size: 11px; 
              color: #6c757d;
              background: #f8f9fa;
              border-radius: 8px;
            }
            
            .grand-total { 
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
              padding: 25px; 
              border-radius: 12px; 
              margin-top: 30px;
              border: 2px solid #1976d2;
              box-shadow: 0 4px 20px rgba(25, 118, 210, 0.15);
            }
            
            .grand-total h2 {
              color: #1976d2;
              text-align: center;
              margin-bottom: 20px;
              font-size: 20px;
              font-weight: 700;
            }
            
            /* Responsive Design */
            @media print { 
              body { margin: 0; font-size: 10px; } 
              .page-break { page-break-before: always; } 
              .no-break { page-break-inside: avoid; }
              .chart-container { page-break-inside: avoid; }
            }
            
            /* Utility Classes */
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-primary { color: #1976d2; }
            .text-success { color: #28a745; }
            .text-warning { color: #ffc107; }
            .text-danger { color: #dc3545; }
            .font-bold { font-weight: 700; }
            .font-large { font-size: 14px; }
            .mb-20 { margin-bottom: 20px; }
            .mt-20 { margin-top: 20px; }
          </style>
        </head>
        <body>
          <!-- Professional Header -->
          <div class="header">
            <div class="company-logo">INSPIRE HUB</div>
            <div class="report-title">PROFESSIONAL BILLING REPORT</div>
            <div class="report-subtitle">Comprehensive Financial Analysis & Export</div>
            <div class="report-meta">
              Generated on: ${currentDate} at ${currentTime} | 
              Total Records: ${billingData.length} | 
              Export Type: ${exportType === 'all' ? 'Complete Data Export' : exportType}
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
                <div class="value text-success">${stats ? formatPHP(stats.totalAmount) : '₱0.00'}</div>
                <div class="label">All Time</div>
              </div>
              <div class="summary-box">
                <h3>Total Bills</h3>
                <div class="value text-primary">${stats ? stats.totalRecords : 0}</div>
                <div class="label">Records</div>
              </div>
              <div class="summary-box">
                <h3>Collection Rate</h3>
                <div class="value text-success">${stats ? stats.paidPercentage : 0}%</div>
                <div class="label">Paid</div>
              </div>
              <div class="summary-box">
                <h3>Pending Amount</h3>
                <div class="value text-warning">${stats ? formatPHP(stats.pendingAmount) : '₱0.00'}</div>
                <div class="label">Outstanding</div>
              </div>
            </div>
          </div>
          
          <!-- Revenue Distribution Chart -->
          <div class="chart-section">
            <div class="chart-title">💰 Revenue Distribution by Status</div>
            <div class="chart-container">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Paid</span>
                    <span class="text-success">${stats ? formatPHP(stats.paidAmount) : '₱0.00'}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-paid" style="width: ${stats ? stats.paidPercentage : 0}%"></div>
                  </div>
                  <div class="text-center text-success font-bold">${stats ? stats.paidPercentage : 0}%</div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Pending</span>
                    <span class="text-warning">${stats ? formatPHP(stats.pendingAmount) : '₱0.00'}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-pending" style="width: ${stats ? stats.pendingPercentage : 0}%"></div>
                  </div>
                  <div class="text-center text-warning font-bold">${stats ? stats.pendingPercentage : 0}%</div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="font-bold">Overdue</span>
                    <span class="text-danger">${stats ? formatPHP(stats.overdueAmount) : '₱0.00'}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-overdue" style="width: ${stats ? stats.overduePercentage : 0}%"></div>
                  </div>
                  <div class="text-center text-danger font-bold">${stats ? stats.overduePercentage : 0}%</div>
                </div>
              </div>
            </div>
          </div>
    `;

    // Always separate by month for better organization
    const months = Object.keys(monthlyData).sort();
    let grandTotalBills = 0;
    let grandTotalAmount = 0;
    let grandPaidAmount = 0;
    let grandPendingAmount = 0;
    let grandOverdueAmount = 0;

    months.forEach((month, monthIndex) => {
      if (monthIndex > 0) {
        pdfContent += '<div class="page-break"></div>';
      }
      
      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      const monthData = monthlyData[month];
      
      const totalBills = monthData.length;
      const totalAmount = monthData.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const paidAmount = monthData
        .filter(bill => bill.status === 'paid')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      const pendingAmount = monthData
        .filter(bill => bill.status === 'pending')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      const overdueAmount = monthData
        .filter(bill => bill.status === 'overdue')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);
      
      // Add to grand totals
      grandTotalBills += totalBills;
      grandTotalAmount += totalAmount;
      grandPaidAmount += paidAmount;
      grandPendingAmount += pendingAmount;
      grandOverdueAmount += overdueAmount;
      
      pdfContent += `
        <div class="month-header">
          <div class="month-title">${monthName}</div>
          <div class="month-subtitle">${totalBills} Bills • ${formatPHP(totalAmount)} Total</div>
        </div>
        
        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-box">
              <h4>Total Bills</h4>
              <p><strong>${totalBills}</strong></p>
            </div>
            <div class="summary-box">
              <h4>Total Amount</h4>
              <p><strong>${formatPHP(totalAmount)}</strong></p>
            </div>
            <div class="summary-box">
              <h4>Paid Amount</h4>
              <p><strong>${formatPHP(paidAmount)}</strong></p>
            </div>
            <div class="summary-box">
              <h4>Pending Amount</h4>
              <p><strong>${formatPHP(pendingAmount)}</strong></p>
            </div>
            <div class="summary-box">
              <h4>Overdue Amount</h4>
              <p><strong>${formatPHP(overdueAmount)}</strong></p>
            </div>
          </div>
        </div>
        
        <h3>Detailed Records for ${monthName}</h3>
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
      `;
      
      monthData.forEach(bill => {
        pdfContent += `
          <tr>
            <td>${bill.tenantName || ''}</td>
            <td>${bill.tenantCompany || ''}</td>
            <td>${bill.tenantType || ''}</td>
            <td><span class="status-badge status-${bill.status}">${bill.status.toUpperCase()}</span></td>
            <td>${formatPHP(bill.total || 0)}</td>
            <td>${new Date(bill.dueDate).toLocaleDateString()}</td>
            <td>${bill.paymentMethod || 'N/A'}</td>
          </tr>
        `;
      });
      
      pdfContent += `
          </tbody>
        </table>
      `;
    });

    // Add grand total summary at the end
    pdfContent += `
      <div class="page-break"></div>
      <div class="grand-total">
        <h2>GRAND TOTAL SUMMARY</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Total Bills (All Months)</h4>
            <p><strong>${grandTotalBills}</strong></p>
          </div>
          <div class="summary-box">
            <h4>Total Amount (All Months)</h4>
            <p><strong>${formatPHP(grandTotalAmount)}</strong></p>
          </div>
          <div class="summary-box">
            <h4>Total Paid (All Months)</h4>
            <p><strong>${formatPHP(grandPaidAmount)}</strong></p>
          </div>
          <div class="summary-box">
            <h4>Total Pending (All Months)</h4>
            <p><strong>${formatPHP(grandPendingAmount)}</strong></p>
          </div>
          <div class="summary-box">
            <h4>Total Overdue (All Months)</h4>
            <p><strong>${formatPHP(grandOverdueAmount)}</strong></p>
          </div>
        </div>
      </div>
    `;
    
    pdfContent += `
          <div class="footer">
            <strong>INSPIRE HUB</strong><br>
            Professional Workspace Solutions<br>
            This report was generated by the Billing Management System<br>
            Report includes ${months.length} months of billing data
          </div>
        </body>
      </html>
    `;
    
    return pdfContent;
  };

  // Download file helper
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all billing data regardless of filters
  const exportAllData = async () => {
    try {
      setExportProgress(0);
      setIsLoading(true);
      
      // Load ALL billing data from the database
      const allBillingQuery = query(
        collection(db, 'billing'),
        orderBy('billingMonth', 'desc')
      );
      
      const querySnapshot = await getDocs(allBillingQuery);
      const allRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process all data by month
      const allMonthlyData = {};
      allRecords.forEach(bill => {
        const month = bill.billingMonth;
        if (!allMonthlyData[month]) {
          allMonthlyData[month] = [];
        }
        allMonthlyData[month].push(bill);
      });
      
      // Create comprehensive Excel workbook with all data
      const workbook = XLSX.utils.book_new();
      const months = Object.keys(allMonthlyData).sort();
      
      // Create sheet for each month with data cleaning
      months.forEach((month, monthIndex) => {
        try {
          const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
          const monthData = allMonthlyData[month];
          
          // Clean the data before creating worksheet
          const cleanMonthData = cleanDataForExcel(monthData);
          
          const worksheetData = [
            // Header row
            ['INSPIRE HUB - COMPLETE BILLING REPORT', '', '', '', '', '', '', '', '', ''],
            [monthName, '', '', '', '', '', '', '', '', ''],
            ['Generated on: ' + new Date().toLocaleDateString(), '', '', '', '', '', '', '', '', ''],
            ['Total Records in Month: ' + cleanMonthData.length, '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            // Column headers
            ['Tenant Name', 'Company', 'Email', 'Type', 'Status', 'Amount (₱)', 'Due Date', 'Billing Month', 'Payment Method', 'Created Date'],
            // Data rows
            ...cleanMonthData.map(bill => [
              bill.tenantName,
              bill.tenantCompany,
              bill.tenantEmail,
              bill.tenantType,
              bill.status,
              bill.total,
              bill.dueDate,
              bill.billingMonth,
              bill.paymentMethod,
              bill.createdAt
            ]),
            ['', '', '', '', '', '', '', '', '', ''],
            // Summary row
            ['MONTH TOTAL', '', '', '', '', cleanMonthData.reduce((sum, bill) => sum + bill.total, 0), '', '', '', '']
          ];
          
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          
          // Set column widths with proper properties
          const columnWidths = [
            { wch: 20, hidden: false }, // Tenant Name
            { wch: 25, hidden: false }, // Company
            { wch: 30, hidden: false }, // Email
            { wch: 15, hidden: false }, // Type
            { wch: 12, hidden: false }, // Status
            { wch: 15, hidden: false }, // Amount
            { wch: 12, hidden: false }, // Due Date
            { wch: 15, hidden: false }, // Billing Month
            { wch: 18, hidden: false }, // Payment Method
            { wch: 15, hidden: false }  // Created Date
          ];
          worksheet['!cols'] = columnWidths;
          
          // Add the worksheet to workbook with safe sheet name
          const safeSheetName = monthName.replace(/[\[\]*?:/\\]/g, '').substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
          
          setExportProgress(((monthIndex + 1) / months.length) * 80);
        } catch (monthError) {
          console.error(`Error processing month ${month}:`, monthError);
          // Continue with other months
        }
      });
      
      // Create comprehensive summary sheet with error handling
      try {
        const summaryData = [
          ['INSPIRE HUB - COMPLETE BILLING SUMMARY', '', '', '', '', ''],
          ['Generated on: ' + new Date().toLocaleDateString(), '', '', '', '', ''],
          ['Total Records: ' + allRecords.length, '', '', '', '', ''],
          ['Total Months: ' + months.length, '', '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Month', 'Total Bills', 'Total Amount (₱)', 'Paid Amount (₱)', 'Pending Amount (₱)', 'Overdue Amount (₱)'],
          ...months.map(month => {
            const monthData = allMonthlyData[month];
            const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            });
            
            const totalBills = monthData.length;
            const totalAmount = monthData.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
            const paidAmount = monthData
              .filter(bill => bill.status === 'paid')
              .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
            const pendingAmount = monthData
              .filter(bill => bill.status === 'pending')
              .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
            const overdueAmount = monthData
              .filter(bill => bill.status === 'overdue')
              .reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
            
            return [
              monthName,
              totalBills,
              totalAmount,
              paidAmount,
              pendingAmount,
              overdueAmount
            ];
          }),
          ['', '', '', '', '', ''],
          ['GRAND TOTAL', 
           allRecords.length,
           allRecords.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0),
           allRecords.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0),
           allRecords.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0),
           allRecords.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0)
          ]
        ];
        
        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [
          { wch: 20, hidden: false }, // Month
          { wch: 15, hidden: false }, // Total Bills
          { wch: 18, hidden: false }, // Total Amount
          { wch: 18, hidden: false }, // Paid Amount
          { wch: 18, hidden: false }, // Pending Amount
          { wch: 18, hidden: false }  // Overdue Amount
        ];
        
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Complete Summary');
      } catch (summaryError) {
        console.error('Error creating summary sheet:', summaryError);
      }
      
      setExportProgress(85);
      
      // Generate Excel file with proper options to prevent corruption
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true,
        cellStyles: false,
        cellDates: true,
        cellNF: false,
        cellHTML: false
      });
      
      setExportProgress(90);
      
      // Create blob with proper MIME type and download
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Generate safe filename
      const timestamp = new Date().toISOString().split('T')[0];
      const safeFilename = `INSPIRE_HUB_Complete_Billing_Report_${timestamp}.xlsx`;
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', safeFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blob);
      
      setExportProgress(100);
      addToExportHistory('all', 'excel', allRecords.length);
      onExportComplete && onExportComplete('excel');
      
    } catch (error) {
      console.error('Error exporting all data:', error);
      addToExportHistory('all', 'excel', allRecords.length, 'failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await loadBillingData();
      
      if (exportFormat === 'excel') {
        await exportToExcel();
      } else if (exportFormat === 'pdf') {
        await exportToPDF();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Enhanced reset function
  const handleReset = () => {
    setExportType('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMonths([]);
    setExportFormat('excel');
    setGroupByMonth(true);
    setIncludeCharts(true);
    setIncludeSummary(true);
    setCustomizeColumns(false);
    setSelectedColumns([
      'tenantName', 'tenantCompany', 'tenantEmail', 'tenantType', 
      'status', 'total', 'dueDate', 'billingMonth', 'paymentMethod', 'createdAt'
    ]);
    setSortBy('billingMonth');
    setSortOrder('desc');
    setViewMode('grid');
    setShowAdvancedOptions(false);
    setAutoExport(false);
    setExportSchedule('monthly');
    setBillingData([]);
    setMonthlyData({});
    setFilteredData([]);
    setExportProgress(0);
    setError(null);
    setSuccess(null);
  };

  // Add export to history
  const addToExportHistory = (type, format, records, status = 'completed') => {
    const exportItem = {
      type,
      format,
      records,
      status,
      timestamp: new Date().toISOString()
    };
    setExportHistory(prev => [exportItem, ...prev.slice(0, 9)]); // Keep last 10 exports
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Enhanced header with animated background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, #1976d2 0%, #1565c0 25%, #0d47a1 50%, #1565c0 75%, #1976d2 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 3s ease infinite',
            opacity: 0.1,
            '@keyframes gradientShift': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' }
            }
          }}
        />
        
        <Box display="flex" alignItems="center" gap={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            <AutoAwesomeIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Advanced Billing Export
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Professional data export with advanced customization
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} sx={{ position: 'relative', zIndex: 1 }}>
          <Tooltip title="Settings">
            <IconButton sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Enhanced tabs with better styling */}
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)} 
            sx={{ 
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <SettingsIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Export Settings</Typography>
                    <Typography variant="caption" color="text.secondary">Configure export options</Typography>
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <ViewModuleIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Data Preview</Typography>
                    <Typography variant="caption" color="text.secondary">Review data before export</Typography>
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AnalyticsIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Analytics</Typography>
                    <Typography variant="caption" color="text.secondary">Data insights & charts</Typography>
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUpIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="caption" color="text.secondary">Export status & history</Typography>
                  </Box>
                </Box>
              } 
            />
          </Tabs>
        </Paper>
        
        {/* Tab content with padding */}
        <Box sx={{ p: 3 }}>
        
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Basic Export Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Export Configuration
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Type</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  label="Export Type"
                >
                  <MenuItem value="all">All Billing Records</MenuItem>
                  <MenuItem value="last12months">Last 12 Months</MenuItem>
                  <MenuItem value="dateRange">Custom Date Range</MenuItem>
                  <MenuItem value="selectedMonths">Selected Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {exportType === 'dateRange' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="month"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="month"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            
            {exportType === 'selectedMonths' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Months to Export:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {generateMonthOptions().map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => {
                        if (selectedMonths.includes(option.value)) {
                          setSelectedMonths(selectedMonths.filter(m => m !== option.value));
                        } else {
                          setSelectedMonths([...selectedMonths, option.value]);
                        }
                      }}
                      color={selectedMonths.includes(option.value) ? 'primary' : 'default'}
                      variant={selectedMonths.includes(option.value) ? 'filled' : 'outlined'}
                      clickable
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={groupByMonth}
                    onChange={(e) => setGroupByMonth(e.target.checked)}
                  />
                }
                label="Separate by Month (Recommended - creates separate sheets/pages for each month)"
              />
            </Grid>
            
            {/* Advanced Options */}
            <Grid item xs={12}>
              <Accordion 
                expanded={showAdvancedOptions} 
                onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
                sx={{ mt: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AutoAwesomeIcon color="primary" />
                    <Typography variant="h6" color="primary">Advanced Options</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={includeCharts}
                            onChange={(e) => setIncludeCharts(e.target.checked)}
                          />
                        }
                        label="Include Charts & Graphs"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={includeSummary}
                            onChange={(e) => setIncludeSummary(e.target.checked)}
                          />
                        }
                        label="Include Summary Pages"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={customizeColumns}
                            onChange={(e) => setCustomizeColumns(e.target.checked)}
                          />
                        }
                        label="Customize Columns"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoExport}
                            onChange={(e) => setAutoExport(e.target.checked)}
                          />
                        }
                        label="Auto Export"
                      />
                    </Grid>
                    
                    {customizeColumns && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Select Columns to Include:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {getAvailableColumns().map((column) => (
                            <Chip
                              key={column.key}
                              label={column.label}
                              onClick={() => {
                                if (column.required) return; // Required columns can't be deselected
                                if (selectedColumns.includes(column.key)) {
                                  setSelectedColumns(selectedColumns.filter(c => c !== column.key));
                                } else {
                                  setSelectedColumns([...selectedColumns, column.key]);
                                }
                              }}
                              color={selectedColumns.includes(column.key) ? 'primary' : 'default'}
                              variant={selectedColumns.includes(column.key) ? 'filled' : 'outlined'}
                              clickable={!column.required}
                              disabled={column.required}
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    {autoExport && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Export Schedule</InputLabel>
                          <Select
                            value={exportSchedule}
                            onChange={(e) => setExportSchedule(e.target.value)}
                            label="Export Schedule"
                          >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="quarterly">Quarterly</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Data Sorting */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    <SortIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Data Sorting & Organization
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          label="Sort By"
                        >
                          <MenuItem value="billingMonth">Billing Month</MenuItem>
                          <MenuItem value="total">Amount</MenuItem>
                          <MenuItem value="dueDate">Due Date</MenuItem>
                          <MenuItem value="createdAt">Created Date</MenuItem>
                          <MenuItem value="tenantName">Tenant Name</MenuItem>
                          <MenuItem value="status">Status</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sort Order</InputLabel>
                        <Select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          label="Sort Order"
                        >
                          <MenuItem value="desc">Descending (Newest First)</MenuItem>
                          <MenuItem value="asc">Ascending (Oldest First)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* PDF Export Settings */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderColor: '#d32f2f' }}>
                <CardContent>
                  <Typography variant="h6" color="error" gutterBottom>
                    <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    PDF Export Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Customize your PDF export with professional styling and enhanced features
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={includeCharts}
                            onChange={(e) => setIncludeCharts(e.target.checked)}
                            color="error"
                          />
                        }
                        label="Include Revenue Charts & Progress Bars"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={includeSummary}
                            onChange={(e) => setIncludeSummary(e.target.checked)}
                            color="error"
                          />
                        }
                        label="Include Executive Summary Dashboard"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" icon={<InfoIcon />}>
                        <Typography variant="body2">
                          <strong>Enhanced PDF Features:</strong><br />
                          • Professional header with company branding<br />
                          • Executive summary with key metrics<br />
                          • Interactive progress bars and charts<br />
                          • Monthly data separation with summaries<br />
                          • Print-optimized layout and styling<br />
                          • Automatic page breaks and formatting
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>Export Options:</strong><br />
                  • <strong>Export All Data (Excel):</strong> Downloads ALL billing records from the database, separated by month<br />
                  • <strong>Regular Export:</strong> Exports based on your selected filters and format<br />
                  • Current Records: {billingData.length > 0 ? `${billingData.length} records loaded` : 'Auto-loading all billing data...'}
                </Typography>
              </Alert>
            </Grid>
            
            {/* Excel Export Quality Notice */}
            <Grid item xs={12}>
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="body2">
                  <strong>Enhanced Excel Export Quality:</strong><br />
                  ✅ Data validation and cleaning to prevent corruption<br />
                  ✅ Safe sheet names and proper formatting<br />
                  ✅ Error handling for individual months<br />
                  ✅ Professional file naming and compression<br />
                  ✅ Compatible with all Excel versions
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" color="primary">
                  <ViewModuleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Data Preview & Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and analyze your billing data before export
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Tooltip title="Grid View">
                  <IconButton 
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton 
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadBillingData}
                  disabled={isLoading}
                >
                  Refresh Data
                </Button>
              </Box>
            </Box>
            
            {/* Error and Success Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading billing data...
                </Typography>
              </Box>
            ) : billingData.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Showing {billingData.length} records (auto-loaded)
                </Typography>
                
                {groupByMonth && Object.keys(monthlyData).length > 0 ? (
                  Object.keys(monthlyData).map((month) => {
                    const monthData = monthlyData[month];
                    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    });
                    
                    return (
                      <Card key={month} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">{monthName}</Typography>
                            <Chip 
                              label={`${monthData.length} records`} 
                              color="primary" 
                              size="small" 
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                                <Typography variant="h6" color="primary">
                                  {formatPHP(monthData.reduce((sum, bill) => sum + (bill.total || 0), 0))}
                                </Typography>
                                <Typography variant="caption">Total Amount</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box textAlign="center" p={2} bgcolor="success.50" borderRadius={1}>
                                <Typography variant="h6" color="success.main">
                                  {monthData.filter(bill => bill.status === 'paid').length}
                                </Typography>
                                <Typography variant="caption">Paid</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box textAlign="center" p={2} bgcolor="warning.50" borderRadius={1}>
                                <Typography variant="h6" color="warning.main">
                                  {monthData.filter(bill => bill.status === 'pending').length}
                                </Typography>
                                <Typography variant="caption">Pending</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box textAlign="center" p={2} bgcolor="error.50" borderRadius={1}>
                                <Typography variant="h6" color="error.main">
                                  {monthData.filter(bill => bill.status === 'overdue').length}
                                </Typography>
                                <Typography variant="caption">Overdue</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Typography color="text.secondary">
                    No data loaded. Data will auto-load when the dialog opens.
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                No data loaded. Data will auto-load when the dialog opens.
              </Typography>
            )}
            
            {/* PDF Preview Section */}
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" color="error" gutterBottom>
                <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                PDF Export Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Preview what your enhanced PDF export will look like
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: '#d32f2f' }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>
                        📊 Executive Summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Professional dashboard with key metrics, revenue charts, and status distribution
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: '#d32f2f' }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>
                        📅 Monthly Breakdown
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Detailed monthly reports with professional styling and data summaries
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    <Typography variant="body2">
                      <strong>Ready for PDF Export!</strong> Your data is prepared for professional PDF generation with enhanced styling, charts, and executive summaries.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
        
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Analytics & Insights</Typography>
            
            {getExportStats() ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Revenue Overview
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" color="success.main">
                          {formatPHP(getExportStats().totalAmount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={parseFloat(getExportStats().paidPercentage)} 
                        color="success"
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {getExportStats().paidPercentage}% Collected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Status Distribution
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2">Paid</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {getExportStats().paidAmount > 0 ? formatPHP(getExportStats().paidAmount) : '₱0'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            <WarningIcon color="warning" fontSize="small" />
                            <Typography variant="body2">Pending</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {getExportStats().pendingAmount > 0 ? formatPHP(getExportStats().pendingAmount) : '₱0'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <ErrorIcon color="error" fontSize="small" />
                            <Typography variant="body2">Overdue</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {getExportStats().overdueAmount > 0 ? formatPHP(getExportStats().overdueAmount) : '₱0'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        <ViewModuleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Monthly Breakdown
                      </Typography>
                      {Object.keys(monthlyData).length > 0 ? (
                        <Grid container spacing={2}>
                          {Object.keys(monthlyData).slice(0, 6).map((month) => {
                            const monthData = monthlyData[month];
                            const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short' 
                            });
                            const monthTotal = monthData.reduce((sum, bill) => sum + (bill.total || 0), 0);
                            
                            return (
                              <Grid item xs={12} sm={6} md={4} key={month}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                  <Typography variant="h6" color="primary">
                                    {monthName}
                                  </Typography>
                                  <Typography variant="h5" fontWeight="bold">
                                    {formatPHP(monthTotal)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {monthData.length} bills
                                  </Typography>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Typography color="text.secondary">No monthly data available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">Load data to view analytics</Typography>
            )}
          </Box>
        )}
        
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Export Progress & History</Typography>
            
            {exportProgress > 0 && (
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight="medium">
                    Export Progress
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {exportProgress}% Complete
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={exportProgress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {exportProgress === 0 && 'Ready to export. Data is auto-loaded when dialog opens.'}
                  {exportProgress > 0 && exportProgress < 100 && 'Processing export...'}
                  {exportProgress === 100 && 'Export completed successfully!'}
                </Typography>
              </Box>
            )}
            
            {/* Export History */}
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Exports
                </Typography>
                {exportHistory.length > 0 ? (
                  <List>
                    {exportHistory.slice(0, 5).map((exportItem, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {exportItem.format === 'excel' ? <TableChartIcon color="success" /> : <PictureAsPdfIcon color="error" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${exportItem.type} Export - ${exportItem.format.toUpperCase()}`}
                          secondary={`${exportItem.records} records • ${new Date(exportItem.timestamp).toLocaleString()}`}
                        />
                        <Chip 
                          label={exportItem.status} 
                          color={exportItem.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No export history available</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2, flexWrap: 'wrap', borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button 
            onClick={handleReset} 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            sx={{ minWidth: 100 }}
          >
            Reset
          </Button>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
        </Box>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Export All Data Button */}
          <Button
            onClick={exportAllData}
            variant="contained"
            color="success"
            startIcon={<CloudDownloadIcon />}
            disabled={isLoading}
            sx={{ 
              minWidth: 200,
              bgcolor: 'success.main',
              '&:hover': { 
                bgcolor: 'success.dark',
                transform: 'translateY(-1px)',
                boxShadow: 3
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isLoading ? 'Exporting All...' : 'Export All Data (Excel)'}
          </Button>
          
                  {/* Enhanced PDF Export Button */}
        <Button
          onClick={exportToPDF}
          variant="contained"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          disabled={isLoading || (exportType === 'dateRange' && (!customStartDate || !customEndDate)) || (exportType === 'selectedMonths' && selectedMonths.length === 0)}
          sx={{
            minWidth: 200,
            bgcolor: '#d32f2f',
            '&:hover': {
              bgcolor: '#b71c1c',
              transform: 'translateY(-1px)',
              boxShadow: 3
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {isLoading ? 'Processing...' : 'Export to PDF (Enhanced)'}
        </Button>
        
        {/* Regular Export Button */}
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={exportFormat === 'excel' ? <TableChartIcon /> : <PictureAsPdfIcon />}
          disabled={isLoading || (exportType === 'dateRange' && (!customStartDate || !customEndDate)) || (exportType === 'selectedMonths' && selectedMonths.length === 0) || exportFormat === 'pdf'}
          sx={{
            minWidth: 180,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: 3
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {isLoading ? 'Processing...' : `Export to ${exportFormat.toUpperCase()}`}
        </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}