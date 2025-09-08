import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { storage } from '../../../../script/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const TemplateUploadDialogFileSystem = ({ open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('dedicated');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

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
      setUploadResult({
        type: 'error',
        message: 'Please fill in all required fields: file, template name, and template type.'
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadResult({
        type: 'error',
        message: 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, or HTML files only.'
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setUploadResult({
        type: 'error',
        message: 'File size too large. Please upload files smaller than 10MB.'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      console.log('Starting template upload...', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        templateName,
        templateType
      });

      // Create a unique filename with metadata
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Store file with descriptive name
      const fileName = `contract-templates/${templateType}/${sanitizedTemplateName}_${timestamp}.${fileExtension}`;
      
      setUploadProgress(10);

      // Upload to Firebase Storage with progress tracking
      const storageRef = ref(storage, fileName);
      console.log('Uploading to storage path:', fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      // Track upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%', 'State:', snapshot.state);
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadResult({
            type: 'error',
            message: `Upload failed: ${error.message}`,
            details: {
              errorCode: error.code || 'unknown',
              errorMessage: error.message || 'Unknown upload error occurred'
            }
          });
          setUploading(false);
          throw error;
        },
        () => {
          console.log('Upload completed successfully');
        }
      );
      
      // Wait for upload to complete
      const uploadResult = await uploadTask;
      console.log('Upload to storage successful:', uploadResult);
      setUploadProgress(85);

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('Download URL obtained:', downloadURL);
      setUploadProgress(95);

      // Create metadata JSON file
      const metadata = {
        name: templateName.trim(),
        type: templateType,
        description: description.trim(),
        fileName: fileName,
        originalFileName: selectedFile.name,
        downloadURL: downloadURL,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
        isActive: true,
        version: '1.0',
        createdBy: 'admin',
        lastModified: new Date().toISOString()
      };

      // Store metadata as JSON file in storage
      const metadataFileName = `contract-templates/${templateType}/metadata/${sanitizedTemplateName}_${timestamp}.json`;
      const metadataRef = ref(storage, metadataFileName);
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      
      await uploadBytesResumable(metadataRef, metadataBlob);
      console.log('Metadata saved to:', metadataFileName);
      
      setUploadProgress(100);

      setUploadResult({
        type: 'success',
        message: `Template "${templateName}" uploaded successfully!`,
        data: {
          fileName: fileName,
          metadataFile: metadataFileName,
          downloadURL: downloadURL
        }
      });

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setTemplateName('');
        setTemplateType('dedicated');
        setDescription('');
        
        // Clear the file input
        const fileInput = document.getElementById('template-upload-filesystem');
        if (fileInput) {
          fileInput.value = '';
        }
      }, 2000);

      // Reload templates
      await loadTemplates();

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Upload failed: Unauthorized access to storage. Please check permissions.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'Upload failed due to unknown error. Please try again.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      setUploadResult({
        type: 'error',
        message: errorMessage,
        details: {
          errorCode: error.code || 'unknown',
          errorMessage: error.message || 'Unknown error occurred'
        }
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templatesList = [];
      
      // Load templates from each type folder
      const types = ['dedicated', 'private', 'virtual'];
      
      for (const type of types) {
        try {
          // List all files in the type folder
          const typeRef = ref(storage, `contract-templates/${type}`);
          const typeFiles = await listAll(typeRef);
          
          // Look for metadata files
          const metadataFiles = typeFiles.items.filter(item => 
            item.name.includes('metadata') && item.name.endsWith('.json')
          );
          
          // Load metadata for each template
          for (const metadataFile of metadataFiles) {
            try {
              const downloadURL = await getDownloadURL(metadataFile);
              const response = await fetch(downloadURL);
              const metadata = await response.json();
              
              templatesList.push({
                id: metadataFile.name,
                ...metadata
              });
            } catch (error) {
              console.error('Error loading metadata for:', metadataFile.name, error);
            }
          }
        } catch (error) {
          console.error(`Error loading templates for type ${type}:`, error);
        }
      }
      
      // Sort templates: active first, then by upload date descending
      templatesList.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      });
      
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveTemplate = async (template) => {
    try {
      // Deactivate all templates of the same type
      const templatesToUpdate = templates.filter(t => 
        t.type === template.type && t.id !== template.id
      );
      
      for (const templateToUpdate of templatesToUpdate) {
        try {
          // Update metadata file
          const updatedMetadata = {
            ...templateToUpdate,
            isActive: false,
            deactivatedAt: new Date().toISOString()
          };
          
          const metadataRef = ref(storage, templateToUpdate.metadataFile || `contract-templates/${templateToUpdate.type}/metadata/${templateToUpdate.id}`);
          const metadataBlob = new Blob([JSON.stringify(updatedMetadata, null, 2)], { type: 'application/json' });
          await uploadBytesResumable(metadataRef, metadataBlob);
        } catch (error) {
          console.error('Error deactivating template:', templateToUpdate.name, error);
        }
      }

      // Activate the selected template
      const updatedMetadata = {
        ...template,
        isActive: true,
        activatedAt: new Date().toISOString()
      };
      
      const metadataRef = ref(storage, template.metadataFile || `contract-templates/${template.type}/metadata/${template.id}`);
      const metadataBlob = new Blob([JSON.stringify(updatedMetadata, null, 2)], { type: 'application/json' });
      await uploadBytesResumable(metadataRef, metadataBlob);

      setUploadResult({
        type: 'success',
        message: 'Template activated successfully!'
      });

      // Reload templates to reflect changes
      await loadTemplates();

    } catch (error) {
      console.error('Error setting active template:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to activate template: ${error.message}`
      });
    }
  };

  const deleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete the main file
      const fileRef = ref(storage, template.fileName);
      await deleteObject(fileRef);
      
      // Delete the metadata file
      const metadataRef = ref(storage, template.metadataFile || `contract-templates/${template.type}/metadata/${template.id}`);
      await deleteObject(metadataRef);
      
      setUploadResult({
        type: 'success',
        message: `Template "${template.name}" deleted successfully!`
      });

      // Reload templates
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to delete template: ${error.message}`
      });
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

  // Load templates when dialog opens
  React.useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FolderIcon />
          File System Template Storage
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" gap={3} mt={1}>
          {/* Upload Form */}
          <Box flex={1}>
            <Typography variant="h6" mb={2}>
              Upload New Template
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                fullWidth
                required
                placeholder="e.g., Standard Lease Agreement"
                size="small"
              />
              
              <FormControl fullWidth required size="small">
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
                rows={2}
                placeholder="Brief description of this template..."
                size="small"
              />
              
              <Box>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.html"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="template-upload-filesystem"
                />
                <label htmlFor="template-upload-filesystem">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                    size="small"
                  >
                    {selectedFile ? selectedFile.name : 'Choose Contract Template File'}
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    File size: {formatFileSize(selectedFile.size)}
                  </Typography>
                )}
              </Box>
              
              {uploading && (
                <Box>
                  <Typography variant="body2" mb={1}>
                    {uploadProgress < 85 ? 'Uploading to Firebase Storage...' : 
                     uploadProgress < 95 ? 'Getting download URL...' : 
                     'Saving template metadata...'} {uploadProgress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }} 
                  />
                </Box>
              )}
              
              {uploadResult && (
                <Alert 
                  severity={uploadResult.type === 'success' ? 'success' : 'error'}
                  size="small"
                >
                  {uploadResult.message}
                </Alert>
              )}
            </Box>
          </Box>

          {/* Templates List */}
          <Box flex={1}>
            <Typography variant="h6" mb={2}>
              Current Templates ({templates.length})
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : templates.length === 0 ? (
              <Box textAlign="center" py={4}>
                <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No templates uploaded yet
                </Typography>
              </Box>
            ) : (
              <Box maxHeight={400} overflow="auto">
                <Stack spacing={1}>
                  {templates.map((template) => (
                    <Card key={template.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
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
                        <Box display="flex" gap={0.5}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(template.downloadURL, '_blank')}
                            sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                          >
                            View
                          </Button>
                          {!template.isActive && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => setActiveTemplate(template)}
                              sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => deleteTemplate(template)}
                            sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(template.fileSize)} • {formatDate(template.uploadedAt)}
                      </Typography>
                      {template.description && (
                        <Typography variant="caption" display="block">
                          {template.description}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={uploadTemplate}
          variant="contained"
          disabled={uploading || !selectedFile || !templateName || !templateType}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateUploadDialogFileSystem;

