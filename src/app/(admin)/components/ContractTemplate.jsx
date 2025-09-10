"use client";

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ContractTemplate = ({ 
  contractData = {},
  preview = false 
}) => {
  const defaultData = {
    companyName: "INSPIRE HOLDINGS INC.",
    companyAddress: "6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig",
    companyPhone: "+63 (02) 123-4567",
    companyEmail: "info@inspirehub.ph",
    ceoName: "PATRICK PEREZ",
    clientName: "[CLIENT NAME]",
    clientAddress: "[CLIENT ADDRESS]",
    clientPhone: "[CLIENT PHONE]",
    clientEmail: "[CLIENT EMAIL]",
    contractNumber: "[CONTRACT NUMBER]",
    contractDate: "[CONTRACT DATE]",
    contractLocation: "[CONTRACT LOCATION]",
    startDate: "[START DATE]",
    endDate: "[END DATE]",
    workspaceType: "one (1) workspace",
    workspaceDetails: "Alliance Global Tower, 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City",
    monthlyRent: "20,000",
    cusaFee: "1,500",
    parkingFee: "10,000",
    securityDeposit: "40,000",
    advanceRental: "40,000",
    totalInitialPayment: "80,000",
    paymentDate: "[PAYMENT DATE]",
    citizenship: "[CITIZENSHIP]",
    docNo: "[DOC NO]",
    pageNo: "[PAGE NO]",
    bookNo: "[BOOK NO]",
    notaryDate: "[NOTARY DATE]",
    notaryLocation: "[NOTARY LOCATION]"
  };

  const data = { ...defaultData, ...contractData };

  // Function to export this component as PDF
  const exportAsPDF = async () => {
    try {
      // Find the contract container element
      const element = document.querySelector('[data-contract-template]');
      if (!element) {
        throw new Error('Contract template not found');
      }

      // Show loading indicator
      const originalContent = element.innerHTML;
      element.innerHTML = '<div style="text-align: center; padding: 50px; font-size: 18px;">Generating PDF...</div>';

      // Wait a moment for the loading indicator to show
      await new Promise(resolve => setTimeout(resolve, 100));

      // Restore original content
      element.innerHTML = originalContent;

      // Create a clone of the element for PDF generation
      const clonedElement = element.cloneNode(true);
      
      // Create a temporary container for the clone
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.visibility = 'visible';
      tempContainer.style.opacity = '1';
      tempContainer.style.zIndex = '9999';
      
      // Apply styles to the cloned element
      clonedElement.style.position = 'static';
      clonedElement.style.left = 'auto';
      clonedElement.style.top = 'auto';
      clonedElement.style.width = '100%';
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.color = '#000000';
      clonedElement.style.fontFamily = 'Arial, sans-serif';
      clonedElement.style.fontSize = '12pt';
      clonedElement.style.lineHeight = '1.8';
      clonedElement.style.padding = '20px';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.visibility = 'visible';
      clonedElement.style.opacity = '1';

      // Remove print button from clone
      const printButtons = clonedElement.querySelectorAll('button');
      printButtons.forEach(btn => btn.remove());

      // Simplify complex styling that might cause issues
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove problematic CSS properties
        el.style.transform = '';
        el.style.animation = '';
        el.style.transition = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
        el.style.position = el.style.position === 'fixed' ? 'static' : el.style.position;
        
        // Ensure visibility
        if (el.style.display === 'none') {
          el.style.display = 'block';
        }
        if (el.style.visibility === 'hidden') {
          el.style.visibility = 'visible';
        }
        if (el.style.opacity === '0') {
          el.style.opacity = '1';
        }
      });

      // Append to temporary container
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create canvas from the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: true,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Apply additional fixes to the cloned document
          const clonedBody = clonedDoc.body;
          clonedBody.style.fontFamily = 'Arial, sans-serif';
          clonedBody.style.color = '#000000';
          clonedBody.style.backgroundColor = '#ffffff';
          
          // Ensure all elements are visible
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
            el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
          });
        }
      });

      // Remove the temporary container
      document.body.removeChild(tempContainer);

      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no content - element may be hidden or empty');
      }

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Check if image data is valid
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data from canvas');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190; // Leave margins
      const pageHeight = 277; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fileName = `Contract_${data.clientName || 'Client'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      console.log('PDF generated successfully');
      return true;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(`PDF generation failed: ${error.message}`);
      return false;
    }
  };

  // Alternative simple PDF export using basic text
  const exportSimplePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set font
      pdf.setFont('helvetica');
      pdf.setFontSize(12);
      
      let yPos = 20;
      const leftMargin = 20;
      const rightMargin = 190;
      const lineHeight = 7;
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTRACT OF LEASE', 105, yPos, { align: 'center' });
      yPos += lineHeight * 2;
      
      // Company info
      pdf.setFontSize(14);
      pdf.text(data.companyName, 105, yPos, { align: 'center' });
      yPos += lineHeight;
      pdf.setFontSize(10);
      pdf.text(data.companyAddress, 105, yPos, { align: 'center' });
      yPos += lineHeight * 2;
      
      // Tenant Information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TENANT INFORMATION', leftMargin, yPos);
      yPos += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tenant Name: ${data.clientName}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Address: ${data.clientAddress}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Email: ${data.clientEmail}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Phone: ${data.clientPhone}`, leftMargin, yPos);
      yPos += lineHeight * 2;
      
      // Contract Details
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTRACT DETAILS', leftMargin, yPos);
      yPos += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Contract Date: ${data.contractDate}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Contract Number: ${data.contractNumber}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Start Date: ${data.startDate}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`End Date: ${data.endDate}`, leftMargin, yPos);
      yPos += lineHeight;
      pdf.text(`Monthly Rent: PHP ${data.monthlyRent}`, leftMargin, yPos);
      yPos += lineHeight * 2;
      
      // Add basic terms
      pdf.setFont('helvetica', 'bold');
      pdf.text('BASIC TERMS', leftMargin, yPos);
      yPos += lineHeight;
      
      const terms = [
        'This Contract of Lease is made between INSPIRE HOLDINGS INC. (LESSOR)',
        `and ${data.clientName} (LESSEE).`,
        '',
        'The LESSOR agrees to lease the designated workspace to the LESSEE',
        'under the terms and conditions specified in this agreement.',
        '',
        'Monthly rental payment of PHP ' + data.monthlyRent + ' is due on the',
        'first day of each month.',
        '',
        'Security deposit of PHP ' + data.securityDeposit + ' is required',
        'upon signing this contract.',
        '',
        'This contract is governed by the laws of the Republic of the Philippines.'
      ];
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      terms.forEach(term => {
        if (yPos > 270) { // Near bottom of page
          pdf.addPage();
          yPos = 20;
        }
        
        if (term === '') {
          yPos += lineHeight / 2;
        } else {
          // Split long lines
          const words = term.split(' ');
          let line = '';
          
          words.forEach((word, index) => {
            const testLine = line + word + ' ';
            const testWidth = pdf.getTextWidth(testLine);
            
            if (testWidth > (rightMargin - leftMargin) && line !== '') {
              pdf.text(line, leftMargin, yPos);
              yPos += lineHeight;
              line = word + ' ';
            } else {
              line = testLine;
            }
            
            // Last word
            if (index === words.length - 1) {
              pdf.text(line, leftMargin, yPos);
              yPos += lineHeight;
            }
          });
        }
      });
      
      // Add signature lines
      yPos += lineHeight;
      pdf.text('_____________________', leftMargin, yPos + 20);
      pdf.text('_____________________', rightMargin - 40, yPos + 20);
      pdf.text('LESSOR', leftMargin, yPos + 25);
      pdf.text('LESSEE', rightMargin - 40, yPos + 25);
      
      // Download the PDF
      const fileName = `Contract_Simple_${data.clientName || 'Client'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      return true;
    } catch (error) {
      console.error('Error exporting simple PDF:', error);
      alert(`Simple PDF generation failed: ${error.message}`);
      return false;
    }
  };

  // Function to print the contract
  const printContract = () => {
    try {
      // Find the contract container element
      const element = document.querySelector('[data-contract-template]');
      if (!element) {
        throw new Error('Contract template not found');
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups for this site.');
      }

      // Get the HTML content
      const htmlContent = element.outerHTML;
      
      // Create the print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contract of Lease - ${data.clientName || 'Client'}</title>
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
                font-size: 12pt;
                line-height: 1.4;
                color: #000000;
                background: white;
              }
              
              .contract-page {
                width: 100%;
                height: auto;
                padding: 0;
                margin: 0;
                box-sizing: border-box;
                font-family: 'Times New Roman', serif;
                font-size: 11px;
                line-height: 1.4;
                color: #000000;
                background: white;
                page-break-after: always;
                break-after: page;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .contract-page:last-child {
                page-break-after: auto;
                break-after: auto;
              }
              
              .page-break {
                display: none;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000000;
                margin: 10px 0;
              }
              
              th, td {
                border: 1px solid #000000;
                padding: 6px 8px;
                text-align: left;
                font-size: 11px;
                color: #000000;
                vertical-align: top;
              }
              
              th {
                font-weight: bold;
              }
              
              u {
                border-bottom: 1px solid #000000;
                text-decoration: none;
              }
              
              strong {
                font-weight: bold;
              }
              
              p {
                margin: 8px 0;
              }
              
              div[style*="margin"] {
                margin: 8px 0 !important;
              }
              
              .print-button {
                display: none !important;
              }
              
              /* Remove extra spacing that causes page breaks */
              [style*="marginBottom: '24px'"],
              [style*="margin-bottom: 24px"] {
                margin-bottom: 12px !important;
              }
              
              [style*="marginTop: '24px'"],
              [style*="margin-top: 24px"] {
                margin-top: 12px !important;
              }
              
              [style*="marginBottom: '16px'"],
              [style*="margin-bottom: 16px"] {
                margin-bottom: 8px !important;
              }
              
              [style*="marginTop: '16px'"],
              [style*="margin-top: 16px"] {
                margin-top: 8px !important;
              }
            }
            
            @media screen {
              body {
                margin: 20px;
                font-family: 'Times New Roman', serif;
                font-size: 12px;
                line-height: 1.8;
                color: #000000;
                background: #f5f5f5;
              }
              
              .contract-page {
                width: 8.5in;
                min-height: 11in;
                padding: 0.75in;
                margin: 0 auto 2rem auto;
                box-sizing: border-box;
                font-family: 'Times New Roman', serif;
                font-size: 12px;
                line-height: 1.8;
                color: #000000;
                background: white;
                border: 1px solid #ddd;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
              
              .print-button:hover {
                background: #0056b3;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">🖨️ Print Contract</button>
          ${htmlContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      console.log('Print window opened successfully');
      return true;
    } catch (error) {
      console.error('Error printing contract:', error);
      alert(`Print failed: ${error.message}`);
      return false;
    }
  };

  // Add keyboard shortcut for printing
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        printContract();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [data.clientName]);

  // Add export functions to window for external access
  React.useEffect(() => {
    window.exportContractAsPDF = exportAsPDF;
    window.exportSimplePDF = exportSimplePDF;
    window.printContract = printContract;
    return () => {
      delete window.exportContractAsPDF;
      delete window.exportSimplePDF;
      delete window.printContract;
    };
  }, [data.clientName]);

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
            onClick={printContract}
            title="Print Contract (Ctrl+P)"
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
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#0056b3'}
            onMouseOut={(e) => e.target.style.background = '#007bff'}
          >
            🖨️ Print Contract
          </button>
            </div>
      )}
      
      <style jsx global>{`
        @media print {
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000000;
            background: white;
          }
          
          .contract-page {
            width: 100%;
            height: auto;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000000;
            background: white;
          }
          
          .contract-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          .page-break {
            display: none;
          }
          
          p {
            margin: 8px 0;
          }
          
          div[style*="margin"] {
            margin: 8px 0 !important;
          }
          
          /* Reduce spacing for print */
          [style*="marginBottom: '24px'"],
          [style*="margin-bottom: 24px"] {
            margin-bottom: 12px !important;
          }
          
          [style*="marginTop: '24px'"],
          [style*="margin-top: 24px"] {
            margin-top: 12px !important;
          }
          
          [style*="marginBottom: '16px'"],
          [style*="margin-bottom: 16px"] {
            margin-bottom: 8px !important;
          }
          
          [style*="marginTop: '16px'"],
          [style*="margin-top: 16px"] {
            margin-top: 8px !important;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            margin: 10px 0;
          }
          
          th, td {
            border: 1px solid #000000;
            padding: 6px 8px;
            text-align: left;
            font-size: 11px;
            color: #000000;
            vertical-align: top;
          }
        }
        
        .contract-page {
          width: 8.5in;
          min-height: 11in;
          padding: 0.75in;
          margin: 0 auto 2rem auto;
          box-sizing: border-box;
          font-family: 'Times New Roman', serif;
          font-size: 12px;
          line-height: 1.8;
          color: #000000;
          background: white;
          border: 1px solid #ddd;
        }
      `}</style>
    <div 
      data-contract-template 
        className={`${preview ? 'shadow-lg' : ''}`} 
      style={{ 
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.4',
        maxWidth: '210mm', // A4 width
        margin: '0 auto',
        padding: preview ? '20px' : '0'
      }}
    >
        {/* PAGE 1 - Header, Parties, Witnesseth, Terms 1-2 */}
        <div className="contract-page">
          {/* Header with INSPIRE Logo */}
          <div className="text-center mb-6" style={{
          textAlign: 'center',
            marginBottom: '24px'
        }}>
            <div className="mb-4" style={{ marginBottom: '16px' }}>
              <img 
                src="/images/inspire_docs_icon.jpg" 
                alt="Inspire Holdings Inc Logo" 
                style={{
                  width: '120px',
                  height: 'auto',
                  marginBottom: '16px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              />
                </div>
            <h1 className="text-2xl font-bold" style={{
              fontSize: '20px',
                  fontWeight: 'bold',
              color: '#000000',
            letterSpacing: '0.1em'
          }}>
            CONTRACT OF LEASE
            </h1>
        </div>

        {/* Opening Statement */}
          <div className="mb-4" style={{ 
            marginBottom: '16px'
          }}>
            <div className="text-center mb-4" style={{
            textAlign: 'center',
              marginBottom: '16px'
            }}>
              <p className="font-bold" style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                color: '#000000'
            }}>
              KNOW ALL MEN BY THESE PRESENTS:
            </p>
          </div>
          
            <div className="mb-4 text-justify" style={{
              marginBottom: '16px',
              fontSize: '12px',
              lineHeight: '1.15',
            textAlign: 'justify',
              color: '#000000'
          }}>
            <p>
              This Contract of Lease is made and executed this <u style={{
                display: 'inline-block',
                minWidth: '80px',
                  borderBottom: '1px solid #000000',
                marginLeft: '4px',
                marginRight: '4px',
                textAlign: 'center'
              }}>{data.contractDate}</u> in <u style={{
                display: 'inline-block',
                minWidth: '120px',
                  borderBottom: '1px solid #000000',
                marginLeft: '4px',
                marginRight: '4px',
                textAlign: 'center'
              }}>{data.contractLocation}</u> by and between:
            </p>
          </div>
        </div>

        {/* Parties */}
          <div className="mb-4" style={{ marginBottom: '16px' }}>
            <div className="text-justify" style={{
              fontSize: '12px',
              lineHeight: '1.15',
              textAlign: 'justify',
              color: '#000000'
            }}>
              <p className="mb-4" style={{ 
                marginBottom: '16px',
                color: '#000000'
              }}>
                <strong style={{ fontWeight: 'bold' }}>{data.companyName}</strong>, a corporation duly organized and existing under the laws of the Republic of the Philippines with principal office at 6th Floor, Alliance Global Tower, 11th Avenue, corner 36th Street, Bonifacio Global City, Taguig, represented by its Chief Executive Officer, <strong style={{ fontWeight: 'bold' }}>{data.ceoName}</strong>, herein referred to as the <strong style={{ fontWeight: 'bold' }}>"LESSOR"</strong>;
              </p>
              
              <div className="text-center my-4" style={{
                textAlign: 'center',
                margin: '16px 0'
              }}>
                <p className="font-bold" style={{ 
                  fontWeight: 'bold',
                  color: '#000000' 
                }}>-and-</p>
              </div>

              <p className="mb-4" style={{ 
                marginBottom: '16px',
                color: '#000000'
              }}>
                <u style={{
                  display: 'inline-block',
                  minWidth: '200px',
                  borderBottom: '1px solid #000000',
                  textAlign: 'center'
                }}>{data.clientName}</u>, of legal age, <u style={{
                  display: 'inline-block',
                  minWidth: '120px',
                  borderBottom: '1px solid #000000',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.citizenship}</u>, with present residential address at <u style={{
                  display: 'inline-block',
                  minWidth: '250px',
                  borderBottom: '1px solid #000000',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.clientAddress}</u>, herein referred to as the <strong style={{ fontWeight: 'bold' }}>"LESSEE"</strong>;
              </p>
          </div>
        </div>

        {/* WITNESSETH */}
          <div className="mb-4">
            <div className="text-center mb-4">
              <p className="font-bold" style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#000000'
              }}>WITNESSETH:</p>
          </div>
          
            <div className="space-y-2 text-justify" style={{
              fontSize: '12px',
              lineHeight: '1.15',
              textAlign: 'justify',
              color: '#000000'
            }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>WHEREAS</strong>, the LESSOR has offered to transfer to the LESSEE the physical possession uses under the concept of <strong>{data.workspaceType}</strong> managed by the LESSOR at Alliance Global Tower, with physical address at 11th Avenue, corner 36th St. Bonifacio Global City, Taguig City, hereinafter referred to as the "Leased Premise".
              </p>
              
              <p style={{ marginBottom: '12px' }}>
              <strong>WHEREAS</strong>, the LESSEE desires to lease the Leased Premise, and the LESSOR is willing to lease unto the LESSEE under the terms and conditions set forth below;
            </p>
            
              <p style={{ marginBottom: '12px' }}>
              <strong>NOW THEREFORE</strong>, for and in consideration of the foregoing premises and the mutual covenants and obligations hereinafter contained and to be performed, the LESSOR hereby leases the Leased Premise to the LESSEE, and the LESSEE accepts the same, subject to the following terms and conditions:
            </p>
          </div>
        </div>

          {/* Terms 1-2 */}
          <div className="space-y-2 text-justify" style={{
            fontSize: '12px',
            lineHeight: '1.8',
            textAlign: 'justify',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>1. TERM.</strong> The Lease shall be for a period of One (1) year commencing on <u style={{
                  display: 'inline-block',
                  minWidth: '60px',
                  borderBottom: '1px solid #000000',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.startDate}</u> and ending on <u style={{
                  display: 'inline-block',
                  minWidth: '60px',
                  borderBottom: '1px solid #000000',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.endDate}</u>, with option to renew upon forty-five (45) days advance notice by the LESSEE and upon mutual agreement of both parties. The term shall be guaranteed for one (1) year and no pre-termination without just cause by either party shall be allowed. If either party provides written notice upon forty-five (45) days before the end of the period, this agreement shall automatically renew for another twelve (12) months under the same conditions.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>2. RENTAL RATE AND PAYMENTS.</strong> The parties herein agree that the monthly rent for the Leased Premise shall be Philippine Peso: <strong>TWENTY THOUSAND PESOS (PHP20,000.00)</strong> excluding 12% VAT per month, Common Use Service Area (CUSA) and parking. Below is the breakdown:
              </p>
              
              <div style={{ margin: '20px 0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000000',
                  marginBottom: '30px'
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#000000',
                        fontSize: '12px'
                      }}>CATEGORY</th>
                      <th style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#000000',
                        fontSize: '12px'
                      }}>TERMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>Monthly Rent</td>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>Php 20,000 (excluding VAT)</td>
                    </tr>
                    <tr>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>CUSA</td>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>Php 1,500.00</td>
                    </tr>
                    <tr>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>Parking Fee (optional)</td>
                      <td style={{
                        border: '1px solid #000000',
                        padding: '10px 8px',
                        color: '#000000',
                        fontSize: '12px'
                      }}>10,000 per month</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p style={{ marginTop: '20px', marginBottom: '16px' }}>
                On or before <u style={{
                  display: 'inline-block',
                  minWidth: '80px',
                  borderBottom: '1px solid #000000',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}></u>, the LESSEE shall pay the LESSOR the amount of <strong>EIGHTY THOUSAND Pesos (Php80,000.00)</strong>, Philippine Currency, representing two (2) months advanced rental and two (2) months security deposit.
              </p>

              <p style={{ marginBottom: '16px' }}>
                Monthly Rental payment shall be paid by the LESSEE every end of the month to the bank account designated by the LESSOR. Any transfer fees shall be shouldered by the LESSEE. In case of late payment, additional five (5) percent per month will be added to the monthly rental fee.
              </p>
            </div>
          </div>
            </div>

        {/* PAGE 2 - Terms 3-6 */}
        <div className="contract-page">
          <div className="space-y-2 text-justify" style={{
            fontSize: '12px',
            lineHeight: '1.8',
            textAlign: 'justify',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>3. TAXES.</strong> Other than the LESSOR's income taxes or taxes required to be withheld from the rentals due to the LESSOR but which shall be credited against the LESSOR's income taxes, all taxes to be due by reason of the receipt of rentals by the LESSOR, including the VAT, and all other amounts which the LESSEE is required to pay the LESSOR as provided thereunder, as well as the documentary stamp taxes or other taxes accruing by reason of the execution of this Contract shall be for the account of the LESSEE.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>4. SECURITY DEPOSIT.</strong> The LESSEE shall pay the amount of <strong>FORTY THOUSAND Pesos (Php40,000.00)</strong>, Philippine Currency to the LESSOR upon the execution of this Lease. This deposit is not advance payment for monthly rental, it shall be held by the LESSOR as security for the full and faithful observance by the LESSEE of the terms, conditions and provisions of this contract. Such security deposit cannot be used to pay the rental, common area charge, nor used to extend the contract term.
              </p>
              
              <p style={{ marginBottom: '16px' }}>
                The two (2) months security deposit shall be reimbursed by the LESSOR to the LESSEE after the lapse of forty-five (45) days from the expiration of the lease but only after the checking of the Leased Premise and after it shall have been ascertained that there are no repairs/restoration works to be undertaken in the Leased Premise.
              </p>
              
              <p style={{ marginBottom: '16px' }}>
                In the event this Contract of Lease is renewed, the LESSEE shall pay such additional amount to the LESSOR so that the said deposit shall be based on the increased monthly rental as indicated above. The security deposit cannot be used as extension of the lease or advance rent for the next lease period.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>5. ADVANCE RENTAL.</strong> The two (2) months advance rental will be used on the last month of the contract period.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>6. PROVIDED SERVICES.</strong> The LESSOR shall provide the following services to the LESSEE:
              </p>
              
              <div style={{
                marginLeft: '16px',
                fontSize: '12px',
                lineHeight: '1.8',
                color: '#000000'
              }}>
                <p style={{ marginBottom: '12px' }}><strong>6.1. Use of workspaces (shared, private, and meeting room)</strong></p>
                <div style={{ marginLeft: '16px', marginBottom: '6px' }}>
                  <p style={{ marginBottom: '3px' }}>6.1.1. The meeting room requires a reservation and costs Php3,200/hour (excluding tax).</p>
                  <p style={{ marginBottom: '3px' }}>6.1.2. Reservations must be made at least 3 days in advance</p>
                  <p style={{ marginBottom: '3px' }}>6.1.3. Cancellation fees are as follows:</p>
                  <div style={{ marginLeft: '16px' }}>
                    <p style={{ marginBottom: '2px' }}>• Same-day cancellation: 60%</p>
                    <p style={{ marginBottom: '2px' }}>• One-day prior: 40%</p>
                    <p style={{ marginBottom: '2px' }}>• Two days or more in advance: Free</p>
                  </div>
                </div>
                <p style={{ marginBottom: '12px' }}><strong>6.2. Two Person Booth</strong></p>
                <div style={{ marginLeft: '16px', marginBottom: '6px' }}>
                  <p style={{ marginBottom: '3px' }}>6.2.1. Lessee is entitled to up to 15 hours of free usage per month</p>
                  <p style={{ marginBottom: '3px' }}>6.2.2. Additional use is charged at 1,500 PHP/hour (excluding tax)</p>
                  <p style={{ marginBottom: '3px' }}>6.2.3. Advance reservation (at least 3 days prior) is required</p>
                </div>
                <p style={{ marginBottom: '8px' }}>• Internet Access (Wifi)</p>
                <p style={{ marginBottom: '8px' }}>• Electrical Outlets</p>
                <p style={{ marginBottom: '8px' }}>• Common Areas (Kitchen, Restroom, Lounge, etc.)</p>
                <p style={{ marginBottom: '8px' }}>• Receipt of Mail</p>
                <p style={{ marginBottom: '8px' }}>• Corporate Registration Service (upon request and approval)</p>
                <p style={{ marginBottom: '8px' }}>• Janitorial Services – The LESSOR shall provide janitorial services to keep the common areas in order</p>
                <p style={{ marginBottom: '8px' }}>• Electricity – The LESSOR shall provide electrical power to the Leased Premise</p>
              </div>
            </div>
          </div>
            </div>

        {/* PAGE 3 - Terms 7-15 */}
        <div className="contract-page">
          <div className="space-y-2 text-justify" style={{
            fontSize: '12px',
            lineHeight: '1.8',
            textAlign: 'justify',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>7. USAGE HOURS.</strong> The Leased Premise shall only be used from Monday to Friday, from 9:00 AM to 6:00 PM. The Leased Premise is closed on Saturdays, Sundays, and public holidays. Use on holidays may be allowed with prior approval from the LESSOR.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>7.1 AIR-CONDITIONING -</strong> The Leased Premise shall be supplied with air-conditioning from 9:00 A.M. to 6:00 P.M. Mondays through Fridays, except holidays. The LESSEE may, however, upon one-day prior written notice, request the LESSOR to extend air-conditioning services to be provided to the Leased Premise outside regular hours. The LESSEE shall reimburse the LESSOR for the cost of providing such services to the Leased Premise at an hourly rate of <strong>Php 3000</strong>. The LESSOR reserves the right to reasonably adjust the hourly rate at any time during the renewal period.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>8. PRE-TERMINATION.</strong> This contract is guaranteed for one (1) year. In the event that this contract was pre-terminated caused by the LESSEE's fault or decision, all the security deposit, and unused advance payments should be forfeited in favor of the LESSOR. In addition, the LESSEE still needs to settle any damages or repairs caused by the LESSEE on the Leased Premise before move out.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>9. HANDOVER THE UNIT.</strong> The LESSEE hereby acknowledges LESSOR will deliver the leased premise to the LESSEE with current status upon the start date of contract. LESSEE receives the leased premise and must start perform the obligations and rights in this contract.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>10. USE OF PREMISES.</strong> The LESSEE shall keep the Leased Premise clean and in sanitary condition for the duration of the Lease. The LESSEE shall use the Leased Premise for office purpose only, and for no other purpose without the written consent of the LESSOR. The LESSEE hereby agrees to abide by existing rules and regulations of the corporation, and any other laws, ordinances, rules and regulations governing the use of the Leased Premise.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>11. ASSIGNMENT AND SUBLEASE.</strong> The LESSEE is NOT allowed to transfer its rights, interest and obligations under this agreement or sub-lease the Leased Premise or any portion thereof to any person or entity during the duration of the lease, without the prior written consent of the LESSOR.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>12. NON-WAIVER.</strong> Delay or failure by either party to exercise any of its rights or remedies hereunder shall not be construed to be a waiver of such right and remedy.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>13. IMPROVEMENTS.</strong> The LESSEE shall not make any alteration, structural changes or improvements in the Leased Premise without the prior written consent of the LESSOR.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>14. ACTS OF GOD.</strong> Should the Leased Premise be damaged by fire, earthquake, storm or any fortuitous events to the extent that the same rendered un-tenantable, this Lease shall be automatically cancelled and the deposit as well as the unused portion of the advance rentals shall be refunded to the LESSEE within <strong>sixty (60) days</strong>, less any unpaid obligations of the LESSEE.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>15. INSPECTION OF PREMISES.</strong> To ensure that the Leased Premise is being maintained in good and tenantable condition, the LESSOR or his authorized representative is hereby given the right after two (2) days prior written notice, to enter and inspect any part of the Leased Premise during reasonable hours of the day and as the occasion might require.
              </p>
            </div>
          </div>
            </div>

        {/* PAGE 4 - Terms 16-22 */}
        <div className="contract-page">
          <div className="space-y-2 text-justify" style={{
            fontSize: '12px',
            lineHeight: '1.8',
            textAlign: 'justify',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>16. INJURY OR DAMAGE.</strong> The LESSEE hereby assumes the full responsibility for any damage which may be caused to the person or property of any third persons in the Leased Premise during the duration of the Lease arising out of the use of the Leased Premise by the LESSEE, its employees and guests. The LESSEE further binds himself to hold the LESSOR free and harmless from damages as a result thereof, unless such damage or liability arose out of structural or other inherent defects in the Leased Premise or is due to the fault of the LESSOR. Further, where such damage or liability is caused by a fortuitous event or an act of God, such as, but not limited to, typhoons, earthquakes, floods, which are beyond the control of the LESSEE, the LESSOR shall not responsible to such damage to the person and items in the Leased Premise.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>17. HAZARDOUS AND PROHIBITED MATERIALS.</strong> The LESSEE shall not keep or store in the Leased Premise any hazardous and obnoxious substance or inflammable material or substance that might constitute a fire hazard or other chemicals and materials or prohibitive drugs in violation of the laws of the Philippines.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>18. RULES AND REGULATIONS.</strong> The LESSEE binds himself to comply with the existing rules and regulations promulgated by the building administrator and/or association and any other environmental or other laws, ordinances, rules and regulations applicable to the Leased Premise.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>19. VIOLATIONS.</strong> Either party may, at its option, consider this Lease automatically rescinded and canceled, without need of any court action, upon seven (7) days written notice given to the other party, based on any of the following grounds:
              </p>
              
              <div style={{
                marginLeft: '16px',
                fontSize: '12px',
                lineHeight: '1.8',
                color: '#000000'
              }}>
                <p style={{ marginBottom: '2px' }}>• Failure of the LESSEE to pay any advance rental and other bills or charges no matter for any reason.</p>
                <p style={{ marginBottom: '2px' }}>• For any violation made by the other party of any of the terms and conditions stipulated in this Lease;</p>
                <p style={{ marginBottom: '2px' }}>• In case the Leased Premise shall be vacated or abandoned for a period of thirty (30) days without prior written notice to the LESSOR. Consequently, the LESSOR is hereby permitted and authorized by the LESSEE to enter the premises, either by force or otherwise, without being liable to prosecution therefor.</p>
                <p style={{ marginBottom: '2px' }}>• When this contract expires without renewal or this contract being canceled, the LESSEE shall pull out all his/her personal belongings immediately from the Leased Premise. If ever LESSEE refuses to do so, after 3 days of informing the LESSEE, the LESSOR shall have rights to dispose any items that occupied in the premise.</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>20. RETURN OF LEASED PREMISES.</strong> Subject to the Clause on Security Deposit, at the end of the term of the Lease, the LESSEE shall peacefully and immediately vacate the Leased Premise and return possession of the Leased Premise to the LESSOR in its original condition prior to start of the Lease unless the term of this Lease is extended or renewed. Sixty (60) days prior to the end of the term of the Lease, without signing renewal contract between the LESSOR and the LESSEE, the LESSOR may show the Leased Premise to prospective tenants through his representatives or agent, at reasonable hours of the day and with advance notice to the LESSEE. Unless agreed by the LESSOR, the LESSEE shall, at its own expense, remove all the property of the LESSEE including those alternations, additions and improvements made or installed by either or both parties. The Lessee shall also pay for any and all damages incurred in the premises as a result of such removal.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>21. ATTORNEY'S FEES.</strong> In case either party resorts to judicial action based upon or in connection with this Lease, the guilty party hereby agrees to pay attorney's fee and liquidated damages equivalent to Ten (10%) of the total amount involved or claimed by the aggrieved party as against the guilty party plus all court expenses and/or costs of litigation.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>22. VENUE.</strong> All court actions from this Lease shall be filed only in the Courts of Taguig City to exclusion of all other courts.
              </p>
            </div>
          </div>
            </div>

        {/* PAGE 5 - Terms 23-24, Signatures, and Witnesses */}
        <div className="contract-page">
          <div className="space-y-2 text-justify" style={{
            fontSize: '12px',
            lineHeight: '1.8',
            textAlign: 'justify',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>23. SUCCESSORS AND ASSIGNS.</strong> This Lease shall bind and inure to the benefits of the successors and assigns of the LESSOR and of the permitted successors and assigns of the LESSEE.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>24. NOTICES.</strong> Unless otherwise provided herein, any notice, tender or delivery to be given hereunder by either party to the other may be affected by personal delivery in writing, or by registered or certified mail, express delivery. A notice shall be deemed to have been served on the 5th day of mailing or on the date of arrival, whichever is earlier. LESSOR shall not be responsible for conveying any notice issued by the property management office (including but not limited to notice of payment, power interruption, water interruption, fire drill, public facility maintenance, etc.). Mailed notices shall be addressed as set forth below. LESSOR and LESSEE shall promptly notify the other party in writing of any change in contact <u style={{ textDecoration: 'underline' }}>information</u>, any adverse consequences shall be borne by the party who fails to perform the notice obligation.
              </p>
          </div>
        </div>

        {/* IN WITNESS WHEREOF */}
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              lineHeight: '1.8',
              textAlign: 'justify',
              color: '#000000'
            }}>
              <p style={{ marginBottom: '16px' }}>
              <strong>IN WITNESS WHEREOF</strong>, the parties have hereunto set their hands on the date and at the place above-written.
            </p>
          </div>
        </div>

        {/* Signatures */}
          <div style={{ marginTop: '40px', paddingTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '120px'
            }}>
              {/* LESSOR Signature */}
              <div style={{ flex: '1' }}>
                <div style={{
                  borderBottom: '1px solid #000000',
                  marginBottom: '8px',
                  height: '20px',
                  width: '200px'
                }}></div>
                <p style={{
                  fontWeight: 'bold',
                  fontSize: '12pt',
                  color: '#000000',
                  margin: '0',
                  textAlign: 'left'
                }}>LESSOR</p>
                <p style={{
                  fontWeight: 'normal',
                  fontSize: '11pt',
                  color: '#000000',
                  margin: '4px 0 0 0',
                  textAlign: 'left'
                }}>{data.ceoName}</p>
                <p style={{
                  fontWeight: 'normal',
                  fontSize: '10pt',
                  color: '#000000',
                  margin: '2px 0 0 0',
                  textAlign: 'left'
                }}>Chief Executive Officer</p>
              </div>
              
              {/* LESSEE Signature */}
              <div style={{ flex: '1', textAlign: 'right' }}>
                <div style={{
                  borderBottom: '1px solid #000000',
                  marginBottom: '8px',
                  height: '20px',
                  width: '200px',
                  marginLeft: 'auto'
                }}></div>
                <p style={{
                  fontWeight: 'bold',
                  fontSize: '12pt',
                  color: '#000000',
                  margin: '0',
                  textAlign: 'right'
                }}>LESSEE</p>
                <p style={{
                  fontWeight: 'normal',
                  fontSize: '11pt',
                  color: '#000000',
                  margin: '4px 0 0 0',
                  textAlign: 'right'
                }}>{data.clientName}</p>
                <p style={{
                  fontWeight: 'normal',
                  fontSize: '10pt',
                  color: '#000000',
                  margin: '2px 0 0 0',
                  textAlign: 'right'
                }}>Authorized Representative</p>
              </div>
            </div>
          </div>

        {/* Witness Signature */}
          <div style={{ marginTop: '60px' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <p style={{
                fontWeight: 'normal',
                fontSize: '12pt',
                color: '#000000',
                margin: '0'
              }}>Signed in the Presence of:</p>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px'
            }}>
              <div style={{
                borderBottom: '1px solid #000000',
                height: '20px',
                width: '300px'
              }}></div>
            </div>
          </div>
        </div>

        {/* PAGE 6 - Acknowledgment Section */}
        <div className="contract-page">
          <div style={{ marginTop: '32px', marginBottom: '16px' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#000000'
              }}>ACKNOWLEDGMENT</h3>
          </div>
          
            <div style={{
              fontSize: '12px',
              lineHeight: '1.8',
              textAlign: 'justify',
              color: '#000000'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ marginBottom: '8px' }}>
                  <strong>REPUBLIC OF THE <u>PHILIPPINES</u> )</strong>
                </p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>TAGUIG CITY                         ) S.S.</strong>
              </p>
            </div>
            
              <div style={{ marginBottom: '16px' }}>
                <p style={{ marginBottom: '16px' }}>
                BEFORE ME, a Notary Public for and in the City of Taguig, personally appeared the following persons with residence Certificate number and/or Passport number as follows:
              </p>
              
                <div style={{ margin: '16px 0' }}>
                  <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                    border: '1px solid #000000',
                    marginBottom: '20px'
                }}>
                  <thead>
                      <tr>
                        <th style={{
                          border: '1px solid #000000',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                          color: '#000000'
                      }}>Name</th>
                        <th style={{
                          border: '1px solid #000000',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                          color: '#000000'
                      }}>Driver's License/SSS/Passport No.</th>
                        <th style={{
                          border: '1px solid #000000',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                          color: '#000000'
                      }}>Date/Place Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                    </tr>
                    <tr>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                        <td style={{
                          border: '1px solid #000000',
                        padding: '8px',
                          color: '#000000'
                        }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
              <div style={{ marginBottom: '16px' }}>
              <p>
                known to me to be the same persons who executed the foregoing Contract of Lease consisting of six (6) pages including this acknowledgment, signed by the parties and their instrumental witnesses and who acknowledged to me that they were duly authorized to execute the said document on their behalf or whom they represent and the same is their free and voluntary act and deed.
              </p>
            </div>
            
              <div style={{ marginBottom: '32px' }}>
                <p>
                  WITNESS MY HAND AND SEAL, this <u style={{
                    display: 'inline-block',
                    minWidth: '40px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '4px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u> day of <u style={{
                    display: 'inline-block',
                    minWidth: '80px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '4px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u> 2025 at <u style={{
                    display: 'inline-block',
                    minWidth: '80px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '4px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u> City, Philippines.
              </p>
            </div>
            
              <div style={{ textAlign: 'center', marginTop: '64px', marginBottom: '32px' }}>
                <div style={{
                  borderBottom: '1px solid #000000',
                  marginBottom: '16px',
                  height: '64px',
                  width: '256px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}></div>
            </div>
            
              <div style={{ marginTop: '16px' }}>
                <p>
                  Doc. No.<u style={{
                    display: 'inline-block',
                    minWidth: '40px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '8px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u>;
                  Page No. <u style={{
                    display: 'inline-block',
                    minWidth: '40px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '4px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u>;
                  Book No. <u style={{
                    display: 'inline-block',
                    minWidth: '40px',
                    borderBottom: '1px solid #000000',
                    marginLeft: '4px',
                    marginRight: '4px',
                    textAlign: 'center'
                  }}></u>;
                  Series of 2025.
              </p>
            </div>
          </div>
        </div>
      </div>

          </div>
    </>
  );
};

export default ContractTemplate;