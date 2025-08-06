import React, { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  Divider,
  Box,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TenantExtensionHistory from "./TenantExtensionHistory";

export default function TenantDetailsModal({
  open,
  onClose,
  client,
  onExtend,
  onEdit
}) {
  const printRef = useRef();

  if (!client) return null;

  const extensionHistory =
    client.extensionHistory ||
    (client.billing && client.billing.extensionHistory) ||
    [];

  // Generate invoice number based on client ID and date
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const clientId = client.id || client.email?.split('@')[0] || 'CLIENT';
    return `INV-${year}${month}${day}-${clientId.toUpperCase()}`;
  };

  // --- Notification for 30 days left ---
  let show30DayNotif = false;
  let daysLeft = null;
  if (client?.billing?.billingEndDate) {
    const now = new Date();
    const end = new Date(client.billing.billingEndDate);
    daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft === 30) {
      show30DayNotif = true;
    }
  }

  // Calculate billing breakdown
  const calculateBillingBreakdown = () => {
    const rate = parseFloat(client?.billing?.rate) || 0;
    const months = parseInt(client?.billing?.monthsToAvail) || 1;
    const cusaFee = parseFloat(client?.billing?.cusaFee) || 0;
    const parkingFee = parseFloat(client?.billing?.parkingFee) || 0;
    
    // Determine item description based on selected items and plan type
    let itemDescription = "Rental Fee";
    let quantity = 1;
    
    if (client?.selectedSeats && client.selectedSeats.length > 0) {
      itemDescription = "Seat Rental";
      quantity = client.selectedSeats.length;
    } else if (client?.selectedOffices && client.selectedOffices.length > 0) {
      itemDescription = "Private Office Rental";
      quantity = client.selectedOffices.length;
    } else if (client?.billing?.plan?.toLowerCase().includes('virtual')) {
      itemDescription = "Virtual Office Service";
      quantity = 1;
    }

    const baseAmount = rate * quantity * months;
    const cusaAmount = cusaFee * months;
    const parkingAmount = parkingFee * months;
    const subtotal = baseAmount + cusaAmount + parkingAmount;
    const vat = subtotal * 0.12;
    const total = subtotal + vat;

    return {
      items: [
        {
          description: `${itemDescription} (${quantity} ${quantity > 1 ? 'units' : 'unit'} × ${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: quantity * months,
          rate: rate,
          amount: baseAmount
        },
        ...(cusaFee > 0 ? [{
          description: `CUSA Fee (${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: months,
          rate: cusaFee,
          amount: cusaAmount
        }] : []),
        ...(parkingFee > 0 ? [{
          description: `Parking Fee (${months} ${months > 1 ? 'months' : 'month'})`,
          quantity: months,
          rate: parkingFee,
          amount: parkingAmount
        }] : [])
      ],
      subtotal,
      vat,
      total
    };
  };

  const billingBreakdown = calculateBillingBreakdown();

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${client.company || 'N/A'}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1976d2;
            }
            .company-logo {
              font-size: 28px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .invoice-subtitle {
              font-size: 14px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-details, .client-details {
              flex: 1;
            }
            .invoice-details {
              text-align: right;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 2px solid #e0e0e0;
            }
            .billing-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .billing-table th {
              background-color: #f5f5f5;
              padding: 12px 8px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: bold;
            }
            .billing-table td {
              padding: 12px 8px;
              border-bottom: 1px solid #ddd;
            }
            .billing-table .amount {
              text-align: right;
            }
            .billing-table .total-row {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .billing-table .total-row td {
              border-top: 2px solid #ddd;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .summary-box {
              flex: 1;
              margin: 0 10px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .summary-box h4 {
              margin: 0 0 10px 0;
              color: #1976d2;
              font-size: 14px;
            }
            .summary-box p {
              margin: 5px 0;
              font-size: 13px;
            }
            .alert-warning { 
              background-color: #fff3cd; 
              color: #856404; 
              padding: 15px; 
              margin-bottom: 20px;
              border-left: 4px solid #ffc107;
              border-radius: 4px;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              text-align: center; 
              font-size: 12px;
              color: #777;
            }
            .terms {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-logo">INSPIRE HUB</div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-subtitle">Professional Workspace Solutions</div>
            </div>
            
            ${show30DayNotif ? `
              <div class="alert-warning">
                <strong>IMPORTANT:</strong> This tenant has only 30 days left in their current monthly availability.
              </div>
            ` : ''}
            
            <div class="invoice-info">
              <div class="client-details">
                <div class="section-title">BILL TO</div>
                <p><strong>${client?.name || 'N/A'}</strong></p>
                <p>${client?.company || 'N/A'}</p>
                <p>${client?.email || 'N/A'}</p>
                <p>${client?.phone || 'N/A'}</p>
                <p>${client?.address || 'N/A'}</p>
              </div>
              <div class="invoice-details">
                <div class="section-title">INVOICE DETAILS</div>
                <p><strong>Invoice #:</strong> ${generateInvoiceNumber()}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${client?.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Plan:</strong> ${client?.billing?.plan || 'N/A'}</p>
                <p><strong>Payment Method:</strong> ${client?.billing?.paymentMethod || 'N/A'}</p>
              </div>
            </div>
            
            <div class="section-title">BILLING BREAKDOWN</div>
            <table class="billing-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Qty</th>
                  <th class="amount">Rate</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${billingBreakdown.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="amount">${
                      item.description.includes('Seat Rental')
                        ? `${client?.selectedSeats?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                        : item.description.includes('Private Office Rental')
                        ? `${client?.selectedOffices?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                        : item.description.includes('Virtual Office Service')
                        ? `1 × ${client?.billing?.monthsToAvail || 1}`
                        : item.quantity
                    }</td>
                    <td class="amount">${formatCurrency(item.rate)}</td>
                    <td class="amount">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>Subtotal</strong></td>
                  <td class="amount"><strong>${formatCurrency(billingBreakdown.subtotal)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>VAT (12%)</strong></td>
                  <td class="amount"><strong>${formatCurrency(billingBreakdown.vat)}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="amount"><strong>TOTAL</strong></td>
                  <td class="amount"><strong>${formatCurrency(billingBreakdown.total)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-box">
                <h4>RENTAL PERIOD</h4>
                <p><strong>Start Date:</strong> ${client?.billing?.startDate ? new Date(client.billing.startDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>End Date:</strong> ${client?.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Duration:</strong> ${client?.billing?.monthsToAvail || 'N/A'} ${parseInt(client?.billing?.monthsToAvail) > 1 ? 'months' : 'month'}</p>
                <p><strong>Remaining Days:</strong> ${daysLeft !== null ? `${daysLeft} days` : 'N/A'}</p>
              </div>
              <div class="summary-box">
                <h4>ASSIGNED SPACE</h4>
                <p><strong>Plan Type:</strong> ${client?.billing?.plan || 'N/A'}</p>
                <p><strong>Selected Items:</strong> ${
                  client?.selectedSeats?.length > 0 
                    ? client.selectedSeats.join(", ")
                    : client?.selectedOffices?.length > 0
                    ? client.selectedOffices.join(", ")
                    : "Virtual Office"
                }</p>
                <p><strong>Base Rate:</strong> ${formatCurrency(client?.billing?.rate)}</p>
                <p><strong>Currency:</strong> ${client?.billing?.currency || 'PHP'}</p>
              </div>
            </div>
            
            ${extensionHistory.length > 0 ? `
              <div class="section-title">EXTENSION HISTORY</div>
              <table class="billing-table">
                <thead>
                  <tr>
                    <th>Extension #</th>
                    <th>Previous End Date</th>
                    <th>New End Date</th>
                    <th>Extended By</th>
                    <th>Extended On</th>
                  </tr>
                </thead>
                <tbody>
                  ${extensionHistory.map((extension, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${extension.previousEndDate}</td>
                      <td>${extension.newEndDate}</td>
                      <td>${extension.extendedBy} days</td>
                      <td>${extension.extendedOn}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            <div class="terms">
              <strong>Terms & Conditions:</strong><br>
              • Payment is due upon receipt of this invoice<br>
              • Late payments may incur additional charges<br>
              • This invoice is valid for 30 days from the date of issue<br>
              • For questions regarding this invoice, please contact our billing department
            </div>
            
            <div class="footer">
              <strong>INSPIRE HUB</strong><br>
              Professional Workspace Solutions<br>
              This is an official invoice generated by the Tenant Management System<br>
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          pb: 0,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Invoice Details
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            {client?.company} • {generateInvoiceNumber()}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Print Invoice">
            <IconButton 
              onClick={handlePrint} 
              aria-label="print" 
              size="large" 
              sx={{ mr: 1, color: 'white' }}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <IconButton 
            onClick={onClose} 
            aria-label="close" 
            size="large"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      {/* Hidden div for print content */}
      <div ref={printRef} style={{ display: 'none' }}></div>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* 30 days left notification */}
          {show30DayNotif && (
            <Alert severity="warning" sx={{ fontWeight: 600 }}>
              ⚠️ This tenant has only 30 days left in their current monthly availability. Please notify them or extend their availability soon.
            </Alert>
          )}

          {/* Invoice Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              INSPIRE HUB
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Professional Workspace Solutions
            </Typography>
          </Box>

          {/* Client and Invoice Info */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary' }}>
                    <PersonIcon />
                    BILL TO
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>{client?.name || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">{client?.company || 'N/A'}</Typography>
                  <Typography variant="body2">{client?.email || 'N/A'}</Typography>
                  <Typography variant="body2">{client?.phone || 'N/A'}</Typography>
                  <Typography variant="body2">{client?.address || 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary' }}>
                    <BusinessIcon />
                    INVOICE DETAILS
                  </Typography>
                  <Typography variant="body2"><strong>Invoice #:</strong> {generateInvoiceNumber()}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date().toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Due Date:</strong> {client?.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Plan:</strong> {client?.billing?.plan || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Payment Method:</strong> {client?.billing?.paymentMethod || 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Billing Breakdown */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                BILLING BREAKDOWN
              </Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {billingBreakdown.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ border: 'none', py: 1 }}>
                          <Typography variant="body2">{item.description}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                          <Typography variant="body2">
                            {item.description.includes('Seat Rental') 
                              ? `${client?.selectedSeats?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                              : item.description.includes('Private Office Rental')
                              ? `${client?.selectedOffices?.length || 0} × ${client?.billing?.monthsToAvail || 1}`
                              : item.description.includes('Virtual Office Service')
                              ? `1 × ${client?.billing?.monthsToAvail || 1}`
                              : item.quantity
                            }
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                          <Typography variant="body2">{formatCurrency(item.rate)}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1 }}>
                          <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
                        <Typography variant="body1" fontWeight={600}>Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
                        <Typography variant="body1" fontWeight={600}>{formatCurrency(billingBreakdown.subtotal)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="body1" fontWeight={600}>VAT (12%)</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight={600}>{formatCurrency(billingBreakdown.vat)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
                        <Typography variant="h6" fontWeight={700} color="primary">TOTAL</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
                        <Typography variant="h6" fontWeight={700} color="primary">{formatCurrency(billingBreakdown.total)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                    RENTAL PERIOD
                  </Typography>
                  <Typography variant="body2"><strong>Start Date:</strong> {client?.billing?.startDate ? new Date(client.billing.startDate).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>End Date:</strong> {client?.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Duration:</strong> {client?.billing?.monthsToAvail || 'N/A'} {parseInt(client?.billing?.monthsToAvail) > 1 ? 'months' : 'month'}</Typography>
                  <Typography variant="body2"><strong>Remaining Days:</strong> {daysLeft !== null ? `${daysLeft} days` : 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary' }}>
                    ASSIGNED SPACE
                  </Typography>
                  <Typography variant="body2"><strong>Plan Type:</strong> {client?.billing?.plan || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Selected Items:</strong> {
                    client?.selectedSeats?.length > 0 
                      ? client.selectedSeats.join(", ")
                      : client?.selectedOffices?.length > 0
                      ? client.selectedOffices.join(", ")
                      : "Virtual Office"
                  }</Typography>
                  <Typography variant="body2"><strong>Base Rate:</strong> {formatCurrency(client?.billing?.rate)}</Typography>
                  <Typography variant="body2"><strong>Currency:</strong> {client?.billing?.currency || 'PHP'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Extension History Section */}
          {extensionHistory.length > 0 && (
            <TenantExtensionHistory history={extensionHistory} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
        <Button
          onClick={() => {
            onClose();
            onEdit(client);
          }}
          startIcon={<EditIcon />}
          color="secondary"
          variant="contained"
        >
          Edit Details
        </Button>
        <Button
          onClick={() => onExtend(client)}
          startIcon={<EventAvailableIcon />}
          color="primary"
          variant="contained"
        >
          Extend Availability
        </Button>
      </DialogActions>
    </Dialog>
  );
}