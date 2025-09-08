import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import {
  Description as ContractIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import ContractGenerator from './ContractGenerator';
import AdvancedContractGenerator from './AdvancedContractGenerator';

// Example integration component showing how to add contract generation to your Tenants table
const ContractIntegrationExample = ({ tenant, tenantType }) => {
  const [showBasicGenerator, setShowBasicGenerator] = useState(false);
  const [showAdvancedGenerator, setShowAdvancedGenerator] = useState(false);

  return (
    <Box display="flex" gap={0.5}>
      {/* Basic Contract Generator */}
      <Tooltip title="Generate Basic Contract">
        <IconButton
          size="small"
          onClick={() => setShowBasicGenerator(true)}
          color="primary"
        >
          <ContractIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Advanced Contract Generator */}
      <Tooltip title="Generate Advanced Contract">
        <IconButton
          size="small"
          onClick={() => setShowAdvancedGenerator(true)}
          color="secondary"
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Basic Contract Generator Modal */}
      <ContractGenerator
        open={showBasicGenerator}
        onClose={() => setShowBasicGenerator(false)}
        tenant={tenant}
        templateType={tenantType}
      />

      {/* Advanced Contract Generator Modal */}
      <AdvancedContractGenerator
        open={showAdvancedGenerator}
        onClose={() => setShowAdvancedGenerator(false)}
        tenant={tenant}
        templateType={tenantType}
      />
    </Box>
  );
};

export default ContractIntegrationExample;

