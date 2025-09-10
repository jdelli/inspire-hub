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
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
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
  Info as InfoIcon
} from '@mui/icons-material';
import { getContractTemplates } from '../utils/contractTemplateManager';
import { processPDFTemplate, downloadPDF, previewPDF } from '../utils/pdfTemplateProcessor';

const PDFContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [tenantData, setTenantData] = useState({});

  useEffect(() => {
    if (open && tenant) {
      loadTemplates();
      initializeTenantData();
    }
  }, [open, tenant, templateType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await getContractTemplates(templateType);
      // Filter only PDF templates
      const pdfTemplates = allTemplates.filter(template => 
        template.mimeType === 'application/pdf' && template.isActive
      );
      setTemplates(pdfTemplates);
      
      // Auto-select first active template
      if (pdfTemplates.length > 0) {
        setSelectedTemplate(pdfTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setResult({
        type: 'error',
        message: `Error loading templates: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeTenantData = () => {
    if (!tenant) return;

    setTenantData({
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
        monthsToAvail: tenant.billing?.monthsToAvail || 12
      },
      selectedSeats: tenant.selectedSeats || [],
      selectedPO: tenant.selectedPO || [],
      virtualOfficeFeatures: tenant.virtualOfficeFeatures || []
    });
  };

  const generateContract = async () => {
    if (!selectedTemplate) {
      setResult({
        type: 'error',
        message: 'Please select a PDF template first.'
      });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const result = await processPDFTemplate(tenantData, templateType);
      
      if (result.success) {
        setGeneratedPDF(result);
        setResult({
          type: 'success',
          message: 'PDF contract generated successfully!'
        });
      } else {
        setResult({
          type: 'error',
          message: result.error || 'Failed to generate PDF contract'
        });
      }
    } catch (error) {
      console.error('Error generating PDF contract:', error);
      setResult({
        type: 'error',
        message: `Error generating contract: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPDF) {
      setResult({
        type: 'error',
        message: 'No contract to download. Please generate a contract first.'
      });
      return;
    }

    try {
      const fileName = `Contract_${tenantData.company || tenantData.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(generatedPDF.pdfBytes, fileName);
      
      setResult({
        type: 'success',
        message: 'Contract downloaded successfully!'
      });
    } catch (error) {
      console.error('Error downloading contract:', error);
      setResult({
        type: 'error',
        message: `Error downloading contract: ${error.message}`
      });
    }
  };

  const handlePreview = () => {
    if (!generatedPDF) {
      setResult({
        type: 'error',
        message: 'No contract to preview. Please generate a contract first.'
      });
      return;
    }

    try {
      const title = `Contract Preview - ${tenantData.company || tenantData.name}`;
      previewPDF(generatedPDF.pdfBytes, title);
    } catch (error) {
      console.error('Error previewing contract:', error);
      setResult({
        type: 'error',
        message: `Error previewing contract: ${error.message}`
      });
    }
  };

  const updateTenantData = (field, value) => {
    setTenantData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PdfIcon color="error" />
          <Box>
            <Typography variant="h6">Generate PDF Contract</Typography>
            <Typography variant="body2" color="text.secondary">
              {tenant?.name} - {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Office
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Template Selection */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  PDF Template
                </Typography>
                
                {loading ? (
                  <Box>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Loading templates...
                    </Typography>
                  </Box>
                ) : (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select PDF Template</InputLabel>
                    <Select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        setSelectedTemplate(template);
                      }}
                      label="Select PDF Template"
                    >
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          <Box>
                            <Typography variant="body2">{template.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {template.description || 'No description'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {templates.length === 0 && !loading && (
                  <Alert severity="warning">
                    No PDF templates found for {templateType} office type. 
                    Please upload a PDF template first.
                  </Alert>
                )}
                
                {selectedTemplate && (
                  <Box>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">
                        Selected Template:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedTemplate.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Size: {(selectedTemplate.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                      <Typography variant="caption" display="block">
                        Uploaded: {new Date(selectedTemplate.uploadedAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                    
                    <Button
                      variant="contained"
                      onClick={generateContract}
                      disabled={processing}
                      fullWidth
                      startIcon={processing ? <RefreshIcon /> : <PdfIcon />}
                      sx={{ mt: 2 }}
                    >
                      {processing ? 'Generating...' : 'Generate PDF Contract'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Generation Status */}
            {processing && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <RefreshIcon color="primary" />
                    <Typography variant="body2">Processing PDF...</Typography>
                  </Box>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Filling template fields and generating contract
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Tenant Data Editor */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Tenant Information
                </Typography>
                
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Tenant Name"
                    value={tenantData.name || ''}
                    onChange={(e) => updateTenantData('name', e.target.value)}
                    size="small"
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
                    label="Email"
                    value={tenantData.email || ''}
                    onChange={(e) => updateTenantData('email', e.target.value)}
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="Phone"
                    value={tenantData.phone || ''}
                    onChange={(e) => updateTenantData('phone', e.target.value)}
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="Address"
                    value={tenantData.address || ''}
                    onChange={(e) => updateTenantData('address', e.target.value)}
                    size="small"
                    multiline
                    rows={2}
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
                    InputProps={{
                      startAdornment: '₱'
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="CUSA Fee"
                    type="number"
                    value={tenantData.billing?.cusaFee || ''}
                    onChange={(e) => updateTenantData('billing.cusaFee', parseFloat(e.target.value) || 0)}
                    size="small"
                    InputProps={{
                      startAdornment: '₱'
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Parking Fee"
                    type="number"
                    value={tenantData.billing?.parkingFee || ''}
                    onChange={(e) => updateTenantData('billing.parkingFee', parseFloat(e.target.value) || 0)}
                    size="small"
                    InputProps={{
                      startAdornment: '₱'
                    }}
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
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Contract Actions & Status */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ContractIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contract Actions
                </Typography>
                
                {generatedPDF ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckIcon fontSize="small" />
                        Contract generated successfully!
                      </Box>
                    </Alert>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      Contract Details:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={generatedPDF.templateName}
                          secondary="Template Used"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarIcon fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={new Date(generatedPDF.metadata.generatedAt).toLocaleString()}
                          secondary="Generated At"
                        />
                      </ListItem>
                    </List>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <PdfIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Select a template and click "Generate PDF Contract" to create your contract
                    </Typography>
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
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFContractGenerator;