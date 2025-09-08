import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Description as ContractIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  FileText as TextIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import WordTemplateGenerator from './WordTemplateGenerator';

// Integration component for Contract Template Generation
const ContractTemplateIntegration = ({ tenant, tenantType }) => {
  const [showWordGenerator, setShowWordGenerator] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGenerateWord = () => {
    setShowWordGenerator(true);
    handleClose();
  };

  const handleGeneratePDF = () => {
    // Placeholder for PDF generation
    console.log('PDF generation not implemented yet');
    handleClose();
  };

  const handleGenerateText = () => {
    // Placeholder for text generation
    console.log('Text generation not implemented yet');
    handleClose();
  };

  return (
    <Box display="flex" gap={0.5}>
      {/* Quick Word Generation Button */}
      <Tooltip title="Generate Word Contract">
        <IconButton
          size="small"
          onClick={handleGenerateWord}
          color="primary"
        >
          <WordIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* More Options Menu */}
      <Tooltip title="More Contract Options">
        <IconButton
          size="small"
          onClick={handleClick}
          color="default"
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleGenerateWord}>
          <ListItemIcon>
            <WordIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Word Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGeneratePDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate PDF Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGenerateText}>
          <ListItemIcon>
            <TextIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Text Document</ListItemText>
        </MenuItem>
      </Menu>

      {/* Word Template Generator Modal */}
      <WordTemplateGenerator
        open={showWordGenerator}
        onClose={() => setShowWordGenerator(false)}
        tenant={tenant}
        templateType={tenantType}
      />
    </Box>
  );
};

export default ContractTemplateIntegration;
