import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as ActiveIcon,
  RadioButtonUnchecked as InactiveIcon,
  Description as TemplateIcon,
  Storage as StorageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  uploadContractTemplate, 
  getContractTemplates, 
  deleteContractTemplate, 
  setActiveTemplate,
  downloadContractTemplate,
  getTemplateStatistics 
} from '../utils/contractTemplateManager';

const ContractTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('dedicated');
  const [description, setDescription] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadStatistics();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templateList = await getContractTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getTemplateStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

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
    try {
      const result = await uploadContractTemplate(
        selectedFile, 
        templateName, 
        templateType, 
        description
      );

      if (result.success) {
        alert('Template uploaded successfully!');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setTemplateName('');
        setTemplateType('dedicated');
        setDescription('');
        loadTemplates();
        loadStatistics();
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const success = await deleteContractTemplate(templateId);
        if (success) {
          alert('Template deleted successfully!');
          loadTemplates();
          loadStatistics();
        } else {
          alert('Failed to delete template');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete template');
      }
    }
  };

  const handleSetActive = async (templateId) => {
    try {
      const success = await setActiveTemplate(templateId);
      if (success) {
        alert('Template set as active!');
        loadTemplates();
      } else {
        alert('Failed to set template as active');
      }
    } catch (error) {
      console.error('Set active error:', error);
      alert('Failed to set template as active');
    }
  };

  const handleDownload = async (template) => {
    try {
      await downloadContractTemplate(template.downloadURL, template.originalFileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download template');
    }
  };

  const handleMenuOpen = (event, template) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTemplate(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
          onClick={() => setUploadDialogOpen(true)}
          size="large"
        >
          Upload Template
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{statistics.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Templates
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <ActiveIcon color="success" />
                  <Box>
                    <Typography variant="h6">{statistics.active}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Templates
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <InfoIcon color="info" />
                  <Box>
                    <Typography variant="h6">{formatFileSize(statistics.totalSize)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Storage Used
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TemplateIcon color="warning" />
                  <Box>
                    <Typography variant="h6">
                      {statistics.byType.dedicated + statistics.byType.private + statistics.byType.virtual}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      By Type
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Templates Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Contract Templates
          </Typography>
          
          {templates.length === 0 ? (
            <Box textAlign="center" py={4}>
              <TemplateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                No templates uploaded yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Upload your first contract template to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Template
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {template.name}
                          </Typography>
                          {template.description && (
                            <Typography variant="caption" color="text.secondary">
                              {template.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.type.toUpperCase()}
                          color={getTypeColor(template.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {template.isActive ? (
                            <>
                              <ActiveIcon color="success" fontSize="small" />
                              <Typography variant="body2" color="success.main">
                                Active
                              </Typography>
                            </>
                          ) : (
                            <>
                              <InactiveIcon color="disabled" fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                Inactive
                              </Typography>
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatFileSize(template.fileSize)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(template.uploadedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(template)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, template)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Contract Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              fullWidth
              required
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
            />
            
            <Box>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
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
                >
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  File size: {formatFileSize(selectedFile.size)}
                </Typography>
              )}
            </Box>
            
            <Alert severity="info">
              Supported formats: PDF, DOC, DOCX, TXT. Maximum file size: 10MB.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFile || !templateName || !templateType}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedTemplate && !selectedTemplate.isActive && (
          <MenuItem onClick={() => {
            handleSetActive(selectedTemplate.id);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <ActiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set as Active</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          handleDownload(selectedTemplate);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedTemplate.id);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContractTemplateManager;
