# Dynamic Contract Generation Guide

## Overview
This guide explains how to implement dynamic contract generation that automatically populates tenant details into contract templates.

## Features Implemented

### 🎯 **Template Variable System**
- **Pre-defined Variables**: Common tenant and contract information
- **Custom Variables**: User-defined variables for specific needs
- **Real-time Preview**: See changes as you edit variables
- **Multiple Formats**: Text, PDF, and Word document support

### 📋 **Available Template Variables**

#### Tenant Information
```
{{tenant.name}} - Tenant Full Name
{{tenant.company}} - Tenant Company
{{tenant.email}} - Tenant Email
{{tenant.phone}} - Tenant Phone
{{tenant.address}} - Tenant Address
{{tenant.position}} - Tenant Position/Title
{{tenant.idNumber}} - Tenant ID Number
{{tenant.taxId}} - Tax ID Number
```

#### Contract Details
```
{{contract.startDate}} - Contract Start Date
{{contract.endDate}} - Contract End Date
{{contract.duration}} - Contract Duration
{{contract.type}} - Contract Type
{{contract.seats}} - Selected Seats/Offices
{{contract.renewal}} - Renewal Terms
{{contract.termination}} - Termination Notice
```

#### Financial Information
```
{{billing.monthlyRate}} - Monthly Rate
{{billing.totalAmount}} - Total Contract Amount
{{billing.paymentMethod}} - Payment Method
{{billing.deposit}} - Security Deposit
{{billing.lateFee}} - Late Payment Fee
{{billing.currency}} - Currency
{{billing.paymentTerms}} - Payment Terms
```

#### Office Information
```
{{office.location}} - Office Location
{{office.floor}} - Floor Number
{{office.area}} - Office Area
{{office.amenities}} - Included Amenities
{{office.access}} - Access Hours
{{office.parking}} - Parking Information
```

#### System Information
```
{{system.companyName}} - Your Company Name
{{system.companyAddress}} - Your Company Address
{{system.contactInfo}} - Your Contact Information
{{system.legalName}} - Legal Company Name
{{system.registration}} - Company Registration Number
{{system.taxId}} - Company Tax ID
```

#### Date Variables
```
{{date.today}} - Current Date
{{date.signature}} - Signature Date
{{date.effective}} - Effective Date
{{date.expiry}} - Expiry Date
```

## Implementation Options

### Option 1: Basic Contract Generator
**File**: `ContractGenerator.jsx`
- Simple template variable replacement
- Text file output
- Basic preview functionality
- Easy to implement and customize

### Option 2: Advanced Contract Generator
**File**: `AdvancedContractGenerator.jsx`
- Tabbed interface for better organization
- Custom variable support
- Multiple output formats (Text, PDF, Word)
- Enhanced preview with formatting options
- More comprehensive variable set

## How to Integrate

### Step 1: Add Contract Generation Buttons to Your Tenants Table

In your `Tenants.jsx` file, add contract generation buttons to the actions column:

```javascript
import ContractGenerator from './ContractGenerator';
import AdvancedContractGenerator from './AdvancedContractGenerator';

// Add these state variables
const [showContractGenerator, setShowContractGenerator] = useState(false);
const [showAdvancedContractGenerator, setShowAdvancedContractGenerator] = useState(false);
const [selectedTenantForContract, setSelectedTenantForContract] = useState(null);

// Add these functions
const handleGenerateContract = (tenant, type) => {
  setSelectedTenantForContract({ ...tenant, type });
  setShowContractGenerator(true);
};

const handleGenerateAdvancedContract = (tenant, type) => {
  setSelectedTenantForContract({ ...tenant, type });
  setShowAdvancedContractGenerator(true);
};

// In your table actions, add these buttons:
<Button
  size="small"
  startIcon={<ContractIcon fontSize="small" />}
  onClick={() => handleGenerateContract(client, tabIndex === 0 ? "dedicated" : tabIndex === 1 ? "private" : "virtual")}
  sx={{ 
    color: grey[700],
    textTransform: 'none',
    fontSize: '0.75rem',
    py: 0.5,
    px: 1,
    minWidth: 'auto',
    '&:hover': { 
      bgcolor: grey[100],
    },
  }}
>
  Generate Contract
</Button>
```

### Step 2: Add the Modal Components

Add these modals at the end of your component:

```javascript
{/* Contract Generator Modals */}
<ContractGenerator
  open={showContractGenerator}
  onClose={() => setShowContractGenerator(false)}
  tenant={selectedTenantForContract}
  templateType={selectedTenantForContract?.type}
/>

<AdvancedContractGenerator
  open={showAdvancedContractGenerator}
  onClose={() => setShowAdvancedContractGenerator(false)}
  tenant={selectedTenantForContract}
  templateType={selectedTenantForContract?.type}
/>
```

## Creating Custom Templates

### Template Structure
Templates use a simple text format with variable placeholders:

```
CONTRACT AGREEMENT

This agreement is made between {{system.companyName}} and {{tenant.name}} ({{tenant.company}}).

TENANT DETAILS:
Name: {{tenant.name}}
Company: {{tenant.company}}
Email: {{tenant.email}}
Phone: {{tenant.phone}}

CONTRACT TERMS:
Start Date: {{contract.startDate}}
End Date: {{contract.endDate}}
Monthly Rate: {{billing.monthlyRate}}

Signature Date: {{date.signature}}

_________________________          _________________________
{{tenant.name}}                     {{system.companyName}}
Tenant Signature                    Company Representative
```

### Adding New Templates

1. **For Basic Generator**: Add templates to the `sampleTemplates` array in `ContractGenerator.jsx`
2. **For Advanced Generator**: Add templates to the `sampleTemplates` array in `AdvancedContractGenerator.jsx`

Example:
```javascript
{
  id: '4',
  name: 'Custom Agreement Template',
  type: 'dedicated',
  format: 'text',
  content: `Your template content here with {{variables}}`,
  isActive: true
}
```

## Advanced Features

### Custom Variables
The Advanced Contract Generator supports custom variables:

```javascript
// Add custom variables dynamically
const customVariables = {
  '{{custom.specialClause}}': 'Your custom clause text',
  '{{custom.additionalTerms}}': 'Additional terms and conditions'
};
```

### Multiple Output Formats
- **Text**: Plain text file (.txt)
- **PDF**: PDF document (requires additional libraries)
- **Word**: Word document (requires additional libraries)

### PDF Generation (Optional)
To add PDF generation, install and use libraries like:
- `jsPDF` for client-side PDF generation
- `html2pdf.js` for HTML to PDF conversion
- `puppeteer` for server-side PDF generation

### Word Document Generation (Optional)
To add Word document generation, install and use:
- `docx` library for creating Word documents
- `mammoth` for reading Word documents

## Best Practices

### 1. Template Design
- Use clear, professional language
- Include all necessary legal clauses
- Make templates easily customizable
- Test with different tenant data

### 2. Variable Management
- Use descriptive variable names
- Provide default values for optional fields
- Validate required fields before generation
- Handle missing data gracefully

### 3. User Experience
- Provide real-time preview
- Show clear error messages
- Allow easy template selection
- Enable quick variable editing

### 4. Data Security
- Validate all input data
- Sanitize output content
- Protect sensitive information
- Implement proper access controls

## Troubleshooting

### Common Issues

1. **Variables not replacing**: Check variable syntax (must use `{{variable.name}}`)
2. **Missing data**: Ensure tenant object has all required fields
3. **Format issues**: Verify template formatting and line breaks
4. **Performance**: For large templates, consider pagination or lazy loading

### Debug Tips

1. **Console Logging**: Add console.log statements to track variable replacement
2. **Preview Mode**: Use preview mode to see real-time changes
3. **Test Data**: Create test tenant objects with all fields populated
4. **Template Validation**: Validate templates before saving

## Future Enhancements

### Potential Improvements
1. **Template Editor**: Visual template editor with drag-and-drop
2. **Version Control**: Track template changes and versions
3. **Approval Workflow**: Multi-step approval process for contracts
4. **Digital Signatures**: Integration with e-signature services
5. **Automated Generation**: Trigger contract generation on tenant creation
6. **Email Integration**: Send generated contracts via email
7. **Storage Integration**: Save generated contracts to cloud storage
8. **Analytics**: Track contract generation and usage statistics

### Integration Possibilities
- **CRM Systems**: Integrate with customer relationship management
- **Accounting Software**: Connect with billing and invoicing systems
- **Document Management**: Link with document storage and retrieval systems
- **Workflow Automation**: Connect with business process automation tools

This dynamic contract generation system provides a flexible foundation that can be extended and customized based on your specific business needs.

