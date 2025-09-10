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
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { uploadContractTemplate, getContractTemplates } from '../utils/contractTemplateManager';

const ContractTemplateUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('dedicated');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName || !templateType) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadContractTemplate(
        selectedFile, 
        templateName, 
        templateType, 
        description
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadResult({
          type: 'success',
          message: 'Template uploaded successfully!',
          data: result
        });
        
        // Reset form
        setSelectedFile(null);
        setTemplateName('');
        setTemplateType('dedicated');
        setDescription('');
        
        // Reload templates
        loadTemplates();
      } else {
        setUploadResult({
          type: 'error',
          message: `Upload failed: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        type: 'error',
        message: `Upload failed: ${error.message}`
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templateList = await getContractTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'dedicated': return 'primary';
      case 'private': return 'secondary';
      case 'virtual': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon />
            Upload Contract Template
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Upload your contract template to Firebase Storage
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={loadTemplates}
          disabled={loadingTemplates}
        >
          {loadingTemplates ? <CircularProgress size={20} /> : 'Refresh Templates'}
        </Button>
      </Box>

      <Box display="flex" gap={3}>
        {/* Upload Form */}
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Upload New Template
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
                
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Supported formats:</strong> PDF, DOC, DOCX, TXT, HTML<br/>
                    <strong>Maximum file size:</strong> 10MB<br/>
                    <strong>Use placeholders:</strong> {{TENANT_NAME}}, {{COMPANY_NAME}}, etc.
                  </Typography>
                </Alert>
                
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
                    icon={uploadResult.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                  >
                    {uploadResult.message}
                  </Alert>
                )}
                
                <Button
                  onClick={handleUpload}
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
        </Box>

        {/* Templates List */}
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Uploaded Templates ({templates.length})
              </Typography>
              
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
                <List>
                  {templates.map((template) => (
                    <ListItem key={template.id} divider>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {template.name}
                            </Typography>
                            <Chip
                              label={template.type.toUpperCase()}
                              color={getTypeColor(template.type)}
                              size="small"
                            />
                            {template.isActive && (
                              <Chip
                                label="ACTIVE"
                                color="success"
                                size="small"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {template.description || 'No description'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(template.fileSize)} • {formatDate(template.uploadedAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ContractTemplateUploader;
