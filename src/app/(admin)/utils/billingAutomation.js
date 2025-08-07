import { 
  generateMonthlyBilling, 
  checkAndUpdateOverdueBills, 
  sendOverdueReminders,
  getBillingStatistics 
} from './billingService';

// Automated billing generation function
export async function runMonthlyBillingAutomation() {
  console.log('Starting monthly billing automation...');
  
  try {
    // Step 1: Check and update overdue bills
    console.log('Step 1: Checking for overdue bills...');
    const overdueResults = await checkAndUpdateOverdueBills();
    console.log(`Updated ${overdueResults.length} overdue bills`);

    // Step 2: Generate monthly billing for all active tenants
    console.log('Step 2: Generating monthly billing...');
    const billingResult = await generateMonthlyBilling();
    
    if (billingResult.success) {
      console.log(`Successfully generated ${billingResult.totalGenerated} billing records`);
      console.log(`Errors: ${billingResult.totalErrors}`);
    } else {
      console.error('Failed to generate monthly billing:', billingResult.error);
    }

    // Step 3: Send overdue reminders
    console.log('Step 3: Sending overdue reminders...');
    const reminderResults = await sendOverdueReminders();
    const successCount = reminderResults.filter(r => r.status === 'sent').length;
    const failCount = reminderResults.filter(r => r.status === 'failed').length;
    console.log(`Sent ${successCount} overdue reminders, ${failCount} failed`);

    // Step 4: Get current month statistics
    console.log('Step 4: Generating billing statistics...');
    const stats = await getBillingStatistics();
    console.log('Current month billing statistics:', {
      totalBills: stats.totalBills,
      totalAmount: stats.totalAmount,
      paidAmount: stats.paidAmount,
      pendingAmount: stats.pendingAmount,
      overdueAmount: stats.overdueAmount
    });

    return {
      success: true,
      summary: {
        overdueBillsUpdated: overdueResults.length,
        billingRecordsGenerated: billingResult.totalGenerated,
        billingErrors: billingResult.totalErrors,
        overdueRemindersSent: successCount,
        overdueRemindersFailed: failCount,
        currentMonthStats: stats
      }
    };

  } catch (error) {
    console.error('Billing automation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to check if billing should be generated (e.g., first day of month)
export function shouldGenerateBilling() {
  const today = new Date();
  const isFirstDayOfMonth = today.getDate() === 1;
  const isBusinessDay = today.getDay() !== 0 && today.getDay() !== 6; // Not Sunday or Saturday
  
  return isFirstDayOfMonth && isBusinessDay;
}

// Function to get next billing date
export function getNextBillingDate() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth;
}

// Function to get days until next billing
export function getDaysUntilNextBilling() {
  const nextBilling = getNextBillingDate();
  const today = new Date();
  const diffTime = nextBilling - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Manual billing generation with confirmation
export async function manualBillingGeneration() {
  const currentDate = new Date();
  const billingMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  console.log(`Manual billing generation requested for ${billingMonth}`);
  
  // Check if billing already exists for this month
  const stats = await getBillingStatistics(billingMonth);
  
  if (stats.totalBills > 0) {
    console.log(`Billing already exists for ${billingMonth} (${stats.totalBills} records)`);
    return {
      success: false,
      message: `Billing already exists for ${billingMonth}. ${stats.totalBills} records found.`
    };
  }
  
  // Proceed with billing generation
  return await runMonthlyBillingAutomation();
}

// Scheduled billing check (can be called by a cron job or scheduled task)
export async function scheduledBillingCheck() {
  if (shouldGenerateBilling()) {
    console.log('Scheduled billing check: Generating monthly billing...');
    return await runMonthlyBillingAutomation();
  } else {
    console.log('Scheduled billing check: Not time for billing generation yet');
    const daysUntil = getDaysUntilNextBilling();
    console.log(`Next billing in ${daysUntil} days`);
    return {
      success: true,
      message: `Not time for billing generation. Next billing in ${daysUntil} days.`
    };
  }
}

// Export for use in other parts of the application
export default {
  runMonthlyBillingAutomation,
  shouldGenerateBilling,
  getNextBillingDate,
  getDaysUntilNextBilling,
  manualBillingGeneration,
  scheduledBillingCheck
};
