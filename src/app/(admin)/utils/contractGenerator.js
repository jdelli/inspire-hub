/**
 * Contract Generation Utility
 * Generates lease contracts for different tenant types based on the INSPIRE Holdings template
 */

import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
// Dynamic import to avoid circular dependency
// import { getActiveContractTemplate } from './contractTemplateManager';

// Company information
const COMPANY_INFO = {
  name: "INSPIRE HOLDINGS INC.",
  type: "A corporation duly organized and existing under the laws of the Republic of the Philippines",
  address: "6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig",
  representative: "PATRICK PEREZ",
  representativeTitle: "Chief Executive Officer"
};

// Helper function to format currency
function formatCurrency(amount) {
  if (!amount) return '₱0.00';
  return `₱${parseFloat(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to calculate contract end date
function calculateContractEndDate(startDate, months) {
  if (!startDate || !months) return '';
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end.toISOString().split('T')[0];
}

// Helper function to get lease type description
function getLeaseTypeDescription(tenantType, tenantData) {
  const safeTenantData = tenantData || {};
  switch (tenantType) {
    case 'dedicated':
      return `one (1) designated desk/cubicle area managed by the LESSOR at Alliance Global Tower, with physical address at 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City`;
    case 'private':
      const offices = Array.isArray(safeTenantData.selectedPO) 
        ? safeTenantData.selectedPO.join(', ') 
        : safeTenantData.selectedPO || 'Private Office';
      return `private office space(s) (${offices}) managed by the LESSOR at Alliance Global Tower, with physical address at 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City`;
    case 'virtual':
      return `virtual office services managed by the LESSOR at Alliance Global Tower, with physical address at 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City`;
    default:
      return `designated workspace managed by the LESSOR at Alliance Global Tower, with physical address at 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City`;
  }
}

// Helper function to get rental breakdown
function getRentalBreakdown(tenantData) {
  const safeTenantData = tenantData || {};
  const rate = parseFloat(safeTenantData.billing?.rate) || 0;
  const cusaFee = parseFloat(safeTenantData.billing?.cusaFee) || 0;
  const parkingFee = parseFloat(safeTenantData.billing?.parkingFee) || 0;
  
  return {
    monthlyRent: rate,
    cusaFee: cusaFee,
    parkingFee: parkingFee,
    totalMonthly: rate + cusaFee + parkingFee
  };
}

// Helper function to get security deposit amount
function getSecurityDeposit(tenantData) {
  const safeTenantData = tenantData || {};
  const rate = parseFloat(safeTenantData.billing?.rate) || 0;
  return rate * 2; // 2 months security deposit
}

// Helper function to get advance rental amount
function getAdvanceRental(tenantData) {
  const safeTenantData = tenantData || {};
  const rate = parseFloat(safeTenantData.billing?.rate) || 0;
  return rate * 2; // 2 months advance rental
}

// Helper function to get total initial payment
function getTotalInitialPayment(tenantData) {
  return getSecurityDeposit(tenantData) + getAdvanceRental(tenantData);
}

// Function to generate contract using uploaded template
export async function generateLeaseContractFromTemplate(tenantData, tenantType = 'dedicated') {
  try {
    // Dynamic import to avoid circular dependency
    const { getActiveContractTemplate } = await import('./contractTemplateManager');
    
    // Get the active template for this tenant type
    const template = await getActiveContractTemplate(tenantType);
    
    if (!template) {
      console.warn(`No active template found for ${tenantType}, falling back to default generation`);
      return generateLeaseContract(tenantData, tenantType);
    }

    // Download the template file
    const response = await fetch(template.downloadURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    const templateContent = await response.text();
    
    // Replace placeholders in the template with actual tenant data
    const contractContent = replaceTemplatePlaceholders(templateContent, tenantData, tenantType);
    
    // Generate contract object with template-based content
    const contract = {
      ...generateLeaseContract(tenantData, tenantType),
      templateBased: true,
      templateId: template.id,
      templateName: template.name,
      content: contractContent
    };
    
    return contract;
    
  } catch (error) {
    console.error('Error generating contract from template:', error);
    // Fallback to default generation
    return generateLeaseContract(tenantData, tenantType);
  }
}

// Function to replace placeholders in template content
function replaceTemplatePlaceholders(templateContent, tenantData, tenantType) {
  // Add null checks and default values to prevent build errors
  const safeTenantData = tenantData || {};
  const contractData = generateLeaseContract(safeTenantData, tenantType);
  
  // Define placeholder mappings with safe fallbacks
  const placeholders = {
    // Company Information
    '{{COMPANY_NAME}}': contractData.lessor?.name || 'INSPIRE HOLDINGS INC.',
    '{{COMPANY_TYPE}}': contractData.lessor?.type || 'A corporation duly organized and existing under the laws of the Republic of the Philippines',
    '{{COMPANY_ADDRESS}}': contractData.lessor?.address || '6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig',
    '{{REPRESENTATIVE_NAME}}': contractData.lessor?.representative || 'PATRICK PEREZ',
    '{{REPRESENTATIVE_TITLE}}': contractData.lessor?.representativeTitle || 'Chief Executive Officer',
    
    // Tenant Information
    '{{TENANT_NAME}}': contractData.lessee?.name || 'TENANT_NAME',
    '{{TENANT_COMPANY}}': contractData.lessee?.company || 'COMPANY_NAME',
    '{{TENANT_ADDRESS}}': contractData.lessee?.address || 'TENANT_ADDRESS',
    '{{TENANT_EMAIL}}': contractData.lessee?.email || 'TENANT_EMAIL',
    '{{TENANT_PHONE}}': contractData.lessee?.phone || 'TENANT_PHONE',
    
    // Contract Details
    '{{CONTRACT_START_DATE}}': formatDate(contractData.contractDetails?.startDate) || 'CONTRACT_START_DATE',
    '{{CONTRACT_END_DATE}}': formatDate(contractData.contractDetails?.endDate) || 'CONTRACT_END_DATE',
    '{{CONTRACT_TERM}}': contractData.contractDetails?.term || 'CONTRACT_TERM',
    '{{LEASE_TYPE}}': contractData.contractDetails?.leaseType || 'LEASE_TYPE',
    '{{RENEWAL_OPTION}}': contractData.contractDetails?.renewalOption || 'RENEWAL_OPTION',
    
    // Financial Terms
    '{{MONTHLY_RENT}}': formatCurrency(contractData.financialTerms?.monthlyRent) || 'MONTHLY_RENT',
    '{{CUSA_FEE}}': formatCurrency(contractData.financialTerms?.cusaFee) || 'CUSA_FEE',
    '{{PARKING_FEE}}': formatCurrency(contractData.financialTerms?.parkingFee) || 'PARKING_FEE',
    '{{TOTAL_MONTHLY}}': formatCurrency(contractData.financialTerms?.totalMonthly) || 'TOTAL_MONTHLY',
    '{{SECURITY_DEPOSIT}}': formatCurrency(contractData.financialTerms?.securityDeposit) || 'SECURITY_DEPOSIT',
    '{{ADVANCE_RENTAL}}': formatCurrency(contractData.financialTerms?.advanceRental) || 'ADVANCE_RENTAL',
    '{{TOTAL_INITIAL_PAYMENT}}': formatCurrency(contractData.financialTerms?.totalInitialPayment) || 'TOTAL_INITIAL_PAYMENT',
    '{{VAT_RATE}}': contractData.financialTerms?.vatRate || 'VAT_RATE',
    '{{LATE_PAYMENT_FEE}}': contractData.financialTerms?.latePaymentFee || 'LATE_PAYMENT_FEE',
    
    // Contract ID and Metadata
    '{{CONTRACT_ID}}': contractData.metadata?.contractId || 'CONTRACT_ID',
    '{{GENERATED_DATE}}': formatDate(contractData.metadata?.generatedAt) || 'GENERATED_DATE',
    '{{TENANT_TYPE}}': contractData.metadata?.tenantType?.toUpperCase() || 'TENANT_TYPE',
    
    // Current Date
    '{{CURRENT_DATE}}': new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
  
  // Replace all placeholders
  let content = templateContent;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, value);
  });
  
  return content;
}

// Main contract generation function (fallback)
export function generateLeaseContract(tenantData, tenantType = 'dedicated') {
  // Add null checks to prevent build errors
  const safeTenantData = tenantData || {};
  const contractStartDate = safeTenantData.billing?.startDate || new Date().toISOString().split('T')[0];
  const contractEndDate = calculateContractEndDate(contractStartDate, safeTenantData.billing?.monthsToAvail || 12);
  const rentalBreakdown = getRentalBreakdown(safeTenantData);
  const securityDeposit = getSecurityDeposit(safeTenantData);
  const advanceRental = getAdvanceRental(safeTenantData);
  const totalInitialPayment = getTotalInitialPayment(safeTenantData);
  
  const contract = {
    // Header
    title: "CONTRACT OF LEASE",
    companyLogo: "INSPIRE",
    
    // Parties
    lessor: {
      name: COMPANY_INFO.name,
      type: COMPANY_INFO.type,
      address: COMPANY_INFO.address,
      representative: COMPANY_INFO.representative,
      representativeTitle: COMPANY_INFO.representativeTitle
    },
    
    lessee: {
      name: safeTenantData.name || "",
      company: safeTenantData.company || "",
      address: safeTenantData.address || "",
      email: safeTenantData.email || "",
      phone: safeTenantData.phone || ""
    },
    
    // Contract Details
    contractDetails: {
      startDate: contractStartDate,
      endDate: contractEndDate,
      term: safeTenantData.billing?.monthsToAvail || 12,
      leaseType: getLeaseTypeDescription(tenantType, safeTenantData),
      renewalOption: "with option to renew upon forty-five (45) days advance notice by the LESSEE and upon mutual agreement of both parties"
    },
    
    // Financial Terms
    financialTerms: {
      monthlyRent: rentalBreakdown.monthlyRent,
      cusaFee: rentalBreakdown.cusaFee,
      parkingFee: rentalBreakdown.parkingFee,
      totalMonthly: rentalBreakdown.totalMonthly,
      securityDeposit: securityDeposit,
      advanceRental: advanceRental,
      totalInitialPayment: totalInitialPayment,
      vatRate: 12,
      latePaymentFee: 5
    },
    
    // Services Included
    servicesIncluded: [
      "Internet Access (Wifi)",
      "Electrical Outlets",
      "Common Areas (Kitchen, Restroom, Lounge, etc.)",
      "Receipt of Mail",
      "Corporate Registration Service (upon request and approval)",
      "Janitorial Services - The LESSOR shall provide janitorial services to keep the common areas in order",
      "Electricity - The LESSOR shall provide electrical power to the Leased Premise"
    ],
    
    // Additional Services (for virtual office)
    additionalServices: tenantType === 'virtual' ? {
      meetingRoom: {
        rate: 3200,
        currency: "PHP",
        unit: "per hour",
        reservationRequired: true,
        advanceNotice: "3 days",
        cancellationFees: {
          sameDay: 60,
          oneDayPrior: 40,
          twoDaysOrMore: 0
        }
      },
      twoPersonBooth: {
        freeHours: 15,
        unit: "per month",
        additionalRate: 1500,
        currency: "PHP",
        unit: "per hour",
        reservationRequired: true,
        advanceNotice: "3 days"
      }
    } : null,
    
    // Usage Terms
    usageTerms: {
      hours: "Monday to Friday, 9:00 AM to 6:00 PM",
      closedDays: "Saturdays, Sundays, and public holidays",
      airConditioning: {
        hours: "9:00 A.M. to 6:00 P.M. Mondays through Fridays, except holidays",
        extendedRate: 3000,
        currency: "PHP",
        unit: "per hour",
        advanceNotice: "one-day prior written notice"
      }
    },
    
    // Generated metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      tenantType: tenantType,
      contractId: `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: "1.0"
    }
  };
  
  return contract;
}

// Function to generate contract as HTML
export function generateContractHTML(contract) {
  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract of Lease - ${contract.lessee.company}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: white;
            color: black;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
        }
        .parties {
            margin-bottom: 30px;
        }
        .party {
            margin-bottom: 15px;
        }
        .party-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .financial-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .financial-table th,
        .financial-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        .financial-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            height: 30px;
            margin-bottom: 5px;
        }
        .witness-section {
            margin-top: 30px;
            text-align: center;
        }
        .witness-line {
            border-bottom: 1px solid #000;
            height: 30px;
            width: 200px;
            margin: 0 auto 5px;
        }
        .acknowledgment {
            margin-top: 50px;
            text-align: center;
        }
        .acknowledgment-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .notary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .notary-table th,
        .notary-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        .notary-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .notary-info {
            margin-top: 20px;
        }
        .notary-line {
            border-bottom: 1px solid #000;
            height: 20px;
            margin-bottom: 5px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">INSPIRE</div>
        <div class="title">Contract of Lease</div>
    </div>

    <div class="section">
        <p><strong>KNOW ALL MEN BY THESE PRESENTS:</strong></p>
        <p>This Contract of Lease is made and executed this ${formatDate(contract.contractDetails.startDate)} by and between:</p>
    </div>

    <div class="parties">
        <div class="party">
            <div class="party-title">${contract.lessor.name}</div>
            <p>${contract.lessor.type} with principal office at ${contract.lessor.address}, represented by its ${contract.lessor.representativeTitle}, <strong>${contract.lessor.representative}</strong>, herein referred to as the "<strong>LESSOR</strong>";</p>
        </div>

        <div class="party">
            <div class="party-title">-and-</div>
            <p><strong>${contract.lessee.name}</strong>, of legal age, ${contract.lessee.company ? `representing ${contract.lessee.company}` : ''}, with address at ${contract.lessee.address}, herein referred to as the "<strong>LESSEE</strong>";</p>
        </div>
    </div>

    <div class="section">
        <p><strong>WITNESSETH:</strong></p>
        <p><strong>WHEREAS</strong>, the LESSOR offers to transfer to the LESSEE the physical possession and use of ${contract.contractDetails.leaseType}, hereinafter referred to as the "Leased Premise";</p>
        <p><strong>WHEREAS</strong>, the LESSEE desires to lease the Leased Premise, and the LESSOR is willing to lease it under the stated terms and conditions;</p>
        <p><strong>NOW THEREFORE</strong>, in consideration of the premises and mutual covenants, the LESSOR leases the Leased Premise to the LESSEE, and the LESSEE accepts, subject to the following terms and conditions:</p>
    </div>

    <div class="section">
        <div class="section-title">1. TERM</div>
        <p>The lease period is for ${contract.contractDetails.term} month(s) commencing on ${formatDate(contract.contractDetails.startDate)} and ending on ${formatDate(contract.contractDetails.endDate)}, ${contract.contractDetails.renewalOption}. The term shall be guaranteed for ${contract.contractDetails.term} month(s) and no pre-termination without just cause by either party shall be allowed.</p>
    </div>

    <div class="section">
        <div class="section-title">2. RENTAL RATE AND PAYMENTS</div>
        <p>The parties herein agree that the monthly rent for the Leased Premise shall be Philippine Peso: <strong>${formatCurrency(contract.financialTerms.monthlyRent)}</strong> excluding 12% VAT per month, Common Use Service Area (CUSA) and parking. Below is the breakdown:</p>
        
        <table class="financial-table">
            <thead>
                <tr>
                    <th>CATEGORY</th>
                    <th>TERMS</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Monthly Rent</td>
                    <td>${formatCurrency(contract.financialTerms.monthlyRent)} (excluding VAT)</td>
                </tr>
                <tr>
                    <td>CUSA</td>
                    <td>${formatCurrency(contract.financialTerms.cusaFee)}</td>
                </tr>
                <tr>
                    <td>Parking Fee (optional)</td>
                    <td>${formatCurrency(contract.financialTerms.parkingFee)} per month</td>
                </tr>
            </tbody>
        </table>

        <p>On or before ${formatDate(contract.contractDetails.startDate)}, the LESSEE must pay the LESSOR <strong>${formatCurrency(contract.financialTerms.totalInitialPayment)}</strong>, representing two (2) months advanced rental and two (2) months security deposit.</p>
        <p>Monthly rental payments are due at the end of each month to a bank account designated by the LESSOR. Any bank transfer fees are to be shouldered by the LESSEE. Late payments will incur an additional five (5) percent per month fee on the monthly rental.</p>
    </div>

    <div class="section">
        <div class="section-title">3. TAXES</div>
        <p>All taxes arising from the receipt of rentals by the LESSOR, including VAT, documentary stamp taxes, and other related taxes, are the responsibility of the LESSEE. Exceptions are the LESSOR's income taxes or taxes required to be withheld from rentals that are credited against the LESSOR's income taxes.</p>
    </div>

    <div class="section">
        <div class="section-title">4. SECURITY DEPOSIT</div>
        <p>The LESSEE is required to pay <strong>${formatCurrency(contract.financialTerms.securityDeposit)}</strong> as a security deposit upon the execution of the lease. This deposit is explicitly stated not to be an advance payment for monthly rental. Its purpose is to secure the LESSEE's full and faithful observance of the contract terms.</p>
    </div>

    <div class="section">
        <div class="section-title">5. ADVANCE RENTAL</div>
        <p>The two (2) months advance rental will be applied to the last month of the contract period.</p>
    </div>

    <div class="section">
        <div class="section-title">6. PROVIDED SERVICES</div>
        <p>The LESSOR shall provide the following services to the LESSEE:</p>
        <ul>
            ${contract.servicesIncluded.map(service => `<li>${service}</li>`).join('')}
        </ul>
        
        ${contract.additionalServices ? `
        <p><strong>6.1. Use of workspaces (shared, private, and meeting room)</strong></p>
        <p><strong>6.1.1.</strong> The meeting room requires a reservation and costs <strong>${formatCurrency(contract.additionalServices.meetingRoom.rate)}/hour</strong> (excluding tax).</p>
        <p><strong>6.1.2.</strong> Reservations for the meeting room must be made at least 3 days in advance.</p>
        <p><strong>6.1.3.</strong> Cancellation fees for meeting room reservations are:</p>
        <ul>
            <li>Same-day cancellation: 60% of the fee.</li>
            <li>One-day prior cancellation: 40% of the fee.</li>
            <li>Two days or more in advance cancellation: Free.</li>
        </ul>
        
        <p><strong>6.2. Two Person Booth</strong></p>
        <p><strong>6.2.1.</strong> The Lessee is entitled to up to <strong>${contract.additionalServices.twoPersonBooth.freeHours} hours of free usage per month</strong> for the two-person booth.</p>
        <p><strong>6.2.2.</strong> Any additional use beyond ${contract.additionalServices.twoPersonBooth.freeHours} hours is charged at <strong>${formatCurrency(contract.additionalServices.twoPersonBooth.additionalRate)}/hour</strong> (excluding tax).</p>
        <p><strong>6.2.3.</strong> Advance reservation (at least 3 days prior) is required for the two-person booth.</p>
        ` : ''}
    </div>

    <div class="section">
        <div class="section-title">7. USAGE HOURS</div>
        <p>The Leased Premise can only be used from ${contract.usageTerms.hours}. It is closed on ${contract.usageTerms.closedDays}. Use on holidays may be allowed with prior approval from the LESSOR.</p>
        
        <p><strong>7.1 AIR-CONDITIONING</strong></p>
        <p>Air-conditioning will be supplied from ${contract.usageTerms.airConditioning.hours}. The LESSEE may request extended air-conditioning services outside regular hours with ${contract.usageTerms.airConditioning.advanceNotice}. The LESSEE must reimburse the LESSOR for these extended services at an hourly rate of ${formatCurrency(contract.usageTerms.airConditioning.extendedRate)}.</p>
    </div>

    <div class="section">
        <div class="section-title">8. PRE-TERMINATION</div>
        <p>This contract is guaranteed for ${contract.contractDetails.term} month(s). If the contract is pre-terminated due to the LESSEE's fault or decision, the security deposit and unused advance payments will be forfeited in favor of the LESSOR. Additionally, the LESSEE must settle any damages or repairs caused to the Leased Premise before moving out.</p>
    </div>

    <div class="section">
        <div class="section-title">9. HANDOVER THE UNIT</div>
        <p>The LESSOR will deliver the Leased Premise in its current status at the contract start date, and the LESSEE must then perform the contract's obligations and rights.</p>
    </div>

    <div class="section">
        <div class="section-title">10. USE OF PREMISES</div>
        <p>The LESSEE is required to keep the Leased Premise clean and in sanitary condition for the duration of the lease. The premise is to be used for office purposes only, and no other purpose without the LESSOR's written consent. The LESSEE agrees to abide by existing rules and regulations of the corporation, and any other applicable laws, ordinances, rules, and regulations governing the use of the Leased Premise.</p>
    </div>

    <div class="section">
        <div class="section-title">11. ASSIGNMENT AND SUBLEASE</div>
        <p>The LESSEE is explicitly NOT allowed to transfer its rights, interest, and obligations under this agreement or sub-lease the Leased Premise or any portion thereof to any person or entity during the lease duration, without the prior written consent of the LESSOR.</p>
    </div>

    <div class="section">
        <div class="section-title">12. NON-WAIVER</div>
        <p>Any delay or failure by either party to exercise any of its rights or remedies under the agreement shall not be interpreted as a waiver of such right and remedy.</p>
    </div>

    <div class="section">
        <div class="section-title">13. IMPROVEMENTS</div>
        <p>The LESSEE shall not make any alteration, structural changes, or improvements to the Leased Premise without the prior written consent of the LESSOR.</p>
    </div>

    <div class="section">
        <div class="section-title">14. ACTS OF GOD</div>
        <p>If the Leased Premise is damaged by fire, earthquake, storm, or any other fortuitous events to the extent that it becomes un-tenantable, the Lease will be automatically cancelled. The deposit and the unused portion of advance rentals will be refunded to the LESSEE within sixty (60) days, less any unpaid obligations of the LESSEE.</p>
    </div>

    <div class="section">
        <div class="section-title">15. INSPECTION OF PREMISES</div>
        <p>To ensure the Leased Premise is maintained in good and tenantable condition, the LESSOR or their authorized representative is granted the right to enter and inspect any part of the Leased Premise after providing two (2) days prior written notice, during reasonable hours of the day and as the occasion might require.</p>
    </div>

    <div class="section">
        <div class="section-title">16. INJURY OR DAMAGE</div>
        <p>The LESSEE assumes full responsibility for any damage to persons or property of third parties within the Leased Premise during the lease term, arising from the LESSEE's use, employees, and guests. The LESSEE also agrees to hold the LESSOR harmless from such damages, unless the damage or liability results from structural or inherent defects in the Leased Premise or is due to the LESSOR's fault. The LESSEE shall hold the LESSOR free and harmless from any and all claims, demands, actions, or causes of action arising from or in connection with the use of the Leased Premise by the LESSEE, its employees, agents, or visitors, except for damages caused by fortuitous events or an act of God such as typhoons, earthquakes, floods, and other similar events beyond the LESSEE's control.</p>
    </div>

    <div class="section">
        <div class="section-title">17. HAZARDOUS AND PROHIBITED MATERIALS</div>
        <p>The LESSEE is prohibited from keeping or storing any hazardous, obnoxious, or inflammable substances, materials that could constitute a fire hazard, other chemicals, or prohibitive drugs in the Leased Premise, in violation of Philippine laws.</p>
    </div>

    <div class="section">
        <div class="section-title">18. RULES AND REGULATIONS</div>
        <p>The LESSEE is obligated to comply with existing rules and regulations promulgated by the building administrator and/or association, as well as any other environmental or other laws, ordinances, rules, and regulations applicable to the Leased Premise.</p>
    </div>

    <div class="section">
        <div class="section-title">19. VIOLATIONS</div>
        <p>Either party may, at its option, consider the Lease automatically rescinded and canceled, without the need for court action, upon seven (7) days' written notice to the other party for:</p>
        <p>a. Failure of the LESSEE to pay any advance rental and other bills or charges for any reason.</p>
        <p>b. Any violation by the other party of the terms and conditions stipulated in the Lease.</p>
        <p>c. If the Leased Premise is vacated or abandoned for thirty (30) days without prior written notice to the LESSOR.</p>
        <p>d. If the LESSEE fails to remove its personal belongings and effects from the Leased Premise upon the expiration of the Lease term.</p>
    </div>

    <div class="section">
        <div class="section-title">20. RETURN OF LEASED PREMISES</div>
        <p>At the end of the Lease term, the LESSEE shall peacefully and immediately vacate the Leased Premise and return possession to the LESSOR in its original condition prior to the start of the Lease, unless the term is extended or renewed. The LESSOR may show the Leased Premise to prospective tenants sixty (60) days prior to the end of the term. The LESSEE shall remove all its property and effects from the Leased Premise and pay for any damages incurred during the removal process.</p>
    </div>

    <div class="section">
        <div class="section-title">21. ATTORNEY'S FEES</div>
        <p>If either party resorts to judicial action in connection with the Lease, the guilty party agrees to pay attorney's fees and liquidated damages equivalent to Ten (10%) of the total amount involved or claimed by the aggrieved party, in addition to all court expenses and/or costs of litigation.</p>
    </div>

    <div class="section">
        <div class="section-title">22. VENUE</div>
        <p>All court actions arising from this Lease shall be filed exclusively in the Courts of Taguig City, to the exclusion of all other courts.</p>
    </div>

    <div class="section">
        <div class="section-title">23. SUCCESSORS AND ASSIGNS</div>
        <p>This Lease shall bind and inure to the benefits of the successors and assigns of the LESSOR and of the permitted successors and assigns of the LESSEE.</p>
    </div>

    <div class="section">
        <div class="section-title">24. NOTICES</div>
        <p>Unless otherwise provided herein, any notice, tender or delivery to be given hereunder by either party to the other may be affected by personal delivery in writing, or by registered or certified mail, express delivery. A notice shall be deemed to have been served on the 5th day of mailing or on the date of arrival, whichever is earlier. The LESSOR is not responsible for conveying notices from the property management office (e.g., payment, power/water interruption, fire drill, public facility maintenance). Mailed notices should be addressed as set forth, and both LESSOR and LESSEE must promptly notify the other party of any contact information changes, with consequences for failure to perform the notice obligation.</p>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>LESSOR</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>LESSEE</div>
        </div>
    </div>

    <div class="witness-section">
        <p>Signed in the Presence of:</p>
        <div class="witness-line"></div>
        <div class="witness-line"></div>
    </div>

    <div class="acknowledgment">
        <div class="acknowledgment-title">ACKNOWLEDGMENT</div>
        <p>REPUBLIC OF THE PHILIPPINES)</p>
        <p>TAGUIG CITY ) S.S.</p>
        
        <p>BEFORE ME, a Notary Public for and in the City of Taguig, personally appeared the following persons with residence Certificate number and/or Passport number as follows:</p>
        
        <table class="notary-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Driver's License/SSS/Passport No.</th>
                    <th>Date/Place Issued</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
        
        <p>known to me to be the same persons who executed the foregoing Contract of Lease consisting of six (6) pages including this acknowledgment, signed by the parties and their instrumental witnesses and who acknowledged to me that they were duly authorized to execute the said document on their behalf or whom they represent and the same is their free and voluntary act and deed.</p>
        
        <div class="notary-info">
            <p>WITNESS MY HAND AND SEAL, this ______ day of ______ 2025 at</p>
            <p>______ City, Philippines.</p>
            
            <p>Doc. No. ______;</p>
            <p>Page No. ______;</p>
            <p>Book No. ______;</p>
            <p>Series of 2025.</p>
        </div>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Contract</button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
    </div>
</body>
</html>
  `;
}

// Function to save contract to Firebase
export async function saveContractToFirebase(contract, tenantId, db) {
  try {
    const contractData = {
      ...contract,
      tenantId: tenantId,
      savedAt: new Date().toISOString(),
      status: 'active'
    };
    
    const docRef = await addDoc(collection(db, 'contracts'), contractData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving contract to Firebase:', error);
    throw error;
  }
}

// Function to retrieve contract from Firebase
export async function getContractFromFirebase(contractId, db) {
  try {
    const docRef = doc(db, 'contracts', contractId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Contract not found');
    }
  } catch (error) {
    console.error('Error retrieving contract from Firebase:', error);
    throw error;
  }
}

// Function to get all contracts for a tenant
export async function getTenantContracts(tenantId) {
  try {
    // Import db dynamically to avoid circular dependencies
    const { db } = await import('../../../../script/firebaseConfig');
    const q = query(collection(db, 'contracts'), where('tenantId', '==', tenantId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error retrieving tenant contracts:', error);
    throw error;
  }
}

// Function to export contract as PDF
export async function exportContractAsPDF(contract, tenantName, tenantCompany) {
  try {
    // Create a temporary div with the contract HTML
    const contractHTML = contract.templateBased ? contract.content : generateContractHTML(contract);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contractHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.fontFamily = 'Times New Roman, serif';
    document.body.appendChild(tempDiv);

    // Convert to canvas then to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempDiv.offsetWidth,
      height: tempDiv.offsetHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Set margins
    const margin = 20; // 20mm margins on all sides
    const imgWidth = 210 - (margin * 2); // 170mm usable width
    const pageHeight = 297 - (margin * 2); // 257mm usable height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;
    let pageNumber = 1;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add page numbers and continue with remaining content
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageNumber++;
      
      // Add page number
      pdf.setFontSize(10);
      pdf.text(`Page ${pageNumber}`, 210 - margin - 20, 297 - 10);
      
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add page number to first page
    pdf.setPage(1);
    pdf.setFontSize(10);
    pdf.text('Page 1', 210 - margin - 20, 297 - 10);

    // Clean up
    document.body.removeChild(tempDiv);

    // Download the PDF
    const fileName = `Contract_${tenantCompany || tenantName}_${contract.metadata?.contractId || Date.now()}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Function to export contract as Excel
export function exportContractAsExcel(contract, tenantName, tenantCompany) {
  try {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Main Contract Sheet - formatted like a contract document
    const contractData = [
      // Header
      ['INSPIRE HOLDINGS INC.'],
      ['CONTRACT OF LEASE'],
      [''],
      ['KNOW ALL MEN BY THESE PRESENTS:'],
      [`This Contract of Lease is made and executed this ${contract.contractDetails?.startDate ? new Date(contract.contractDetails.startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} by and between:`],
      [''],
      
      // Parties Section
      ['LESSOR:'],
      [contract.lessor?.name || 'INSPIRE HOLDINGS INC.'],
      [contract.lessor?.type || 'A corporation duly organized and existing under the laws of the Republic of the Philippines'],
      [`with principal office at ${contract.lessor?.address || '6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig'},`],
      [`represented by its ${contract.lessor?.representativeTitle || 'Chief Executive Officer'}, ${contract.lessor?.representative || 'PATRICK PEREZ'},`],
      ['herein referred to as the "LESSOR";'],
      [''],
      ['-and-'],
      [''],
      ['LESSEE:'],
      [contract.lessee?.name || tenantName || 'N/A'],
      [contract.lessee?.company ? `representing ${contract.lessee.company}` : tenantCompany ? `representing ${tenantCompany}` : ''],
      [`with address at ${contract.lessee?.address || 'N/A'},`],
      ['herein referred to as the "LESSEE";'],
      [''],
      
      // WITNESSETH Section
      ['WITNESSETH:'],
      [''],
      ['WHEREAS, the LESSOR offers to transfer to the LESSEE the physical possession and use of'],
      [contract.contractDetails?.leaseType || 'designated workspace'],
      ['hereinafter referred to as the "Leased Premise";'],
      [''],
      ['WHEREAS, the LESSEE desires to lease the Leased Premise, and the LESSOR is willing to lease it'],
      ['under the stated terms and conditions;'],
      [''],
      ['NOW THEREFORE, in consideration of the premises and mutual covenants, the LESSOR leases'],
      ['the Leased Premise to the LESSEE, and the LESSEE accepts, subject to the following terms and conditions:'],
      [''],
      
      // Section 1: TERM
      ['1. TERM'],
      [`The lease period is for ${contract.contractDetails?.term || 'N/A'} month(s) commencing on`],
      [`${contract.contractDetails?.startDate ? new Date(contract.contractDetails.startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} and ending on`],
      [`${contract.contractDetails?.endDate ? new Date(contract.contractDetails.endDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'},`],
      [contract.contractDetails?.renewalOption || 'with option to renew upon forty-five (45) days advance notice by the LESSEE and upon mutual agreement of both parties.'],
      [`The term shall be guaranteed for ${contract.contractDetails?.term || 'N/A'} month(s) and no pre-termination without just cause by either party shall be allowed.`],
      [''],
      
      // Section 2: RENTAL RATE AND PAYMENTS
      ['2. RENTAL RATE AND PAYMENTS'],
      ['The parties herein agree that the monthly rent for the Leased Premise shall be Philippine Peso:'],
      [`₱${contract.financialTerms?.monthlyRent?.toLocaleString() || '0'} excluding 12% VAT per month, Common Use Service Area (CUSA) and parking.`],
      ['Below is the breakdown:'],
      [''],
      ['CATEGORY', 'TERMS'],
      ['Monthly Rent', `₱${contract.financialTerms?.monthlyRent?.toLocaleString() || '0'} (excluding VAT)`],
      ['CUSA', `₱${contract.financialTerms?.cusaFee?.toLocaleString() || '0'}`],
      ['Parking Fee (optional)', `₱${contract.financialTerms?.parkingFee?.toLocaleString() || '0'} per month`],
      [''],
      [`On or before ${contract.contractDetails?.startDate ? new Date(contract.contractDetails.startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}, the LESSEE must pay the LESSOR`],
      [`₱${contract.financialTerms?.totalInitialPayment?.toLocaleString() || '0'}, representing two (2) months advanced rental and two (2) months security deposit.`],
      ['Monthly rental payments are due at the end of each month to a bank account designated by the LESSOR.'],
      ['Any bank transfer fees are to be shouldered by the LESSEE. Late payments will incur an additional'],
      [`five (${contract.financialTerms?.latePaymentFee || 5}) percent per month fee on the monthly rental.`],
      [''],
      
      // Section 3: TAXES
      ['3. TAXES'],
      ['All taxes arising from the receipt of rentals by the LESSOR, including VAT, documentary stamp taxes,'],
      ['and other related taxes, are the responsibility of the LESSEE. Exceptions are the LESSOR\'s income taxes'],
      ['or taxes required to be withheld from rentals that are credited against the LESSOR\'s income taxes.'],
      [''],
      
      // Section 4: SECURITY DEPOSIT
      ['4. SECURITY DEPOSIT'],
      [`The LESSEE is required to pay ₱${contract.financialTerms?.securityDeposit?.toLocaleString() || '0'} as a security deposit upon the execution of the lease.`],
      ['This deposit is explicitly stated not to be an advance payment for monthly rental. Its purpose is to'],
      ['secure the LESSEE\'s full and faithful observance of the contract terms.'],
      [''],
      
      // Section 5: ADVANCE RENTAL
      ['5. ADVANCE RENTAL'],
      ['The two (2) months advance rental will be applied to the last month of the contract period.'],
      [''],
      
      // Section 6: PROVIDED SERVICES
      ['6. PROVIDED SERVICES'],
      ['The LESSOR shall provide the following services to the LESSEE:'],
      ...contract.servicesIncluded?.map(service => [service]) || [],
      [''],
      
      // Additional Services (if applicable)
      ...(contract.additionalServices ? [
        ['6.1. Use of workspaces (shared, private, and meeting room)'],
        [`6.1.1. The meeting room requires a reservation and costs ₱${contract.additionalServices.meetingRoom?.rate?.toLocaleString() || '0'}/hour (excluding tax).`],
        ['6.1.2. Reservations for the meeting room must be made at least 3 days in advance.'],
        ['6.1.3. Cancellation fees for meeting room reservations are:'],
        ['Same-day cancellation: 60% of the fee.'],
        ['One-day prior cancellation: 40% of the fee.'],
        ['Two days or more in advance cancellation: Free.'],
        [''],
        ['6.2. Two Person Booth'],
        [`6.2.1. The Lessee is entitled to up to ${contract.additionalServices.twoPersonBooth?.freeHours || 15} hours of free usage per month for the two-person booth.`],
        [`6.2.2. Any additional use beyond ${contract.additionalServices.twoPersonBooth?.freeHours || 15} hours is charged at ₱${contract.additionalServices.twoPersonBooth?.additionalRate?.toLocaleString() || '0'}/hour (excluding tax).`],
        ['6.2.3. Advance reservation (at least 3 days prior) is required for the two-person booth.'],
        ['']
      ] : []),
      
      // Section 7: USAGE HOURS
      ['7. USAGE HOURS'],
      [`The Leased Premise can only be used from ${contract.usageTerms?.hours || 'Monday to Friday, 9:00 AM to 6:00 PM'}.`],
      [`It is closed on ${contract.usageTerms?.closedDays || 'Saturdays, Sundays, and public holidays'}.`],
      ['Use on holidays may be allowed with prior approval from the LESSOR.'],
      [''],
      ['7.1 AIR-CONDITIONING'],
      [`Air-conditioning will be supplied from ${contract.usageTerms?.airConditioning?.hours || '9:00 A.M. to 6:00 P.M. Mondays through Fridays, except holidays'}.`],
      [`The LESSEE may request extended air-conditioning services outside regular hours with`],
      [`${contract.usageTerms?.airConditioning?.advanceNotice || 'one-day prior written notice'}.`],
      [`The LESSEE must reimburse the LESSOR for these extended services at an hourly rate of`],
      [`₱${contract.usageTerms?.airConditioning?.extendedRate?.toLocaleString() || '0'}.`],
      [''],
      
      // Section 8: PRE-TERMINATION
      ['8. PRE-TERMINATION'],
      [`This contract is guaranteed for ${contract.contractDetails?.term || 'N/A'} month(s). If the contract is pre-terminated due to the LESSEE's fault or decision, the security deposit and unused advance payments will be forfeited in favor of the LESSOR. Additionally, the LESSEE must settle any damages or repairs caused to the Leased Premise before moving out.`],
      [''],
      
      // Section 9: HANDOVER THE UNIT
      ['9. HANDOVER THE UNIT'],
      ['The LESSOR will deliver the Leased Premise in its current status at the contract start date, and the LESSEE must then perform the contract\'s obligations and rights.'],
      [''],
      
      // Section 10: USE OF PREMISES
      ['10. USE OF PREMISES'],
      ['The LESSEE is required to keep the Leased Premise clean and in sanitary condition for the duration of the lease. The premise is to be used for office purposes only, and no other purpose without the LESSOR\'s written consent. The LESSEE agrees to abide by existing rules and regulations of the corporation, and any other applicable laws, ordinances, rules, and regulations governing the use of the Leased Premise.'],
      [''],
      
      // Section 11: ASSIGNMENT AND SUBLEASE
      ['11. ASSIGNMENT AND SUBLEASE'],
      ['The LESSEE is explicitly NOT allowed to transfer its rights, interest, and obligations under this agreement or sub-lease the Leased Premise or any portion thereof to any person or entity during the lease duration, without the prior written consent of the LESSOR.'],
      [''],
      
      // Section 12: NON-WAIVER
      ['12. NON-WAIVER'],
      ['Any delay or failure by either party to exercise any of its rights or remedies under the agreement shall not be interpreted as a waiver of such right and remedy.'],
      [''],
      
      // Section 13: IMPROVEMENTS
      ['13. IMPROVEMENTS'],
      ['The LESSEE shall not make any alteration, structural changes, or improvements to the Leased Premise without the prior written consent of the LESSOR.'],
      [''],
      
      // Section 14: ACTS OF GOD
      ['14. ACTS OF GOD'],
      ['If the Leased Premise is damaged by fire, earthquake, storm, or any other fortuitous events to the extent that it becomes un-tenantable, the Lease will be automatically cancelled. The deposit and the unused portion of advance rentals will be refunded to the LESSEE within sixty (60) days, less any unpaid obligations of the LESSEE.'],
      [''],
      
      // Section 15: INSPECTION OF PREMISES
      ['15. INSPECTION OF PREMISES'],
      ['To ensure the Leased Premise is maintained in good and tenantable condition, the LESSOR or their authorized representative is granted the right to enter and inspect any part of the Leased Premise after providing two (2) days prior written notice, during reasonable hours of the day and as the occasion might require.'],
      [''],
      
      // Section 16: INJURY OR DAMAGE
      ['16. INJURY OR DAMAGE'],
      ['The LESSEE assumes full responsibility for any damage to persons or property of third parties within the Leased Premise during the lease term, arising from the LESSEE\'s use, employees, and guests. The LESSEE also agrees to hold the LESSOR harmless from such damages, unless the damage or liability results from structural or inherent defects in the Leased Premise or is due to the LESSOR\'s fault. The LESSEE shall hold the LESSOR free and harmless from any and all claims, demands, actions, or causes of action arising from or in connection with the use of the Leased Premise by the LESSEE, its employees, agents, or visitors, except for damages caused by fortuitous events or an act of God such as typhoons, earthquakes, floods, and other similar events beyond the LESSEE\'s control.'],
      [''],
      
      // Section 17: HAZARDOUS AND PROHIBITED MATERIALS
      ['17. HAZARDOUS AND PROHIBITED MATERIALS'],
      ['The LESSEE is prohibited from keeping or storing any hazardous, obnoxious, or inflammable substances, materials that could constitute a fire hazard, other chemicals, or prohibitive drugs in the Leased Premise, in violation of Philippine laws.'],
      [''],
      
      // Section 18: RULES AND REGULATIONS
      ['18. RULES AND REGULATIONS'],
      ['The LESSEE is obligated to comply with existing rules and regulations promulgated by the building administrator and/or association, as well as any other environmental or other laws, ordinances, rules, and regulations applicable to the Leased Premise.'],
      [''],
      
      // Section 19: VIOLATIONS
      ['19. VIOLATIONS'],
      ['Either party may, at its option, consider the Lease automatically rescinded and canceled, without the need for court action, upon seven (7) days\' written notice to the other party for:'],
      ['a. Failure of the LESSEE to pay any advance rental and other bills or charges for any reason.'],
      ['b. Any violation by the other party of the terms and conditions stipulated in the Lease.'],
      ['c. If the Leased Premise is vacated or abandoned for thirty (30) days without prior written notice to the LESSOR.'],
      ['d. If the LESSEE fails to remove its personal belongings and effects from the Leased Premise upon the expiration of the Lease term.'],
      [''],
      
      // Section 20: RETURN OF LEASED PREMISES
      ['20. RETURN OF LEASED PREMISES'],
      ['At the end of the Lease term, the LESSEE shall peacefully and immediately vacate the Leased Premise and return possession to the LESSOR in its original condition prior to the start of the Lease, unless the term is extended or renewed. The LESSOR may show the Leased Premise to prospective tenants sixty (60) days prior to the end of the term. The LESSEE shall remove all its property and effects from the Leased Premise and pay for any damages incurred during the removal process.'],
      [''],
      
      // Section 21: ATTORNEY'S FEES
      ['21. ATTORNEY\'S FEES'],
      ['If either party resorts to judicial action in connection with the Lease, the guilty party agrees to pay attorney\'s fees and liquidated damages equivalent to Ten (10%) of the total amount involved or claimed by the aggrieved party, in addition to all court expenses and/or costs of litigation.'],
      [''],
      
      // Section 22: VENUE
      ['22. VENUE'],
      ['All court actions arising from this Lease shall be filed exclusively in the Courts of Taguig City, to the exclusion of all other courts.'],
      [''],
      
      // Section 23: SUCCESSORS AND ASSIGNS
      ['23. SUCCESSORS AND ASSIGNS'],
      ['This Lease shall bind and inure to the benefits of the successors and assigns of the LESSOR and of the permitted successors and assigns of the LESSEE.'],
      [''],
      
      // Section 24: NOTICES
      ['24. NOTICES'],
      ['Unless otherwise provided herein, any notice, tender or delivery to be given hereunder by either party to the other may be affected by personal delivery in writing, or by registered or certified mail, express delivery. A notice shall be deemed to have been served on the 5th day of mailing or on the date of arrival, whichever is earlier. The LESSOR is not responsible for conveying notices from the property management office (e.g., payment, power/water interruption, fire drill, public facility maintenance). Mailed notices should be addressed as set forth, and both LESSOR and LESSEE must promptly notify the other party of any contact information changes, with consequences for failure to perform the notice obligation.'],
      [''],
      
      // Contract ID and Metadata
      [''],
      ['CONTRACT INFORMATION:'],
      ['Contract ID:', contract.metadata?.contractId || 'N/A'],
      ['Generated Date:', contract.metadata?.generatedAt ? new Date(contract.metadata.generatedAt).toLocaleDateString() : 'N/A'],
      ['Status:', contract.status?.toUpperCase() || 'ACTIVE'],
      [''],
      
      // Signature Lines
      [''],
      [''],
      ['IN WITNESS WHEREOF, the parties have hereunto set their hands on the date and at the place above-written.'],
      [''],
      ['_________________________', '_________________________'],
      ['LESSOR', 'LESSEE'],
      [''],
      [''],
      ['Signed in the Presence of:'],
      [''],
      ['_________________________'],
      ['_________________________'],
      [''],
      [''],
      ['ACKNOWLEDGMENT'],
      [''],
      ['REPUBLIC OF THE PHILIPPINES)'],
      ['TAGUIG CITY ) S.S.'],
      [''],
      ['BEFORE ME, a Notary Public for and in the City of Taguig, personally appeared the following persons with residence Certificate number and/or Passport number as follows:'],
      [''],
      ['Name', 'Driver\'s License/SSS/Passport No.', 'Date/Place Issued'],
      ['', '', ''],
      ['', '', ''],
      [''],
      ['known to me to be the same persons who executed the foregoing Contract of Lease consisting of six (6) pages including this acknowledgment, signed by the parties and their instrumental witnesses and who acknowledged to me that they were duly authorized to execute the said document on their behalf or whom they represent and the same is their free and voluntary act and deed.'],
      [''],
      ['WITNESS MY HAND AND SEAL, this _____ day of _____, 2025, at _____ City, Philippines.'],
      [''],
      ['Doc. No. _____'],
      ['Page No. _____'],
      ['Book No. _____'],
      ['Series of 2025.']
    ];

    const contractSheet = XLSX.utils.aoa_to_sheet(contractData);
    
    // Set column widths for better formatting
    contractSheet['!cols'] = [
      { wch: 50 }, // Column A - wider for content
      { wch: 30 }  // Column B - for values
    ];
    
    XLSX.utils.book_append_sheet(workbook, contractSheet, 'Contract of Lease');

    // Financial Summary Sheet
    const financialData = [
      ['FINANCIAL SUMMARY'],
      [''],
      ['Item', 'Amount (PHP)'],
      ['Monthly Rent', `₱${contract.financialTerms?.monthlyRent?.toLocaleString() || '0'}`],
      ['CUSA Fee', `₱${contract.financialTerms?.cusaFee?.toLocaleString() || '0'}`],
      ['Parking Fee', `₱${contract.financialTerms?.parkingFee?.toLocaleString() || '0'}`],
      ['Total Monthly', `₱${contract.financialTerms?.totalMonthly?.toLocaleString() || '0'}`],
      ['Security Deposit', `₱${contract.financialTerms?.securityDeposit?.toLocaleString() || '0'}`],
      ['Advance Rental', `₱${contract.financialTerms?.advanceRental?.toLocaleString() || '0'}`],
      ['Total Initial Payment', `₱${contract.financialTerms?.totalInitialPayment?.toLocaleString() || '0'}`],
      [''],
      ['Contract Term', `${contract.contractDetails?.term || 'N/A'} months`],
      ['VAT Rate', `${contract.financialTerms?.vatRate || 12}%`],
      ['Late Payment Fee', `${contract.financialTerms?.latePaymentFee || 5}%`]
    ];

    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    financialSheet['!cols'] = [
      { wch: 25 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Summary');

    // Download the Excel file
    const fileName = `Contract_${tenantCompany || tenantName}_${contract.metadata?.contractId || Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}

// DOCX Contract Generator Class
export class ContractGenerator {
  constructor() {
    this.templatePath = '/docs/contract_template.docx';
  }

  async loadTemplate() {
    try {
      const response = await fetch(this.templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  prepareTemplateData(tenantData) {
    const currentDate = new Date();
    const leaseStartDate = tenantData.billing?.startDate ? new Date(tenantData.billing.startDate) : new Date();
    const leaseEndDate = tenantData.billing?.endDate ? new Date(tenantData.billing.endDate) : new Date(leaseStartDate.getFullYear() + 1, leaseStartDate.getMonth(), leaseStartDate.getDate());
    
    const monthlyRent = parseFloat(tenantData.billing?.rate) || parseFloat(tenantData.monthlyRent) || 20000;
    const cusa = parseFloat(tenantData.billing?.cusaFee) || parseFloat(tenantData.cusa) || 1500;
    const parkingFee = parseFloat(tenantData.billing?.parkingFee) || parseFloat(tenantData.parkingFee) || 0;
    const securityDeposit = monthlyRent * 2;
    const advanceRental = monthlyRent * 2;
    const totalInitialPayment = securityDeposit + advanceRental;

    return {
      // Contract execution details
      contractDate: this.formatDate(currentDate),
      contractLocation: 'Taguig City',
      
      // Lessee information (using both old and new variable names for compatibility)
      lesseeName: tenantData.name || '',
      lesseeAge: tenantData.age || '',
      lesseeCivilStatus: tenantData.civilStatus || '',
      lesseeAddress: tenantData.address || '',
      lesseeCompany: tenantData.company || '',
      
      // Alternative variable names for template compatibility
      tenantName: tenantData.name || '',
      tenantCompany: tenantData.company || '',
      tenantEmail: tenantData.email || '',
      tenantPhone: tenantData.phone || '',
      tenantAddress: tenantData.address || '',
      
      // Lease term
      leaseStartDate: this.formatDate(leaseStartDate),
      leaseEndDate: this.formatDate(leaseEndDate),
      contractStartDate: this.formatDate(leaseStartDate),
      contractEndDate: this.formatDate(leaseEndDate),
      
      // Payment details
      monthlyRent: this.formatCurrency(monthlyRent),
      monthlyRentAmount: monthlyRent.toLocaleString(),
      cusa: this.formatCurrency(cusa),
      cusaAmount: cusa.toLocaleString(),
      parkingFee: this.formatCurrency(parkingFee),
      parkingFeeAmount: parkingFee.toLocaleString(),
      
      // Deposit and advance
      securityDeposit: this.formatCurrency(securityDeposit),
      securityDepositAmount: securityDeposit.toLocaleString(),
      advanceRental: this.formatCurrency(advanceRental),
      advanceRentalAmount: advanceRental.toLocaleString(),
      totalInitialPayment: this.formatCurrency(totalInitialPayment),
      totalInitialPaymentAmount: totalInitialPayment.toLocaleString(),
      
      // Payment due date
      paymentDueDate: this.formatDate(tenantData.billing?.startDate || tenantData.paymentDueDate || leaseStartDate),
      
      // Additional tenant information
      tenantId: tenantData.id || '',
      
      // Current year for acknowledgment
      currentYear: currentDate.getFullYear(),
      
      // Company information
      companyName: 'INSPIRE HOLDINGS INC.',
      companyAddress: '6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig',
      representativeName: 'PATRICK PEREZ',
      representativeTitle: 'Chief Executive Officer',
    };
  }

  async generateContract(tenantData) {
    try {
      // Validate tenant data
      if (!tenantData) {
        throw new Error('Tenant data is required');
      }

      // Load the template
      const templateBuffer = await this.loadTemplate();
      
      // Create PizZip instance
      const zip = new PizZip(templateBuffer);
      
      // Create Docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Prepare template data
      const templateData = this.prepareTemplateData(tenantData);

      // Render the document with data
      doc.render(templateData);

      // Generate the document
      const output = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      return output;
    } catch (error) {
      console.error('Error generating contract:', error);
      // Return a more descriptive error
      throw new Error(`Contract generation failed: ${error.message}`);
    }
  }

  async downloadContract(tenantData, filename) {
    try {
      const contractBlob = await this.generateContract(tenantData);
      const contractFilename = filename || `contract_${tenantData.name || 'tenant'}_${new Date().toISOString().split('T')[0]}.docx`;
      
      saveAs(contractBlob, contractFilename);
      return true;
    } catch (error) {
      console.error('Error downloading contract:', error);
      throw error;
    }
  }

  async previewContract(tenantData) {
    try {
      const contractBlob = await this.generateContract(tenantData);
      const url = URL.createObjectURL(contractBlob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (error) {
      console.error('Error previewing contract:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const contractGeneratorDocx = new ContractGenerator();

const contractGenerator = {
  generateLeaseContract,
  generateLeaseContractFromTemplate,
  generateContractHTML,
  saveContractToFirebase,
  getContractFromFirebase,
  getTenantContracts,
  exportContractAsPDF,
  exportContractAsExcel,
  // Add new DOCX methods
  contractGeneratorDocx
};

export default contractGenerator;
