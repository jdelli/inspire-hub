import React, { useState, useEffect } from 'react';
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
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Computer as ComputerIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const TemplateUploadDialogLocal = ({ open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('dedicated');
  const [description, setDescription] = useState('');
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

  const uploadTemplate = () => {
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

    try {
      // Create template metadata
      const templateData = {
        id: Date.now().toString(),
        name: templateName.trim(),
        type: templateType,
        description: description.trim(),
        originalFileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
        isActive: true,
        version: '1.0',
        createdBy: 'admin',
        lastModified: new Date().toISOString(),
        fileData: null // Will store file data
      };

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        templateData.fileData = e.target.result;
        
        // Get existing templates from localStorage
        const existingTemplates = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
        
        // Deactivate other templates of the same type
        const updatedTemplates = existingTemplates.map(template => {
          if (template.type === templateType && template.id !== templateData.id) {
            return { ...template, isActive: false, deactivatedAt: new Date().toISOString() };
          }
          return template;
        });
        
        // Add new template
        updatedTemplates.push(templateData);
        
        // Save to localStorage
        localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates));
        
        setUploadResult({
          type: 'success',
          message: `Template "${templateName}" uploaded successfully!`
        });

        // Reset form
        setSelectedFile(null);
        setTemplateName('');
        setTemplateType('dedicated');
        setDescription('');
        
        // Clear the file input
        const fileInput = document.getElementById('template-upload-local');
        if (fileInput) {
          fileInput.value = '';
        }

        // Reload templates
        loadTemplates();
      };
      
      reader.readAsDataURL(selectedFile);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        type: 'error',
        message: `Upload failed: ${error.message}`
      });
    }
  };

  const loadTemplates = () => {
    try {
      const storedTemplates = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
      
      // Sort templates: active first, then by upload date descending
      storedTemplates.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      });
      
      setTemplates(storedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const setActiveTemplate = (template) => {
    try {
      const existingTemplates = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
      
      const updatedTemplates = existingTemplates.map(t => {
        if (t.type === template.type) {
          return {
            ...t,
            isActive: t.id === template.id,
            activatedAt: t.id === template.id ? new Date().toISOString() : undefined,
            deactivatedAt: t.id !== template.id ? new Date().toISOString() : undefined
          };
        }
        return t;
      });
      
      localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates));
      
      setUploadResult({
        type: 'success',
        message: 'Template activated successfully!'
      });

      loadTemplates();
    } catch (error) {
      console.error('Error setting active template:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to activate template: ${error.message}`
      });
    }
  };

  const deleteTemplate = (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const existingTemplates = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
      const updatedTemplates = existingTemplates.filter(t => t.id !== template.id);
      
      localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates));
      
      setUploadResult({
        type: 'success',
        message: `Template "${template.name}" deleted successfully!`
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to delete template: ${error.message}`
      });
    }
  };

  const downloadTemplate = (template) => {
    try {
      // Create a blob from the base64 data
      const byteCharacters = atob(template.fileData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: template.mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = template.originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to download template: ${error.message}`
      });
    }
  };

  const exportTemplates = () => {
    try {
      const templatesData = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
      const dataStr = JSON.stringify(templatesData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-templates-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setUploadResult({
        type: 'success',
        message: 'Templates exported successfully!'
      });
    } catch (error) {
      console.error('Error exporting templates:', error);
      setUploadResult({
        type: 'error',
        message: `Failed to export templates: ${error.message}`
      });
    }
  };

  const importTemplates = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplates = JSON.parse(e.target.result);
        
        if (Array.isArray(importedTemplates)) {
          localStorage.setItem('contractTemplates', JSON.stringify(importedTemplates));
          setUploadResult({
            type: 'success',
            message: `Successfully imported ${importedTemplates.length} templates!`
          });
          loadTemplates();
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Error importing templates:', error);
        setUploadResult({
          type: 'error',
          message: `Failed to import templates: ${error.message}`
        });
      }
    };
    
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
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
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ComputerIcon />
            Local Storage Template Management
          </Box>
          <Box display="flex" gap={1}>
            <input
              type="file"
              accept=".json"
              onChange={importTemplates}
              style={{ display: 'none' }}
              id="import-templates"
            />
            <label htmlFor="import-templates">
              <Button
                size="small"
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
              >
                Import
              </Button>
            </label>
            <Button
              size="small"
              variant="outlined"
              onClick={exportTemplates}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>
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
                  id="template-upload-local"
                />
                <label htmlFor="template-upload-local">
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
            
            {templates.length === 0 ? (
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
                          <IconButton
                            size="small"
                            onClick={() => downloadTemplate(template)}
                            title="Download"
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
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
                          <IconButton
                            size="small"
                            onClick={() => deleteTemplate(template)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
          disabled={!selectedFile || !templateName || !templateType}
          startIcon={<UploadIcon />}
        >
          Upload Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateUploadDialogLocal;

