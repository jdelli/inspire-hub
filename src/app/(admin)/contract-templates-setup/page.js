"use client";
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Alert
} from '@mui/material';
import {
  Storage as StorageIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import FirebaseStorageTest from '../components/FirebaseStorageTest';
import ContractTemplateUploader from '../components/ContractTemplateUploader';

const ContractTemplatesSetupPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [storageTestPassed, setStorageTestPassed] = useState(false);

  const steps = [
    {
      label: 'Test Firebase Storage',
      description: 'Verify Firebase Storage connectivity',
      icon: <StorageIcon />,
      content: <FirebaseStorageTest />
    },
    {
      label: 'Upload Contract Template',
      description: 'Upload your first contract template',
      icon: <UploadIcon />,
      content: <ContractTemplateUploader />
    },
    {
      label: 'Setup Complete',
      description: 'Your contract template system is ready',
      icon: <CheckIcon />,
      content: (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              🎉 Contract Template System Setup Complete!
            </Typography>
            <Typography variant="body2">
              You have successfully set up the contract template system. You can now:
            </Typography>
            <ul>
              <li>Upload contract templates for different tenant types</li>
              <li>Set active templates for automatic contract generation</li>
              <li>Generate contracts using your uploaded templates</li>
              <li>Manage templates through the admin interface</li>
            </ul>
          </Alert>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Next Steps:
            </Typography>
            <ol>
              <li>Upload contract templates for each tenant type (Dedicated, Private, Virtual)</li>
              <li>Set one template as &quot;Active&quot; for each tenant type</li>
              <li>Test contract generation by adding a new tenant</li>
              <li>Verify that contracts are generated using your templates</li>
            </ol>
          </Paper>
          
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Tip:</strong> Use placeholders like <code>{'{{TENANT_NAME}}'}</code>, <code>{'{{COMPANY_NAME}}'}</code>, 
              and <code>{'{{MONTHLY_RENT}}'}</code> in your templates for dynamic content replacement.
            </Typography>
          </Alert>
        </Box>
      )
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setStorageTestPassed(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorageIcon />
          Contract Template Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          Set up your contract template system with Firebase Storage
        </Typography>
      </Box>

      {/* Setup Steps */}
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">All done!</Typography>
                  ) : null
                }
                icon={step.icon}
              >
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 1 }}>
                  {index === steps.length - 1 ? (
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                      Reset Setup
                    </Button>
                  ) : (
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Quick Access */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Quick Access
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
            startIcon={<StorageIcon />}
          >
            Test Storage
          </Button>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(1)}
            startIcon={<UploadIcon />}
          >
            Upload Template
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ContractTemplatesSetupPage;
