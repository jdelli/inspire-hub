"use client";

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceTemplate = ({ 
  invoiceData = {},
  preview = false 
}) => {
  const defaultData = {
    companyName: "INSPIRE HOLDINGS INC.",
    companyAddress: "6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    companyTIN: "123-456-789-000",
    invoiceNumber: "INV-2025-001",
    invoiceDate: new Date().toLocaleDateString('en-PH'),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PH'),
    clientName: "[CLIENT NAME]",
    clientCompany: "[CLIENT COMPANY]",
    clientAddress: "[CLIENT ADDRESS]",
    clientEmail: "[CLIENT EMAIL]",
    clientPhone: "[CLIENT PHONE]",
    contractNumber: "[CONTRACT NUMBER]",
    workspaceType: "Dedicated Desk",
    monthlyRate: 20000,
    cusaFee: 1500,
    parkingFee: 10000,
    advanceMonths: 2,
    securityMonths: 2,
    startDate: "[START DATE]",
    endDate: "[END DATE]",
    paymentMethod: "Bank Transfer"
  };

  const data = { ...defaultData, ...invoiceData };

  // Calculate amounts - only include fees if they are set and greater than 0
  const cusaFee = (data.cusaFee && parseFloat(data.cusaFee) > 0) ? parseFloat(data.cusaFee) : 0;
  const parkingFee = (data.parkingFee && parseFloat(data.parkingFee) > 0) ? parseFloat(data.parkingFee) : 0;
  const monthlyTotal = data.monthlyRate + cusaFee + parkingFee;
  const advanceRental = monthlyTotal * data.advanceMonths;
  const securityDeposit = monthlyTotal * data.securityMonths;
  const subtotal = advanceRental + securityDeposit;
  const totalAmount = subtotal;

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const numberToWords = (num) => {
    try {
      // Simplified number to words for common amounts
      if (num === 80000) return 'Eighty Thousand';
      if (num === 89600) return 'Eighty Nine Thousand Six Hundred';
      
      // For other amounts, provide a basic conversion
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      
      let result = '';
      if (thousands > 0) {
        result += `${thousands} Thousand `;
      }
      if (remainder > 0) {
        result += `${remainder}`;
      }
      
      return result.trim() || 'Zero';
    } catch (error) {
      console.error('Error converting number to words:', error);
      return num.toString();
    }
  };

  // Function to export this component as PDF
  const exportAsPDF = async () => {
    try {
      const element = document.querySelector('[data-invoice-template]');
      if (!element) {
        throw new Error('Invoice template not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Invoice_${data.invoiceNumber}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      return true;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`PDF generation failed: ${error.message}`);
      return false;
    }
  };

  // Function to print the invoice
  const printInvoice = () => {
    try {
      const element = document.querySelector('[data-invoice-template]');
      if (!element) {
        throw new Error('Invoice template not found');
      }

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
      }

      const htmlContent = element.outerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${data.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 0.75in;
            }
            
            @media print {
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000000;
                background: white;
              }
              
              .invoice-container {
                width: 100%;
                max-width: 100%;
                margin: 0;
                padding: 0;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-size: 12px;
              }
              
              .print-button {
                display: none !important;
              }
            }
            
            @media screen {
              body {
                margin: 20px;
                font-family: 'Arial', sans-serif;
                background: #f5f5f5;
              }
              
              .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
          ${htmlContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      return true;
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert(`Print failed: ${error.message}`);
      return false;
    }
  };

  // Add export functions to window for external access
  React.useEffect(() => {
    try {
      window.exportInvoiceAsPDF = exportAsPDF;
      window.printInvoice = printInvoice;
    } catch (error) {
      console.error('Error setting up window functions:', error);
    }
    
    return () => {
      try {
        delete window.exportInvoiceAsPDF;
        delete window.printInvoice;
      } catch (error) {
        console.error('Error cleaning up window functions:', error);
      }
    };
  }, [data.invoiceNumber]);

  return (
    <>
      {/* Print Button */}
      {!preview && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={printInvoice}
            title="Print Invoice (Ctrl+P)"
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🖨️ Print Invoice
          </button>
        </div>
      )}

      <div 
        data-invoice-template 
        className="invoice-container"
        style={{ 
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.4',
          maxWidth: '210mm',
          margin: '0 auto',
          padding: preview ? '20px' : '0',
          minHeight: '297mm'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '3px solid #007bff'
        }}>
          {/* Company Info */}
          <div style={{ flex: '1' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src="/images/inspire_docs_icon.jpg" 
                alt="Inspire Holdings Inc Logo" 
                style={{
                  width: '120px',
                  height: 'auto',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '10px'
                }}
              />
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '8px'
            }}>
              {data.companyName}
            </div>
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
              <div>{data.companyAddress}</div>
              <div>Phone: {data.companyPhone}</div>
              <div>Email: {data.companyEmail}</div>
              <div>TIN: {data.companyTIN}</div>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Invoice #:</strong> {data.invoiceNumber}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Date:</strong> {data.invoiceDate}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Due Date:</strong> {data.dueDate}
              </div>
              <div>
                <strong>Contract #:</strong> {data.contractNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px'
        }}>
          <div style={{ flex: '1' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Bill To:
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {data.clientName}
              </div>
              {data.clientCompany && (
                <div style={{ marginBottom: '4px' }}>{data.clientCompany}</div>
              )}
              <div style={{ marginBottom: '4px' }}>{data.clientAddress}</div>
              <div style={{ marginBottom: '4px' }}>Email: {data.clientEmail}</div>
              <div>Phone: {data.clientPhone}</div>
            </div>
          </div>

          <div style={{ flex: '1', textAlign: 'right' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Service Period:
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Start Date:</strong> {data.startDate}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>End Date:</strong> {data.endDate}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Workspace:</strong> {data.workspaceType}
              </div>
              <div>
                <strong>Payment Method:</strong> {data.paymentMethod}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  borderBottom: '2px solid #007bff',
                  fontWeight: 'bold'
                }}>
                  Description
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  borderBottom: '2px solid #007bff',
                  fontWeight: 'bold',
                  width: '80px'
                }}>
                  Months
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #007bff',
                  fontWeight: 'bold',
                  width: '100px'
                }}>
                  Monthly Rate
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #007bff',
                  fontWeight: 'bold',
                  width: '120px'
                }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Advance Rental */}
              <tr>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 'bold' }}>Advance Rental Payment</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Monthly Rent: {formatCurrency(data.monthlyRate)}
                    {cusaFee > 0 && ` + CUSA: ${formatCurrency(cusaFee)}`}
                    {parkingFee > 0 && ` + Parking: ${formatCurrency(parkingFee)}`}
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                  {data.advanceMonths}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  {formatCurrency(monthlyTotal)}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  {formatCurrency(advanceRental)}
                </td>
              </tr>

              {/* Security Deposit */}
              <tr>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 'bold' }}>Security Deposit</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Refundable after lease expiration (subject to property inspection)
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                  {data.securityMonths}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  {formatCurrency(monthlyTotal)}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  {formatCurrency(securityDeposit)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '30px'
        }}>
          <div style={{ width: '300px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #eee'
            }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '2px solid #007bff',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#007bff'
            }}>
              <span>TOTAL AMOUNT:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>



        {/* Bank Details */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#007bff',
            textAlign: 'center',
            textTransform: 'uppercase'
          }}>
            BANK ACCOUNT DETAILS
          </div>
          
          {/* Philippine Peso Accounts */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#333',
              borderLeft: '4px solid #007bff',
              paddingLeft: '10px'
            }}>
              Philippine Peso Accounts
            </div>
            
            {/* First PHP Account */}
            <div style={{
              marginBottom: '15px',
              borderLeft: '4px solid #007bff',
              paddingLeft: '15px'
            }}>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><strong>Account Name:</strong> Inspire Holdings Incorporated</div>
                <div><strong>Bank Name:</strong> BDO</div>
                <div><strong>Account Number:</strong> 11868006353</div>
              </div>
            </div>
            
            {/* Second PHP Account */}
            <div style={{
              borderLeft: '4px solid #007bff',
              paddingLeft: '15px'
            }}>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><strong>Account Name:</strong> Inspire Holdings Incorporated</div>
                <div><strong>Bank Name:</strong> Union Bank of the Philippines</div>
                <div><strong>Account Number:</strong> 00-1970005625</div>
              </div>
            </div>
          </div>
          
          {/* Japanese Yen Accounts */}
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#333',
              borderLeft: '4px solid #007bff',
              paddingLeft: '10px'
            }}>
              Japanese Yen Accounts
            </div>
            
            {/* First JPY Account */}
            <div style={{
              marginBottom: '15px',
              borderLeft: '4px solid #007bff',
              paddingLeft: '15px'
            }}>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><strong>Account Name:</strong> GMO aozoranet bank</div>
                <div><strong>Bank Name:</strong> Inspire Connect</div>
                <div><strong>Account Number:</strong> 2224038</div>
                <div><strong>Branch Number:</strong> 101</div>
              </div>
            </div>
            
            {/* Second JPY Account */}
            <div style={{
              borderLeft: '4px solid #007bff',
              paddingLeft: '15px'
            }}>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><strong>Account Name:</strong> GMO aozoranet bank</div>
                <div><strong>Bank Name:</strong> Alliance global group inc.</div>
                <div><strong>Account Number:</strong> 1249973</div>
                <div><strong>Branch Number:</strong> 102</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#666',
          borderTop: '1px solid #ddd',
          paddingTop: '15px'
        }}>
          Thank you for choosing INSPIRE Holdings Inc. for your workspace needs!
        </div>
      </div>
    </>
  );
};

export default InvoiceTemplate;