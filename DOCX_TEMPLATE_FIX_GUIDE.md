# DOCX Template Fix Guide

## Problem
You can download the DOCX template but the tenant details are not being populated in the generated contract.

## Root Cause
The issue is that your Word template (`public/docs/contract_template.docx`) doesn't contain the correct placeholder variables that match what the contract generator is trying to replace.

## Solution

### Step 1: Use the Debug Tool
1. **Open the DOCX Contract Generator** in your application
2. **Click "Debug Template Variables"** button
3. **Review the available variables** - This will show you exactly what variables are available
4. **Copy the template example** - Use this as a reference for your Word template

### Step 2: Update Your Word Template
1. **Open your Word template**: `public/docs/contract_template.docx`
2. **Replace static text with variables** using the format `{{variableName}}`
3. **Use the example template** from the debugger as a guide

### Step 3: Available Variables
The contract generator provides these variables:

#### Tenant Information
- `{{tenantName}}` - Tenant's full name
- `{{tenantCompany}}` - Tenant's company name
- `{{tenantEmail}}` - Tenant's email address
- `{{tenantPhone}}` - Tenant's phone number
- `{{tenantAddress}}` - Tenant's address

#### Contract Details
- `{{contractStartDate}}` - Contract start date
- `{{contractEndDate}}` - Contract end date
- `{{contractDate}}` - Contract execution date
- `{{paymentDueDate}}` - Payment due date

#### Financial Information
- `{{monthlyRent}}` - Monthly rent amount (formatted)
- `{{cusa}}` - CUSA fee (formatted)
- `{{parkingFee}}` - Parking fee (formatted)
- `{{securityDeposit}}` - Security deposit (formatted)
- `{{advanceRental}}` - Advance rental (formatted)
- `{{totalInitialPayment}}` - Total initial payment (formatted)

#### Company Information
- `{{companyName}}` - Your company name
- `{{companyAddress}}` - Your company address
- `{{representativeName}}` - Representative name
- `{{representativeTitle}}` - Representative title

#### Other
- `{{currentYear}}` - Current year

### Step 4: Example Template
Here's an example of how your Word template should look:

```
CONTRACT OF LEASE

This agreement is made between {{companyName}} and {{tenantName}} ({{tenantCompany}}).

TENANT DETAILS:
Name: {{tenantName}}
Company: {{tenantCompany}}
Email: {{tenantEmail}}
Phone: {{tenantPhone}}
Address: {{tenantAddress}}

CONTRACT TERMS:
Start Date: {{contractStartDate}}
End Date: {{contractEndDate}}
Monthly Rent: {{monthlyRent}}
CUSA Fee: {{cusa}}
Parking Fee: {{parkingFee}}

FINANCIAL TERMS:
Security Deposit: {{securityDeposit}}
Advance Rental: {{advanceRental}}
Total Initial Payment: {{totalInitialPayment}}

Contract Date: {{contractDate}}
Payment Due Date: {{paymentDueDate}}

Company: {{companyName}}
Address: {{companyAddress}}
Representative: {{representativeName}}
Title: {{representativeTitle}}

Year: {{currentYear}}
```

### Step 5: Test the Fix
1. **Save your updated Word template**
2. **Try generating a contract** using the DOCX generator
3. **Check if the variables are replaced** with actual tenant data
4. **Use the debugger** if you need to see what variables are available

## Common Issues and Fixes

### Issue 1: Variables Not Replaced
**Problem:** Variables like `{{tenantName}}` appear as-is in the generated document

**Solution:** 
- Check that your Word template contains the exact variable names
- Variables are case-sensitive
- Make sure variables are wrapped in double curly braces

### Issue 2: Missing Data
**Problem:** Some fields show as empty or "N/A"

**Solution:**
- Check that the tenant data contains the required information
- Use the debugger to see what data is available
- Verify that the tenant has billing information

### Issue 3: Formatting Issues
**Problem:** Numbers or dates don't look right

**Solution:**
- The system automatically formats currency and dates
- Use the formatted variables (e.g., `{{monthlyRent}}` instead of raw numbers)
- Check the debugger to see the formatted values

## Testing Your Template

### 1. Use the Debugger
The debugger shows you:
- All available variables
- Current values for each variable
- Example template format
- Copy-paste ready examples

### 2. Test with Sample Data
Make sure your tenant has:
- Name and company information
- Billing details (rate, fees, dates)
- Contact information

### 3. Verify the Output
After generating a contract:
- Check that all variables are replaced
- Verify that formatting looks correct
- Ensure all required information is present

## Advanced Tips

### 1. Custom Variables
You can add custom variables by modifying the `prepareTemplateData` function in `contractGenerator.js`

### 2. Conditional Content
For conditional content, you can use multiple variables:
```
{{tenantCompany}} (if representing a company)
{{tenantName}} (if individual)
```

### 3. Formatting
The system automatically formats:
- Currency amounts (with ₱ symbol)
- Dates (in readable format)
- Numbers (with proper formatting)

## Troubleshooting

### If Variables Still Don't Work:
1. **Check the debugger** - See what variables are actually available
2. **Verify template format** - Make sure you're using the correct syntax
3. **Test with simple variables** - Start with basic ones like `{{tenantName}}`
4. **Check console logs** - Look for any error messages

### If You Get Errors:
1. **Check the browser console** for error messages
2. **Verify tenant data** is complete
3. **Test with a simple template** first
4. **Use the debugger** to identify issues

## Support

If you continue to have issues:
1. Use the "Debug Template Variables" button to see available variables
2. Check the browser console for error messages
3. Verify your Word template contains the correct variable names
4. Test with the provided example template

The debugger tool will help you identify exactly what's wrong and provide the correct variable names to use in your template.
