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
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Description as ContractIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PublicDocsContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [generatedContract, setGeneratedContract] = useState(null);
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [tenantData, setTenantData] = useState({});

  // Template configurations for public/docs structure
  const templateConfigs = {
    dedicated: {
      textTemplate: '/docs/contracts/dedicated/standard-desk-agreement.txt',
      pdfTemplate: '/docs/CONTRACT OF LEASE AGT.pdf',
      name: 'Standard Desk Agreement'
    },
    private: {
      textTemplate: '/docs/contracts/private/private-office-lease.txt',
      pdfTemplate: '/docs/CONTRACT OF LEASE AGT.pdf',
      name: 'Private Office Lease'
    },
    virtual: {
      textTemplate: '/docs/contracts/virtual/virtual-office-service.txt',
      pdfTemplate: '/docs/CONTRACT OF LEASE AGT.pdf',
      name: 'Virtual Office Service Agreement'
    }
  };

  useEffect(() => {
    if (open && tenant) {
      initializeTenantData();
      loadTemplate();
    }
  }, [open, tenant, templateType]);

  const loadTemplate = () => {
    const config = templateConfigs[templateType];
    if (config) {
      setSelectedTemplate({
        id: `${templateType}-text`,
        name: `${config.name}`,
        format: 'text',
        path: config.textTemplate,
        description: 'Text-based template with variable replacement'
      });
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
      position: tenant.position || 'Business Owner',
      idNumber: tenant.idNumber || '',
      taxId: tenant.taxId || '',
      billing: {
        rate: tenant.billing?.rate || 0,
        cusaFee: tenant.billing?.cusaFee || 0,
        parkingFee: tenant.billing?.parkingFee || 0,
        startDate: tenant.billing?.startDate || new Date().toISOString().split('T')[0],
        monthsToAvail: tenant.billing?.monthsToAvail || 12,
        paymentMethod: tenant.billing?.paymentMethod || 'Bank Transfer',
        paymentTerms: tenant.billing?.paymentTerms || 'Monthly, due at end of each month',
        lateFee: tenant.billing?.lateFee || '5% per month'
      },
      selectedSeats: tenant.selectedSeats || [],
      selectedPO: tenant.selectedPO || [],
      virtualOfficeFeatures: tenant.virtualOfficeFeatures || []
    });
  };

  const generateContract = async () => {
    if (!selectedTemplate) return;

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch(selectedTemplate.path);
      if (!response.ok) {
        throw new Error(`Template not found at ${selectedTemplate.path}`);
      }
      const templateContent = await response.text();
      
      const contractContent = replaceVariables(templateContent, tenantData, templateType);
      
      if (outputFormat === 'pdf') {
        const pdfBytes = await convertTextToPDF(contractContent);
        setGeneratedContract({
          content: contractContent,
          pdfBytes: pdfBytes,
          format: 'pdf',
          templateName: selectedTemplate.name
        });
      } else {
        setGeneratedContract({
          content: contractContent,
          format: 'text',
          templateName: selectedTemplate.name
        });
      }
      
      setResult({
        type: 'success',
        message: 'Contract generated successfully!'
      });
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

  const replaceVariables = (template, data, type) => {
    const currentDate = new Date().toLocaleDateString();
    const startDate = data.billing?.startDate || currentDate;
    const monthsToAvail = data.billing?.monthsToAvail || 12;
    const endDate = calculateEndDate(startDate, monthsToAvail);
    
    const variables = {
      '{{tenant.name}}': data.name || '',
      '{{tenant.company}}': data.company || '',
      '{{tenant.email}}': data.email || '',
      '{{tenant.phone}}': data.phone || '',
      '{{tenant.address}}': data.address || '',
      '{{tenant.position}}': data.position || 'Business Owner',
      '{{tenant.idNumber}}': data.idNumber || '',
      '{{tenant.taxId}}': data.taxId || '',
      '{{contract.startDate}}': startDate,
      '{{contract.endDate}}': endDate,
      '{{contract.duration}}': `${monthsToAvail} months`,
      '{{contract.type}}': type.charAt(0).toUpperCase() + type.slice(1) + ' Office',
      '{{contract.seats}}': getSelectedSeats(data),
      '{{contract.renewal}}': 'Subject to mutual agreement and 45-day advance notice',
      '{{contract.termination}}': '30 days written notice required',
      '{{billing.monthlyRate}}': formatCurrency(data.billing?.rate || 0),
      '{{billing.totalAmount}}': formatCurrency(getTotalAmount(data.billing)),
      '{{billing.paymentMethod}}': data.billing?.paymentMethod || 'Bank Transfer',
      '{{billing.paymentTerms}}': data.billing?.paymentTerms || 'Monthly, due at end of each month',
      '{{billing.deposit}}': formatCurrency((data.billing?.rate || 0) * 2),
      '{{billing.lateFee}}': data.billing?.lateFee || '5% per month',
      '{{billing.currency}}': 'PHP',
      '{{office.location}}': 'INSPIRE HOLDINGS INC., 6th Floor, Alliance Global Tower, BGC, Taguig',
      '{{office.amenities}}': 'High-speed internet, meeting rooms, reception services, cleaning services',
      '{{office.access}}': 'Monday to Friday, 9:00 AM to 6:00 PM',
      '{{system.companyName}}': 'INSPIRE HOLDINGS INC.',
      '{{system.legalName}}': 'INSPIRE HOLDINGS INC.',
      '{{system.companyAddress}}': '6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig',
      '{{system.registration}}': 'SEC Registration: CS200XXXXXX',
      '{{system.taxId}}': 'TIN: XXX-XXX-XXX-XXX',
      '{{date.today}}': currentDate,
      '{{date.signature}}': currentDate,
      '{{date.effective}}': startDate
    };
    
    let content = template;
    Object.entries(variables).forEach(([variable, value]) => {
      const regex = new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, value);
    });
    
    return content;
  };

  const convertTextToPDF = async (textContent) => {
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    
    const fontSize = 10;
    const margin = 50;
    const pageWidth = currentPage.getWidth() - (margin * 2);
    const pageHeight = currentPage.getHeight() - (margin * 2);
    
    const lines = textContent.split('\n');
    let yPosition = pageHeight + margin;
    
    for (const line of lines) {
      if (yPosition < margin + fontSize) {
        currentPage = pdfDoc.addPage();
        yPosition = currentPage.getHeight() - margin;
      }
      
      const wrappedLines = wrapText(line, font, fontSize, pageWidth);
      
      for (const wrappedLine of wrappedLines) {
        if (yPosition < margin + fontSize) {
          currentPage = pdfDoc.addPage();
          yPosition = currentPage.getHeight() - margin;
        }
        
        currentPage.drawText(wrappedLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= fontSize + 2;
      }
    }
    
    return await pdfDoc.save();
  };

  const wrapText = (text, font, fontSize, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const getSelectedSeats = (data) => {
    if (data.selectedSeats && data.selectedSeats.length > 0) {
      return Array.isArray(data.selectedSeats) ? data.selectedSeats.join(', ') : data.selectedSeats;
    }
    if (data.selectedPO && data.selectedPO.length > 0) {
      return Array.isArray(data.selectedPO) ? data.selectedPO.join(', ') : data.selectedPO;
    }
    if (data.virtualOfficeFeatures && data.virtualOfficeFeatures.length > 0) {
      return data.virtualOfficeFeatures.join(', ');
    }
    return 'As specified in agreement';
  };

  const getTotalMonthly = (billing) => {
    if (!billing) return 0;
    const rate = parseFloat(billing.rate) || 0;
    const cusaFee = parseFloat(billing.cusaFee) || 0;
    const parkingFee = parseFloat(billing.parkingFee) || 0;
    return rate + cusaFee + parkingFee;
  };

  const getTotalAmount = (billing) => {
    const monthly = getTotalMonthly(billing);
    const months = billing?.monthsToAvail || 12;
    return monthly * months;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const calculateEndDate = (startDate, months) => {
    if (!startDate || !months) return '';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end.toLocaleDateString();
  };

  const handleDownload = () => {
    if (!generatedContract) return;

    const fileName = `Contract_${tenantData.company || tenantData.name}_${new Date().toISOString().split('T')[0]}`;
    
    if (generatedContract.format === 'pdf') {
      const blob = new Blob([generatedContract.pdfBytes], { type: 'application/pdf' });
      downloadFile(blob, `${fileName}.pdf`);
    } else {
      const blob = new Blob([generatedContract.content], { type: 'text/plain' });
      downloadFile(blob, `${fileName}.txt`);
    }
  };

  const handlePreview = () => {
    if (!generatedContract) return;

    if (generatedContract.format === 'pdf') {
      const blob = new Blob([generatedContract.pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Contract Preview</title>
              <style>body { font-family: monospace; white-space: pre-wrap; padding: 20px; }</style>
            </head>
            <body>${generatedContract.content}</body>
          </html>
        `);
      }
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ContractIcon color="primary" />
          <Box>
            <Typography variant="h6">Generate Contract from Templates</Typography>
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
                  Template Options
                </Typography>
                
                {selectedTemplate && (
                  <Box>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedTemplate.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Source: {selectedTemplate.path}
                      </Typography>
                    </Paper>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Output Format:</Typography>
                      <ToggleButtonGroup
                        value={outputFormat}
                        exclusive
                        onChange={(e, newFormat) => newFormat && setOutputFormat(newFormat)}
                        size="small"
                        fullWidth
                      >
                        <ToggleButton value="text">
                          <TextIcon sx={{ mr: 1 }} />
                          Text
                        </ToggleButton>
                        <ToggleButton value="pdf">
                          <PdfIcon sx={{ mr: 1 }} />
                          PDF
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={generateContract}
                      disabled={processing}
                      fullWidth
                      startIcon={processing ? <RefreshIcon /> : <ContractIcon />}
                    >
                      {processing ? 'Generating...' : 'Generate Contract'}
                    </Button>

                    {processing && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          Loading template and replacing variables...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
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
                    label="Position"
                    value={tenantData.position || ''}
                    onChange={(e) => updateTenantData('position', e.target.value)}
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
                    InputProps={{ startAdornment: '₱' }}
                  />
                  
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
                  
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body2" color="primary">
                      Total Amount: {formatCurrency(getTotalAmount(tenantData.billing))}
                    </Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Generated Contract */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated Contract
                </Typography>
                
                {generatedContract ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                      Contract generated successfully!
                    </Alert>
                    
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        onClick={handlePreview}
                        startIcon={<PreviewIcon />}
                        fullWidth
                      >
                        Preview Contract
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={handleDownload}
                        startIcon={<DownloadIcon />}
                        fullWidth
                      >
                        Download Contract
                      </Button>
                    </Stack>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={generatedContract.templateName}
                          secondary="Template Used"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarIcon fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={new Date().toLocaleString()}
                          secondary="Generated At"
                        />
                      </ListItem>
                    </List>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <ContractIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate Contract" to create your contract
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
        <Button onClick={onClose}>Close</Button>
        {generatedContract && (
          <>
            <Button onClick={handlePreview} startIcon={<PreviewIcon />}>
              Preview
            </Button>
            <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
              Download
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PublicDocsContractGenerator;