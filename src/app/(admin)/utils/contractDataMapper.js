/**
 * Utility functions to map tenant data to contract template format
 */

/**
 * Maps tenant data to contract template data format
 * @param {Object} tenant - Tenant data from database
 * @param {string} tenantType - Type of tenant (dedicated, private, virtual)
 * @returns {Object} Contract data formatted for ContractTemplate component
 */
export function mapTenantToContractData(tenant, tenantType = 'dedicated') {
  if (!tenant) {
    return getDefaultContractData();
  }

  // Calculate dates
  const startDate = tenant.billing?.startDate || new Date().toISOString().split('T')[0];
  const monthsToAvail = tenant.billing?.monthsToAvail || 12;
  const endDate = calculateEndDate(startDate, monthsToAvail);
  
  // Calculate financial amounts
  const monthlyRate = parseFloat(tenant.billing?.rate) || 0;
  const cusaFee = parseFloat(tenant.billing?.cusaFee) || 0;
  const parkingFee = parseFloat(tenant.billing?.parkingFee) || 0;
  const totalMonthly = monthlyRate + cusaFee + parkingFee;
  const securityDeposit = monthlyRate; // Typically one month's rent
  const totalAmount = totalMonthly * monthsToAvail;

  // Determine workspace details based on tenant type
  const workspaceDetails = getWorkspaceDetails(tenant, tenantType);
  const workspaceType = getWorkspaceType(tenantType);

  // Generate contract number
  const contractNumber = generateContractNumber(tenant, tenantType);

  return {
    // Company information (Inspire Hub details)
    companyName: "Inspire Hub",
    companyAddress: "123 Business District, Metro Manila, Philippines",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    
    // Client information
    clientName: tenant.name || "[CLIENT NAME]",
    clientAddress: tenant.address || "[CLIENT ADDRESS]",
    clientPhone: tenant.phone || "[CLIENT PHONE]",
    clientEmail: tenant.email || "[CLIENT EMAIL]",
    
    // Contract details
    contractNumber: contractNumber,
    contractDate: formatDate(new Date()),
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    
    // Workspace information
    workspaceType: workspaceType,
    workspaceDetails: workspaceDetails,
    
    // Financial information
    monthlyRate: formatCurrency(totalMonthly),
    securityDeposit: formatCurrency(securityDeposit),
    totalAmount: formatCurrency(totalAmount),
    paymentTerms: getPaymentTerms(tenant.billing?.paymentMethod, tenant.billing?.paymentTerms)
  };
}

/**
 * Gets workspace details based on tenant type and data
 */
function getWorkspaceDetails(tenant, tenantType) {
  switch (tenantType) {
    case 'dedicated':
      if (tenant.selectedSeats && tenant.selectedSeats.length > 0) {
        return Array.isArray(tenant.selectedSeats) 
          ? tenant.selectedSeats.join(', ')
          : tenant.selectedSeats;
      }
      return "Dedicated Desk - Location to be assigned";
    
    case 'private':
      if (tenant.selectedPO && tenant.selectedPO.length > 0) {
        return Array.isArray(tenant.selectedPO) 
          ? tenant.selectedPO.join(', ')
          : tenant.selectedPO;
      }
      return "Private Office - Location to be assigned";
    
    case 'virtual':
      if (tenant.virtualOfficeFeatures && tenant.virtualOfficeFeatures.length > 0) {
        return Array.isArray(tenant.virtualOfficeFeatures) 
          ? tenant.virtualOfficeFeatures.join(', ')
          : tenant.virtualOfficeFeatures;
      }
      return "Virtual Office Services";
    
    default:
      return "Workspace - Details to be specified";
  }
}

/**
 * Gets workspace type description
 */
function getWorkspaceType(tenantType) {
  switch (tenantType) {
    case 'dedicated':
      return "Dedicated Desk";
    case 'private':
      return "Private Office";
    case 'virtual':
      return "Virtual Office";
    default:
      return "Workspace";
  }
}

/**
 * Generates a unique contract number
 */
function generateContractNumber(tenant, tenantType) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const typePrefix = {
    'dedicated': 'DD',
    'private': 'PO',
    'virtual': 'VO'
  }[tenantType] || 'WS';
  
  const tenantInitials = tenant.name 
    ? tenant.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'TENANT';
  
  return `${typePrefix}-${year}${month}${day}-${tenantInitials}`;
}

/**
 * Gets payment terms description
 */
function getPaymentTerms(paymentMethod, customTerms) {
  if (customTerms) {
    return customTerms;
  }
  
  const method = paymentMethod || 'Bank Transfer';
  return `Monthly payment via ${method}, due on the 1st day of each month`;
}

/**
 * Calculates end date based on start date and duration
 */
function calculateEndDate(startDate, months) {
  if (!startDate || !months) return "[END DATE]";
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  
  return formatDate(end);
}

/**
 * Formats date to readable string
 */
function formatDate(date) {
  if (!date) return "[DATE]";
  
  const d = new Date(date);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats currency to Philippine Peso format
 */
function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return "₱0.00";
  
  return `₱${parseFloat(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Returns default contract data when no tenant is provided
 */
function getDefaultContractData() {
  return {
    companyName: "Inspire Hub",
    companyAddress: "123 Business District, Metro Manila, Philippines",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    clientName: "[CLIENT NAME]",
    clientAddress: "[CLIENT ADDRESS]",
    clientPhone: "[CLIENT PHONE]",
    clientEmail: "[CLIENT EMAIL]",
    contractNumber: "[CONTRACT NUMBER]",
    contractDate: "[CONTRACT DATE]",
    startDate: "[START DATE]",
    endDate: "[END DATE]",
    workspaceType: "[WORKSPACE TYPE]",
    workspaceDetails: "[WORKSPACE DETAILS]",
    monthlyRate: "[MONTHLY RATE]",
    securityDeposit: "[SECURITY DEPOSIT]",
    totalAmount: "[TOTAL AMOUNT]",
    paymentTerms: "[PAYMENT TERMS]"
  };
}

/**
 * Validates if tenant data is complete enough for contract generation
 */
export function validateTenantForContract(tenant) {
  const requiredFields = ['name', 'email', 'phone', 'address'];
  const missingFields = requiredFields.filter(field => !tenant[field]);
  
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields,
    message: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(', ')}`
      : 'Tenant data is complete for contract generation'
  };
}

/**
 * Gets contract preview data for display
 */
export function getContractPreviewData(tenant, tenantType = 'dedicated') {
  const contractData = mapTenantToContractData(tenant, tenantType);
  const validation = validateTenantForContract(tenant);
  
  return {
    contractData,
    validation,
    tenantType,
    generatedAt: new Date().toISOString()
  };
}
