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
  Card,
  CardContent,
  Stack,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  FileText as FileIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const TemplateManager = ({ open, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'dedicated',
    description: '',
    content: ''
  });

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/docs/contracts/templates.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
      
      if (data.templates && data.templates.length === 0) {
        setResult({
          type: 'info',
          message: 'No templates found. Add templates to public/docs/contracts/ folder and update templates.json'
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setResult({
        type: 'error',
        message: `Failed to load templates: ${error.message}. Make sure templates.json exists in public/docs/contracts/`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = () => {
    setTemplateForm({
      name: '',
      type: 'dedicated',
      description: '',
      content: ''
    });
    setSelectedTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (template) => {
    setTemplateForm({
      name: template.name,
      type: template.type,
      description: template.description,
      content: '' // We'll load this separately
    });
    setSelectedTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async () => {
    // Validate form
    if (!templateForm.name.trim()) {
      setResult({
        type: 'error',
        message: 'Template name is required'
      });
      return;
    }
    
    if (!templateForm.description.trim()) {
      setResult({
        type: 'error',
        message: 'Template description is required'
      });
      return;
    }
    
    if (!templateForm.content.trim()) {
      setResult({
        type: 'error',
        message: 'Template content is required'
      });
      return;
    }

    try {
      // This is a simplified version - in a real app, you'd need a backend API
      // to actually save files to the public folder
      setResult({
        type: 'success',
        message: 'Template saved successfully! (Note: This requires backend implementation)'
      });
      setShowTemplateEditor(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setResult({
        type: 'error',
        message: 'Failed to save template'
      });
    }
  };

  const handleDeleteTemplate = (template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      // This is a simplified version - in a real app, you'd need a backend API
      setResult({
        type: 'success',
        message: 'Template deleted successfully! (Note: This requires backend implementation)'
      });
      loadTemplates();
    }
  };

  const toggleTemplateStatus = (template) => {
    // This is a simplified version - in a real app, you'd need a backend API
    setResult({
      type: 'success',
      message: 'Template status updated! (Note: This requires backend implementation)'
    });
    loadTemplates();
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FolderIcon />
            Template Manager
          </Box>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddTemplate}
            variant="contained"
            size="small"
          >
            Add Template
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading templates...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Templates ({templates.length})
                  </Typography>
                  
                  {templates.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No templates found
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add templates to public/docs/contracts/ folder
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {templates.map((template, index) => (
                        <React.Fragment key={template.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body1" fontWeight={500}>
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
                                  <Typography variant="body2" color="text.secondary">
                                    {template.description}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Version {template.version} • Modified: {template.lastModified}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box display="flex" gap={1}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={template.isActive}
                                      onChange={() => toggleTemplateStatus(template)}
                                      size="small"
                                    />
                                  }
                                  label="Active"
                                  labelPlacement="top"
                                />
                                <Tooltip title="Edit Template">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditTemplate(template)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Template">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteTemplate(template)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < templates.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template Structure
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Templates are stored in the following structure:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ fontSize: '0.75rem', margin: 0 }}>
{`public/
  docs/
    contracts/
      templates.json
      dedicated/
        standard-desk-agreement.txt
      private/
        private-office-lease.txt
      virtual/
        virtual-office-service.txt`}
                    </pre>
                  </Paper>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      How to Add Templates:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      1. Create a .txt file in the appropriate folder<br />
                      2. Add template metadata to templates.json<br />
                      3. Use variable syntax for dynamic content:<br />
                      &nbsp;&nbsp;• {`{{tenant.name}}`}, {`{{tenant.company}}`}, {`{{tenant.email}}`}<br />
                      &nbsp;&nbsp;• {`{{billing.monthlyRate}}`}, {`{{billing.totalAmount}}`}<br />
                      &nbsp;&nbsp;• {`{{contract.startDate}}`}, {`{{contract.endDate}}`}<br />
                      &nbsp;&nbsp;• {`{{office.location}}`}, {`{{office.amenities}}`}<br />
                      4. Refresh the template manager
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {result && (
          <Alert 
            severity={result.type === 'success' ? 'success' : result.type === 'info' ? 'info' : 'error'}
            sx={{ mt: 2 }}
          >
            {result.message}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={loadTemplates}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </DialogActions>

      {/* Template Editor Dialog */}
      <Dialog
        open={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Add New Template'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Template Name"
              value={templateForm.name}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={templateForm.type}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                label="Template Type"
              >
                <MenuItem value="dedicated">Dedicated Desk</MenuItem>
                <MenuItem value="private">Private Office</MenuItem>
                <MenuItem value="virtual">Virtual Office</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Description"
              value={templateForm.description}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            
            <TextField
              label="Template Content"
              value={templateForm.content}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
              fullWidth
              multiline
              rows={10}
              placeholder={`Enter template content with variable placeholders like:
{{tenant.name}} - Tenant's full name
{{tenant.company}} - Tenant's company
{{billing.monthlyRate}} - Monthly rent amount
{{contract.startDate}} - Contract start date
{{office.location}} - Office location`}
              helperText={`${templateForm.content.length} characters`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateEditor(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default TemplateManager;
