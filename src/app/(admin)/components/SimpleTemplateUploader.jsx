"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { db, storage } from '../../../../script/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SimpleTemplateUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('dedicated');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [templates, setTemplates] = useState([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.split('.')[0]);
      }
    }
  };

  const uploadTemplate = async () => {
    if (!selectedFile || !templateName || !templateType) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      console.log('Starting upload...');
      console.log('File:', selectedFile);
      console.log('Template name:', templateName);
      console.log('Template type:', templateType);

      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `contract-templates/${templateType}/${templateName}_${timestamp}.${fileExtension}`;
      
      console.log('File path:', fileName);

      // Upload to Firebase Storage
      console.log('Uploading to Firebase Storage...');
      const storageRef = ref(storage, fileName);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      console.log('Storage upload successful:', uploadResult);

      setUploadProgress(50);

      // Get download URL
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL:', downloadURL);

      setUploadProgress(75);

      // Save metadata to Firestore
      console.log('Saving metadata to Firestore...');
      const templateData = {
        name: templateName,
        type: templateType,
        description: description,
        fileName: fileName,
        originalFileName: selectedFile.name,
        downloadURL: downloadURL,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
        isActive: true,
        version: '1.0'
      };

      console.log('Template data:', templateData);
      const templatesCollection = collection(db, 'contractTemplates');
      console.log('Collection reference:', templatesCollection);
      
      const docRef = await addDoc(templatesCollection, templateData);
      console.log('Document added with ID:', docRef.id);

      setUploadProgress(100);

      setUploadResult({
        type: 'success',
        message: 'Template uploaded successfully!',
        data: {
          templateId: docRef.id,
          downloadURL: downloadURL,
          fileName: fileName
        }
      });

      // Reset form
      setSelectedFile(null);
      setTemplateName('');
      setTemplateType('dedicated');
      setDescription('');

      // Reload templates
      loadTemplates();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        type: 'error',
        message: `Upload failed: ${error.message}`,
        details: {
          errorCode: error.code,
          errorMessage: error.message
        }
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const loadTemplates = async () => {
    try {
      console.log('Loading templates...');
      const templatesCollection = collection(db, 'contractTemplates');
      const querySnapshot = await getDocs(templatesCollection);
      
      const templateList = [];
      querySnapshot.forEach((doc) => {
        templateList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Templates loaded:', templateList);
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Upload Contract Template
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Standard Lease Agreement"
            />
            
            <FormControl fullWidth required>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                label="Template Type"
              >
                <MenuItem value="dedicated">Dedicated Desk</MenuItem>
                <MenuItem value="private">Private Office</MenuItem>
                <MenuItem value="virtual">Virtual Office</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of this template..."
            />
            
            <Box>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.html"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="template-upload"
              />
              <label htmlFor="template-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  {selectedFile ? selectedFile.name : 'Choose Contract Template File'}
                </Button>
              </label>
              {selectedFile && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    File size: {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {uploading && (
              <Box>
                <Typography variant="body2" mb={1}>
                  Uploading to Firebase Storage... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            
            {uploadResult && (
              <Alert 
                severity={uploadResult.type === 'success' ? 'success' : 'error'}
              >
                <Typography variant="body2" fontWeight={600}>
                  {uploadResult.message}
                </Typography>
                {uploadResult.details && (
                  <Box mt={1}>
                    <Typography variant="caption" component="div">
                      <strong>Template ID:</strong> {uploadResult.details.templateId}
                    </Typography>
                    <Typography variant="caption" component="div">
                      <strong>File Path:</strong> {uploadResult.details.fileName}
                    </Typography>
                    {uploadResult.details.errorCode && (
                      <Typography variant="caption" component="div">
                        <strong>Error Code:</strong> {uploadResult.details.errorCode}
                      </Typography>
                    )}
                  </Box>
                )}
              </Alert>
            )}
            
            <Button
              onClick={uploadTemplate}
              variant="contained"
              disabled={uploading || !selectedFile || !templateName || !templateType}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              size="large"
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload to Firebase Storage'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Uploaded Templates ({templates.length})
            </Typography>
            <Button onClick={loadTemplates} size="small">
              Refresh
            </Button>
          </Box>
          
          {templates.length === 0 ? (
            <Box textAlign="center" py={4}>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                No templates uploaded yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your first contract template to get started
              </Typography>
            </Box>
          ) : (
            <Box>
              {templates.map((template) => (
                <Box key={template.id} p={2} border="1px solid #e0e0e0" borderRadius={1} mb={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {template.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type: {template.type} • Size: {formatFileSize(template.fileSize)} • 
                    Uploaded: {formatDate(template.uploadedAt)}
                  </Typography>
                  {template.description && (
                    <Typography variant="caption" display="block">
                      {template.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleTemplateUploader;
