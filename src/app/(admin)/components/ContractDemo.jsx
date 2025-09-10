"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  Description as ContractIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import ContractTemplate from './ContractTemplate';
import { mapTenantToContractData, validateTenantForContract } from '../utils/contractDataMapper';

const ContractDemo = () => {
  // Sample tenant data for demonstration
  const sampleTenants = [
    {
      id: '1',
      name: 'John Doe',
      company: 'Tech Solutions Inc.',
      email: 'john.doe@techsolutions.com',
      phone: '+63 917 123 4567',
      address: '123 Business Avenue, Makati City, Philippines',
      type: 'dedicated',
      selectedSeats: ['A1', 'A2'],
      billing: {
        rate: 5000,
        cusaFee: 500,
        parkingFee: 300,
        startDate: '2024-01-01',
        monthsToAvail: 12,
        paymentMethod: 'Bank Transfer'
      }
    },
    {
      id: '2',
      name: 'Maria Santos',
      company: 'Creative Agency Co.',
      email: 'maria@creativeagency.com',
      phone: '+63 917 987 6543',
      address: '456 Creative Street, BGC, Taguig City',
      type: 'private',
      selectedPO: ['Office 201', 'Office 202'],
      billing: {
        rate: 15000,
        cusaFee: 1000,
        parkingFee: 500,
        startDate: '2024-02-01',
        monthsToAvail: 6,
        paymentMethod: 'Credit Card'
      }
    },
    {
      id: '3',
      name: 'Robert Chen',
      company: 'Digital Marketing Pro',
      email: 'robert@digitalmarketing.com',
      phone: '+63 917 555 1234',
      address: '789 Digital Plaza, Ortigas Center',
      type: 'virtual',
      virtualOfficeFeatures: ['Mail Handling', 'Phone Answering', 'Meeting Room Access'],
      billing: {
        rate: 3000,
        cusaFee: 200,
        parkingFee: 0,
        startDate: '2024-03-01',
        monthsToAvail: 24,
        paymentMethod: 'Bank Transfer'
      }
    }
  ];

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [contractData, setContractData] = useState({});
  const [validation, setValidation] = useState({ isValid: true, message: '' });

  // Simplified PDF generation function
  const generateContractPDF = async (contractData, tenantData) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPos = 30;
      const leftMargin = 20;
      const lineHeight = 7;
      
      // Set default font
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont('times', 'bold');
      pdf.text('INSPIRE', 105, yPos, { align: 'center' });
      yPos += 10;
      
      pdf.setFontSize(16);
      pdf.text('CONTRACT OF LEASE', 105, yPos, { align: 'center' });
      yPos += 20;
      
      // Reset to normal
      pdf.setFontSize(12);
      pdf.setFont('times', 'normal');
      
      // Opening
      pdf.setFont('times', 'bold');
      pdf.text('KNOW ALL MEN BY THESE PRESENTS:', 105, yPos, { align: 'center' });
      yPos += 15;
      
      pdf.setFont('times', 'normal');
      const contractDate = new Date().toLocaleDateString();
      pdf.text(`This Contract of Lease is made and executed this ${contractDate}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text('in Taguig City by and between:', leftMargin, yPos);
      yPos += 15;
      
      // LESSOR
      pdf.text('INSPIRE HOLDINGS INC., a corporation duly organized and existing', leftMargin, yPos);
      yPos += lineHeight;
      pdf.text('under the laws of the Republic of the Philippines, represented by', leftMargin, yPos);
      yPos += lineHeight;
      pdf.text('PATRICK PEREZ, herein referred to as the "LESSOR";', leftMargin, yPos);
      yPos += 15;
      
      // -and-
      pdf.setFont('times', 'bold');
      pdf.text('-and-', 105, yPos, { align: 'center' });
      yPos += 10;
      
      // LESSEE
      pdf.setFont('times', 'normal');
      const clientName = contractData.clientName || tenantData?.name || 'CLIENT_NAME';
      const clientAddress = contractData.clientAddress || tenantData?.address || 'CLIENT_ADDRESS';
      pdf.text(`${clientName}, of legal age, with present residential`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`address at ${clientAddress},`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text('herein referred to as the "LESSEE";', leftMargin, yPos);
      yPos += 20;
      
      // Key Terms
      pdf.setFont('times', 'bold');
      pdf.text('KEY TERMS:', leftMargin, yPos);
      yPos += 10;
      
      pdf.setFont('times', 'normal');
      const terms = [
        '1. TERM: One (1) year lease period with renewal option',
        '2. MONTHLY RENT: PHP 20,000.00 (excluding VAT)',
        '3. CUSA FEE: PHP 1,500.00',
        '4. SECURITY DEPOSIT: PHP 40,000.00',
        '5. ADVANCE RENTAL: Two (2) months'
      ];
      
      terms.forEach(term => {
        pdf.text(term, leftMargin, yPos);
        yPos += lineHeight + 2;
      });
      
      yPos += 10;
      
      // Services
      pdf.setFont('times', 'bold');
      pdf.text('PROVIDED SERVICES:', leftMargin, yPos);
      yPos += 8;
      
      pdf.setFont('times', 'normal');
      const services = [
        '• Workspace (shared, private, meeting room)',
        '• Internet Access (WiFi)',
        '• Electrical Outlets',
        '• Common Areas (Kitchen, Restroom, Lounge)',
        '• Mail Handling',
        '• Janitorial Services'
      ];
      
      services.forEach(service => {
        pdf.text(service, leftMargin, yPos);
        yPos += lineHeight;
      });
      
      yPos += 20;
      
      // Signature section
      pdf.setFont('times', 'bold');
      pdf.text('IN WITNESS WHEREOF', 105, yPos, { align: 'center' });
      yPos += 5;
      pdf.setFont('times', 'normal');
      pdf.text('the parties have set their hands:', 105, yPos, { align: 'center' });
      yPos += 30;
      
      // Signature lines
      pdf.line(30, yPos, 80, yPos);
      pdf.line(130, yPos, 180, yPos);
      pdf.text('LESSOR', 55, yPos + 10, { align: 'center' });
      pdf.text('LESSEE', 155, yPos + 10, { align: 'center' });
      
      // Generate filename
      const fileName = `Contract_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save PDF
      pdf.save(fileName);
      
      console.log('PDF generated successfully');
      return true;
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF generation failed. Please try again.');
      return false;
    }
  };
  
  // Print function
  const printContract = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the contract.');
        return;
      }
      
      const clientName = contractData.clientName || selectedTenant?.name || 'CLIENT_NAME';
      const clientAddress = contractData.clientAddress || selectedTenant?.address || 'CLIENT_ADDRESS';
      const contractDate = new Date().toLocaleDateString();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contract of Lease - ${clientName}</title>
          <style>
            @page { size: A4; margin: 1in; }
            body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.6; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .signature-section { margin-top: 50px; }
            .signature-line { border-bottom: 1px solid black; width: 200px; display: inline-block; margin: 0 50px; }
            .signature-label { text-align: center; margin-top: 10px; font-weight: bold; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">🖨️ Print</button>
          
          <div class="header">
            <div class="title">INSPIRE</div>
            <div class="subtitle">CONTRACT OF LEASE</div>
          </div>
          
          <div class="section center">
            <div class="bold">KNOW ALL MEN BY THESE PRESENTS:</div>
          </div>
          
          <div class="section">
            <p>This Contract of Lease is made and executed this <u>${contractDate}</u> in Taguig City by and between:</p>
          </div>
          
          <div class="section">
            <p><span class="bold">INSPIRE HOLDINGS INC.</span>, a corporation duly organized and existing under the laws of the Republic of the Philippines with principal office at 6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig, represented by its Chief Executive Officer, <span class="bold">PATRICK PEREZ</span>, herein referred to as the <span class="bold">"LESSOR"</span>;</p>
          </div>
          
          <div class="section center">
            <div class="bold">-and-</div>
          </div>
          
          <div class="section">
            <p><u>${clientName}</u>, of legal age, with present residential address at <u>${clientAddress}</u>, herein referred to as the <span class="bold">"LESSEE"</span>;</p>
          </div>
          
          <div class="section">
            <div class="bold center">WITNESSETH:</div>
            <p><span class="bold">WHEREAS</span>, the LESSOR has offered to transfer to the LESSEE the physical possession uses under the concept of one (1) designated desk/cubicle area managed by the LESSOR at Alliance Global Tower;</p>
            <p><span class="bold">WHEREAS</span>, the LESSEE desires to lease the Leased Premise, and the LESSOR is willing to lease unto the LESSEE under the terms and conditions set forth below;</p>
          </div>
          
          <div class="section">
            <div class="bold">KEY TERMS:</div>
            <ul>
              <li><span class="bold">TERM:</span> One (1) year lease period with renewal option</li>
              <li><span class="bold">MONTHLY RENT:</span> PHP 20,000.00 (excluding VAT)</li>
              <li><span class="bold">CUSA FEE:</span> PHP 1,500.00</li>
              <li><span class="bold">SECURITY DEPOSIT:</span> PHP 40,000.00</li>
              <li><span class="bold">ADVANCE RENTAL:</span> Two (2) months</li>
            </ul>
          </div>
          
          <div class="section">
            <div class="bold">PROVIDED SERVICES:</div>
            <ul>
              <li>Workspace (shared, private, meeting room)</li>
              <li>Internet Access (WiFi)</li>
              <li>Electrical Outlets</li>
              <li>Common Areas (Kitchen, Restroom, Lounge)</li>
              <li>Mail Handling</li>
              <li>Janitorial Services</li>
            </ul>
          </div>
          
          <div class="signature-section">
            <div class="center bold">IN WITNESS WHEREOF</div>
            <p class="center">the parties have set their hands on the date and at the place above-written.</p>
            
            <div style="display: flex; justify-content: space-around; margin-top: 50px;">
              <div style="text-align: center;">
                <div class="signature-line"></div>
                <div class="signature-label">LESSOR</div>
              </div>
              <div style="text-align: center;">
                <div class="signature-line"></div>
                <div class="signature-label">LESSEE</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-print after a delay
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      return true;
    } catch (error) {
      console.error('Print Error:', error);
      alert('Print failed. Please try again.');
      return false;
    }
  };

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    
    // Map tenant data to contract format
    const mappedData = mapTenantToContractData(tenant, tenant.type);
    setContractData(mappedData);
    
    // Validate tenant data
    const validationResult = validateTenantForContract(tenant);
    setValidation(validationResult);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getTotalMonthly = (tenant) => {
    const rate = parseFloat(tenant.billing?.rate) || 0;
    const cusaFee = parseFloat(tenant.billing?.cusaFee) || 0;
    const parkingFee = parseFloat(tenant.billing?.parkingFee) || 0;
    return rate + cusaFee + parkingFee;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Template Integration Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This demo shows how the ContractTemplate component integrates with tenant data from the Tenants component.
        Select a tenant below to see how their data is mapped to the contract template.
      </Typography>

      <Grid container spacing={3}>
        {/* Tenant Selection */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Sample Tenants
              </Typography>
              
              <Stack spacing={2}>
                {sampleTenants.map((tenant) => (
                  <Paper
                    key={tenant.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedTenant?.id === tenant.id ? '2px solid' : '1px solid',
                      borderColor: selectedTenant?.id === tenant.id ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50'
                      }
                    }}
                    onClick={() => handleSelectTenant(tenant)}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {tenant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tenant.company}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label={tenant.type.charAt(0).toUpperCase() + tenant.type.slice(1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={formatCurrency(getTotalMonthly(tenant))}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Contract Data Preview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ContractIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Contract Data Mapping
              </Typography>
              
              {selectedTenant ? (
                <Box>
                  <Paper sx={{ p: 2, bgcolor: validation.isValid ? 'success.50' : 'warning.50', mb: 2 }}>
                    <Typography variant="body2" color={validation.isValid ? 'success.main' : 'warning.main'}>
                      <strong>Validation:</strong> {validation.message}
                    </Typography>
                  </Paper>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        Client Information
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {contractData.clientName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Company:</strong> {selectedTenant.company}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {contractData.clientEmail}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phone:</strong> {contractData.clientPhone}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Address:</strong> {contractData.clientAddress}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        Contract Details
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Contract #:</strong> {contractData.contractNumber}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Type:</strong> {contractData.workspaceType}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Details:</strong> {contractData.workspaceDetails}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Period:</strong> {contractData.startDate} - {contractData.endDate}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        Financial Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2">
                            <strong>Monthly Rate:</strong><br />
                            {contractData.monthlyRate}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2">
                            <strong>Security Deposit:</strong><br />
                            {contractData.securityDeposit}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2">
                            <strong>Total Amount:</strong><br />
                            {contractData.totalAmount}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <ContractIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Select a tenant to see how their data is mapped to the contract template
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contract Template Preview */}
      {selectedTenant && contractData.clientName && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Contract Template Preview
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PdfIcon />}
                onClick={() => {
                  generateContractPDF(contractData, selectedTenant);
                }}
                sx={{ minWidth: 140 }}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={() => {
                  printContract();
                }}
                sx={{ minWidth: 120 }}
              >
                Print
              </Button>
            </Stack>
          </Box>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'grey.300' }}>
            <ContractTemplate contractData={contractData} preview={true} />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ContractDemo;
