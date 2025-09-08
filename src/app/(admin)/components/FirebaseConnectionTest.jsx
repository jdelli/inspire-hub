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
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { db, storage } from '../../../../script/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const FirebaseConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testFirebaseConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('Testing Firebase connection...');
      console.log('DB instance:', db);
      console.log('Storage instance:', storage);

      // Test Firestore connection
      console.log('Testing Firestore...');
      const testCollection = collection(db, 'test');
      console.log('Collection reference created:', testCollection);
      
      // Test adding a document
      const testDoc = await addDoc(testCollection, {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Firebase connection test'
      });
      console.log('Document added successfully:', testDoc.id);

      // Test reading documents
      const querySnapshot = await getDocs(testCollection);
      console.log('Documents read successfully:', querySnapshot.size);

      // Test Storage connection
      console.log('Testing Storage...');
      const testContent = 'Firebase Storage test file';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const testRef = ref(storage, 'test/connection-test.txt');
      
      const uploadResult = await uploadBytes(testRef, testFile);
      console.log('Storage upload successful:', uploadResult);
      
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL:', downloadURL);

      setTestResult({
        type: 'success',
        message: 'Firebase connection is working perfectly!',
        details: {
          firestore: 'Connected and tested',
          storage: 'Connected and tested',
          testDocId: testDoc.id,
          downloadURL: downloadURL
        }
      });

    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setTestResult({
        type: 'error',
        message: `Firebase connection failed: ${error.message}`,
        details: {
          errorCode: error.code,
          errorMessage: error.message,
          errorStack: error.stack
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
              Firebase Connection Test
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={3}>
            This test will verify that both Firestore and Storage are properly connected and working.
          </Typography>
          
          <Button
            variant="contained"
            onClick={testFirebaseConnection}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <StorageIcon />}
            sx={{ mb: 2 }}
          >
            {testing ? 'Testing...' : 'Test Firebase Connection'}
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
                  {Object.entries(testResult.details).map(([key, value]) => (
                    <Typography key={key} variant="caption" component="div">
                      <strong>{key}:</strong> {value}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirebaseConnectionTest;
