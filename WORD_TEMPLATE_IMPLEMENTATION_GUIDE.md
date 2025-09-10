# Word Document Template Implementation Guide

## Overview
This guide explains how to implement dynamic Word document generation using your existing `contract_template.docx` file in the `public/docs` folder.

## What You Have
- ✅ `public/docs/contract_template.docx` - Your Word template file
- ✅ Frontend components for template selection and variable editing
- ✅ Backend API structure for document processing

## Implementation Steps

### Step 1: Install Required Dependencies

Add these packages to your project:

```bash
npm install docx mammoth express multer cors
```

Or add to your `package.json`:
```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "mammoth": "^1.6.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}
```

### Step 2: Set Up Backend API

Create a backend API endpoint to process your Word template:

```javascript
// api/contract-generator.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const mammoth = require('mammoth');

const app = express();
app.use(express.json());

app.post('/api/generate-contract', async (req, res) => {
  try {
    const { variables } = req.body;
    
    // Path to your template
    const templatePath = path.join(__dirname, '../public/docs/contract_template.docx');
    
    // Read and process template
    const templateBuffer = fs.readFileSync(templatePath);
    const result = await mammoth.extractRawText({ buffer: templateBuffer });
    let documentText = result.value;
    
    // Replace variables
    Object.keys(variables).forEach(variable => {
      const value = variables[variable] || variable;
      documentText = documentText.replace(new RegExp(variable, 'g'), value);
    });
    
    // Create new document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [new Paragraph({
          children: [new TextRun(documentText)]
        })]
      }]
    });
    
    // Generate and send
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=contract.docx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 3: Update Frontend Component

Modify the `WordTemplateGenerator.jsx` to call your backend API:

```javascript
const generateWordDocument = async () => {
  setGenerating(true);
  try {
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: contractVariables })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate document');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contract_${tenant.name}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setResult({
      type: 'success',
      message: 'Word document generated successfully!'
    });
  } catch (error) {
    setResult({
      type: 'error',
      message: `Error generating document: ${error.message}`
    });
  } finally {
    setGenerating(false);
  }
};
```

### Step 4: Integrate with Your Tenants Component

Add the contract generation to your Tenants table:

```javascript
import ContractTemplateIntegration from './ContractTemplateIntegration';

// In your table actions column:
<TableCell sx={{ py: 2, px: 3 }}>
  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
    {/* Existing buttons... */}
    
    {/* Add Contract Generation */}
    <ContractTemplateIntegration 
      tenant={client} 
      tenantType={tabIndex === 0 ? "dedicated" : tabIndex === 1 ? "private" : "virtual"} 
    />
  </Stack>
</TableCell>
```

## Template Variable System

### How Variables Work
Your Word template should contain placeholders like:
```
{{tenant.name}}
{{tenant.company}}
{{billing.monthlyRate}}
{{contract.startDate}}
```

### Available Variables

#### Tenant Information
```
{{tenant.name}}           # Tenant Full Name
{{tenant.company}}        # Tenant Company
{{tenant.email}}          # Tenant Email
{{tenant.phone}}          # Tenant Phone
{{tenant.address}}        # Tenant Address
{{tenant.position}}       # Tenant Position/Title
{{tenant.idNumber}}       # Tenant ID Number
{{tenant.taxId}}          # Tax ID Number
```

#### Contract Details
```
{{contract.startDate}}    # Contract Start Date
{{contract.endDate}}      # Contract End Date
{{contract.duration}}     # Contract Duration
{{contract.type}}         # Contract Type
{{contract.seats}}        # Selected Seats/Offices
{{contract.renewal}}      # Renewal Terms
{{contract.termination}}  # Termination Notice
```

#### Financial Information
```
{{billing.monthlyRate}}   # Monthly Rate
{{billing.totalAmount}}   # Total Contract Amount
{{billing.paymentMethod}} # Payment Method
{{billing.deposit}}       # Security Deposit
{{billing.lateFee}}       # Late Payment Fee
{{billing.currency}}      # Currency
{{billing.paymentTerms}}  # Payment Terms
```

#### Office Information
```
{{office.location}}       # Office Location
{{office.floor}}          # Floor Number
{{office.area}}           # Office Area
{{office.amenities}}      # Included Amenities
{{office.access}}         # Access Hours
{{office.parking}}        # Parking Information
```

#### System Information
```
{{system.companyName}}    # Your Company Name
{{system.companyAddress}} # Your Company Address
{{system.contactInfo}}    # Your Contact Information
{{system.legalName}}      # Legal Company Name
{{system.registration}}   # Company Registration Number
{{system.taxId}}          # Company Tax ID
```

#### Date Variables
```
{{date.today}}            # Current Date
{{date.signature}}        # Signature Date
{{date.effective}}        # Effective Date
{{date.expiry}}           # Expiry Date
```

## Advanced Features

### 1. Multiple Templates
You can have multiple Word templates:

```
public/docs/
├── contract_template.docx
├── lease_agreement.docx
├── service_agreement.docx
└── renewal_contract.docx
```

### 2. Template Selection
Update the template loading to include multiple options:

```javascript
const loadTemplates = async () => {
  const templateList = [
    {
      id: 'contract-template-001',
      name: 'Standard Contract Template',
      file: 'contract_template.docx',
      description: 'Your main contract template',
      format: 'docx'
    },
    {
      id: 'lease-agreement-001',
      name: 'Lease Agreement',
      file: 'lease_agreement.docx',
      description: 'Detailed lease agreement',
      format: 'docx'
    }
  ];
  setTemplates(templateList);
};
```

### 3. PDF Generation
To generate PDFs from Word documents, you can use:

```bash
npm install puppeteer
```

```javascript
const puppeteer = require('puppeteer');

app.post('/api/generate-pdf', async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Convert Word to HTML first, then to PDF
  const html = await convertWordToHtml(templatePath, variables);
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  
  await browser.close();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});
```

### 4. Email Integration
Send generated contracts via email:

```javascript
const nodemailer = require('nodemailer');

app.post('/api/send-contract', async (req, res) => {
  const { tenantEmail, contractBuffer } = req.body;
  
  const transporter = nodemailer.createTransporter({
    // Your email configuration
  });
  
  await transporter.sendMail({
    to: tenantEmail,
    subject: 'Your Contract Document',
    attachments: [{
      filename: 'contract.docx',
      content: contractBuffer
    }]
  });
});
```

## Testing Your Implementation

### 1. Test Template Loading
```javascript
// Test if your template loads correctly
const testTemplate = async () => {
  const response = await fetch('/api/templates');
  const data = await response.json();
  console.log('Available templates:', data.templates);
};
```

### 2. Test Variable Replacement
```javascript
// Test variable replacement
const testVariables = {
  '{{tenant.name}}': 'John Doe',
  '{{tenant.company}}': 'ABC Corp',
  '{{billing.monthlyRate}}': '₱15,000'
};
```

### 3. Test Document Generation
```javascript
// Test full document generation
const testGeneration = async () => {
  const response = await fetch('/api/generate-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables: testVariables })
  });
  
  if (response.ok) {
    console.log('Document generated successfully!');
  }
};
```

## Troubleshooting

### Common Issues

1. **Template not found**
   - Check file path in backend
   - Ensure template exists in public/docs
   - Verify file permissions

2. **Variables not replacing**
   - Check variable syntax in template
   - Ensure exact match between template and code
   - Verify variable names are correct

3. **Document generation fails**
   - Check backend logs for errors
   - Verify all dependencies are installed
   - Test with simple template first

### Debug Tips

1. **Console Logging**
   ```javascript
   console.log('Template path:', templatePath);
   console.log('Variables:', variables);
   console.log('Document text:', documentText);
   ```

2. **Test with Simple Template**
   Create a simple test template with just a few variables

3. **Check File Permissions**
   Ensure your backend can read files from public/docs

## Benefits of This Approach

### ✅ **Professional Documents**
- Maintains Word formatting
- Professional appearance
- Easy to customize

### ✅ **Version Control**
- Templates stored in codebase
- Track changes with Git
- Easy rollback

### ✅ **Dynamic Content**
- Automatic tenant data injection
- Real-time variable editing
- Consistent formatting

### ✅ **Scalable**
- Multiple templates supported
- Easy to add new variables
- Extensible system

This implementation gives you a professional contract generation system that uses your existing Word template and dynamically populates it with tenant details!
