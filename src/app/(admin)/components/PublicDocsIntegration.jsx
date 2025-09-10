import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import {
  Description as ContractIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import PublicDocsContractGenerator from './PublicDocsContractGenerator';
import TemplateManager from './TemplateManager';

// Integration component for Public Docs Contract Generation
const PublicDocsIntegration = ({ tenant, tenantType }) => {
  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  return (
    <Box display="flex" gap={0.5}>
      {/* Contract Generator Button */}
      <Tooltip title="Generate Contract from Public Docs">
        <IconButton
          size="small"
          onClick={() => setShowContractGenerator(true)}
          color="primary"
        >
          <ContractIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Template Manager Button (for admin) */}
      <Tooltip title="Manage Templates">
        <IconButton
          size="small"
          onClick={() => setShowTemplateManager(true)}
          color="secondary"
        >
          <FolderIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Contract Generator Modal */}
      <PublicDocsContractGenerator
        open={showContractGenerator}
        onClose={() => setShowContractGenerator(false)}
        tenant={tenant}
        templateType={tenantType}
      />

      {/* Template Manager Modal */}
      <TemplateManager
        open={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />
    </Box>
  );
};

export default PublicDocsIntegration;
