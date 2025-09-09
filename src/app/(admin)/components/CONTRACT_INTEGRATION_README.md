# Contract Template Integration

This document explains how the `ContractTemplate.jsx` component has been integrated with the tenant data from the `Tenants.jsx` component.

## Overview

The integration allows you to generate professional contracts using the existing `ContractTemplate.jsx` component with real tenant data from your database. The system automatically maps tenant information to the contract template format.

## Components

### 1. ContractTemplate.jsx
- **Purpose**: The original contract template component that renders a professional workspace rental agreement
- **Location**: `src/app/(admin)/components/ContractTemplate.jsx`
- **Props**:
  - `contractData`: Object containing all contract information
  - `preview`: Boolean to enable preview mode

### 2. ContractGenerator.jsx
- **Purpose**: New component that integrates tenant data with the contract template
- **Location**: `src/app/(admin)/components/ContractGenerator.jsx`
- **Features**:
  - Editable tenant information form
  - Real-time contract preview
  - PDF generation and download
  - Data validation
  - Support for all tenant types (dedicated, private, virtual)

### 3. contractDataMapper.js
- **Purpose**: Utility functions to map tenant data to contract template format
- **Location**: `src/app/(admin)/utils/contractDataMapper.js`
- **Key Functions**:
  - `mapTenantToContractData()`: Maps tenant data to contract format
  - `validateTenantForContract()`: Validates tenant data completeness
  - `getContractPreviewData()`: Generates preview data

## How to Use

### From the Tenants Component

1. **Navigate to Tenant Management**
   - Go to Admin Dashboard → Tenant Management
   - Or visit `/admin/tenants`

2. **Select a Tenant**
   - Choose any tenant from the dedicated desk, private office, or virtual office tabs
   - Click the "Contract" button in the Actions column

3. **Generate Contract**
   - The ContractGenerator modal will open with the tenant's data pre-filled
   - Review and edit any information as needed
   - Click "Generate Contract" to create the contract
   - Use "Preview Contract" to see the full contract
   - Use "Download PDF" to save the contract as a PDF

### Programmatically

```javascript
import { mapTenantToContractData, validateTenantForContract } from '../utils/contractDataMapper';
import ContractTemplate from './ContractTemplate';

// Map tenant data to contract format
const contractData = mapTenantToContractData(tenant, 'dedicated');

// Validate tenant data
const validation = validateTenantForContract(tenant);

// Render contract template
<ContractTemplate contractData={contractData} preview={true} />
```

## Data Mapping

The system automatically maps tenant data to contract fields:

| Tenant Field | Contract Field | Description |
|--------------|----------------|-------------|
| `name` | `clientName` | Tenant's full name |
| `company` | Company info | Tenant's company name |
| `email` | `clientEmail` | Tenant's email address |
| `phone` | `clientPhone` | Tenant's phone number |
| `address` | `clientAddress` | Tenant's address |
| `billing.rate` | `monthlyRate` | Monthly rental rate |
| `billing.cusaFee` | Included in rate | CUSA fee |
| `billing.parkingFee` | Included in rate | Parking fee |
| `billing.startDate` | `startDate` | Contract start date |
| `billing.monthsToAvail` | `endDate` | Contract duration |
| `selectedSeats` | `workspaceDetails` | Selected desk seats |
| `selectedPO` | `workspaceDetails` | Selected private offices |
| `virtualOfficeFeatures` | `workspaceDetails` | Virtual office features |

## Tenant Types

The system supports three types of tenants:

### 1. Dedicated Desk (`dedicated`)
- **Workspace Type**: "Dedicated Desk"
- **Details**: Selected seat numbers (e.g., "A1, A2")
- **Default Rate**: ₱5,000/month

### 2. Private Office (`private`)
- **Workspace Type**: "Private Office"
- **Details**: Selected office numbers (e.g., "Office 201, Office 202")
- **Default Rate**: ₱15,000/month

### 3. Virtual Office (`virtual`)
- **Workspace Type**: "Virtual Office"
- **Details**: Virtual office features (e.g., "Mail Handling, Phone Answering")
- **Default Rate**: ₱3,000/month

## Contract Number Generation

Contract numbers are automatically generated using the format:
```
{Type}-{YYYYMMDD}-{Initials}
```

Examples:
- `DD-20241201-JD` (Dedicated Desk for John Doe)
- `PO-20241201-MS` (Private Office for Maria Santos)
- `VO-20241201-RC` (Virtual Office for Robert Chen)

## Validation

The system validates tenant data before contract generation:

### Required Fields
- `name`: Tenant's full name
- `email`: Valid email address
- `phone`: Phone number
- `address`: Physical address

### Optional Fields
- `company`: Company name
- `billing.rate`: Monthly rate (defaults based on tenant type)
- `billing.startDate`: Contract start date (defaults to today)
- `billing.monthsToAvail`: Contract duration (defaults to 12 months)

## Demo Component

A demo component is available to test the integration:

**Location**: `src/app/(admin)/components/ContractDemo.jsx`

**Features**:
- Sample tenant data for all three types
- Interactive tenant selection
- Real-time contract data mapping preview
- Full contract template preview

## File Structure

```
src/app/(admin)/
├── components/
│   ├── ContractTemplate.jsx          # Original contract template
│   ├── ContractGenerator.jsx         # New integrated generator
│   ├── ContractDemo.jsx              # Demo component
│   └── Tenants.jsx                   # Updated with integration
├── utils/
│   └── contractDataMapper.js         # Data mapping utilities
└── CONTRACT_INTEGRATION_README.md    # This documentation
```

## Future Enhancements

Potential improvements for the integration:

1. **Template Customization**: Allow admins to customize contract templates
2. **Digital Signatures**: Add digital signature functionality
3. **Email Integration**: Automatically email contracts to tenants
4. **Contract History**: Track contract versions and changes
5. **Multi-language Support**: Support for different languages
6. **Advanced PDF Features**: Better PDF formatting and styling

## Troubleshooting

### Common Issues

1. **Missing Tenant Data**
   - Ensure all required fields are filled
   - Check the validation message in the ContractGenerator

2. **Contract Not Generating**
   - Verify tenant data is complete
   - Check browser console for errors
   - Ensure all required props are passed

3. **PDF Download Issues**
   - Check browser popup blockers
   - Ensure JavaScript is enabled
   - Try a different browser

### Support

For issues or questions about the contract integration:
1. Check the browser console for error messages
2. Verify tenant data completeness
3. Test with the demo component
4. Review the validation messages in the ContractGenerator
