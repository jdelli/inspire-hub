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
    workspaceType: "one (1) designated desk/cubicle area",
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

      // Create a clone of the element for PDF generation
      const clonedElement = element.cloneNode(true);
      
      // Apply print-specific styles to the clone
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      clonedElement.style.width = '210mm';
      clonedElement.style.minHeight = '297mm';
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.color = '#000000';
      clonedElement.style.fontFamily = 'Arial, sans-serif';
      clonedElement.style.fontSize = '12px';
      clonedElement.style.lineHeight = '1.4';
      clonedElement.style.padding = '20px';
      clonedElement.style.boxSizing = 'border-box';

      // Remove any elements that shouldn't be printed
      const noPrintElements = clonedElement.querySelectorAll('.no-pdf');
      noPrintElements.forEach(el => el.remove());

      // Simplify complex styling that might cause issues
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove problematic CSS properties
        el.style.transform = '';
        el.style.animation = '';
        el.style.transition = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
        
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

      // Append to body for rendering
      document.body.appendChild(clonedElement);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas from the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
        foreignObjectRendering: false,
        width: clonedElement.offsetWidth,
        height: clonedElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Apply additional fixes to the cloned document
          const clonedBody = clonedDoc.body;
          clonedBody.style.fontFamily = 'Arial, sans-serif';
          clonedBody.style.color = '#000000';
        }
      });

      // Remove the cloned element
      document.body.removeChild(clonedElement);

      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no content - element may be hidden or empty');
      }

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      
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

  // Add export functions to window for external access
  React.useEffect(() => {
    window.exportContractAsPDF = exportAsPDF;
    window.exportSimplePDF = exportSimplePDF;
    return () => {
      delete window.exportContractAsPDF;
      delete window.exportSimplePDF;
    };
  }, [exportAsPDF, exportSimplePDF]);

  return (
    <div 
      data-contract-template 
      className={`bg-white ${preview ? 'shadow-lg' : ''} mx-auto`} 
      style={{ 
        maxWidth: '8.5in', 
        minHeight: '11in',
        width: '8.5in',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4'
      }}
    >
      <div style={{ 
        padding: '32px', 
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-8" style={{
          textAlign: 'center',
          borderBottom: '2px solid #d1d5db',
          paddingBottom: '24px',
          marginBottom: '32px'
        }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>{data.companyName}</h1>
          <div className="text-sm text-gray-600 space-y-1" style={{
            fontSize: '14px',
            color: '#4b5563'
          }}>
            <p style={{ marginBottom: '4px' }}>{data.companyAddress}</p>
            <div className="flex justify-center space-x-4" style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <span>Tel: {data.companyPhone}</span>
              <span>Email: {data.companyEmail}</span>
            </div>
          </div>
        </div>

        {/* Contract Title */}
        <div className="text-center mb-8" style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '24px',
            letterSpacing: '0.1em'
          }}>
            CONTRACT OF LEASE
          </h2>
        </div>

        {/* Tenant Details Section - Moved to Top */}
        <div className="mb-8" style={{ marginBottom: '32px' }}>
          <div className="bg-gray-50 p-6 rounded-lg border" style={{
            backgroundColor: '#f9fafb',
            padding: '24px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center" style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              TENANT INFORMATION
            </h3>
            
            <div className="grid grid-cols-2 gap-6" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div>
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Tenant Name:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '20px'
                  }}>
                    {data.clientName}
                  </div>
                </div>
                
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Company/Business:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '20px'
                  }}>
                    {data.clientName} Enterprise
                  </div>
                </div>
                
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Contact Information:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '20px'
                  }}>
                    Email: {data.clientEmail}<br />
                    Phone: {data.clientPhone}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Complete Address:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '40px'
                  }}>
                    {data.clientAddress}
                  </div>
                </div>
                
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Lease Period:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '20px'
                  }}>
                    {data.startDate} to {data.endDate}
                  </div>
                </div>
                
                <div className="mb-3" style={{ marginBottom: '12px' }}>
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block'
                  }}>Monthly Rent:</label>
                  <div className="mt-1 p-2 bg-white border border-gray-300 rounded" style={{
                    marginTop: '4px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    minHeight: '20px',
                    fontWeight: 'bold',
                    color: '#059669'
                  }}>
                    ₱{data.monthlyRent}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Summary Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200" style={{
            backgroundColor: '#eff6ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            marginBottom: '16px'
          }}>
            <h4 className="text-md font-semibold text-blue-900 mb-3 text-center" style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              CONTRACT SUMMARY
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-center" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              textAlign: 'center'
            }}>
              <div>
                <div className="text-xs text-blue-700 mb-1" style={{
                  fontSize: '11px',
                  color: '#1d4ed8',
                  marginBottom: '4px'
                }}>Contract Date</div>
                <div className="text-sm font-semibold text-blue-900" style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#1e3a8a'
                }}>
                  {data.contractDate}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-blue-700 mb-1" style={{
                  fontSize: '11px',
                  color: '#1d4ed8',
                  marginBottom: '4px'
                }}>Contract Number</div>
                <div className="text-sm font-semibold text-blue-900" style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#1e3a8a'
                }}>
                  {data.contractNumber}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-blue-700 mb-1" style={{
                  fontSize: '11px',
                  color: '#1d4ed8',
                  marginBottom: '4px'
                }}>Total Initial Payment</div>
                <div className="text-sm font-semibold text-green-700" style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#15803d'
                }}>
                  ₱{data.totalInitialPayment}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Statement */}
        <div className="mb-8" style={{ marginBottom: '32px' }}>
          <div className="text-center mb-6" style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <p className="text-base font-semibold" style={{
              fontSize: '16px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              color: '#111827'
            }}>
              KNOW ALL MEN BY THESE PRESENTS:
            </p>
          </div>
          
          <div className="mb-6 text-sm leading-relaxed text-justify" style={{
            marginBottom: '24px',
            fontSize: '14px',
            lineHeight: '1.6',
            textAlign: 'justify',
            color: '#374151'
          }}>
            <p>
              This Contract of Lease is made and executed this <u style={{
                display: 'inline-block',
                minWidth: '80px',
                borderBottom: '1px solid #111827',
                marginLeft: '4px',
                marginRight: '4px',
                textAlign: 'center'
              }}>{data.contractDate}</u> in <u style={{
                display: 'inline-block',
                minWidth: '120px',
                borderBottom: '1px solid #111827',
                marginLeft: '4px',
                marginRight: '4px',
                textAlign: 'center'
              }}>{data.contractLocation}</u> by and between:
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="mb-8" style={{ marginBottom: '32px' }}>
          <div className="space-y-6" style={{ display: 'block' }}>
            <div className="text-sm leading-relaxed text-justify" style={{
              fontSize: '14px',
              lineHeight: '1.6',
              textAlign: 'justify',
              color: '#374151'
            }}>
              <p className="mb-4" style={{ 
                marginBottom: '16px',
                color: '#374151'
              }}>
                <strong style={{ fontWeight: 'bold' }}>{data.companyName}</strong>, a corporation duly organized and existing under the laws of the Republic of the Philippines with principal office at {data.companyAddress}, represented by its Chief Executive Officer, <strong style={{ fontWeight: 'bold' }}>{data.ceoName}</strong>, herein referred to as the <strong style={{ fontWeight: 'bold' }}>"LESSOR"</strong>;
              </p>
              
              <div className="text-center my-4" style={{
                textAlign: 'center',
                margin: '16px 0'
              }}>
                <p className="font-semibold" style={{ 
                  fontWeight: '600',
                  color: '#374151' 
                }}>-and-</p>
              </div>

              <p className="mb-4" style={{ 
                marginBottom: '16px',
                color: '#374151'
              }}>
                <u style={{
                  display: 'inline-block',
                  minWidth: '200px',
                  borderBottom: '1px solid #111827',
                  textAlign: 'center'
                }}>{data.clientName}</u>, of legal age, <u style={{
                  display: 'inline-block',
                  minWidth: '120px',
                  borderBottom: '1px solid #111827',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.citizenship}</u>, with present residential address at <u style={{
                  display: 'inline-block',
                  minWidth: '250px',
                  borderBottom: '1px solid #111827',
                  marginLeft: '4px',
                  marginRight: '4px',
                  textAlign: 'center'
                }}>{data.clientAddress}</u>, herein referred to as the <strong style={{ fontWeight: 'bold' }}>"LESSEE"</strong>;
              </p>
            </div>
          </div>
        </div>

        {/* WITNESSETH */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <p className="text-base font-semibold">WITNESSETH:</p>
          </div>
          
          <div className="space-y-4 text-sm leading-relaxed text-justify">
            <p>
              <strong>WHEREAS</strong>, the LESSOR has offered to transfer to the LESSEE the physical possession uses under the concept of {data.workspaceType} managed by the LESSOR at Alliance Global Tower, with physical address at {data.workspaceDetails}, hereinafter referred to as the "Leased Premise".
            </p>
            
            <p>
              <strong>WHEREAS</strong>, the LESSEE desires to lease the Leased Premise, and the LESSOR is willing to lease unto the LESSEE under the terms and conditions set forth below;
            </p>
            
            <p>
              <strong>NOW THEREFORE</strong>, for and in consideration of the foregoing premises and the mutual covenants and obligations hereinafter contained and to be performed, the LESSOR hereby leases the Leased Premise to the LESSEE, and the LESSEE accepts the same, subject to the following terms and conditions:
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <p className="mb-2">
                <strong>TERM.</strong> The Lease shall be for a period of One (1) year commencing on <u className="inline-block w-24 border-b border-gray-800 mx-1">{data.startDate}</u> and ending on <u className="inline-block w-24 border-b border-gray-800 mx-1">{data.endDate}</u>, with option to renew upon forty-five (45) days advance notice by the LESSEE and upon mutual agreement of both parties. The term shall be guaranteed for one (1) year and no pre-termination without just cause by either party shall be allowed. If either party provides written notice upon forty-five (45) days before the end of the period, this agreement shall automatically renew for another twelve (12) months under the same conditions.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>RENTAL RATE AND PAYMENTS.</strong> The parties herein agree that the monthly rent for the Leased Premise shall be Philippine Peso: TWENTY THOUSAND PESOS (PHP{data.monthlyRent}.00) excluding 12% VAT per month, Common Use Service Area (CUSA) and parking. Below is the breakdown:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg my-4" style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                margin: '16px 0'
              }}>
                <table className="w-full border-collapse border border-gray-300" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #d1d5db'
                }}>
                  <thead>
                    <tr className="bg-gray-100" style={{ backgroundColor: '#f3f4f6' }}>
                      <th className="border border-gray-300 p-2 text-left font-semibold" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>CATEGORY</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>TERMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>Monthly Rent</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>Php {data.monthlyRent} (excluding VAT)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>CUSA</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>Php {data.cusaFee}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>Parking Fee (optional)</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>{data.parkingFee} per month</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mb-2">
                On or before <u className="inline-block w-24 border-b border-gray-800 mx-1">{data.paymentDate}</u>, the LESSEE shall pay the LESSOR the amount of EIGHTY THOUSAND Pesos (Php{data.totalInitialPayment}.00), Philippine Currency, representing two (2) months advanced rental and two (2) months security deposit.
              </p>

              <p className="mb-2">
                Monthly Rental payment shall be paid by the LESSEE every end of the month to the bank account designated by the LESSOR. Any transfer fees shall be shouldered by the LESSEE. In case of late payment, additional five (5) percent per month will be added to the monthly rental fee.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>TAXES.</strong> Other than the LESSOR's income taxes or taxes required to be withheld from the rentals due to the LESSOR but which shall be credited against the LESSOR's income taxes, all taxes to be due by reason of the receipt of rentals by the LESSOR, including the VAT, and all other amounts which the LESSEE is required to pay the LESSOR as provided thereunder, as well as the documentary stamp taxes or other taxes accruing by reason of the execution of this Contract shall be for the account of the LESSEE.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>SECURITY DEPOSIT.</strong> The LESSEE shall pay the amount of FORTY THOUSAND Pesos (Php{data.securityDeposit}.00), Philippine Currency to the LESSOR upon the execution of this Lease. This deposit is not advance payment for monthly rental, it shall be held by the LESSOR as security for the full and faithful observance by the LESSEE of the terms, conditions and provisions of this contract. Such security deposit cannot be used to pay the rental, common area charge, nor used to extend the contract term.
              </p>
              
              <p className="mb-2">
                The two (2) months security deposit shall be reimbursed by the LESSOR to the LESSEE after the lapse of forty-five (45) days from the expiration of the lease but only after the checking of the Leased Premise and after it shall have been ascertained that there are no repairs/restoration works to be undertaken in the Leased Premise.
              </p>
              
              <p className="mb-2">
                In the event this Contract of Lease is renewed, the LESSEE shall pay such additional amount to the LESSOR so that the said deposit shall be based on the increased monthly rental as indicated above. The security deposit cannot be used as extension of the lease or advance rent for the next lease period.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>ADVANCE RENTAL.</strong> The two (2) months advance rental will be used on the last month of the contract period.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>PROVIDED SERVICES.</strong> The LESSOR shall provide the following services to the LESSEE:
              </p>
              
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Use of workspaces (shared, private, and meeting room)</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>The meeting room requires a reservation and costs Php3,200/hour (excluding tax)</li>
                    <li>Reservations must be made at least 3 days in advance</li>
                    <li>Cancellation fees are as follows:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Same-day cancellation: 60%</li>
                        <li>One-day prior: 40%</li>
                        <li>Two days or more in advance: Free</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li><strong>Two Person Booth</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Lessee is entitled to up to 15 hours of free usage per month</li>
                    <li>Additional use is charged at 1,500 PHP/hour (excluding tax)</li>
                    <li>Advance reservation (at least 3 days prior) is required</li>
                  </ul>
                </li>
                <li>Internet Access (Wifi)</li>
                <li>Electrical Outlets</li>
                <li>Common Areas (Kitchen, Restroom, Lounge, etc.)</li>
                <li>Receipt of Mail</li>
                <li>Corporate Registration Service (upon request and approval)</li>
                <li>Janitorial Services – The LESSOR shall provide janitorial services to keep the common areas in order</li>
                <li>Electricity – The LESSOR shall provide electrical power to the Leased Premise</li>
              </ul>
            </div>

            <div>
              <p className="mb-2">
                <strong>USAGE HOURS.</strong> The Leased Premise shall only be used from Monday to Friday, from 9:00 AM to 6:00 PM. The Leased Premise is closed on Saturdays, Sundays, and public holidays. Use on holidays may be allowed with prior approval from the LESSOR.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>AIR-CONDITIONING.</strong> The Leased Premise shall be supplied with air-conditioning from 9:00 A.M. to 6:00 P.M. Mondays through Fridays, except holidays. The LESSEE may, however, upon one-day prior written notice, request the LESSOR to extend air-conditioning services to be provided to the Leased Premise outside regular hours. The LESSEE shall reimburse the LESSOR for the cost of providing such services to the Leased Premise at an hourly rate of Php 3000. The LESSOR reserves the right to reasonably adjust the hourly rate at any time during the renewal period.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>PRE-TERMINATION.</strong> This contract is guaranteed for one (1) year. In the event that this contract was pre-terminated caused by the LESSEE's fault or decision, all the security deposit, and unused advance payments should be forfeited in favor of the LESSOR. In addition, the LESSEE still needs to settle any damages or repairs caused by the LESSEE on the Leased Premise before move out.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>HANDOVER THE UNIT.</strong> The LESSEE hereby acknowledges LESSOR will deliver the leased premise to the LESSEE with current status upon the start date of contract. LESSEE receives the leased premise and must start perform the obligations and rights in this contract.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>USE OF PREMISES.</strong> The LESSEE shall keep the Leased Premise clean and in sanitary condition for the duration of the Lease. The LESSEE shall use the Leased Premise for office purpose only, and for no other purpose without the written consent of the LESSOR. The LESSEE hereby agrees to abide by existing rules and regulations of the corporation, and any other laws, ordinances, rules and regulations governing the use of the Leased Premise.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>ASSIGNMENT AND SUBLEASE.</strong> The LESSEE is NOT allowed to transfer its rights, interest and obligations under this agreement or sub-lease the Leased Premise or any portion thereof to any person or entity during the duration of the lease, without the prior written consent of the LESSOR.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>NON-WAIVER.</strong> Delay or failure by either party to exercise any of its rights or remedies hereunder shall not be construed to be a waiver of such right and remedy.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>IMPROVEMENTS.</strong> The LESSEE shall not make any alteration, structural changes or improvements in the Leased Premise without the prior written consent of the LESSOR.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>ACTS OF GOD.</strong> Should the Leased Premise be damaged by fire, earthquake, storm or any fortuitous events to the extent that the same rendered un-tenantable, this Lease shall be automatically cancelled and the deposit as well as the unused portion of the advance rentals shall be refunded to the LESSEE within sixty (60) days, less any unpaid obligations of the LESSEE.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>INSPECTION OF PREMISES.</strong> To ensure that the Leased Premise is being maintained in good and tenantable condition, the LESSOR or his authorized representative is hereby given the right after two (2) days prior written notice, to enter and inspect any part of the Leased Premise during reasonable hours of the day and as the occasion might require.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>INJURY OR DAMAGE.</strong> The LESSEE hereby assumes the full responsibility for any damage which may be caused to the person or property of any third persons in the Leased Premise during the duration of the Lease arising out of the use of the Leased Premise by the LESSEE, its employees and guests. The LESSEE further binds himself to hold the LESSOR free and harmless from damages as a result thereof, unless such damage or liability arose out of structural or other inherent defects in the Leased Premise or is due to the fault of the LESSOR. Further, where such damage or liability is caused by a fortuitous event or an act of God, such as, but not limited to, typhoons, earthquakes, floods, which are beyond the control of the LESSEE, the LESSOR shall not responsible to such damage to the person and items in the Leased Premise.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>HAZARDOUS AND PROHIBITED MATERIALS.</strong> The LESSEE shall not keep or store in the Leased Premise any hazardous and obnoxious substance or inflammable material or substance that might constitute a fire hazard or other chemicals and materials or prohibitive drugs in violation of the laws of the Philippines.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>RULES AND REGULATIONS.</strong> The LESSEE binds himself to comply with the existing rules and regulations promulgated by the building administrator and/or association and any other environmental or other laws, ordinances, rules and regulations applicable to the Leased Premise.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>VIOLATIONS.</strong> Either party may, at its option, consider this Lease automatically rescinded and canceled, without need of any court action, upon seven (7) days written notice given to the other party, based on any of the following grounds:
              </p>
              
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Failure of the LESSEE to pay any advance rental and other bills or charges no matter for any reason.</li>
                <li>For any violation made by the other party of any of the terms and conditions stipulated in this Lease;</li>
                <li>In case the Leased Premise shall be vacated or abandoned for a period of thirty (30) days without prior written notice to the LESSOR. Consequently, the LESSOR is hereby permitted and authorized by the LESSEE to enter the premises, either by force or otherwise, without being liable to prosecution therefor.</li>
                <li>When this contract expires without renewal or this contract being canceled, the LESSEE shall pull out all his/her personal belongings immediately from the Leased Premise. If ever LESSEE refuses to do so, after 3 days of informing the LESSEE, the LESSOR shall have rights to dispose any items that occupied in the premise.</li>
              </ul>
            </div>

            <div>
              <p className="mb-2">
                <strong>RETURN OF LEASED PREMISES.</strong> Subject to the Clause on Security Deposit, at the end of the term of the Lease, the LESSEE shall peacefully and immediately vacate the Leased Premise and return possession of the Leased Premise to the LESSOR in its original condition prior to start of the Lease unless the term of this Lease is extended or renewed. Sixty (60) days prior to the end of the term of the Lease, without signing renewal contract between the LESSOR and the LESSEE, the LESSOR may show the Leased Premise to prospective tenants through his representatives or agent, at reasonable hours of the day and with advance notice to the LESSEE. Unless agreed by the LESSOR, the LESSEE shall, at its own expense, remove all the property of the LESSEE including those alternations, additions and improvements made or installed by either or both parties. The Lessee shall also pay for any and all damages incurred in the premises as a result of such removal.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>ATTORNEY'S FEES.</strong> In case either party resorts to judicial action based upon or in connection with this Lease, the guilty party hereby agrees to pay attorney's fee and liquidated damages equivalent to Ten (10%) of the total amount involved or claimed by the aggrieved party as against the guilty party plus all court expenses and/or costs of litigation.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>VENUE.</strong> All court actions from this Lease shall be filed only in the Courts of Taguig City to exclusion of all other courts.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>SUCCESSORS AND ASSIGNS.</strong> This Lease shall bind and inure to the benefits of the successors and assigns of the LESSOR and of the permitted successors and assigns of the LESSEE.
              </p>
            </div>

            <div>
              <p className="mb-2">
                <strong>NOTICES.</strong> Unless otherwise provided herein, any notice, tender or delivery to be given hereunder by either party to the other may be affected by personal delivery in writing, or by registered or certified mail, express delivery. A notice shall be deemed to have been served on the 5th day of mailing or on the date of arrival, whichever is earlier. LESSOR shall not be responsible for conveying any notice issued by the property management office (including but not limited to notice of payment, power interruption, water interruption, fire drill, public facility maintenance, etc.). Mailed notices shall be addressed as set forth below. LESSOR and LESSEE shall promptly notify the other party in writing of any change in contact information, any adverse consequences shall be borne by the party who fails to perform the notice obligation.
              </p>
            </div>
          </div>
        </div>

        {/* IN WITNESS WHEREOF */}
        <div className="mt-8 mb-8">
          <div className="text-sm leading-relaxed text-justify">
            <p className="mb-4">
              <strong>IN WITNESS WHEREOF</strong>, the parties have hereunto set their hands on the date and at the place above-written.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="text-center">
              <div className="border-b-2 border-gray-800 mb-4 h-20"></div>
              <p className="font-semibold">LESSOR</p>
              <p className="text-sm text-gray-600 mt-2">{data.companyName}</p>
              <p className="text-sm text-gray-600">By: {data.ceoName}</p>
              <p className="text-sm text-gray-600">Chief Executive Officer</p>
            </div>
            
            <div className="text-center">
              <div className="border-b-2 border-gray-800 mb-4 h-20"></div>
              <p className="font-semibold">LESSEE</p>
              <p className="text-sm text-gray-600 mt-2">{data.clientName}</p>
            </div>
          </div>
        </div>

        {/* Witnesses */}
        <div className="mt-12">
          <h4 className="font-semibold text-gray-900 mb-6 text-center">Signed in the Presence of:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="text-center">
              <div className="border-b-2 border-gray-800 mb-4 h-16"></div>
              <p className="text-sm text-gray-600">Witness 1 - Signature over Printed Name</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-gray-800 mb-4 h-16"></div>
              <p className="text-sm text-gray-600">Witness 2 - Signature over Printed Name</p>
            </div>
          </div>
        </div>

        {/* Acknowledgment Section */}
        <div className="mt-16 mb-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900">ACKNOWLEDGMENT</h3>
          </div>
          
          <div className="text-sm leading-relaxed">
            <div className="mb-4">
              <p className="mb-2">
                <strong>REPUBLIC OF THE PHILIPPINES )</strong>
              </p>
              <p className="mb-2">
                <strong>TAGUIG CITY) S.S.</strong>
              </p>
            </div>
            
            <div className="mb-6">
              <p className="mb-4">
                BEFORE ME, a Notary Public for and in the City of Taguig, personally appeared the following persons with residence Certificate number and/or Passport number as follows:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg my-4" style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                margin: '16px 0'
              }}>
                <table className="w-full border-collapse border border-gray-300" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #d1d5db'
                }}>
                  <thead>
                    <tr className="bg-gray-100" style={{ backgroundColor: '#f3f4f6' }}>
                      <th className="border border-gray-300 p-2 text-left font-semibold" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>Name</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>Driver's License/SSS/Passport No.</th>
                      <th className="border border-gray-300 p-2 text-left font-semibold" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>Date/Place Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>{data.ceoName}</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>_________________________</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>_________________________</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>{data.clientName}</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>_________________________</td>
                      <td className="border border-gray-300 p-2" style={{
                        border: '1px solid #d1d5db',
                        padding: '8px',
                        color: '#374151'
                      }}>_________________________</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mb-6">
              <p>
                known to me to be the same persons who executed the foregoing Contract of Lease consisting of six (6) pages including this acknowledgment, signed by the parties and their instrumental witnesses and who acknowledged to me that they were duly authorized to execute the said document on their behalf or whom they represent and the same is their free and voluntary act and deed.
              </p>
            </div>
            
            <div className="mb-6">
              <p>
                WITNESS MY HAND AND SEAL, this <u className="inline-block w-16 border-b border-gray-800 mx-1">{data.notaryDate}</u> day of <u className="inline-block w-24 border-b border-gray-800 mx-1"></u> 2025 at <u className="inline-block w-32 border-b border-gray-800 mx-1">{data.notaryLocation}</u> City, Philippines.
              </p>
            </div>
            
            <div className="text-center mt-12">
              <div className="border-b-2 border-gray-800 mb-4 h-20 w-64 mx-auto"></div>
              <p className="font-semibold">NOTARY PUBLIC</p>
            </div>
            
            <div className="mt-8">
              <p>
                Doc. No. <u className="inline-block w-16 border-b border-gray-800 mx-1">{data.docNo}</u>; Page No. <u className="inline-block w-16 border-b border-gray-800 mx-1">{data.pageNo}</u>; Book No. <u className="inline-block w-16 border-b border-gray-800 mx-1">{data.bookNo}</u>; Series of 2025.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This document was generated on {new Date().toLocaleDateString('en-PH')} by {data.companyName} Contract Management System</p>
        </div>
      </div>

      {/* PDF Download Buttons - Only show in preview mode */}
      {preview && (
        <div className="no-pdf p-4 bg-gray-100 border-t border-gray-300 text-center">
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={exportAsPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Download Full PDF
            </button>
            
            <button
              onClick={exportSimplePDF}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Download Simple PDF
            </button>
          </div>
          
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <p>Full PDF: Complete layout with styling | Simple PDF: Basic text format (recommended if Full PDF is blank)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractTemplate;