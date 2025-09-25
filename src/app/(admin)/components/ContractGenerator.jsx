"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Grid,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Description as ContractIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import ContractTemplate from './ContractTemplate';
import InvoiceTemplate from './InvoiceTemplate';
import { mapTenantToContractData, validateTenantForContract, getContractPreviewData } from '../utils/contractDataMapper';

const ContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [contractData, setContractData] = useState({});
  const [tenantData, setTenantData] = useState({});
  const [validation, setValidation] = useState({ isValid: true, missingFields: [], message: '' });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState({});

  useEffect(() => {
    if (open && tenant) {
      initializeData();
    }
  }, [open, tenant, templateType]);

  const initializeData = () => {
    if (!tenant) return;

    // Initialize tenant data with defaults
    const initialTenantData = {
      name: tenant.name || '',
      company: tenant.company || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: tenant.address || '',
      billing: {
        rate: tenant.billing?.rate || 0,
        cusaFee: tenant.billing?.cusaFee || 0,
        parkingFee: tenant.billing?.parkingFee || 0,
        startDate: tenant.billing?.startDate || new Date().toISOString().split('T')[0],
        monthsToAvail: tenant.billing?.monthsToAvail || 12,
        paymentMethod: tenant.billing?.paymentMethod || 'Bank Transfer',
        paymentTerms: tenant.billing?.paymentTerms || ''
      },
      selectedSeats: tenant.selectedSeats || [],
      selectedPO: tenant.selectedPO || [],
      virtualOfficeFeatures: tenant.virtualOfficeFeatures || []
    };

    setTenantData(initialTenantData);
    
    // Generate initial contract data
    const previewData = getContractPreviewData(initialTenantData, templateType);
    setContractData(previewData.contractData);
    setValidation(previewData.validation);
  };

  const updateTenantData = (field, value) => {
    const newTenantData = { ...tenantData };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newTenantData[parent] = {
        ...newTenantData[parent],
        [child]: value
      };
    } else {
      newTenantData[field] = value;
    }
    
    setTenantData(newTenantData);
    
    // Regenerate contract data
    const previewData = getContractPreviewData(newTenantData, templateType);
    setContractData(previewData.contractData);
    setValidation(previewData.validation);
  };

  const generateContract = async () => {
    setProcessing(true);
    setResult(null);

    try {
      // Validate tenant data
      const validationResult = validateTenantForContract(tenantData);
      if (!validationResult.isValid) {
        setResult({
          type: 'error',
          message: validationResult.message
        });
        return;
      }

      // Generate final contract data
      const finalContractData = mapTenantToContractData(tenantData, templateType);
      setContractData(finalContractData);
      
      setResult({
        type: 'success',
        message: 'Contract generated successfully!'
      });
      
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating contract:', error);
      setResult({
        type: 'error',
        message: `Error generating contract: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };


  const handlePrintContract = () => {
    if (!contractData || !contractData.clientName) {
      setResult({
        type: 'error',
        message: 'No contract data to print. Please generate a contract first.'
      });
      return;
    }

    try {
      // Call the print function from ContractTemplate
      if (window.printContract) {
        window.printContract();
        setResult({
          type: 'success',
          message: 'Print dialog opened successfully!'
        });
      } else {
        setResult({
          type: 'error',
          message: 'Print function is not available. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error printing contract:', error);
      setResult({
        type: 'error',
        message: `Error printing contract: ${error.message}`
      });
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const generateInvoice = () => {
    if (!contractData || !contractData.clientName) {
      setResult({
        type: 'error',
        message: 'No contract data available. Please generate a contract first.'
      });
      return;
    }

    try {
      // Calculate amounts - only include fees if they are set and greater than 0
      const monthlyRate = parseFloat(tenantData.billing?.rate) || 20000;
      const cusaFee = (tenantData.billing?.cusaFee && parseFloat(tenantData.billing.cusaFee) > 0) ? parseFloat(tenantData.billing.cusaFee) : 0;
      const parkingFee = (tenantData.billing?.parkingFee && parseFloat(tenantData.billing.parkingFee) > 0) ? parseFloat(tenantData.billing.parkingFee) : 0;

      // Generate invoice number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const invoiceNumber = `INV-${year}${month}${day}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newInvoiceData = {
        invoiceNumber,
        invoiceDate: now.toLocaleDateString('en-PH'),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PH'),
        clientName: contractData.clientName,
        clientCompany: tenantData.company || '',
        clientAddress: contractData.clientAddress || tenantData.address,
        clientEmail: contractData.clientEmail || tenantData.email,
        clientPhone: contractData.clientPhone || tenantData.phone,
        contractNumber: contractData.contractNumber,
        workspaceType: getWorkspaceTypeForInvoice(),
        monthlyRate,
        cusaFee,
        parkingFee,
        advanceMonths: 2,
        securityMonths: 2,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        paymentMethod: tenantData.billing?.paymentMethod || 'Bank Transfer'
      };

      setInvoiceData(newInvoiceData);
      setShowInvoice(true);
      
      setResult({
        type: 'success',
        message: 'Invoice generated successfully!'
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      setResult({
        type: 'error',
        message: `Error generating invoice: ${error.message}`
      });
    }
  };

  const getWorkspaceTypeForInvoice = () => {
    switch (templateType) {
      case 'dedicated':
        return 'Dedicated Desk';
      case 'private':
        return 'Private Office';
      case 'virtual':
        return 'Virtual Office';
      default:
        return 'Workspace';
    }
  };

  const handlePrintInvoice = () => {
    if (!invoiceData || !invoiceData.clientName) {
      setResult({
        type: 'error',
        message: 'No invoice data to print. Please generate an invoice first.'
      });
      return;
    }

    try {
      if (window.printInvoice) {
        window.printInvoice();
        setResult({
          type: 'success',
          message: 'Invoice print dialog opened successfully!'
        });
      } else {
        setResult({
          type: 'error',
          message: 'Print function is not available. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      setResult({
        type: 'error',
        message: `Error printing invoice: ${error.message}`
      });
    }
  };

  const handleDownloadInvoicePDF = () => {
    if (!invoiceData || !invoiceData.clientName) {
      setResult({
        type: 'error',
        message: 'No invoice data to download. Please generate an invoice first.'
      });
      return;
    }

    try {
      if (window.exportInvoiceAsPDF) {
        window.exportInvoiceAsPDF();
        setResult({
          type: 'success',
          message: 'Invoice PDF generated successfully!'
        });
      } else {
        setResult({
          type: 'error',
          message: 'PDF export function is not available. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      setResult({
        type: 'error',
        message: `Error generating invoice PDF: ${error.message}`
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getTotalMonthly = () => {
    const rate = parseFloat(tenantData.billing?.rate) || 0;
    const cusaFee = parseFloat(tenantData.billing?.cusaFee) || 0;
    const parkingFee = parseFloat(tenantData.billing?.parkingFee) || 0;
    return rate + cusaFee + parkingFee;
  };

  const getWorkspaceInfo = () => {
    switch (templateType) {
      case 'dedicated':
        return tenantData.selectedSeats?.length > 0 
          ? `${tenantData.selectedSeats.length} seat(s): ${Array.isArray(tenantData.selectedSeats) ? tenantData.selectedSeats.join(', ') : tenantData.selectedSeats}`
          : 'Dedicated Desk - Location to be assigned';
      case 'private':
        return tenantData.selectedPO?.length > 0 
          ? `Private Office(s): ${Array.isArray(tenantData.selectedPO) ? tenantData.selectedPO.join(', ') : tenantData.selectedPO}`
          : 'Private Office - Location to be assigned';
      case 'virtual':
        return tenantData.virtualOfficeFeatures?.length > 0 
          ? `Virtual Office Features: ${Array.isArray(tenantData.virtualOfficeFeatures) ? tenantData.virtualOfficeFeatures.join(', ') : tenantData.virtualOfficeFeatures}`
          : 'Virtual Office Services';
      default:
        return 'Workspace - Details to be specified';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <ContractIcon color="primary" />
              <Box>
                <Typography variant="h6">Generate Contract</Typography>
                <Typography variant="body2" color="text.secondary">
                  {tenant?.name} - {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Office
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            {/* Tenant Data Editor */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Tenant Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Tenant Name *"
                      value={tenantData.name || ''}
                      onChange={(e) => updateTenantData('name', e.target.value)}
                      size="small"
                      error={!tenantData.name}
                      helperText={!tenantData.name ? 'Required field' : ''}
                    />
                    
                    <TextField
                      fullWidth
                      label="Company"
                      value={tenantData.company || ''}
                      onChange={(e) => updateTenantData('company', e.target.value)}
                      size="small"
                    />
                    
                    <TextField
                      fullWidth
                      label="Email *"
                      value={tenantData.email || ''}
                      onChange={(e) => updateTenantData('email', e.target.value)}
                      size="small"
                      error={!tenantData.email}
                      helperText={!tenantData.email ? 'Required field' : ''}
                    />
                    
                    <TextField
                      fullWidth
                      label="Phone *"
                      value={tenantData.phone || ''}
                      onChange={(e) => updateTenantData('phone', e.target.value)}
                      size="small"
                      error={!tenantData.phone}
                      helperText={!tenantData.phone ? 'Required field' : ''}
                    />
                    
                    <TextField
                      fullWidth
                      label="Address *"
                      value={tenantData.address || ''}
                      onChange={(e) => updateTenantData('address', e.target.value)}
                      size="small"
                      multiline
                      rows={2}
                      error={!tenantData.address}
                      helperText={!tenantData.address ? 'Required field' : ''}
                    />
                  </Stack>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Billing Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Monthly Rate"
                      type="number"
                      value={tenantData.billing?.rate || ''}
                      onChange={(e) => updateTenantData('billing.rate', parseFloat(e.target.value) || 0)}
                      size="small"
                      InputProps={{ startAdornment: '₱' }}
                    />
                    
                    <TextField
                      fullWidth
                      label="CUSA Fee"
                      type="number"
                      value={tenantData.billing?.cusaFee || ''}
                      onChange={(e) => updateTenantData('billing.cusaFee', parseFloat(e.target.value) || 0)}
                      size="small"
                      InputProps={{ startAdornment: '₱' }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Parking Fee"
                      type="number"
                      value={tenantData.billing?.parkingFee || ''}
                      onChange={(e) => updateTenantData('billing.parkingFee', parseFloat(e.target.value) || 0)}
                      size="small"
                      InputProps={{ startAdornment: '₱' }}
                    />
                    
                    <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                      <Typography variant="body2" color="primary">
                        Total Monthly: {formatCurrency(getTotalMonthly())}
                      </Typography>
                    </Paper>
                    
                    <TextField
                      fullWidth
                      label="Contract Start Date"
                      type="date"
                      value={tenantData.billing?.startDate || ''}
                      onChange={(e) => updateTenantData('billing.startDate', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Contract Duration (months)"
                      type="number"
                      value={tenantData.billing?.monthsToAvail || ''}
                      onChange={(e) => updateTenantData('billing.monthsToAvail', parseInt(e.target.value) || 12)}
                      size="small"
                    />
                    
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={tenantData.billing?.paymentMethod || 'Bank Transfer'}
                        onChange={(e) => updateTenantData('billing.paymentMethod', e.target.value)}
                        label="Payment Method"
                      >
                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Check">Check</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Workspace Information
                  </Typography>
                  
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Office
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Details:</strong> {getWorkspaceInfo()}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>

            {/* Contract Preview & Actions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ContractIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Contract Preview
                  </Typography>
                  
                  {validation.isValid ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                      {validation.message}
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <ErrorIcon fontSize="small" sx={{ mr: 1 }} />
                      {validation.message}
                    </Alert>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={generateContract}
                      disabled={processing || !validation.isValid}
                      fullWidth
                      startIcon={processing ? <RefreshIcon /> : <ContractIcon />}
                    >
                      {processing ? 'Generating...' : 'Generate Contract'}
                    </Button>
                    
                    {processing && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          Processing contract data...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {contractData.clientName && contractData.clientName !== '[CLIENT NAME]' && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="caption" color="text.secondary">
                        Contract Summary:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary={contractData.contractNumber}
                            secondary="Contract Number"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CalendarIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary={`${contractData.startDate} - ${contractData.endDate}`}
                            secondary="Contract Period"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><MoneyIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary={contractData.monthlyRate}
                            secondary="Monthly Rate"
                          />
                        </ListItem>
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box>
                        <Button
                          variant="outlined"
                          onClick={generateInvoice}
                          disabled={!contractData.clientName || contractData.clientName === '[CLIENT NAME]'}
                          fullWidth
                          startIcon={<ReceiptIcon />}
                          sx={{ mb: 1 }}
                        >
                          Generate Invoice
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result && (
            <Alert 
              severity={result.type === 'success' ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {result.message}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Preview Dialog */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            maxHeight: '90vh',
            borderRadius: 1,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Contract Preview</Typography>
            <Box>
              <Button
                onClick={handlePrintContract}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
                variant="outlined"
              >
                Print
              </Button>
              <IconButton onClick={() => setShowPreview(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2,
            fontFamily: 'Arial, sans-serif',
            fontSize: '12pt',
            lineHeight: 1.4,
            maxWidth: '210mm', // A4 width
            margin: '0 auto',
            backgroundColor: '#fff'
          }}>
            <ContractTemplate contractData={contractData} preview={true} />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog 
        open={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            maxHeight: '90vh',
            borderRadius: 1,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Invoice Preview</Typography>
            <Box>
              <Button
                onClick={handlePrintInvoice}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
                variant="outlined"
              >
                Print
              </Button>
              <IconButton onClick={() => setShowInvoice(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2,
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            lineHeight: 1.4,
            maxWidth: '210mm',
            margin: '0 auto',
            backgroundColor: '#fff'
          }}>
            {invoiceData && Object.keys(invoiceData).length > 0 ? (
              <InvoiceTemplate invoiceData={invoiceData} preview={true} />
            ) : (
              <Typography>Loading invoice data...</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractGenerator;