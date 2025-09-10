import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as TemplateIcon
} from '@mui/icons-material';

const ContractTemplateManagerSimple = () => {
  const [loading, setLoading] = useState(false);

  const handleTest = () => {
    console.log('Contract Template Manager loaded successfully!');
    alert('Contract Template Manager is working!');
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TemplateIcon />
            Contract Template Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Upload and manage contract templates for different tenant types
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleTest}
          size="large"
        >
          Test Upload
        </Button>
      </Box>

      {/* Test Card */}
      <Card>
        <CardContent>
          <Alert severity="info">
            Contract Template Manager is loaded successfully! This is a simplified version for testing.
          </Alert>
          <Typography variant="h6" mt={2}>
            Features Coming Soon:
          </Typography>
          <ul>
            <li>Upload contract templates (PDF, DOC, DOCX)</li>
            <li>Manage templates by tenant type</li>
            <li>Set active templates</li>
            <li>Automatic contract generation from templates</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ContractTemplateManagerSimple;
