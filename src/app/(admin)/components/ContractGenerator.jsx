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
  Paper
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { storage } from '../../../../script/firebaseConfig';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

const ContractGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [generatedContract, setGeneratedContract] = useState('');
  const [contractVariables, setContractVariables] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [result, setResult] = useState(null);

  // Available template variables
  const availableVariables = {
    // Tenant Information
    '{{tenant.name}}': 'Tenant Full Name',
    '{{tenant.company}}': 'Tenant Company',
    '{{tenant.email}}': 'Tenant Email',
    '{{tenant.phone}}': 'Tenant Phone',
    '{{tenant.address}}': 'Tenant Address',
    
    // Contract Details
    '{{contract.startDate}}': 'Contract Start Date',
    '{{contract.endDate}}': 'Contract End Date',
    '{{contract.duration}}': 'Contract Duration',
    '{{contract.type}}': 'Contract Type',
    '{{contract.seats}}': 'Selected Seats/Offices',
    
    // Financial Information
    '{{billing.monthlyRate}}': 'Monthly Rate',
    '{{billing.totalAmount}}': 'Total Contract Amount',
    '{{billing.paymentMethod}}': 'Payment Method',
    '{{billing.deposit}}': 'Security Deposit',
    
    // Office Information
    '{{office.location}}': 'Office Location',
    '{{office.floor}}': 'Floor Number',
    '{{office.area}}': 'Office Area',
    '{{office.amenities}}': 'Included Amenities',
    
    // Dates
    '{{date.today}}': 'Current Date',
    '{{date.signature}}': 'Signature Date',
    '{{date.effective}}': 'Effective Date',
    
    // System Information
    '{{system.companyName}}': 'Your Company Name',
    '{{system.companyAddress}}': 'Your Company Address',
    '{{system.contactInfo}}': 'Your Contact Information'
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
      // Load templates from storage (you can modify this based on your storage method)
      const templatesList = [];
      
      // For now, we'll create some sample templates
      // In real implementation, load from your storage system
      const sampleTemplates = [
        {
          id: '1',
          name: 'Standard Dedicated Desk Agreement',
          type: 'dedicated',
          content: `CONTRACT AGREEMENT

This agreement is made between {{system.companyName}} and {{tenant.name}} ({{tenant.company}}) for the rental of dedicated desk space.

TENANT DETAILS:
Name: {{tenant.name}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}
Address: {{tenant.address}}

CONTRACT TERMS:
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Duration: {{contract.duration}}
Monthly Rate: {{billing.monthlyRate}}
Payment Method: {{billing.paymentMethod}}

SELECTED SEATS: {{contract.seats}}

OFFICE LOCATION: {{office.location}}

This contract is effective from {{date.effective}} and will expire on {{contract.endDate}}.

Signature Date: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Tenant Signature                    Company Representative`,
          isActive: true
        },
        {
          id: '2',
          name: 'Private Office Lease Agreement',
          type: 'private',
          content: `PRIVATE OFFICE LEASE AGREEMENT

This lease agreement is entered into between {{system.companyName}} and {{tenant.name}} representing {{tenant.company}}.

TENANT INFORMATION:
Full Name: {{tenant.name}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}
Business Address: {{tenant.address}}

LEASE DETAILS:
Office Type: {{contract.type}}
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Lease Duration: {{contract.duration}}
Monthly Rent: {{billing.monthlyRate}}
Security Deposit: {{billing.deposit}}
Payment Method: {{billing.paymentMethod}}

OFFICE SPECIFICATIONS:
Location: {{office.location}}
Floor: {{office.floor}}
Area: {{office.area}}
Selected Offices: {{contract.seats}}
Included Amenities: {{office.amenities}}

TERMS AND CONDITIONS:
This lease agreement is effective from {{date.effective}} and will terminate on {{contract.endDate}}.

Total Contract Value: {{billing.totalAmount}}

Signed on: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Lessee                               Lessor`,
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
      
      // Contract Details
      '{{contract.startDate}}': tenant.contractStartDate || new Date().toLocaleDateString(),
      '{{contract.endDate}}': tenant.contractEndDate || '',
      '{{contract.duration}}': tenant.contractDuration || '12 months',
      '{{contract.type}}': templateType,
      '{{contract.seats}}': tenant.selectedSeats ? 
        (Array.isArray(tenant.selectedSeats) ? tenant.selectedSeats.join(', ') : tenant.selectedSeats) :
        (tenant.selectedPO ? 
          (Array.isArray(tenant.selectedPO) ? tenant.selectedPO.join(', ') : tenant.selectedPO) :
          'Not specified'),
      
      // Financial Information
      '{{billing.monthlyRate}}': tenant.billing?.monthlyRate || '₱0.00',
      '{{billing.totalAmount}}': tenant.billing?.totalAmount || '₱0.00',
      '{{billing.paymentMethod}}': tenant.billing?.paymentMethod || 'Not specified',
      '{{billing.deposit}}': tenant.billing?.deposit || '₱0.00',
      
      // Office Information
      '{{office.location}}': 'Inspire Hub Office Space',
      '{{office.floor}}': 'Multiple Floors Available',
      '{{office.area}}': 'Various Sizes Available',
      '{{office.amenities}}': 'High-speed internet, meeting rooms, reception services, cleaning services',
      
      // Dates
      '{{date.today}}': new Date().toLocaleDateString(),
      '{{date.signature}}': new Date().toLocaleDateString(),
      '{{date.effective}}': new Date().toLocaleDateString(),
      
      // System Information
      '{{system.companyName}}': 'Inspire Hub',
      '{{system.companyAddress}}': 'Your Company Address Here',
      '{{system.contactInfo}}': 'Contact: +63 XXX XXX XXXX | Email: info@inspirehub.com'
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
      const blob = new Blob([generatedContract], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contract_${tenant.name}_${new Date().toISOString().split('T')[0]}.txt`;
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

  const getVariableValue = (variable) => {
    return contractVariables[variable] || '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ContractIcon />
          Generate Contract for {tenant?.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Template Selection */}
          <Grid item xs={12} md={4}>
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
                          {template.name}
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

            {/* Variable Editor */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Edit Variables
                </Typography>
                <Box maxHeight={300} overflow="auto">
                  <Stack spacing={2}>
                    {Object.entries(availableVariables).map(([variable, label]) => (
                      <Box key={variable}>
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
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Contract Preview */}
          <Grid item xs={12} md={8}>
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

export default ContractGenerator;

