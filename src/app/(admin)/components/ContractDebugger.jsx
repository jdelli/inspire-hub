import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  BugReport as DebugIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const ContractDebugger = ({ tenant, tenantType = 'dedicated' }) => {
  const [debugResults, setDebugResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Test 1: Check tenant data
      results.push({
        test: 'Tenant Data Validation',
        status: tenant && tenant.name ? 'success' : 'error',
        message: tenant && tenant.name 
          ? `Tenant data is valid: ${tenant.name}` 
          : 'Tenant data is missing or invalid',
        details: tenant ? Object.keys(tenant) : 'No tenant data'
      });

      // Test 2: Check required dependencies
      const dependencies = [
        { name: 'PizZip', check: () => typeof window !== 'undefined' && window.PizZip },
        { name: 'Docxtemplater', check: () => typeof window !== 'undefined' && window.Docxtemplater },
        { name: 'file-saver', check: () => typeof window !== 'undefined' && window.saveAs }
      ];

      for (const dep of dependencies) {
        try {
          const isAvailable = dep.check();
          results.push({
            test: `Dependency: ${dep.name}`,
            status: isAvailable ? 'success' : 'warning',
            message: isAvailable 
              ? `${dep.name} is available` 
              : `${dep.name} is not available (this is normal for some dependencies)`,
            details: isAvailable ? 'Loaded successfully' : 'Not loaded in browser'
          });
        } catch (error) {
          results.push({
            test: `Dependency: ${dep.name}`,
            status: 'error',
            message: `Error checking ${dep.name}`,
            details: error.message
          });
        }
      }

      // Test 3: Check template file accessibility
      try {
        const response = await fetch('/docs/contract_template.docx', { method: 'HEAD' });
        results.push({
          test: 'Template File Access',
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? 'Template file is accessible' 
            : `Template file not accessible: ${response.status}`,
          details: response.ok ? 'File found' : `HTTP ${response.status}: ${response.statusText}`
        });
      } catch (error) {
        results.push({
          test: 'Template File Access',
          status: 'error',
          message: 'Failed to access template file',
          details: error.message
        });
      }

      // Test 4: Check contract generator import
      try {
        const { generateLeaseContract } = await import('../utils/contractGenerator');
        results.push({
          test: 'Contract Generator Import',
          status: 'success',
          message: 'Contract generator imported successfully',
          details: 'All functions available'
        });

        // Test 5: Try generating a simple contract
        try {
          const testTenant = {
            name: 'Test Tenant',
            company: 'Test Company',
            email: 'test@example.com',
            phone: '123-456-7890',
            address: 'Test Address',
            billing: {
              rate: 10000,
              cusaFee: 1000,
              parkingFee: 500,
              startDate: new Date().toISOString().split('T')[0],
              monthsToAvail: 12
            }
          };

          const contract = generateLeaseContract(testTenant, tenantType);
          results.push({
            test: 'Contract Generation',
            status: 'success',
            message: 'Contract generated successfully',
            details: `Contract ID: ${contract.metadata?.contractId || 'N/A'}`
          });
        } catch (error) {
          results.push({
            test: 'Contract Generation',
            status: 'error',
            message: 'Failed to generate contract',
            details: error.message
          });
        }

      } catch (error) {
        results.push({
          test: 'Contract Generator Import',
          status: 'error',
          message: 'Failed to import contract generator',
          details: error.message
        });
      }

      // Test 6: Check browser compatibility
      const browserTests = [
        { name: 'Blob API', check: () => typeof Blob !== 'undefined' },
        { name: 'URL.createObjectURL', check: () => typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' },
        { name: 'fetch API', check: () => typeof fetch !== 'undefined' },
        { name: 'ArrayBuffer', check: () => typeof ArrayBuffer !== 'undefined' }
      ];

      for (const test of browserTests) {
        results.push({
          test: `Browser API: ${test.name}`,
          status: test.check() ? 'success' : 'error',
          message: test.check() 
            ? `${test.name} is supported` 
            : `${test.name} is not supported`,
          details: test.check() ? 'Available' : 'Not available'
        });
      }

    } catch (error) {
      results.push({
        test: 'Diagnostic Runner',
        status: 'error',
        message: 'Failed to run diagnostics',
        details: error.message
      });
    }

    setDebugResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <DebugIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <DebugIcon />
          <Typography variant="h6">
            Contract Generation Diagnostics
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Run diagnostics to identify issues with contract generation functionality.
        </Typography>

        <Button
          variant="contained"
          onClick={runDiagnostics}
          disabled={isRunning}
          startIcon={<DebugIcon />}
          sx={{ mb: 2 }}
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {debugResults.length > 0 && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Diagnostic Results
            </Typography>
            
            <Stack spacing={1}>
              {debugResults.map((result, index) => (
                <Alert
                  key={index}
                  severity={getStatusColor(result.status)}
                  icon={getStatusIcon(result.status)}
                >
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {result.test}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {result.message}
                    </Typography>
                    {result.details && (
                      <Typography variant="caption" color="text.secondary">
                        Details: {result.details}
                      </Typography>
                    )}
                  </Box>
                </Alert>
              ))}
            </Stack>

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Summary
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={`${debugResults.filter(r => r.status === 'success').length} Passed`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${debugResults.filter(r => r.status === 'warning').length} Warnings`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`${debugResults.filter(r => r.status === 'error').length} Errors`}
                  color="error"
                  size="small"
                />
              </Stack>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractDebugger;
