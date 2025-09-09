"use client";

import React, { useState } from 'react';
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
  AttachMoney as MoneyIcon
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
          <Typography variant="h6" gutterBottom>
            Contract Template Preview
          </Typography>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'grey.300' }}>
            <ContractTemplate contractData={contractData} preview={true} />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ContractDemo;
