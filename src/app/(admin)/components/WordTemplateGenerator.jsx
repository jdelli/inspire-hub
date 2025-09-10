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
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Description as ContractIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Folder as FolderIcon,
  FileText as FileIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

const WordTemplateGenerator = ({ open, onClose, tenant, templateType = 'dedicated' }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contractVariables, setContractVariables] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [availableVariables, setAvailableVariables] = useState({});
  const [templatePreview, setTemplatePreview] = useState('');

  // Available template variables
  const defaultVariables = {
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
  }, [open, tenant, templateType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load available templates from public/docs folder
      const templateList = [
        {
          id: 'contract-template-001',
          name: 'Standard Contract Template',
          type: 'general',
          file: 'contract_template.docx',
          description: 'Professional contract template with dynamic fields',
          version: '1.0',
          lastModified: '2024-01-15',
          isActive: true,
          format: 'docx'
        }
      ];

      setTemplates(templateList);
      setAvailableVariables(defaultVariables);
      
      // Auto-select first template if available
      if (templateList.length > 0) {
        setSelectedTemplate(templateList[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setResult({
        type: 'error',
        message: 'Failed to load contract templates.'
      });
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

  const generateWordDocument = async () => {
    if (!selectedTemplate) {
      setResult({
        type: 'error',
        message: 'Please select a template first.'
      });
      return;
    }

    setGenerating(true);
    try {
      // This is a simplified version - in a real implementation, you would:
      // 1. Load the Word template from public/docs
      // 2. Use a library like 'docx' or 'mammoth' to process the document
      // 3. Replace variables with actual values
      // 4. Generate a new document

      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      // In a real implementation, you would use something like:
      /*
      const templatePath = `/docs/${selectedTemplate.file}`;
      const response = await fetch(templatePath);
      const templateBuffer = await response.arrayBuffer();
      
      // Process the Word document
      const doc = new Document(templateBuffer);
      
      // Replace variables
      Object.keys(contractVariables).forEach(variable => {
        const value = contractVariables[variable] || variable;
        doc.replaceText(variable, value);
      });
      
      // Generate new document
      const newDoc = doc.generate();
      */

      setResult({
        type: 'success',
        message: 'Word document generated successfully! (Note: This requires backend implementation for full functionality)'
      });

    } catch (error) {
      console.error('Error generating Word document:', error);
      setResult({
        type: 'error',
        message: `Error generating document: ${error.message}`
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadDocument = () => {
    if (!selectedTemplate) {
      setResult({
        type: 'error',
        message: 'Please select a template first.'
      });
      return;
    }

    try {
      // Create a simple text representation for now
      // In a real implementation, this would be the actual Word document
      const documentContent = `CONTRACT GENERATED FROM TEMPLATE: ${selectedTemplate.name}

TENANT: ${contractVariables['{{tenant.name}}']}
COMPANY: ${contractVariables['{{tenant.company}}']}
EMAIL: ${contractVariables['{{tenant.email}}']}
PHONE: ${contractVariables['{{tenant.phone}}']}

CONTRACT TYPE: ${contractVariables['{{contract.type}}']}
START DATE: ${contractVariables['{{contract.startDate}}']}
END DATE: ${contractVariables['{{contract.endDate}}']}
MONTHLY RATE: ${contractVariables['{{billing.monthlyRate}}']}

Generated on: ${new Date().toLocaleString()}`;

      const blob = new Blob([documentContent], { type: 'text/plain' });
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
        message: 'Document downloaded successfully!'
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      setResult({
        type: 'error',
        message: `Error downloading document: ${error.message}`
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

  const getVariableDescription = (variable) => {
    return availableVariables[variable] || variable;
  };

  const previewTemplate = () => {
    if (!selectedTemplate) return;

    // Create a preview of what the document would look like
    const preview = `TEMPLATE PREVIEW: ${selectedTemplate.name}

This is a preview of how the variables would be populated:

TENANT INFORMATION:
Name: ${contractVariables['{{tenant.name}}']}
Company: ${contractVariables['{{tenant.company}}']}
Email: ${contractVariables['{{tenant.email}}']}
Phone: ${contractVariables['{{tenant.phone}}']}

CONTRACT DETAILS:
Type: ${contractVariables['{{contract.type}}']}
Start Date: ${contractVariables['{{contract.startDate}}']}
End Date: ${contractVariables['{{contract.endDate}}']}
Monthly Rate: ${contractVariables['{{billing.monthlyRate}}']}

OFFICE INFORMATION:
Location: ${contractVariables['{{office.location}}']}
Amenities: ${contractVariables['{{office.amenities}}']}

Note: This is a text preview. The actual Word document will maintain its original formatting.`;

    setTemplatePreview(preview);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WordIcon />
          Word Template Generator - {tenant?.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Template Selection" />
            <Tab label="Variable Editor" />
            <Tab label="Document Preview" />
            <Tab label="Implementation Guide" />
          </Tabs>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {activeTab === 0 && !loading && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Templates
                  </Typography>
                  
                  {templates.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No templates found
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {templates.map((template) => (
                        <ListItem
                          key={template.id}
                          button
                          selected={selectedTemplate?.id === template.id}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <ListItemIcon>
                            <WordIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={template.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {template.description}
                                </Typography>
                                <Box display="flex" gap={1} mt={0.5}>
                                  <Chip label={template.format.toUpperCase()} size="small" />
                                  <Chip label={`v${template.version}`} size="small" />
                                  {template.isActive && (
                                    <Chip label="ACTIVE" color="success" size="small" />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  {selectedTemplate && (
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        onClick={generateWordDocument}
                        fullWidth
                        disabled={generating}
                        startIcon={generating ? <CircularProgress size={20} /> : <RefreshIcon />}
                      >
                        {generating ? 'Generating...' : 'Generate Word Document'}
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
                    Template Information
                  </Typography>
                  
                  {selectedTemplate ? (
                    <Box>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {selectedTemplate.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedTemplate.description}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            File Type
                          </Typography>
                          <Typography variant="body2">
                            {selectedTemplate.format.toUpperCase()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Version
                          </Typography>
                          <Typography variant="body2">
                            {selectedTemplate.version}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Last Modified
                          </Typography>
                          <Typography variant="body2">
                            {selectedTemplate.lastModified}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="body2">
                            {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <WordIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Select a template to view details
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && !loading && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edit Variables
              </Typography>
              <Box maxHeight={400} overflow="auto">
                <Grid container spacing={2}>
                  {Object.keys(contractVariables).map((variable) => (
                    <Grid item xs={12} sm={6} md={4} key={variable}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {getVariableDescription(variable)}
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

        {activeTab === 2 && !loading && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Document Preview
                </Typography>
                <Box>
                  <Button
                    onClick={previewTemplate}
                    startIcon={<PreviewIcon />}
                    size="small"
                  >
                    Generate Preview
                  </Button>
                  {templatePreview && (
                    <Button
                      onClick={downloadDocument}
                      startIcon={<DownloadIcon />}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      Download
                    </Button>
                  )}
                </Box>
              </Box>
              
              {templatePreview ? (
                <Paper 
                  sx={{ 
                    p: 2, 
                    minHeight: 400, 
                    maxHeight: 500, 
                    overflow: 'auto',
                    backgroundColor: 'grey.50'
                  }}
                >
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}>
                    {templatePreview}
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
                    <PreviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate Preview" to see how the document will look
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
              <Typography variant="h6" gutterBottom>
                Implementation Guide for Word Document Processing
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>
                  To fully implement Word document processing, you'll need:
                </Typography>
                
                <Box component="ol" sx={{ pl: 2 }}>
                  <li>
                    <Typography variant="body2" gutterBottom>
                      <strong>Backend API:</strong> Create an API endpoint to process Word documents
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" gutterBottom>
                      <strong>Word Processing Library:</strong> Use libraries like:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li><code>docx</code> - For creating Word documents</li>
                      <li><code>mammoth</code> - For reading Word documents</li>
                      <li><code>officegen</code> - For generating Office documents</li>
                    </Box>
                  </li>
                  <li>
                    <Typography variant="body2" gutterBottom>
                      <strong>Template Processing:</strong> Replace variables in the Word template
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" gutterBottom>
                      <strong>File Generation:</strong> Generate new Word document with populated data
                    </Typography>
                  </li>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Example Backend Implementation (Node.js):
                </Typography>
                
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <pre style={{ fontSize: '0.75rem', margin: 0 }}>
{`// Install required packages:
// npm install docx mammoth express multer

const express = require('express');
const multer = require('multer');
const { Document, Packer } = require('docx');
const mammoth = require('mammoth');

app.post('/api/generate-contract', async (req, res) => {
  try {
    // Load template
    const templatePath = './public/docs/contract_template.docx';
    const templateBuffer = fs.readFileSync(templatePath);
    
    // Extract text from template
    const result = await mammoth.extractRawText({ buffer: templateBuffer });
    let documentText = result.value;
    
    // Replace variables
    Object.keys(req.body.variables).forEach(variable => {
      const value = req.body.variables[variable] || variable;
      documentText = documentText.replace(new RegExp(variable, 'g'), value);
    });
    
    // Create new document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(documentText)]
          })
        ]
      }]
    });
    
    // Generate and send document
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=contract.docx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`}
                  </pre>
                </Paper>

                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Frontend Integration:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
{`const generateWordDocument = async () => {
  try {
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: contractVariables })
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contract.docx';
    link.click();
  } catch (error) {
    console.error('Error generating document:', error);
  }
};`}
                    </pre>
                  </Paper>
                </Box>
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
        {selectedTemplate && (
          <Button
            onClick={downloadDocument}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Download Document
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WordTemplateGenerator;
