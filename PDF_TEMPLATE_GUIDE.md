# PDF Template Dynamic Contract Generation Guide

## Overview
This system allows you to upload PDF templates and automatically populate them with tenant details when generating contracts. It supports both fillable PDF forms and text overlay on static PDFs.

## How It Works

### 🎯 **System Components**
1. **PDF Template Manager** - Upload and manage PDF templates
2. **PDF Template Processor** - Process templates with tenant data
3. **PDF Contract Generator** - UI component for generating contracts

### 📋 **Supported PDF Types**

#### Option 1: Fillable PDF Forms
- PDFs with form fields (text fields, checkboxes, radio buttons)
- Field names are automatically mapped to tenant data
- Best for complex contracts with multiple data points

#### Option 2: Static PDFs with Text Overlay
- Regular PDFs without form fields
- Text is overlayed at predefined positions
- Good for simple templates with standard layouts

## Setting Up PDF Templates

### Step 1: Create Your PDF Template

#### For Fillable PDF Forms:
1. Create your contract template in Word, Google Docs, or similar
2. Add form fields with descriptive names:
   - `tenant_name` or `name` - Tenant's full name
   - `company_name` or `company` - Company name
   - `email` - Email address
   - `phone` - Phone number
   - `start_date` - Contract start date
   - `monthly_rent` - Monthly rental amount
   - `security_deposit` - Security deposit amount
3. Export/Save as PDF with form fields enabled

#### For Static PDFs:
1. Create your contract template with placeholder spaces
2. Note the positions where you want tenant data to appear
3. Save as standard PDF

### Step 2: Upload Template
1. Go to Tenant Management page
2. Click "Upload Contract Template" button
3. Select your PDF file
4. Choose template type (Dedicated, Private, or Virtual Office)
5. Add template name and description
6. Click Upload

### Step 3: Set as Active Template
1. The uploaded template will automatically be set as active
2. You can have one active template per office type
3. Only active templates are used for contract generation

## Using the PDF Contract Generator

### Step 1: Access Generator
1. Go to Tenant Management page
2. Find the tenant you want to generate a contract for
3. Click the "PDF Contract" button in the Actions column

### Step 2: Generate Contract
1. **Select Template**: Choose from available PDF templates for the tenant type
2. **Review/Edit Tenant Data**: Verify and update tenant information
3. **Generate**: Click "Generate PDF Contract"
4. **Preview/Download**: Preview in browser or download the PDF

### Step 3: Available Actions
- **Preview PDF**: Opens generated contract in new browser tab
- **Download PDF**: Downloads contract file to your computer
- **Regenerate**: Create new version with updated data

## Field Mapping System

### Automatic Field Detection
The system automatically maps PDF form field names to tenant data:

```
PDF Field Name → Tenant Data
├── tenant_name, name → Tenant's full name
├── company_name, company → Company name
├── email, email_address → Email address
├── phone, phone_number → Phone number
├── address → Address
├── start_date, contract_start → Contract start date
├── end_date, contract_end → Contract end date
├── monthly_rate, monthly_rent → Monthly rental rate
├── security_deposit, deposit → Security deposit
├── cusa_fee → CUSA fee
├── parking_fee → Parking fee
└── current_date, date → Current date
```

### Financial Calculations
The system automatically calculates:
- **Total Monthly**: Monthly Rate + CUSA Fee + Parking Fee
- **Security Deposit**: 2 months of monthly rate
- **Contract End Date**: Start date + duration in months

## Advanced Features

### 1. Template Variables
Even in PDFs, you can use template variables in text fields:
- `{{tenant.name}}` - Tenant name
- `{{tenant.company}}` - Company name
- `{{billing.monthlyRate}}` - Formatted monthly rate
- `{{contract.startDate}}` - Contract start date
- `{{system.companyName}}` - Your company name

### 2. Multiple Template Support
- Upload different templates for different office types
- Each office type (Dedicated, Private, Virtual) can have its own active template
- Easy template switching and management

### 3. Data Validation
- Required fields are highlighted
- Currency amounts are properly formatted
- Dates are validated and formatted consistently
- Missing data is handled gracefully

## Best Practices

### 1. PDF Template Design
```
✅ DO:
- Use clear, descriptive field names
- Test your PDF forms before uploading
- Include all necessary legal clauses
- Use consistent formatting

❌ DON'T:
- Use special characters in field names
- Create overly complex nested fields
- Forget to test with sample data
- Make fields too small for content
```

### 2. Field Naming Convention
```
Good Field Names:
- tenant_name, tenant_email, tenant_phone
- contract_start_date, contract_end_date
- monthly_rate, security_deposit
- company_name, company_address

Avoid:
- field1, field2, textbox1
- very_long_field_names_that_are_hard_to_read
- ALLCAPS, MiXeD CaSe
- Special characters: @#$%^&*
```

### 3. Template Testing
1. Upload test template
2. Create test tenant with sample data
3. Generate contract and verify all fields populate correctly
4. Check formatting, alignment, and readability
5. Test with different data lengths (long names, addresses)

## Troubleshooting

### Common Issues

#### 1. Fields Not Filling
```
Problem: PDF form fields remain empty after generation
Solutions:
- Check field names match the mapping system
- Ensure PDF has editable form fields
- Verify tenant data is complete
- Check PDF isn't password protected
```

#### 2. Text Positioning Issues
```
Problem: Text appears in wrong positions
Solutions:
- Adjust overlay positions in pdfTemplateProcessor.js
- Use fillable forms instead of static overlays
- Test with different PDF viewers
```

#### 3. Template Not Found
```
Problem: "No PDF templates found" message
Solutions:
- Upload template for correct office type
- Set template as active
- Check template file is valid PDF
- Refresh browser cache
```

#### 4. Download/Preview Errors
```
Problem: Cannot download or preview generated PDF
Solutions:
- Check browser popup blockers
- Ensure sufficient browser memory
- Try different browser
- Check PDF generation logs
```

### Debug Steps
1. Check browser console for error messages
2. Verify template is uploaded and active
3. Confirm tenant data is complete
4. Test with simple template first
5. Check network connectivity

## File Structure

```
src/app/(admin)/
├── components/
│   └── PDFContractGenerator.jsx      # Main UI component
├── utils/
│   ├── pdfTemplateProcessor.js       # PDF processing logic
│   └── contractTemplateManager.js    # Template management
└── docs/
    └── PDF_TEMPLATE_GUIDE.md         # This guide
```

## Sample Field Names for PDF Forms

When creating fillable PDF forms, use these field names for automatic mapping:

### Tenant Information
- `tenant_name` or `name`
- `tenant_company` or `company`
- `tenant_email` or `email`
- `tenant_phone` or `phone`
- `tenant_address` or `address`

### Contract Details
- `contract_start_date` or `start_date`
- `contract_end_date` or `end_date`
- `contract_duration` or `duration`
- `contract_type` or `type`

### Financial Terms
- `monthly_rate` or `monthly_rent`
- `cusa_fee`
- `parking_fee`
- `security_deposit` or `deposit`
- `total_monthly`

### Company Information
- `company_name` (your company)
- `company_address` (your address)

### Dates
- `current_date` or `date`
- `signature_date`

## Example Workflow

### For Property Manager:
1. **Setup**: Upload PDF templates for each office type
2. **Daily Use**: 
   - Select tenant → Click "PDF Contract"
   - Review/edit tenant data if needed
   - Generate and download contract
3. **Management**: 
   - Update templates as needed
   - Monitor template usage
   - Ensure data accuracy

### For Legal/Admin:
1. **Template Creation**: Design contracts with fillable fields
2. **Quality Control**: Test templates with sample data
3. **Updates**: Revise templates based on legal requirements
4. **Training**: Guide staff on proper usage

This system streamlines contract generation while maintaining legal accuracy and professional presentation. The automated data population reduces errors and saves significant time compared to manual contract creation.

## Support

For technical support or feature requests:
1. Check this guide first
2. Test with sample data
3. Check browser console for errors
4. Document exact steps to reproduce issues
5. Contact development team with details

Remember to regularly backup your templates and test the system with new tenant data to ensure continued reliability.