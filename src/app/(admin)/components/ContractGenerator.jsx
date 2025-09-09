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
  Print as PrintIcon
} from '@mui/icons-material';
import ContractTemplate from './ContractTemplate';
import { mapTenantToContractData, validateTenantForContract, getContractPreviewData } from '../utils/contractDataMapper';

const ContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [contractData, setContractData] = useState({});
  const [tenantData, setTenantData] = useState({});
  const [validation, setValidation] = useState({ isValid: true, missingFields: [], message: '' });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const handleDownloadPDF = () => {
    if (!contractData || !contractData.clientName) {
      setResult({
        type: 'error',
        message: 'No contract data to download. Please generate a contract first.'
      });
      return;
    }

    try {
      // Create a new window with the contract content
      const printWindow = window.open('', '_blank');
      const contractHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contract - ${contractData.clientName}</title>
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
            </style>
          </head>
          <body>
            <div id="contract-content"></div>
            <script>
              // Render the React component
              const { createElement: h, render } = React;
              const contractData = ${JSON.stringify(contractData)};
              const ContractTemplate = ${ContractTemplate.toString()};
              render(h(ContractTemplate, { contractData, preview: true }), document.getElementById('contract-content'));
            </script>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          </body>
        </html>
      `;
      
      printWindow.document.write(contractHTML);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
      
      setResult({
        type: 'success',
        message: 'Contract PDF generated successfully!'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setResult({
        type: 'error',
        message: `Error generating PDF: ${error.message}`
      });
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
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
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={handlePreview}
                          startIcon={<PreviewIcon />}
                          fullWidth
                        >
                          Preview Contract
                        </Button>
                        
                        <Button
                          variant="contained"
                          onClick={handleDownloadPDF}
                          startIcon={<PdfIcon />}
                          fullWidth
                        >
                          Download PDF
                        </Button>
                      </Stack>
                      
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
          {contractData.clientName && contractData.clientName !== '[CLIENT NAME]' && (
            <>
              <Button onClick={handlePreview} startIcon={<PreviewIcon />}>
                Preview
              </Button>
              <Button onClick={handleDownloadPDF} variant="contained" startIcon={<PdfIcon />}>
                Download PDF
              </Button>
            </>
          )}
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
                onClick={handleDownloadPDF}
                startIcon={<PdfIcon />}
                sx={{ mr: 1 }}
              >
                Download PDF
              </Button>
              <IconButton onClick={() => setShowPreview(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <ContractTemplate contractData={contractData} preview={true} />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractGenerator;