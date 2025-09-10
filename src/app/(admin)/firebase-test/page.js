import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import {
  Storage as StorageIcon
} from '@mui/icons-material';
import FirebaseConnectionTest from '../components/FirebaseConnectionTest';
import SimpleTemplateUploader from '../components/SimpleTemplateUploader';

export default function FirebaseTestPage() {
  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorageIcon />
          Firebase Test & Template Upload
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          Test Firebase connection and upload your first contract template
        </Typography>
      </Box>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Instructions:</strong>
        </Typography>
        <ol>
          <li>First, test your Firebase connection to make sure everything is working</li>
          <li>If the test passes, you can upload your contract template</li>
          <li>Use placeholders like <code>{'{{TENANT_NAME}}'}</code> in your template for dynamic content</li>
        </ol>
      </Alert>

      {/* Connection Test */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Step 1: Test Firebase Connection
        </Typography>
        <FirebaseConnectionTest />
      </Paper>

      {/* Template Upload */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Step 2: Upload Contract Template
        </Typography>
        <SimpleTemplateUploader />
      </Paper>
    </Box>
  );
}
