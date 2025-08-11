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


// Helper to format number as PHP currency with thousands separator
function formatPHP(amount) {
  return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Calculate billing amount based on tenant type and configuration
function calculateBillingAmount(tenant) {
  const rate = parseFloat(tenant.billing?.rate) || 0;
  const cusaFee = parseFloat(tenant.billing?.cusaFee) || 0;
  const parkingFee = parseFloat(tenant.billing?.parkingFee) || 0;
  const penaltyFee = parseFloat(tenant.billing?.penaltyFee) || 0;
  const damageFee = parseFloat(tenant.billing?.damageFee) || 0;
  
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
async function generateBillingRecord(tenant, billingMonth, tenantType, billingDate = new Date()) {
  const billingAmounts = calculateBillingAmount(tenant);
  
  // Use tenant's billing start date if available, otherwise use billingDate
  const startDate = tenant.billing?.startDate ? new Date(tenant.billing.startDate) : billingDate;
  const dueDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start date
  
  const billingRecord = {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantEmail: tenant.email,
    tenantCompany: tenant.company,
    tenantPhone: tenant.phone,
    tenantAddress: tenant.address,
    tenantType: tenantType, // 'dedicated-desk', 'private-office', 'virtual-office'
    
    // Billing period
    billingMonth: billingMonth, // Format: '2024-01'
    billingDate: billingDate.toISOString(),
    dueDate: dueDate.toISOString(), // 30 days from tenant's billing start date
    
    // Billing details
    baseRate: tenant.billing?.rate || 0,
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
    billingAddress: tenant.billing?.billingAddress || tenant.address,
    currency: 'PHP',
    
    // Items breakdown for invoice
    items: [
      {
        description: tenantType === 'dedicated-desk' ? 'Dedicated Desk Rental' :
                    tenantType === 'private-office' ? 'Private Office Rental' : 'Virtual Office Services',
        quantity: tenant.selectedSeats?.length || tenant.selectedPO?.length || 1,
        unitPrice: tenant.billing?.rate || 0,
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
    
    // Process each tenant type
    const tenantTypes = [
      { collection: 'seatMap', type: 'dedicated-desk' },
      { collection: 'privateOffice', type: 'private-office' },
      { collection: 'virtualOffice', type: 'virtual-office' }
    ];
    
    for (const { collection: collectionName, type } of tenantTypes) {
      try {
        // Get all active tenants
        const tenantsQuery = query(
          collection(db, collectionName),
          where('status', '==', 'active')
        );
        
        const querySnapshot = await getDocs(tenantsQuery);
        
        for (const doc of querySnapshot.docs) {
          const tenant = { id: doc.id, ...doc.data() };
          
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
          } else {
            console.log(`Billing already exists for tenant ${tenant.id} for ${billingMonth}`);
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
    
    return {
      success: true,
      billingRecords,
      errors,
      billingMonth,
      totalGenerated: billingRecords.length,
      totalErrors: errors.length
    };
    
  } catch (error) {
    console.error('Error generating monthly billing:', error);
    return {
      success: false,
      error: error.message,
      billingRecords: [],
      errors: [error]
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
    const newVat = newSubtotal * 0.12;
    const newTotal = newSubtotal + newVat;
    
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
      vat: newVat,
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

export { formatPHP, calculateBillingAmount };
