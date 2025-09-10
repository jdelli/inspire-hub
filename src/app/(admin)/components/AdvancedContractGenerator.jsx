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
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Description as ContractIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const AdvancedContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [generatedContract, setGeneratedContract] = useState('');
  const [contractVariables, setContractVariables] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [outputFormat, setOutputFormat] = useState('text');
  const [customVariables, setCustomVariables] = useState({});

  // Enhanced template variables with more options
  const availableVariables = {
    // Tenant Information
    '{{tenant.name}}': 'Tenant Full Name',
    '{{tenant.company}}': 'Tenant Company',
    '{{tenant.email}}': 'Tenant Email',
    '{{tenant.phone}}': 'Tenant Phone',
    '{{tenant.address}}': 'Tenant Address',
    '{{tenant.position}}': 'Tenant Position/Title',
    '{{tenant.idNumber}}': 'Tenant ID Number',
    '{{tenant.taxId}}': 'Tax ID Number',
    
    // Contract Details
    '{{contract.startDate}}': 'Contract Start Date',
    '{{contract.endDate}}': 'Contract End Date',
    '{{contract.duration}}': 'Contract Duration',
    '{{contract.type}}': 'Contract Type',
    '{{contract.seats}}': 'Selected Seats/Offices',
    '{{contract.renewal}}': 'Renewal Terms',
    '{{contract.termination}}': 'Termination Notice',
    
    // Financial Information
    '{{billing.monthlyRate}}': 'Monthly Rate',
    '{{billing.totalAmount}}': 'Total Contract Amount',
    '{{billing.paymentMethod}}': 'Payment Method',
    '{{billing.deposit}}': 'Security Deposit',
    '{{billing.lateFee}}': 'Late Payment Fee',
    '{{billing.currency}}': 'Currency',
    '{{billing.paymentTerms}}': 'Payment Terms',
    
    // Office Information
    '{{office.location}}': 'Office Location',
    '{{office.floor}}': 'Floor Number',
    '{{office.area}}': 'Office Area',
    '{{office.amenities}}': 'Included Amenities',
    '{{office.access}}': 'Access Hours',
    '{{office.parking}}': 'Parking Information',
    
    // Dates
    '{{date.today}}': 'Current Date',
    '{{date.signature}}': 'Signature Date',
    '{{date.effective}}': 'Effective Date',
    '{{date.expiry}}': 'Expiry Date',
    
    // System Information
    '{{system.companyName}}': 'Your Company Name',
    '{{system.companyAddress}}': 'Your Company Address',
    '{{system.contactInfo}}': 'Your Contact Information',
    '{{system.legalName}}': 'Legal Company Name',
    '{{system.registration}}': 'Company Registration Number',
    '{{system.taxId}}': 'Company Tax ID'
  };

  useEffect(() => {
    if (open && tenant) {
      loadTemplates();
      initializeContractVariables();
    }
  }, [open, tenant]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Enhanced sample templates with more variables
      const sampleTemplates = [
        {
          id: '1',
          name: 'Standard Dedicated Desk Agreement',
          type: 'dedicated',
          format: 'text',
          content: `CONTRACT AGREEMENT

This agreement is made between {{system.companyName}} ({{system.legalName}}) and {{tenant.name}} ({{tenant.company}}) for the rental of dedicated desk space.

TENANT DETAILS:
Name: {{tenant.name}}
Position: {{tenant.position}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}
Address: {{tenant.address}}
ID Number: {{tenant.idNumber}}
Tax ID: {{tenant.taxId}}

CONTRACT TERMS:
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Duration: {{contract.duration}}
Monthly Rate: {{billing.monthlyRate}} {{billing.currency}}
Payment Method: {{billing.paymentMethod}}
Payment Terms: {{billing.paymentTerms}}
Security Deposit: {{billing.deposit}} {{billing.currency}}
Late Payment Fee: {{billing.lateFee}} {{billing.currency}}

SELECTED SEATS: {{contract.seats}}

OFFICE LOCATION: {{office.location}}
Floor: {{office.floor}}
Access Hours: {{office.access}}
Parking: {{office.parking}}

INCLUDED AMENITIES: {{office.amenities}}

RENEWAL TERMS: {{contract.renewal}}
TERMINATION NOTICE: {{contract.termination}}

This contract is effective from {{date.effective}} and will expire on {{contract.endDate}}.

Total Contract Value: {{billing.totalAmount}} {{billing.currency}}

Signature Date: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Tenant Signature                    Company Representative

Company Registration: {{system.registration}}
Tax ID: {{system.taxId}}`,
          isActive: true
        },
        {
          id: '2',
          name: 'Private Office Lease Agreement',
          type: 'private',
          format: 'text',
          content: `PRIVATE OFFICE LEASE AGREEMENT

This lease agreement is entered into between {{system.companyName}} ({{system.legalName}}) and {{tenant.name}} representing {{tenant.company}}.

TENANT INFORMATION:
Full Name: {{tenant.name}}
Position: {{tenant.position}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}
Business Address: {{tenant.address}}
ID Number: {{tenant.idNumber}}
Tax ID: {{tenant.taxId}}

LEASE DETAILS:
Office Type: {{contract.type}}
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Lease Duration: {{contract.duration}}
Monthly Rent: {{billing.monthlyRate}} {{billing.currency}}
Security Deposit: {{billing.deposit}} {{billing.currency}}
Payment Method: {{billing.paymentMethod}}
Payment Terms: {{billing.paymentTerms}}
Late Payment Fee: {{billing.lateFee}} {{billing.currency}}

OFFICE SPECIFICATIONS:
Location: {{office.location}}
Floor: {{office.floor}}
Area: {{office.area}}
Selected Offices: {{contract.seats}}
Access Hours: {{office.access}}
Parking: {{office.parking}}
Included Amenities: {{office.amenities}}

RENEWAL TERMS: {{contract.renewal}}
TERMINATION NOTICE: {{contract.termination}}

TERMS AND CONDITIONS:
This lease agreement is effective from {{date.effective}} and will terminate on {{contract.endDate}}.

Total Contract Value: {{billing.totalAmount}} {{billing.currency}}

Signed on: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Lessee                               Lessor

Company Registration: {{system.registration}}
Tax ID: {{system.taxId}}`,
          isActive: true
        },
        {
          id: '3',
          name: 'Virtual Office Service Agreement',
          type: 'virtual',
          format: 'text',
          content: `VIRTUAL OFFICE SERVICE AGREEMENT

This service agreement is entered into between {{system.companyName}} ({{system.legalName}}) and {{tenant.name}} representing {{tenant.company}}.

CLIENT INFORMATION:
Full Name: {{tenant.name}}
Position: {{tenant.position}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}
Business Address: {{tenant.address}}
ID Number: {{tenant.idNumber}}
Tax ID: {{tenant.taxId}}

SERVICE DETAILS:
Service Type: {{contract.type}}
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Service Duration: {{contract.duration}}
Monthly Fee: {{billing.monthlyRate}} {{billing.currency}}
Payment Method: {{billing.paymentMethod}}
Payment Terms: {{billing.paymentTerms}}
Security Deposit: {{billing.deposit}} {{billing.currency}}
Late Payment Fee: {{billing.lateFee}} {{billing.currency}}

VIRTUAL OFFICE FEATURES: {{contract.seats}}

SERVICE LOCATION: {{office.location}}
Access Hours: {{office.access}}
Included Services: {{office.amenities}}

RENEWAL TERMS: {{contract.renewal}}
TERMINATION NOTICE: {{contract.termination}}

TERMS AND CONDITIONS:
This service agreement is effective from {{date.effective}} and will terminate on {{contract.endDate}}.

Total Contract Value: {{billing.totalAmount}} {{billing.currency}}

Signed on: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Client                                Service Provider

Company Registration: {{system.registration}}
Tax ID: {{system.taxId}}`,
          isActive: true
        }
      ];

      setTemplates(sampleTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeContractVariables = () => {
    if (!tenant) return;

    const variables = {
      // Tenant Information
      '{{tenant.name}}': tenant.name || '',
      '{{tenant.company}}': tenant.company || '',
      '{{tenant.email}}': tenant.email || '',
      '{{tenant.phone}}': tenant.phone || '',
      '{{tenant.address}}': tenant.address || '',
      '{{tenant.position}}': tenant.position || 'Not specified',
      '{{tenant.idNumber}}': tenant.idNumber || 'Not provided',
      '{{tenant.taxId}}': tenant.taxId || 'Not provided',
      
      // Contract Details
      '{{contract.startDate}}': tenant.contractStartDate || new Date().toLocaleDateString(),
      '{{contract.endDate}}': tenant.contractEndDate || '',
      '{{contract.duration}}': tenant.contractDuration || '12 months',
      '{{contract.type}}': templateType,
      '{{contract.seats}}': tenant.selectedSeats ? 
        (Array.isArray(tenant.selectedSeats) ? tenant.selectedSeats.join(', ') : tenant.selectedSeats) :
        (tenant.selectedPO ? 
          (Array.isArray(tenant.selectedPO) ? tenant.selectedPO.join(', ') : tenant.selectedPO) :
          (tenant.virtualOfficeFeatures ? 
            (Array.isArray(tenant.virtualOfficeFeatures) ? tenant.virtualOfficeFeatures.join(', ') : tenant.virtualOfficeFeatures) :
            'Not specified')),
      '{{contract.renewal}}': 'Automatic renewal unless terminated with 30 days notice',
      '{{contract.termination}}': '30 days written notice required',
      
      // Financial Information
      '{{billing.monthlyRate}}': tenant.billing?.monthlyRate || '₱0.00',
      '{{billing.totalAmount}}': tenant.billing?.totalAmount || '₱0.00',
      '{{billing.paymentMethod}}': tenant.billing?.paymentMethod || 'Bank Transfer',
      '{{billing.deposit}}': tenant.billing?.deposit || '₱0.00',
      '{{billing.lateFee}}': '₱500.00',
      '{{billing.currency}}': 'PHP',
      '{{billing.paymentTerms}}': 'Payment due on the 1st of each month',
      
      // Office Information
      '{{office.location}}': 'Inspire Hub Office Space',
      '{{office.floor}}': 'Multiple Floors Available',
      '{{office.area}}': 'Various Sizes Available',
      '{{office.amenities}}': 'High-speed internet, meeting rooms, reception services, cleaning services, kitchen facilities',
      '{{office.access}}': '24/7 access with keycard',
      '{{office.parking}}': 'Parking spaces available (additional fee may apply)',
      
      // Dates
      '{{date.today}}': new Date().toLocaleDateString(),
      '{{date.signature}}': new Date().toLocaleDateString(),
      '{{date.effective}}': new Date().toLocaleDateString(),
      '{{date.expiry}}': tenant.contractEndDate || '',
      
      // System Information
      '{{system.companyName}}': 'Inspire Hub',
      '{{system.companyAddress}}': 'Your Company Address Here',
      '{{system.contactInfo}}': 'Contact: +63 XXX XXX XXXX | Email: info@inspirehub.com',
      '{{system.legalName}}': 'Inspire Hub Corporation',
      '{{system.registration}}': 'SEC Registration Number: 123456789',
      '{{system.taxId}}': 'TIN: 123-456-789-000'
    };

    setContractVariables(variables);
  };

  const generateContract = () => {
    if (!selectedTemplate) {
      setResult({
        type: 'error',
        message: 'Please select a template first.'
      });
      return;
    }

    try {
      let contractContent = selectedTemplate.content;
      
      // Replace all variables with actual values
      Object.keys(contractVariables).forEach(variable => {
        const value = contractVariables[variable] || variable;
        contractContent = contractContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      });
      
      // Replace custom variables
      Object.keys(customVariables).forEach(variable => {
        const value = customVariables[variable] || variable;
        contractContent = contractContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      });
      
      setGeneratedContract(contractContent);
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
    }
  };

  const downloadContract = () => {
    if (!generatedContract) {
      setResult({
        type: 'error',
        message: 'Please generate a contract first.'
      });
      return;
    }

    try {
      let blob;
      let filename;
      let mimeType;

      switch (outputFormat) {
        case 'pdf':
          // For PDF generation, you would use a library like jsPDF or html2pdf
          // This is a placeholder - you'd need to implement actual PDF generation
          blob = new Blob([generatedContract], { type: 'text/plain' });
          filename = `Contract_${tenant.name}_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'word':
          // For Word generation, you would use a library like docx
          // This is a placeholder - you'd need to implement actual Word generation
          blob = new Blob([generatedContract], { type: 'text/plain' });
          filename = `Contract_${tenant.name}_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        default:
          blob = new Blob([generatedContract], { type: 'text/plain' });
          filename = `Contract_${tenant.name}_${new Date().toISOString().split('T')[0]}.txt`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
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

  const updateVariable = (variable, value) => {
    setContractVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const addCustomVariable = () => {
    const newVariable = `{{custom.${Date.now()}}}`;
    setCustomVariables(prev => ({
      ...prev,
      [newVariable]: ''
    }));
  };

  const removeCustomVariable = (variable) => {
    setCustomVariables(prev => {
      const newVars = { ...prev };
      delete newVars[variable];
      return newVars;
    });
  };

  const updateCustomVariable = (variable, value) => {
    setCustomVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const getVariableValue = (variable) => {
    return contractVariables[variable] || customVariables[variable] || '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ContractIcon />
            Advanced Contract Generator - {tenant?.name}
          </Box>
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                label="Output Format"
              >
                <MenuItem value="text">Text File</MenuItem>
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="word">Word Document</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Template Selection" />
            <Tab label="Variable Editor" />
            <Tab label="Contract Preview" />
            <Tab label="Custom Variables" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Select Template
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Contract Template</InputLabel>
                    <Select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        setSelectedTemplate(template);
                      }}
                      label="Contract Template"
                    >
                      {templates
                        .filter(t => t.type === templateType)
                        .map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            <Box>
                              <Typography variant="body1">{template.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {template.type} • {template.format}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  
                  {selectedTemplate && (
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        onClick={generateContract}
                        fullWidth
                        startIcon={<RefreshIcon />}
                      >
                        Generate Contract
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template Preview
                  </Typography>
                  {selectedTemplate ? (
                    <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        lineHeight: 1.4
                      }}>
                        {selectedTemplate.content.substring(0, 500)}...
                      </pre>
                    </Paper>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <ContractIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Select a template to preview
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edit Variables
              </Typography>
              <Box maxHeight={400} overflow="auto">
                <Grid container spacing={2}>
                  {Object.entries(availableVariables).map(([variable, label]) => (
                    <Grid item xs={12} sm={6} md={4} key={variable}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={getVariableValue(variable)}
                          onChange={(e) => updateVariable(variable, e.target.value)}
                          placeholder={variable}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Contract Preview
                </Typography>
                <Box>
                  <Tooltip title="Toggle Preview Mode">
                    <IconButton
                      onClick={() => setPreviewMode(!previewMode)}
                      color={previewMode ? 'primary' : 'default'}
                    >
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  {generatedContract && (
                    <Tooltip title="Download Contract">
                      <IconButton onClick={downloadContract} color="primary">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              
              {generatedContract ? (
                <Paper 
                  sx={{ 
                    p: 2, 
                    minHeight: 400, 
                    maxHeight: 500, 
                    overflow: 'auto',
                    backgroundColor: previewMode ? 'background.paper' : 'grey.50'
                  }}
                >
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}>
                    {generatedContract}
                  </pre>
                </Paper>
              ) : (
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  minHeight={400}
                  textAlign="center"
                >
                  <Box>
                    <ContractIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Select a template and click "Generate Contract" to preview
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Custom Variables
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addCustomVariable}
                  size="small"
                >
                  Add Variable
                </Button>
              </Box>
              
              <Box maxHeight={400} overflow="auto">
                <Stack spacing={2}>
                  {Object.entries(customVariables).map(([variable, value]) => (
                    <Box key={variable} display="flex" alignItems="center" gap={2}>
                      <TextField
                        label="Variable Name"
                        value={variable}
                        size="small"
                        sx={{ flex: 1 }}
                        disabled
                      />
                      <TextField
                        label="Value"
                        value={value}
                        onChange={(e) => updateCustomVariable(variable, e.target.value)}
                        size="small"
                        sx={{ flex: 2 }}
                      />
                      <IconButton
                        onClick={() => removeCustomVariable(variable)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  {Object.keys(customVariables).length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="text.secondary">
                        No custom variables added yet. Click "Add Variable" to create one.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        )}

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
        {generatedContract && (
          <Button
            onClick={downloadContract}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Download Contract
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedContractGenerator;

