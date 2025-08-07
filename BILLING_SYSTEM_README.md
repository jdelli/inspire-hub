# Monthly Billing System for Inspire Hub

This document describes the comprehensive monthly billing system implemented for the Inspire Hub tenant management platform.

## Overview

The billing system automatically generates monthly billing records for all active tenants across three service types:
- **Dedicated Desk** (seatMap collection)
- **Private Office** (privateOffice collection) 
- **Virtual Office** (virtualOffice collection)

## Features

### 🏢 **Multi-Tenant Support**
- Handles all three tenant types with different billing calculations
- Automatic rate calculation based on quantity (seats/offices)
- Support for additional fees (CUSA, Parking)

### 📊 **Billing Management**
- Monthly billing generation
- Payment status tracking (pending, paid, overdue)
- Billing history per tenant
- Comprehensive billing statistics

### 📧 **Automated Notifications**
- Monthly billing notifications to tenants
- Overdue payment reminders
- Email integration via EmailJS

### 🔄 **Automation**
- Scheduled billing generation
- Automatic overdue bill detection
- Payment status updates

## System Architecture

### Core Components

1. **Billing Service** (`src/app/(admin)/utils/billingService.js`)
   - Main billing logic and database operations
   - Billing record generation and management
   - Statistics and reporting functions

2. **Billing Management UI** (`src/app/(admin)/components/BillingManagement.jsx`)
   - Admin dashboard for billing management
   - Manual billing generation
   - Payment recording and status updates

3. **Email Notifications** (`src/app/(admin)/utils/email.js`)
   - Billing notification templates
   - Overdue reminder emails

4. **Billing Automation** (`src/app/(admin)/utils/billingAutomation.js`)
   - Automated billing generation
   - Scheduled tasks and checks

## Database Schema

### Billing Collection Structure

```javascript
{
  id: "auto-generated",
  tenantId: "tenant-document-id",
  tenantName: "John Doe",
  tenantEmail: "john@example.com",
  tenantCompany: "ABC Corp",
  tenantType: "dedicated-desk|private-office|virtual-office",
  
  // Billing period
  billingMonth: "2024-01", // Format: YYYY-MM
  billingDate: "2024-01-01T00:00:00.000Z",
  dueDate: "2024-02-01T00:00:00.000Z",
  
  // Billing details
  baseRate: 5000,
  quantity: 2, // Number of seats/offices
  cusaFee: 500,
  parkingFee: 300,
  
  // Calculated amounts
  subtotal: 10800,
  vat: 1296,
  total: 12096,
  
  // Status and payment
  status: "pending|paid|overdue|cancelled",
  paymentMethod: "credit|bank|cash|check",
  paidAt: "2024-01-15T00:00:00.000Z", // Only when paid
  
  // Metadata
  createdAt: "timestamp",
  updatedAt: "timestamp",
  
  // Additional info
  billingAddress: "123 Main St",
  currency: "PHP",
  
  // Items breakdown
  items: [
    {
      description: "Dedicated Desk Rental",
      quantity: 2,
      unitPrice: 5000,
      amount: 10000
    },
    {
      description: "CUSA Fee",
      quantity: 1,
      unitPrice: 500,
      amount: 500
    }
  ]
}
```

## Usage

### Manual Billing Generation

1. **Access Billing Management**
   - Navigate to Admin Dashboard → Billing Management
   - Or visit `/admin/billing`

2. **Generate Monthly Billing**
   - Click "Generate Monthly Billing" button
   - System will create billing records for all active tenants
   - Email notifications will be sent automatically

3. **View Billing Records**
   - Select month from dropdown
   - View all billing records for selected month
   - Filter by status, tenant type, etc.

### Payment Management

1. **Record Payments**
   - Click the checkmark icon next to pending bills
   - Enter payment details (method, reference, notes)
   - Mark as paid

2. **View Billing History**
   - Open tenant details modal
   - Navigate to "Billing History" tab
   - View complete billing history for the tenant

### Automated Tasks

#### Monthly Billing Generation
```javascript
import { runMonthlyBillingAutomation } from './utils/billingAutomation';

// Run manually
const result = await runMonthlyBillingAutomation();
```

#### Scheduled Billing Check
```javascript
import { scheduledBillingCheck } from './utils/billingAutomation';

// Check if billing should be generated (first day of month)
const result = await scheduledBillingCheck();
```

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# EmailJS Configuration for Billing Notifications
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_EMAILJS_TEMPLATE_MONTHLY_BILLING_ID=your_monthly_billing_template_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_OVERDUE_BILLING_ID=your_overdue_billing_template_id
```

### Email Templates

Create EmailJS templates for billing notifications:

#### Monthly Billing Template Variables
- `to_name`: Tenant name
- `to_email`: Tenant email
- `company_name`: Company name
- `billing_month`: Billing month (e.g., "January 2024")
- `due_date`: Due date
- `total_amount`: Total amount in PHP
- `items_breakdown`: Itemized breakdown
- `billing_id`: Billing record ID

#### Overdue Billing Template Variables
- Same as monthly billing plus:
- `urgency_message`: Overdue payment reminder message

## Billing Calculations

### Dedicated Desk
```
Base Amount = Rate per Seat × Number of Seats
Subtotal = Base Amount + CUSA Fee + Parking Fee
VAT = Subtotal × 12%
Total = Subtotal + VAT
```

### Private Office
```
Base Amount = Rate per Office × Number of Offices
Subtotal = Base Amount + CUSA Fee + Parking Fee
VAT = Subtotal × 12%
Total = Subtotal + VAT
```

### Virtual Office
```
Base Amount = Rate per Service
Subtotal = Base Amount + CUSA Fee + Parking Fee
VAT = Subtotal × 12%
Total = Subtotal + VAT
```

## Automation Setup

### Manual Setup (Recommended for Development)

1. **Daily Check for Overdue Bills**
   ```javascript
   // Run this daily
   await checkAndUpdateOverdueBills();
   ```

2. **Monthly Billing Generation**
   ```javascript
   // Run on first day of each month
   await generateMonthlyBilling();
   ```

3. **Overdue Reminders**
   ```javascript
   // Run weekly or as needed
   await sendOverdueReminders();
   ```

### Production Setup

For production, consider using:

1. **Cron Jobs** (Linux/Unix)
   ```bash
   # Daily at 9 AM - Check overdue bills
   0 9 * * * curl -X POST https://your-domain.com/api/billing/check-overdue

   # Monthly on 1st at 8 AM - Generate billing
   0 8 1 * * curl -X POST https://your-domain.com/api/billing/generate-monthly

   # Weekly on Monday at 10 AM - Send overdue reminders
   0 10 * * 1 curl -X POST https://your-domain.com/api/billing/send-reminders
   ```

2. **Cloud Functions** (Firebase/Google Cloud)
   - Set up scheduled functions for billing automation
   - Use Firebase Functions with cron triggers

3. **Third-party Services**
   - Use services like Zapier, Integromat, or similar
   - Schedule HTTP requests to your billing endpoints

## API Endpoints (Future Enhancement)

Consider creating these API endpoints for external integration:

```javascript
// POST /api/billing/generate-monthly
// POST /api/billing/check-overdue
// POST /api/billing/send-reminders
// GET /api/billing/statistics
// GET /api/billing/tenant/{tenantId}/history
// PUT /api/billing/{billingId}/status
```

## Monitoring and Reporting

### Key Metrics to Track

1. **Billing Generation**
   - Number of bills generated per month
   - Success/failure rates
   - Processing time

2. **Payment Collection**
   - Total amount billed vs collected
   - Days to payment
   - Overdue amounts

3. **Tenant Retention**
   - Billing-related cancellations
   - Payment issues leading to service suspension

### Dashboard Widgets

The billing management dashboard provides:
- Total bills and amounts for current month
- Paid vs pending vs overdue amounts
- Billing records by tenant type
- Payment status overview

## Troubleshooting

### Common Issues

1. **Billing Not Generated**
   - Check if tenants have active status
   - Verify billing rates are set
   - Check for existing billing records

2. **Email Notifications Failed**
   - Verify EmailJS configuration
   - Check email template variables
   - Review email service logs

3. **Payment Status Not Updated**
   - Verify billing record exists
   - Check database permissions
   - Review error logs

### Debug Mode

Enable debug logging by adding to your environment:
```env
NEXT_PUBLIC_BILLING_DEBUG=true
```

## Security Considerations

1. **Data Protection**
   - Billing records contain sensitive financial information
   - Implement proper access controls
   - Regular backup of billing data

2. **Payment Security**
   - Never store payment card details
   - Use secure payment gateways
   - Implement audit trails for payment changes

3. **Access Control**
   - Restrict billing management to admin users only
   - Log all billing-related actions
   - Implement role-based access control

## Future Enhancements

1. **Payment Gateway Integration**
   - Online payment processing
   - Automatic payment reconciliation
   - Payment gateway webhooks

2. **Advanced Reporting**
   - Revenue analytics
   - Tenant payment patterns
   - Cash flow forecasting

3. **Automated Collections**
   - Automatic payment reminders
   - Escalation procedures
   - Service suspension automation

4. **Multi-Currency Support**
   - Support for different currencies
   - Exchange rate management
   - Multi-currency reporting

## Support

For issues or questions about the billing system:
1. Check the troubleshooting section
2. Review the console logs for errors
3. Verify environment configuration
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
