"use client";

import React, { useState } from 'react';
import { contractGeneratorDocx } from '../utils/contractGenerator';
import DOCXTemplateDebugger from './DOCXTemplateDebugger';

const DOCXContractGenerator = ({ tenantData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);

  // Initialize template data when component mounts
  React.useEffect(() => {
    if (tenantData) {
      const data = contractGeneratorDocx.prepareTemplateData(tenantData);
      setTemplateData(data);
    }
  }, [tenantData]);

  const handleGenerateContract = async () => {
    if (!tenantData) {
      setError('No tenant data provided');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await contractGeneratorDocx.downloadContract(tenantData);
    } catch (err) {
      console.error('Error generating contract:', err);
      setError(err.message || 'Failed to generate contract');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewContract = async () => {
    if (!tenantData) {
      setError('No tenant data provided');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await contractGeneratorDocx.previewContract(tenantData);
    } catch (err) {
      console.error('Error previewing contract:', err);
      setError(err.message || 'Failed to preview contract');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!tenantData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Generator</h3>
        <p className="text-gray-600">No tenant data selected</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">DOCX Contract Generator</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Tenant Information Preview */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-3">Tenant Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {tenantData.name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Company:</span> {tenantData.company || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {tenantData.email || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {tenantData.phone || 'N/A'}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Address:</span> {tenantData.address || 'N/A'}
            </div>
          </div>
        </div>

        {/* Financial Information Preview */}
        {templateData && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Financial Terms</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Monthly Rent:</span> {templateData.monthlyRent}
              </div>
              <div>
                <span className="font-medium">CUSA:</span> {templateData.cusa}
              </div>
              <div>
                <span className="font-medium">Parking Fee:</span> {templateData.parkingFee}
              </div>
              <div>
                <span className="font-medium">Security Deposit:</span> {templateData.securityDeposit}
              </div>
              <div>
                <span className="font-medium">Advance Rental:</span> {templateData.advanceRental}
              </div>
              <div>
                <span className="font-medium">Total Initial:</span> {templateData.totalInitialPayment}
              </div>
            </div>
          </div>
        )}

        {/* Contract Dates Preview */}
        {templateData && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Contract Dates</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Start Date:</span> {templateData.leaseStartDate}
              </div>
              <div>
                <span className="font-medium">End Date:</span> {templateData.leaseEndDate}
              </div>
              <div>
                <span className="font-medium">Contract Date:</span> {templateData.contractDate}
              </div>
              <div>
                <span className="font-medium">Payment Due:</span> {templateData.paymentDueDate}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={handlePreviewContract}
              disabled={isGenerating}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Processing...' : 'Preview Contract'}
            </button>
            
            <button
              onClick={handleGenerateContract}
              disabled={isGenerating}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Download Contract'}
            </button>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => setShowDebugger(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Debug Template Variables
            </button>
          </div>
        </div>

        {/* Template Information */}
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Template Information</h3>
              <p className="text-sm text-blue-700 mt-1">
                Using template: <code>contract_template.docx</code>
              </p>
              <p className="text-sm text-blue-700">
                Contracts will be generated with placeholders replaced by actual tenant data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Template Debugger Modal */}
      <DOCXTemplateDebugger
        open={showDebugger}
        onClose={() => setShowDebugger(false)}
        tenantData={tenantData}
      />
    </div>
  );
};

export default DOCXContractGenerator;