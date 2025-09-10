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
    companyName: "INSPIRE HOLDINGS INC.",
    companyAddress: "6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    ceoName: "PATRICK PEREZ",
    
    // Client information
    clientName: tenant.name || "[CLIENT NAME]",
    clientAddress: tenant.address || "[CLIENT ADDRESS]",
    clientPhone: tenant.phone || "[CLIENT PHONE]",
    clientEmail: tenant.email || "[CLIENT EMAIL]",
    citizenship: tenant.citizenship || tenant.nationality || "",
    
    // Contract details
    contractNumber: contractNumber,
    contractDate: formatDate(new Date()),
    contractLocation: "Taguig City, Philippines",
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    paymentDate: formatDate(new Date()),
    
    // Workspace information
    workspaceType: workspaceType,
    workspaceDetails: "Alliance Global Tower, 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City",
    
    // Financial information
    monthlyRent: formatNumber(monthlyRate),
    cusaFee: formatNumber(cusaFee),
    parkingFee: formatNumber(parkingFee),
    securityDeposit: formatNumber(monthlyRate * 2), // 2 months security deposit
    advanceRental: formatNumber(monthlyRate * 2), // 2 months advance rental
    totalInitialPayment: formatNumber((monthlyRate * 2) + (monthlyRate * 2)), // advance + security
    paymentTerms: getPaymentTerms(tenant.billing?.paymentMethod, tenant.billing?.paymentTerms),
    
    // Notary information (placeholders for now - can be filled when contract is finalized)
    docNo: generateDocNumber(),
    pageNo: "1",
    bookNo: generateBookNumber(),
    notaryDate: formatDate(new Date()),
    notaryLocation: "Taguig City"
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
      return "one (1) dedicated desk/cubicle area";
    case 'private':
      return "one (1) private office space";
    case 'virtual':
      return "virtual office services and facilities";
    default:
      return "one (1) workspace";
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
 * Formats number without currency symbol for contract template
 */
function formatNumber(amount) {
  if (!amount || isNaN(amount)) return "0";
  
  return parseFloat(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Generates a document number for notary purposes
 */
function generateDocNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  
  return `DOC-${year}${month}${day}-${random}`;
}

/**
 * Generates a book number for notary purposes
 */
function generateBookNumber() {
  const year = new Date().getFullYear();
  const bookNumber = Math.floor(Math.random() * 99) + 1;
  
  return `${bookNumber}/${year}`;
}

/**
 * Returns default contract data when no tenant is provided
 */
function getDefaultContractData() {
  return {
    // Company information
    companyName: "INSPIRE HOLDINGS INC.",
    companyAddress: "6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    ceoName: "PATRICK PEREZ",
    
    // Client information
    clientName: "[CLIENT NAME]",
    clientAddress: "[CLIENT ADDRESS]",
    clientPhone: "[CLIENT PHONE]",
    clientEmail: "[CLIENT EMAIL]",
    citizenship: "[CITIZENSHIP]",
    
    // Contract details
    contractNumber: "[CONTRACT NUMBER]",
    contractDate: "[CONTRACT DATE]",
    contractLocation: "[CONTRACT LOCATION]",
    startDate: "[START DATE]",
    endDate: "[END DATE]",
    paymentDate: "[PAYMENT DATE]",
    
    // Workspace information
    workspaceType: "[WORKSPACE TYPE]",
    workspaceDetails: "[WORKSPACE DETAILS]",
    
    // Financial information
    monthlyRent: "[MONTHLY RENT]",
    cusaFee: "[CUSA FEE]",
    parkingFee: "[PARKING FEE]",
    securityDeposit: "[SECURITY DEPOSIT]",
    advanceRental: "[ADVANCE RENTAL]",
    totalInitialPayment: "[TOTAL INITIAL PAYMENT]",
    paymentTerms: "[PAYMENT TERMS]",
    
    // Notary information
    docNo: "[DOC NO]",
    pageNo: "[PAGE NO]",
    bookNo: "[BOOK NO]",
    notaryDate: "[NOTARY DATE]",
    notaryLocation: "[NOTARY LOCATION]"
  };
}

/**
 * Validates if tenant data is complete enough for contract generation
 */
export function validateTenantForContract(tenant) {
  const requiredFields = ['name', 'email', 'phone', 'address'];
  const recommendedFields = ['citizenship', 'nationality'];
  
  const missingFields = requiredFields.filter(field => !tenant[field]);
  const missingRecommended = recommendedFields.filter(field => !tenant[field]);
  
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields,
    missingRecommended: missingRecommended,
    message: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(', ')}`
      : missingRecommended.length > 0
      ? `Contract ready. Optional fields missing: ${missingRecommended.join(', ')}`
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
