import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import {
  BugReport as DebugIcon,
  Description as TemplateIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { contractGeneratorDocx } from '../utils/contractGenerator';

const DOCXTemplateDebugger = ({ open, onClose, tenantData }) => {
  const [templateData, setTemplateData] = useState(null);
  const [templateVariables, setTemplateVariables] = useState([]);

  useEffect(() => {
    if (open && tenantData) {
      try {
        const data = contractGeneratorDocx.prepareTemplateData(tenantData);
        setTemplateData(data);
        
        // Extract all variables for display
        const variables = Object.entries(data).map(([key, value]) => ({
          name: key,
          value: value,
          placeholder: `{{${key}}}`
        }));
        setTemplateVariables(variables);
      } catch (error) {
        console.error('Error preparing template data:', error);
      }
    }
  }, [open, tenantData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generateTemplateExample = () => {
    if (!templateData) return '';
    
    return `CONTRACT OF LEASE

This agreement is made between {{companyName}} and {{tenantName}} ({{tenantCompany}}).

TENANT DETAILS:
Name: {{tenantName}}
Company: {{tenantCompany}}
Email: {{tenantEmail}}
Phone: {{tenantPhone}}
Address: {{tenantAddress}}

CONTRACT TERMS:
Start Date: {{contractStartDate}}
End Date: {{contractEndDate}}
Monthly Rent: {{monthlyRent}}
CUSA Fee: {{cusa}}
Parking Fee: {{parkingFee}}

FINANCIAL TERMS:
Security Deposit: {{securityDeposit}}
Advance Rental: {{advanceRental}}
Total Initial Payment: {{totalInitialPayment}}

Contract Date: {{contractDate}}
Payment Due Date: {{paymentDueDate}}

Company: {{companyName}}
Address: {{companyAddress}}
Representative: {{representativeName}}
Title: {{representativeTitle}}

Year: {{currentYear}}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DebugIcon />
          DOCX Template Debugger
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This tool shows you what variables are available for your Word template and provides an example of how to use them.
          </Typography>
        </Alert>

        {!tenantData ? (
          <Alert severity="warning">
            No tenant data provided. Please select a tenant first.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Available Variables */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Template Variables
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Use these variables in your Word template:
                  </Typography>
                  
                  <Box maxHeight={400} overflow="auto">
                    {templateVariables.map((variable, index) => (
                      <Box key={index} mb={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Chip 
                            label={variable.placeholder} 
                            size="small" 
                            color="primary"
                            onClick={() => copyToClipboard(variable.placeholder)}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {variable.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          Value: {variable.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Template Example */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template Example
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Example of how to use variables in your Word template:
                  </Typography>
                  
                  <Paper 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      {generateTemplateExample()}
                    </pre>
                  </Paper>
                  
                  <Box mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => copyToClipboard(generateTemplateExample())}
                    >
                      Copy Example Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Instructions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    How to Fix Your Word Template
                  </Typography>
                  
                  <Box component="ol" sx={{ pl: 2 }}>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        <strong>Open your Word template:</strong> Open <code>public/docs/contract_template.docx</code>
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        <strong>Add variables:</strong> Replace static text with variables like <code>{'{{tenantName}}'}</code>, <code>{'{{tenantCompany}}'}</code>, etc.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        <strong>Use the example:</strong> Copy the template example above and paste it into your Word document
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" gutterBottom>
                        <strong>Test the generation:</strong> Try generating a contract to see if the variables are replaced
                      </Typography>
                    </li>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Important:</strong> Make sure your Word template uses the exact variable names shown above. 
                      Variables are case-sensitive and must be wrapped in double curly braces.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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

export default DOCXTemplateDebugger;
