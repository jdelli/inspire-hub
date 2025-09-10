"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Storage as StorageIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { storage } from '../../../../script/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FirebaseStorageTest = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testFirebaseStorage = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Create a test file
      const testContent = 'This is a test file for Firebase Storage connectivity.';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      
      // Create a reference to the test file
      const testRef = ref(storage, 'test/connectivity-test.txt');
      
      // Upload the test file
      console.log('Uploading test file to Firebase Storage...');
      const uploadResult = await uploadBytes(testRef, testFile);
      console.log('Upload successful:', uploadResult);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL:', downloadURL);
      
      setTestResult({
        type: 'success',
        message: 'Firebase Storage is working correctly!',
        details: {
          uploadPath: uploadResult.ref.fullPath,
          downloadURL: downloadURL
        }
      });
      
    } catch (error) {
      console.error('Firebase Storage test failed:', error);
      setTestResult({
        type: 'error',
        message: `Firebase Storage test failed: ${error.message}`,
        details: {
          errorCode: error.code,
          errorMessage: error.message
        }
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <StorageIcon color="primary" />
            <Typography variant="h6">
              Firebase Storage Connectivity Test
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={3}>
            This test will verify that your Firebase Storage is properly configured and accessible.
            It will upload a small test file and retrieve its download URL.
          </Typography>
          
          <Button
            variant="contained"
            onClick={testFirebaseStorage}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <StorageIcon />}
            sx={{ mb: 2 }}
          >
            {testing ? 'Testing...' : 'Test Firebase Storage'}
          </Button>
          
          {testResult && (
            <Alert 
              severity={testResult.type === 'success' ? 'success' : 'error'}
              icon={testResult.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            >
              <Typography variant="body2" fontWeight={600}>
                {testResult.message}
              </Typography>
              {testResult.details && (
                <Box mt={1}>
                  <Typography variant="caption" component="div">
                    <strong>Upload Path:</strong> {testResult.details.uploadPath}
                  </Typography>
                  {testResult.details.downloadURL && (
                    <Typography variant="caption" component="div">
                      <strong>Download URL:</strong> {testResult.details.downloadURL}
                    </Typography>
                  )}
                  {testResult.details.errorCode && (
                    <Typography variant="caption" component="div">
                      <strong>Error Code:</strong> {testResult.details.errorCode}
                    </Typography>
                  )}
                </Box>
              )}
            </Alert>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Make sure you have configured Firebase Storage rules in your Firebase Console.
              You can use the rules provided in the <code>firebase-storage-rules.txt</code> file.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirebaseStorageTest;
