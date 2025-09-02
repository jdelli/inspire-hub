# Billing Export Component

## Overview
The Billing Export Component is a comprehensive solution for exporting billing data from the Inspire Hub system. It supports both Excel (CSV) and PDF formats with advanced filtering and grouping options.

## Features

### Export Types
- **All Billing Records**: Export all billing data in the system
- **Last 12 Months**: Export billing data from the last 12 months
- **Custom Date Range**: Export data within a specific date range
- **Selected Months**: Export data from specific months (up to 24 months)

### Export Formats
- **Excel (CSV)**: Multi-sheet export with month separation
- **PDF**: Multi-page report with professional formatting

### Data Grouping
- **By Month**: Creates separate sheets/pages for each month
- **Single Table**: All data in one sheet/page
- **Summary Sheet**: Overview with totals and statistics

## Usage

### 1. Access the Export Component
- Click the "Export All Data" button in the main billing management header
- Or click "Export Data" in the month selector section

### 2. Configure Export Settings
- **Export Type**: Choose the data scope
- **Export Format**: Select Excel or PDF
- **Date Range**: Set custom start/end dates (if applicable)
- **Month Selection**: Pick specific months (if applicable)
- **Grouping**: Enable/disable month-based separation

### 3. Preview Data
- Use the "Data Preview" tab to see what will be exported
- Click "Load Data" to fetch and preview the data
- View monthly summaries and statistics

### 4. Execute Export
- Click "Export to [FORMAT]" to start the export process
- Monitor progress in the "Export Progress" tab
- Files will download automatically or open in new windows

## Export Structure

### Excel (CSV) Format
When "Group by Month" is enabled:
- **Monthly Sheets**: One sheet per month with detailed records
- **Summary Sheet**: Overview with totals and statistics
- **Headers**: Tenant Name, Company, Email, Type, Status, Amount, Due Date, Billing Month, Payment Method, Created Date

### PDF Format
When "Group by Month" is enabled:
- **Monthly Pages**: One page per month with summary and details
- **Professional Layout**: Company branding and consistent formatting
- **Status Indicators**: Color-coded status badges
- **Summary Boxes**: Key metrics for each month

## Data Fields Exported

| Field | Description | Example |
|-------|-------------|---------|
| Tenant Name | Full name of the tenant | John Doe |
| Company | Company name | ABC Corporation |
| Email | Tenant email address | john@abc.com |
| Type | Workspace type | dedicated-desk |
| Status | Payment status | paid/pending/overdue |
| Amount | Total billing amount | ₱5,000.00 |
| Due Date | Payment due date | 2024-01-15 |
| Billing Month | Billing period | 2024-01 |
| Payment Method | How payment was made | credit/bank/cash |
| Created Date | When record was created | 2024-01-01 |

## Technical Details

### File Naming
- **CSV**: `billing_export.csv`
- **PDF**: Opens in print dialog for saving

### Data Processing
- Real-time data fetching from Firestore
- Progress tracking during export
- Error handling and validation
- Responsive UI for mobile and desktop

### Performance
- Optimized queries for large datasets
- Progressive loading with progress indicators
- Efficient memory usage for large exports

## Requirements

### Dependencies
- Material-UI components
- Firebase Firestore
- React hooks and state management

### Browser Support
- Modern browsers with ES6+ support
- PDF printing capability
- File download support

## Customization

### Adding New Export Types
1. Add new option to `exportType` state
2. Implement logic in `loadBillingData` function
3. Add UI controls in the export settings tab

### Modifying Export Fields
1. Update headers array in export functions
2. Modify data mapping in `exportToExcel` and `generatePDFContent`
3. Adjust table structure in PDF generation

### Styling Changes
1. Modify CSS in `generatePDFContent` function
2. Update Material-UI theme properties
3. Adjust component styling in the main component

## Troubleshooting

### Common Issues
- **No data loaded**: Check Firestore permissions and data availability
- **Export fails**: Verify browser supports file downloads
- **PDF not printing**: Ensure popup blockers are disabled

### Performance Tips
- Use date range filters for large datasets
- Enable month grouping for better organization
- Preview data before export to verify scope

## Future Enhancements

### Planned Features
- Real Excel (.xlsx) format support
- Email export functionality
- Scheduled exports
- Custom field selection
- Advanced filtering options

### Integration Opportunities
- Accounting software integration
- Bank statement reconciliation
- Financial reporting systems
- Audit trail exports
