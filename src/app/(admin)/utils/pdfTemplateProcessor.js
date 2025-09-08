/**
 * PDF Template Processor
 * Handles processing PDF templates with dynamic tenant data
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getActiveContractTemplate } from './contractTemplateManager';

/**
 * Process PDF template with tenant data
 * @param {Object} tenantData - Tenant information
 * @param {string} tenantType - Type of tenant (dedicated, private, virtual)
 * @returns {Promise<Object>} - Processed PDF data
 */
export async function processPDFTemplate(tenantData, tenantType = 'dedicated') {
  try {
    // Get the active template for this tenant type
    const template = await getActiveContractTemplate(tenantType);
    
    if (!template) {
      throw new Error(`No active PDF template found for ${tenantType} tenant type`);
    }

    // Check if the template is a PDF
    if (template.mimeType !== 'application/pdf') {
      throw new Error('Selected template is not a PDF file');
    }

    // Download the PDF template
    const response = await fetch(template.downloadURL);
    const templateBytes = await response.arrayBuffer();

    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the form (if it has fillable fields)
    const form = pdfDoc.getForm();
    
    // If PDF has form fields, fill them
    if (form) {
      await fillPDFFormFields(form, tenantData, tenantType);
    }

    // Add text overlays for additional data
    await addTextOverlays(pdfDoc, tenantData, tenantType);

    // Generate the final PDF
    const pdfBytes = await pdfDoc.save();
    
    return {
      success: true,
      pdfBytes: pdfBytes,
      templateId: template.id,
      templateName: template.name,
      metadata: {
        tenantName: tenantData.name,
        tenantCompany: tenantData.company,
        tenantType: tenantType,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error processing PDF template:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fill PDF form fields with tenant data
 * @param {Object} form - PDF form object
 * @param {Object} tenantData - Tenant information
 * @param {string} tenantType - Type of tenant
 */
async function fillPDFFormFields(form, tenantData, tenantType) {
  // Get all form fields
  const fields = form.getFields();
  
  // Create a mapping of common field names to tenant data
  const fieldMappings = createFieldMappings(tenantData, tenantType);
  
  fields.forEach(field => {
    const fieldName = field.getName().toLowerCase();
    const fieldType = field.constructor.name;
    
    // Try to find a matching value for this field
    const value = findFieldValue(fieldName, fieldMappings);
    
    if (value) {
      try {
        if (fieldType === 'PDFTextField') {
          field.setText(String(value));
        } else if (fieldType === 'PDFCheckBox') {
          // For checkboxes, check if the value indicates it should be checked
          const shouldCheck = ['true', 'yes', '1', 'on', 'checked'].includes(String(value).toLowerCase());
          if (shouldCheck) {
            field.check();
          }
        } else if (fieldType === 'PDFRadioGroup') {
          // For radio buttons, try to select the option that matches the value
          try {
            field.select(String(value));
          } catch (e) {
            console.warn(`Could not select radio option "${value}" for field "${fieldName}"`);
          }
        }
      } catch (error) {
        console.warn(`Error filling field "${fieldName}":`, error.message);
      }
    }
  });
}

/**
 * Add text overlays to PDF pages
 * @param {Object} pdfDoc - PDF document
 * @param {Object} tenantData - Tenant information
 * @param {string} tenantType - Type of tenant
 */
async function addTextOverlays(pdfDoc, tenantData, tenantType) {
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Define standard positions for common data (you can customize these)
  const overlayPositions = {
    tenantName: { x: 100, y: 700, size: 12 },
    tenantCompany: { x: 100, y: 680, size: 10 },
    tenantEmail: { x: 100, y: 660, size: 9 },
    tenantPhone: { x: 100, y: 640, size: 9 },
    contractDate: { x: 400, y: 700, size: 10 },
    monthlyRate: { x: 400, y: 680, size: 12 }
  };

  // Add text to first page (you can extend this to other pages)
  if (pages.length > 0) {
    const firstPage = pages[0];
    const fieldMappings = createFieldMappings(tenantData, tenantType);
    
    // Add tenant name
    if (fieldMappings.tenantName) {
      firstPage.drawText(fieldMappings.tenantName, {
        x: overlayPositions.tenantName.x,
        y: overlayPositions.tenantName.y,
        size: overlayPositions.tenantName.size,
        font: font,
        color: rgb(0, 0, 0)
      });
    }
    
    // Add company name
    if (fieldMappings.tenantCompany) {
      firstPage.drawText(fieldMappings.tenantCompany, {
        x: overlayPositions.tenantCompany.x,
        y: overlayPositions.tenantCompany.y,
        size: overlayPositions.tenantCompany.size,
        font: font,
        color: rgb(0, 0, 0)
      });
    }
    
    // Add current date
    firstPage.drawText(new Date().toLocaleDateString(), {
      x: overlayPositions.contractDate.x,
      y: overlayPositions.contractDate.y,
      size: overlayPositions.contractDate.size,
      font: font,
      color: rgb(0, 0, 0)
    });
  }
}

/**
 * Create field mappings from tenant data
 * @param {Object} tenantData - Tenant information
 * @param {string} tenantType - Type of tenant
 * @returns {Object} - Field mappings
 */
function createFieldMappings(tenantData, tenantType) {
  const currentDate = new Date().toLocaleDateString();
  const startDate = tenantData.billing?.startDate || currentDate;
  const monthsToAvail = tenantData.billing?.monthsToAvail || 12;
  const endDate = calculateEndDate(startDate, monthsToAvail);

  return {
    // Tenant Information
    tenantName: tenantData.name || '',
    tenantCompany: tenantData.company || '',
    tenantEmail: tenantData.email || '',
    tenantPhone: tenantData.phone || '',
    tenantAddress: tenantData.address || '',
    
    // Contract Details
    contractStartDate: startDate,
    contractEndDate: endDate,
    contractDuration: `${monthsToAvail} months`,
    contractType: tenantType,
    selectedSeats: getSelectedSeats(tenantData),
    
    // Financial Information
    monthlyRate: formatCurrency(tenantData.billing?.rate || 0),
    cusaFee: formatCurrency(tenantData.billing?.cusaFee || 0),
    parkingFee: formatCurrency(tenantData.billing?.parkingFee || 0),
    totalMonthly: formatCurrency(getTotalMonthly(tenantData.billing)),
    securityDeposit: formatCurrency((tenantData.billing?.rate || 0) * 2),
    
    // System Information
    companyName: 'INSPIRE HOLDINGS INC.',
    companyAddress: '6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig',
    
    // Dates
    currentDate: currentDate,
    signatureDate: currentDate
  };
}

/**
 * Find field value based on field name
 * @param {string} fieldName - Field name (lowercase)
 * @param {Object} mappings - Field mappings
 * @returns {string|null} - Field value or null
 */
function findFieldValue(fieldName, mappings) {
  // Define possible field name variations
  const fieldVariations = {
    // Tenant name variations
    'tenant_name': mappings.tenantName,
    'tenantname': mappings.tenantName,
    'client_name': mappings.tenantName,
    'lessee_name': mappings.tenantName,
    'name': mappings.tenantName,
    
    // Company variations
    'company_name': mappings.tenantCompany,
    'companyname': mappings.tenantCompany,
    'company': mappings.tenantCompany,
    'business_name': mappings.tenantCompany,
    
    // Contact information
    'email': mappings.tenantEmail,
    'email_address': mappings.tenantEmail,
    'phone': mappings.tenantPhone,
    'phone_number': mappings.tenantPhone,
    'contact_number': mappings.tenantPhone,
    'address': mappings.tenantAddress,
    
    // Contract dates
    'start_date': mappings.contractStartDate,
    'contract_start': mappings.contractStartDate,
    'end_date': mappings.contractEndDate,
    'contract_end': mappings.contractEndDate,
    'duration': mappings.contractDuration,
    'term': mappings.contractDuration,
    
    // Financial terms
    'monthly_rate': mappings.monthlyRate,
    'monthly_rent': mappings.monthlyRate,
    'rent': mappings.monthlyRate,
    'cusa_fee': mappings.cusaFee,
    'parking_fee': mappings.parkingFee,
    'security_deposit': mappings.securityDeposit,
    'deposit': mappings.securityDeposit,
    
    // Dates
    'date': mappings.currentDate,
    'current_date': mappings.currentDate,
    'signature_date': mappings.signatureDate
  };
  
  return fieldVariations[fieldName] || null;
}

/**
 * Get selected seats/offices as string
 * @param {Object} tenantData - Tenant data
 * @returns {string} - Selected seats/offices
 */
function getSelectedSeats(tenantData) {
  if (tenantData.selectedSeats && tenantData.selectedSeats.length > 0) {
    return Array.isArray(tenantData.selectedSeats) 
      ? tenantData.selectedSeats.join(', ') 
      : tenantData.selectedSeats;
  }
  
  if (tenantData.selectedPO && tenantData.selectedPO.length > 0) {
    return Array.isArray(tenantData.selectedPO) 
      ? tenantData.selectedPO.join(', ') 
      : tenantData.selectedPO;
  }
  
  if (tenantData.virtualOfficeFeatures && tenantData.virtualOfficeFeatures.length > 0) {
    return tenantData.virtualOfficeFeatures.join(', ');
  }
  
  return 'Not specified';
}

/**
 * Calculate total monthly amount
 * @param {Object} billing - Billing information
 * @returns {number} - Total monthly amount
 */
function getTotalMonthly(billing) {
  if (!billing) return 0;
  
  const rate = parseFloat(billing.rate) || 0;
  const cusaFee = parseFloat(billing.cusaFee) || 0;
  const parkingFee = parseFloat(billing.parkingFee) || 0;
  
  return rate + cusaFee + parkingFee;
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
function formatCurrency(amount) {
  if (!amount) return '₱0.00';
  return `₱${parseFloat(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Calculate end date from start date and duration
 * @param {string} startDate - Start date
 * @param {number} months - Duration in months
 * @returns {string} - End date
 */
function calculateEndDate(startDate, months) {
  if (!startDate || !months) return '';
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  
  return end.toLocaleDateString();
}

/**
 * Download generated PDF
 * @param {Uint8Array} pdfBytes - PDF data
 * @param {string} fileName - File name
 */
export function downloadPDF(pdfBytes, fileName) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Preview PDF in new window
 * @param {Uint8Array} pdfBytes - PDF data
 * @param {string} title - Window title
 */
export function previewPDF(pdfBytes, title = 'Contract Preview') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  if (newWindow) {
    newWindow.document.title = title;
  }
}

export default {
  processPDFTemplate,
  downloadPDF,
  previewPDF
};