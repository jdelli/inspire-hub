# Contract Generation Error Debugging Guide

## Error Analysis
The error `generateContract@http://localhost:3001/_next/static/chunks/src_app_(admin)_components_dbadefc7._.js:3458:23` indicates that there's an issue with the contract generation functionality in your application.

## Root Cause Analysis

### Possible Causes:
1. **Missing Dependencies** - Required libraries not installed
2. **Template File Issues** - Word template not accessible
3. **Data Validation** - Invalid or missing tenant data
4. **Browser Compatibility** - Missing browser APIs
5. **Import/Export Issues** - Circular dependencies or module loading problems

## Solutions Implemented

### 1. Enhanced Error Handling
- Added better error messages in `contractGenerator.js`
- Added validation for tenant data
- Improved error catching and reporting

### 2. Error Boundary Component
- Created `ContractErrorBoundary.jsx` to catch and handle contract generation errors
- Provides user-friendly error messages
- Includes retry functionality

### 3. Debugging Component
- Created `ContractDebugger.jsx` to diagnose issues
- Tests all dependencies and APIs
- Provides detailed diagnostic information

## How to Use the Debugging Tools

### Step 1: Add Error Boundary
Wrap your contract generation components with the error boundary:

```javascript
import ContractErrorBoundary from './ContractErrorBoundary';

// In your component:
<ContractErrorBoundary>
  <YourContractComponent />
</ContractErrorBoundary>
```

### Step 2: Use the Debugger
Add the debugger component to test contract generation:

```javascript
import ContractDebugger from './ContractDebugger';

// In your component:
<ContractDebugger tenant={tenantData} tenantType="dedicated" />
```

### Step 3: Check Dependencies
Ensure all required packages are installed:

```bash
npm install docx mammoth pizzip docxtemplater file-saver
```

## Common Issues and Fixes

### Issue 1: Missing Dependencies
**Error:** `PizZip is not defined` or `Docxtemplater is not defined`

**Solution:**
```bash
npm install pizzip docxtemplater
```

### Issue 2: Template File Not Found
**Error:** `Failed to fetch template: 404 Not Found`

**Solution:**
1. Ensure `contract_template.docx` exists in `public/docs/`
2. Check file permissions
3. Verify the file path is correct

### Issue 3: Invalid Tenant Data
**Error:** `Tenant data is required` or `Cannot read property of undefined`

**Solution:**
```javascript
// Validate tenant data before generating contract
const validateTenantData = (tenant) => {
  return tenant && 
         tenant.name && 
         tenant.email && 
         tenant.billing;
};

if (validateTenantData(tenantData)) {
  // Generate contract
} else {
  console.error('Invalid tenant data:', tenantData);
}
```

### Issue 4: Browser Compatibility
**Error:** `Blob is not defined` or `URL.createObjectURL is not a function`

**Solution:**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Check if you're in a server-side environment
- Add polyfills if needed

## Testing Your Fix

### 1. Run the Debugger
Use the `ContractDebugger` component to test all functionality:

```javascript
// Add this to your component for testing
<ContractDebugger tenant={testTenant} tenantType="dedicated" />
```

### 2. Test with Sample Data
```javascript
const testTenant = {
  name: 'John Doe',
  company: 'Test Company',
  email: 'john@test.com',
  phone: '123-456-7890',
  address: '123 Test Street',
  billing: {
    rate: 10000,
    cusaFee: 1000,
    parkingFee: 500,
    startDate: new Date().toISOString().split('T')[0],
    monthsToAvail: 12
  }
};
```

### 3. Check Console Logs
Look for specific error messages in the browser console that will help identify the exact issue.

## Integration Steps

### 1. Add to Your Tenants Component
```javascript
import ContractErrorBoundary from './ContractErrorBoundary';
import ContractDebugger from './ContractDebugger';

// Wrap your contract generation with error boundary
<ContractErrorBoundary>
  <ContractTemplateIntegration 
    tenant={client} 
    tenantType={tenantType} 
  />
</ContractErrorBoundary>

// Add debugger for testing (remove in production)
{process.env.NODE_ENV === 'development' && (
  <ContractDebugger tenant={client} tenantType={tenantType} />
)}
```

### 2. Update Your Contract Generation
```javascript
import { contractGeneratorDocx } from '../utils/contractGenerator';

const handleGenerateContract = async () => {
  try {
    const contractBlob = await contractGeneratorDocx.generateContract(tenantData);
    // Handle successful generation
  } catch (error) {
    console.error('Contract generation failed:', error);
    // Show user-friendly error message
  }
};
```

## Production Considerations

### 1. Remove Debug Components
Remove or conditionally render debug components in production:

```javascript
{process.env.NODE_ENV === 'development' && <ContractDebugger />}
```

### 2. Add Error Logging
Implement proper error logging for production:

```javascript
const logError = (error, context) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    console.error('Contract Error:', error, context);
  }
};
```

### 3. Fallback Options
Provide fallback options when contract generation fails:

```javascript
const handleContractGeneration = async () => {
  try {
    await generateWordContract();
  } catch (error) {
    // Fallback to PDF or text generation
    try {
      await generatePDFContract();
    } catch (pdfError) {
      // Final fallback to text
      generateTextContract();
    }
  }
};
```

## Quick Fix Checklist

- [ ] Install required dependencies: `npm install docx mammoth pizzip docxtemplater file-saver`
- [ ] Verify `contract_template.docx` exists in `public/docs/`
- [ ] Add error boundary around contract components
- [ ] Run the debugger to identify specific issues
- [ ] Check browser console for detailed error messages
- [ ] Validate tenant data before contract generation
- [ ] Test with sample data first

## Support

If you continue to experience issues:

1. Run the `ContractDebugger` component
2. Check the browser console for specific error messages
3. Verify all dependencies are properly installed
4. Test with the provided sample tenant data
5. Check file permissions for the template file

The debugging tools will help identify the exact cause of the error and provide specific guidance for fixing it.
