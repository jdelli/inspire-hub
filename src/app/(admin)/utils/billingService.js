import { db } from "../../../../script/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { sendBillingNotification } from "./email";


// Helper to format number as PHP currency with thousands separator
export function formatPHP(amount) {
  return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Fetch unpaid invoices with penalties for a tenant
export async function getUnpaidPenaltiesForTenant(tenantId) {
  try {
    const unpaidQuery = query(
      collection(db, 'billing'),
      where('tenantId', '==', tenantId),
      where('status', 'in', ['unpaid', 'overdue', 'pending'])
    );

    const unpaidSnapshot = await getDocs(unpaidQuery);
    let totalUnpaidPenalties = 0;
    const unpaidInvoices = [];

    unpaidSnapshot.forEach((doc) => {
      const invoice = doc.data();
      const penaltyFee = parseFloat(invoice.penaltyFee) || 0;

      if (penaltyFee > 0) {
        totalUnpaidPenalties += penaltyFee;
        unpaidInvoices.push({
          id: doc.id,
          billingMonth: invoice.billingMonth,
          penaltyFee: penaltyFee,
          total: parseFloat(invoice.total) || 0
        });
      }
    });

    return {
      totalUnpaidPenalties,
      unpaidInvoices,
      count: unpaidInvoices.length
    };
  } catch (error) {
    console.error('Error fetching unpaid penalties:', error);
    return {
      totalUnpaidPenalties: 0,
      unpaidInvoices: [],
      count: 0
    };
  }
}

// Calculate billing amount based on tenant type and configuration
export function calculateBillingAmount(tenant) {
  // Set default rates if not provided
  let defaultRate = 0;
  if (tenant.selectedSeats && tenant.selectedSeats.length > 0) {
    defaultRate = 5000; // Default rate for dedicated desk
  } else if (tenant.selectedPO && tenant.selectedPO.length > 0) {
    defaultRate = 15000; // Default rate for private office
  } else {
    defaultRate = 3000; // Default rate for virtual office
  }

  const rate = parseFloat(tenant.billing?.rate) || defaultRate;
  // Only include fees if they are explicitly set and greater than 0
  const cusaFee = (tenant.billing?.cusaFee && parseFloat(tenant.billing.cusaFee) > 0) ? parseFloat(tenant.billing.cusaFee) : 0;
  const parkingFee = (tenant.billing?.parkingFee && parseFloat(tenant.billing.parkingFee) > 0) ? parseFloat(tenant.billing.parkingFee) : 0;
  // Penalty and damage fees are set to 0 by default - they should be added manually per invoice
  const penaltyFee = 0;
  const damageFee = 0;

  let baseAmount = 0;

  // Calculate base amount based on tenant type
  if (tenant.selectedSeats && tenant.selectedSeats.length > 0) {
    // Dedicated Desk - multiply by number of seats
    baseAmount = rate * tenant.selectedSeats.length;
  } else if (tenant.selectedPO && tenant.selectedPO.length > 0) {
    // Private Office - multiply by number of offices
    baseAmount = rate * tenant.selectedPO.length;
  } else {
    // Virtual Office - single rate
    baseAmount = rate;
  }

  const subtotal = baseAmount + cusaFee + parkingFee + penaltyFee + damageFee;
  const vat = subtotal * 0.12; // 12% VAT
  const total = subtotal + vat;

  return {
    baseAmount,
    cusaFee,
    parkingFee,
    penaltyFee,
    damageFee,
    subtotal,
    vat,
    total
  };
}

// Generate billing record for a tenant
export async function generateBillingRecord(tenant, billingMonth, tenantType, billingDate = new Date()) {
  // Calculate billing amount
  const billingAmounts = calculateBillingAmount(tenant);

  // Use tenant's billing start date if available, otherwise use billingDate
  const startDate = tenant.billing?.startDate ? new Date(tenant.billing.startDate) : billingDate;
  const dueDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start date

  // Set default rate if not provided
  let defaultRate = 0;
  if (tenant.selectedSeats && tenant.selectedSeats.length > 0) {
    defaultRate = 5000; // Default rate for dedicated desk
  } else if (tenant.selectedPO && tenant.selectedPO.length > 0) {
    defaultRate = 15000; // Default rate for private office
  } else {
    defaultRate = 3000; // Default rate for virtual office
  }

  const billingRecord = {
    tenantId: tenant.id,
    tenantName: tenant.name || 'Unknown',
    tenantEmail: tenant.email || 'No email provided',
    tenantCompany: tenant.company || 'No company provided',
    tenantPhone: tenant.phone || 'No phone provided',
    tenantAddress: tenant.address || 'No address provided',
    tenantType: tenantType, // 'dedicated-desk', 'private-office', 'virtual-office'

    // Billing period
    billingMonth: billingMonth, // Format: '2024-01'
    billingDate: billingDate.toISOString(),
    dueDate: dueDate.toISOString(), // 30 days from tenant's billing start date

    // Billing details
    baseRate: tenant.billing?.rate || defaultRate,
    quantity: tenant.selectedSeats?.length || tenant.selectedPO?.length || 1,
    cusaFee: billingAmounts.cusaFee,
    parkingFee: billingAmounts.parkingFee,
    penaltyFee: billingAmounts.penaltyFee,
    damageFee: billingAmounts.damageFee,

    // Calculated amounts
    subtotal: billingAmounts.subtotal,
    vat: billingAmounts.vat,
    total: billingAmounts.total,

    // Status
    status: 'pending', // 'pending', 'paid', 'overdue', 'cancelled'
    paymentMethod: tenant.billing?.paymentMethod || 'credit',

    // Metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // Additional info
    billingAddress: tenant.billing?.billingAddress || tenant.address || 'No billing address provided',
    currency: 'PHP',

    // Unpaid penalties tracking - REMOVED as per request to not make penalties global
    unpaidPenaltiesIncluded: false,
    unpaidPenaltiesAmount: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoicesDetails: [],

    // Items breakdown for invoice
    items: [
      {
        description: tenantType === 'dedicated-desk' ? 'Dedicated Desk Rental' :
          tenantType === 'private-office' ? 'Private Office Rental' : 'Virtual Office Services',
        quantity: tenant.selectedSeats?.length || tenant.selectedPO?.length || 1,
        unitPrice: tenant.billing?.rate || defaultRate,
        amount: billingAmounts.baseAmount
      },
      ...(billingAmounts.cusaFee > 0 ? [{
        description: 'CUSA Fee',
        quantity: 1,
        unitPrice: billingAmounts.cusaFee,
        amount: billingAmounts.cusaFee
      }] : []),
      ...(billingAmounts.parkingFee > 0 ? [{
        description: 'Parking Fee',
        quantity: 1,
        unitPrice: billingAmounts.parkingFee,
        amount: billingAmounts.parkingFee
      }] : []),
      ...(billingAmounts.penaltyFee > 0 ? [{
        description: 'Late Payment Penalty',
        quantity: 1,
        unitPrice: billingAmounts.penaltyFee,
        amount: billingAmounts.penaltyFee
      }] : []),
      ...(billingAmounts.damageFee > 0 ? [{
        description: 'Damage Fee',
        quantity: 1,
        unitPrice: billingAmounts.damageFee,
        amount: billingAmounts.damageFee
      }] : [])
    ]
  };

  return billingRecord;
}

// Generate monthly billing for all active tenants
export async function generateMonthlyBilling(targetMonth = null) {
  try {
    let billingMonth;
    let billingDate;

    if (targetMonth) {
      billingMonth = targetMonth;
      // Parse the target month to get the billing date (1st of that month)
      const [year, month] = targetMonth.split('-');
      billingDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
      const currentDate = new Date();
      billingMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      billingDate = new Date();
    }

    console.log(`Generating monthly billing for ${billingMonth}...`);

    const billingRecords = [];
    const errors = [];
    const skippedTenants = [];

    // Process each tenant type
    const tenantTypes = [
      { collection: 'seatMap', type: 'dedicated-desk' },
      { collection: 'privateOffice', type: 'private-office' },
      { collection: 'virtualOffice', type: 'virtual-office' }
    ];

    for (const { collection: collectionName, type } of tenantTypes) {
      try {
        console.log(`Processing ${collectionName} collection for ${type}...`);

        // Get all active tenants
        const tenantsQuery = query(
          collection(db, collectionName),
          where('status', '==', 'active')
        );

        const querySnapshot = await getDocs(tenantsQuery);
        console.log(`Found ${querySnapshot.docs.length} active tenants in ${collectionName}`);

        // Debug: Log tenant details
        querySnapshot.docs.forEach((doc, index) => {
          const tenant = doc.data();
          console.log(`Tenant ${index + 1}: ${tenant.name || 'Unknown'} (${tenant.id}) - Status: ${tenant.status}, Rate: ${tenant.billing?.rate || 'Not set'}`);
        });

        for (const doc of querySnapshot.docs) {
          const tenant = { id: doc.id, ...doc.data() };

          try {
            // Check if billing already exists for this month
            const existingBillingQuery = query(
              collection(db, 'billing'),
              where('tenantId', '==', tenant.id),
              where('billingMonth', '==', billingMonth)
            );

            const existingBilling = await getDocs(existingBillingQuery);

            if (existingBilling.empty) {
              // Generate new billing record
              const billingRecord = await generateBillingRecord(tenant, billingMonth, type, billingDate);

              // Add to billing collection
              const billingDocRef = await addDoc(collection(db, 'billing'), billingRecord);
              billingRecord.id = billingDocRef.id;

              billingRecords.push(billingRecord);

              const penaltyInfo = '';
              console.log(`Generated billing for tenant: ${tenant.name || tenant.id} (${type}) - Amount: ₱${billingRecord.total.toFixed(2)}${penaltyInfo}`);
            } else {
              console.log(`Billing already exists for tenant ${tenant.name || tenant.id} for ${billingMonth}`);
              skippedTenants.push({
                tenantId: tenant.id,
                tenantName: tenant.name || 'Unknown',
                reason: 'Billing already exists for this month'
              });
            }
          } catch (tenantError) {
            console.error(`Error processing tenant ${tenant.id}:`, tenantError);
            errors.push({
              tenantId: tenant.id,
              tenantName: tenant.name || 'Unknown',
              collection: collectionName,
              error: 'Tenant processing failed',
              details: tenantError.message
            });
          }
        }
      } catch (collectionError) {
        console.error(`Error processing ${collectionName} collection:`, collectionError);
        errors.push({
          collection: collectionName,
          error: 'Collection processing failed',
          details: collectionError.message
        });
      }
    }

    console.log(`Monthly billing generation completed. Generated ${billingRecords.length} billing records.`);
    console.log(`Skipped ${skippedTenants.length} tenants (billing already exists).`);
    console.log(`Errors: ${errors.length}`);

    return {
      success: true,
      billingRecords,
      errors,
      skippedTenants,
      billingMonth,
      totalGenerated: billingRecords.length,
      totalSkipped: skippedTenants.length,
      totalErrors: errors.length
    };

  } catch (error) {
    console.error('Error generating monthly billing:', error);
    return {
      success: false,
      error: error.message,
      billingRecords: [],
      errors: [error],
      skippedTenants: []
    };
  }
}

// Get billing records for a specific tenant
export async function getTenantBillingHistory(tenantId, limit = 12) {
  try {
    const billingQuery = query(
      collection(db, 'billing'),
      where('tenantId', '==', tenantId),
      // orderBy('billingMonth', 'desc'),
      // limit(limit)
    );

    const querySnapshot = await getDocs(billingQuery);
    const billingHistory = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by billing month descending
    billingHistory.sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));

    return billingHistory.slice(0, limit);
  } catch (error) {
    console.error('Error fetching tenant billing history:', error);
    throw error;
  }
}

// Get all billing records for a specific month
export async function getMonthlyBillingRecords(billingMonth) {
  try {
    const billingQuery = query(
      collection(db, 'billing'),
      where('billingMonth', '==', billingMonth)
    );

    const querySnapshot = await getDocs(billingQuery);
    const billingRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return billingRecords;
  } catch (error) {
    console.error('Error fetching monthly billing records:', error);
    throw error;
  }
}

// Get all billing records from all months
export async function getAllBillingRecords() {
  try {
    const billingQuery = query(collection(db, 'billing'));

    const querySnapshot = await getDocs(billingQuery);
    const billingRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by billing month and then by tenant name
    billingRecords.sort((a, b) => {
      const monthCompare = (b.billingMonth || '').localeCompare(a.billingMonth || '');
      if (monthCompare !== 0) return monthCompare;
      return (a.tenantName || '').localeCompare(b.tenantName || '');
    });

    return billingRecords;
  } catch (error) {
    console.error('Error fetching all billing records:', error);
    throw error;
  }
}

// Update billing record status (e.g., mark as paid)
export async function updateBillingStatus(billingId, status, paymentDetails = {}) {
  try {
    const billingRef = doc(db, 'billing', billingId);

    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...paymentDetails
    };

    if (status === 'paid') {
      updateData.paidAt = serverTimestamp();
      updateData.paymentDetails = paymentDetails;
    }

    await updateDoc(billingRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating billing status:', error);
    throw error;
  }
}

// Get billing statistics
export async function getBillingStatistics(month = null) {
  try {
    const currentMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const billingQuery = query(
      collection(db, 'billing'),
      where('billingMonth', '==', currentMonth)
    );

    const querySnapshot = await getDocs(billingQuery);
    const billingRecords = querySnapshot.docs.map(doc => doc.data());

    const stats = {
      totalBills: billingRecords.length,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      byTenantType: {
        'dedicated-desk': { count: 0, amount: 0 },
        'private-office': { count: 0, amount: 0 },
        'virtual-office': { count: 0, amount: 0 }
      }
    };

    billingRecords.forEach(record => {
      stats.totalAmount += record.total || 0;
      stats.byTenantType[record.tenantType].count++;
      stats.byTenantType[record.tenantType].amount += record.total || 0;

      switch (record.status) {
        case 'paid':
          stats.paidAmount += record.total || 0;
          stats.paidCount++;
          break;
        case 'pending':
          stats.pendingAmount += record.total || 0;
          stats.pendingCount++;
          break;
        case 'overdue':
          stats.overdueAmount += record.total || 0;
          stats.overdueCount++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching billing statistics:', error);
    throw error;
  }
}

// Send overdue reminders
export async function sendOverdueReminders() {
  try {
    const overdueQuery = query(
      collection(db, 'billing'),
      where('status', '==', 'overdue')
    );

    const querySnapshot = await getDocs(overdueQuery);
    const overdueRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const results = [];

    for (const record of overdueRecords) {
      try {
        await sendBillingNotification(record, 'overdue');
        results.push({
          billingId: record.id,
          tenantEmail: record.tenantEmail,
          status: 'sent'
        });
      } catch (error) {
        results.push({
          billingId: record.id,
          tenantEmail: record.tenantEmail,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending overdue reminders:', error);
    throw error;
  }
}

// Check for overdue bills and update status
export async function checkAndUpdateOverdueBills() {
  try {
    const pendingQuery = query(
      collection(db, 'billing'),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(pendingQuery);
    const pendingRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const currentDate = new Date();
    const updatedRecords = [];

    for (const record of pendingRecords) {
      const dueDate = new Date(record.dueDate);

      if (currentDate > dueDate) {
        // Mark as overdue
        await updateBillingStatus(record.id, 'overdue');
        updatedRecords.push({
          billingId: record.id,
          tenantEmail: record.tenantEmail,
          status: 'marked_overdue'
        });
      }
    }

    return updatedRecords;
  } catch (error) {
    console.error('Error checking overdue bills:', error);
    throw error;
  }
}

// Update additional fees for existing billing records
export async function updateBillingFees(billingId, additionalFees) {
  try {
    const billingRef = doc(db, 'billing', billingId);
    const billingDoc = await getDoc(billingRef);

    if (!billingDoc.exists()) {
      throw new Error('Billing record not found');
    }

    const billingData = billingDoc.data();
    const { penaltyFee = 0, damageFee = 0, notes = '' } = additionalFees;

    // Calculate new totals
    const baseSubtotal = billingData.subtotal - (billingData.penaltyFee || 0) - (billingData.damageFee || 0);
    const newSubtotal = baseSubtotal + penaltyFee + damageFee;
    const vat = newSubtotal * 0.12; // 12% VAT
    const newTotal = newSubtotal + vat;

    // Update items array to include new fees
    const updatedItems = billingData.items.filter(item =>
      item.description !== 'Late Payment Penalty' && item.description !== 'Damage Fee'
    );

    if (penaltyFee > 0) {
      updatedItems.push({
        description: 'Late Payment Penalty',
        quantity: 1,
        unitPrice: penaltyFee,
        amount: penaltyFee
      });
    }

    if (damageFee > 0) {
      updatedItems.push({
        description: 'Damage Fee',
        quantity: 1,
        unitPrice: damageFee,
        amount: damageFee
      });
    }

    // Update the billing record
    await updateDoc(billingRef, {
      penaltyFee,
      damageFee,
      subtotal: newSubtotal,
      vat: vat,
      total: newTotal,
      items: updatedItems,
      additionalFeesNotes: notes,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      billingId,
      newTotal,
      penaltyFee,
      damageFee
    };
  } catch (error) {
    console.error('Error updating billing fees:', error);
    throw error;
  }
}

// Check tenant billing configuration
export async function checkTenantBillingConfiguration() {
  try {
    const tenantTypes = [
      { collection: 'seatMap', type: 'dedicated-desk' },
      { collection: 'privateOffice', type: 'private-office' },
      { collection: 'virtualOffice', type: 'virtual-office' }
    ];

    const results = {
      totalTenants: 0,
      tenantsWithBilling: 0,
      tenantsWithoutBilling: 0,
      tenantsWithZeroRate: 0,
      tenantsWithMissingInfo: 0,
      details: []
    };

    for (const { collection: collectionName, type } of tenantTypes) {
      try {
        const tenantsQuery = query(
          collection(db, collectionName),
          where('status', '==', 'active')
        );

        const querySnapshot = await getDocs(tenantsQuery);

        for (const doc of querySnapshot.docs) {
          const tenant = { id: doc.id, ...doc.data() };
          results.totalTenants++;

          const hasBilling = tenant.billing && Object.keys(tenant.billing).length > 0;
          const hasRate = tenant.billing?.rate && parseFloat(tenant.billing.rate) > 0;
          const hasRequiredInfo = tenant.name && tenant.email;

          const detail = {
            tenantId: tenant.id,
            tenantName: tenant.name || 'Unknown',
            collection: collectionName,
            type: type,
            hasBilling,
            hasRate,
            hasRequiredInfo,
            rate: tenant.billing?.rate || 0,
            issues: []
          };

          if (!hasBilling) {
            results.tenantsWithoutBilling++;
            detail.issues.push('No billing configuration');
          } else {
            results.tenantsWithBilling++;
          }

          if (!hasRate) {
            results.tenantsWithZeroRate++;
            detail.issues.push('Zero or missing billing rate');
          }

          if (!hasRequiredInfo) {
            results.tenantsWithMissingInfo++;
            detail.issues.push('Missing required tenant information');
          }

          results.details.push(detail);
        }
      } catch (error) {
        console.error(`Error checking ${collectionName} collection:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking tenant billing configuration:', error);
    throw error;
  }
}

// Update tenant billing configuration with default rates if missing
export async function updateTenantBillingDefaults() {
  try {
    const tenantTypes = [
      { collection: 'seatMap', type: 'dedicated-desk', defaultRate: 5000 },
      { collection: 'privateOffice', type: 'private-office', defaultRate: 15000 },
      { collection: 'virtualOffice', type: 'virtual-office', defaultRate: 3000 }
    ];

    const results = {
      totalUpdated: 0,
      totalSkipped: 0,
      errors: []
    };

    for (const { collection: collectionName, type, defaultRate } of tenantTypes) {
      try {
        const tenantsQuery = query(
          collection(db, collectionName),
          where('status', '==', 'active')
        );

        const querySnapshot = await getDocs(tenantsQuery);

        for (const doc of querySnapshot.docs) {
          const tenant = { id: doc.id, ...doc.data() };

          try {
            const needsUpdate = !tenant.billing || !tenant.billing.rate || parseFloat(tenant.billing.rate) === 0;

            if (needsUpdate) {
              const updateData = {
                billing: {
                  ...tenant.billing,
                  rate: defaultRate,
                  currency: 'PHP',
                  plan: tenant.billing?.plan || 'monthly',
                  paymentMethod: tenant.billing?.paymentMethod || 'credit',
                  startDate: tenant.billing?.startDate || new Date().toISOString().split('T')[0]
                }
              };

              await updateDoc(doc(db, collectionName, tenant.id), updateData);
              results.totalUpdated++;
              console.log(`Updated billing for tenant: ${tenant.name || tenant.id} with rate: ₱${defaultRate}`);
            } else {
              results.totalSkipped++;
            }
          } catch (tenantError) {
            console.error(`Error updating tenant ${tenant.id}:`, tenantError);
            results.errors.push({
              tenantId: tenant.id,
              tenantName: tenant.name || 'Unknown',
              error: tenantError.message
            });
          }
        }
      } catch (collectionError) {
        console.error(`Error processing ${collectionName} collection:`, collectionError);
        results.errors.push({
          collection: collectionName,
          error: collectionError.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error updating tenant billing defaults:', error);
    throw error;
  }
}

// Update tenant billing information and recalculate existing billing records
export async function updateTenantBillingInfo(tenantId, tenantType, updatedBillingInfo) {
  try {
    // Determine the collection based on tenant type
    let collectionName;
    switch (tenantType) {
      case 'dedicated':
      case 'dedicated-desk':
        collectionName = 'seatMap';
        break;
      case 'private':
      case 'private-office':
        collectionName = 'privateOffice';
        break;
      case 'virtual':
      case 'virtual-office':
        collectionName = 'virtualOffice';
        break;
      default:
        throw new Error(`Unknown tenant type: ${tenantType}`);
    }

    // Update the tenant's billing information
    const tenantRef = doc(db, collectionName, tenantId);
    await updateDoc(tenantRef, {
      billing: updatedBillingInfo,
      updatedAt: serverTimestamp()
    });

    // Get the updated tenant data
    const tenantDoc = await getDoc(tenantRef);
    if (!tenantDoc.exists()) {
      throw new Error('Tenant not found after update');
    }

    const updatedTenant = { id: tenantDoc.id, ...tenantDoc.data() };

    // Find and update existing billing records for this tenant
    const billingQuery = query(
      collection(db, 'billing'),
      where('tenantId', '==', tenantId),
      where('status', 'in', ['pending', 'overdue'])
    );

    const billingSnapshot = await getDocs(billingQuery);
    const updatedBillingRecords = [];

    for (const billingDoc of billingSnapshot.docs) {
      const billingData = billingDoc.data();

      // Recalculate billing amounts with updated tenant information
      const newBillingAmounts = calculateBillingAmount(updatedTenant);

      // Preserve existing penalty and damage fees (they are manually added per invoice)
      const existingPenalty = parseFloat(billingData.penaltyFee) || 0;
      const existingDamage = parseFloat(billingData.damageFee) || 0;

      // Recalculate subtotal and total with preserved penalties
      const newSubtotalWithPenalties = newBillingAmounts.subtotal - newBillingAmounts.penaltyFee - newBillingAmounts.damageFee + existingPenalty + existingDamage;
      const newVat = newSubtotalWithPenalties * 0.12;
      const newTotalWithPenalties = newSubtotalWithPenalties + newVat;

      // Update the billing record
      await updateDoc(doc(db, 'billing', billingDoc.id), {
        baseRate: updatedBillingInfo.rate || billingData.baseRate,
        subtotal: newSubtotalWithPenalties,
        vat: newVat,
        total: newTotalWithPenalties,
        cusaFee: newBillingAmounts.cusaFee,
        parkingFee: newBillingAmounts.parkingFee,
        penaltyFee: existingPenalty,
        damageFee: existingDamage,
        updatedAt: serverTimestamp(),
        // Update items array to reflect new amounts (preserve existing penalties)
        items: [
          {
            description: updatedTenant.selectedSeats?.length > 0
              ? `Dedicated Desk (${updatedTenant.selectedSeats.length} seat${updatedTenant.selectedSeats.length > 1 ? 's' : ''})`
              : updatedTenant.selectedPO?.length > 0
                ? `Private Office (${updatedTenant.selectedPO.length} office${updatedTenant.selectedPO.length > 1 ? 's' : ''})`
                : 'Virtual Office Services',
            quantity: updatedTenant.selectedSeats?.length || updatedTenant.selectedPO?.length || 1,
            unitPrice: updatedBillingInfo.rate || billingData.baseRate,
            amount: newBillingAmounts.baseAmount
          },
          ...(newBillingAmounts.cusaFee > 0 ? [{
            description: 'CUSA Fee',
            quantity: 1,
            unitPrice: newBillingAmounts.cusaFee,
            amount: newBillingAmounts.cusaFee
          }] : []),
          ...(newBillingAmounts.parkingFee > 0 ? [{
            description: 'Parking Fee',
            quantity: 1,
            unitPrice: newBillingAmounts.parkingFee,
            amount: newBillingAmounts.parkingFee
          }] : []),
          ...(existingPenalty > 0 ? [{
            description: 'Late Payment Penalty',
            quantity: 1,
            unitPrice: existingPenalty,
            amount: existingPenalty
          }] : []),
          ...(existingDamage > 0 ? [{
            description: 'Damage Fee',
            quantity: 1,
            unitPrice: existingDamage,
            amount: existingDamage
          }] : [])
        ]
      });

      updatedBillingRecords.push({
        billingId: billingDoc.id,
        oldTotal: billingData.total,
        newTotal: newTotalWithPenalties,
        billingMonth: billingData.billingMonth
      });
    }

    return {
      success: true,
      tenantId,
      tenantType,
      updatedBillingInfo,
      updatedBillingRecords,
      message: `Successfully updated billing for tenant ${updatedTenant.name || tenantId}. Updated ${updatedBillingRecords.length} billing records.`
    };

  } catch (error) {
    console.error('Error updating tenant billing information:', error);
    throw error;
  }
}

// Fix billing records with incorrect VAT calculations (removes VAT from total)
export async function fixBillingVATCalculations(billingMonth = null) {
  try {
    console.log('Fixing billing records to add 12% VAT...');

    let billingQuery;
    if (billingMonth) {
      billingQuery = query(
        collection(db, 'billing'),
        where('billingMonth', '==', billingMonth)
      );
    } else {
      billingQuery = collection(db, 'billing');
    }

    const billingSnapshot = await getDocs(billingQuery);
    const fixedRecords = [];
    let totalFixed = 0;

    for (const billingDoc of billingSnapshot.docs) {
      const billingData = billingDoc.data();
      const currentTotal = parseFloat(billingData.total) || 0;
      const currentSubtotal = parseFloat(billingData.subtotal) || 0;
      const currentVAT = parseFloat(billingData.vat) || 0;

      // Check if VAT is missing or incorrect (total should equal subtotal + VAT)
      const expectedVAT = currentSubtotal * 0.12;
      const expectedTotalWithVAT = currentSubtotal + expectedVAT;
      const difference = Math.abs(currentTotal - expectedTotalWithVAT);

      // If difference is more than 1 peso OR VAT field is missing, fix it
      if (difference > 1 || currentVAT === 0 || !billingData.hasOwnProperty('vat')) {
        // Calculate correct VAT and total
        const correctVAT = currentSubtotal * 0.12;
        const correctTotal = currentSubtotal + correctVAT;

        await updateDoc(doc(db, 'billing', billingDoc.id), {
          vat: correctVAT,
          total: correctTotal,
          updatedAt: serverTimestamp()
        });

        fixedRecords.push({
          id: billingDoc.id,
          tenantName: billingData.tenantName,
          oldTotal: currentTotal,
          newTotal: correctTotal,
          oldVAT: currentVAT,
          newVAT: correctVAT,
          difference: correctTotal - currentTotal
        });

        totalFixed++;
        console.log(`Fixed billing record ${billingDoc.id}: ${formatPHP(currentTotal)} → ${formatPHP(correctTotal)} (VAT: ${formatPHP(correctVAT)})`);
      }
    }

    console.log(`Fixed ${totalFixed} billing records with 12% VAT`);

    return {
      success: true,
      totalRecordsChecked: billingSnapshot.size,
      totalFixed,
      fixedRecords
    };

  } catch (error) {
    console.error('Error fixing billing VAT calculations:', error);
    throw error;
  }
}

// Test function to verify exports are working
export function testExports() {
  console.log('Billing service exports are working correctly');
  return {
    formatPHP: typeof formatPHP === 'function',
    calculateBillingAmount: typeof calculateBillingAmount === 'function',
    generateBillingRecord: typeof generateBillingRecord === 'function',
    generateMonthlyBilling: typeof generateMonthlyBilling === 'function',
    getBillingStatistics: typeof getBillingStatistics === 'function',
    getMonthlyBillingRecords: typeof getMonthlyBillingRecords === 'function',
    updateBillingStatus: typeof updateBillingStatus === 'function',
    checkAndUpdateOverdueBills: typeof checkAndUpdateOverdueBills === 'function',
    updateBillingFees: typeof updateBillingFees === 'function',
    checkTenantBillingConfiguration: typeof checkTenantBillingConfiguration === 'function',
    updateTenantBillingDefaults: typeof updateTenantBillingDefaults === 'function',
    updateTenantBillingInfo: typeof updateTenantBillingInfo === 'function',
    sendOverdueReminders: typeof sendOverdueReminders === 'function',
    fixBillingVATCalculations: typeof fixBillingVATCalculations === 'function'
  };
}


