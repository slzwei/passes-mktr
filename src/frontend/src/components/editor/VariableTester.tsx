import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Code } from 'lucide-react';
import variableService from '../../services/variableService';
import { PassData } from '../../types/passTypes';

interface VariableTesterProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
}

const VariableTester: React.FC<VariableTesterProps> = ({
  template,
  isOpen,
  onClose
}) => {
  const [testData, setTestData] = useState<PassData>({
    campaignId: 'TEST-001',
    campaignName: 'Test Campaign',
    tenantName: 'Test Company',
    customerEmail: 'test@example.com',
    customerName: 'John Doe',
    stampsEarned: 5,
    stampsRequired: 10,
    pointsEarned: 150,
    spendAmount: 25.50,
    nextReward: 'Free Coffee',
    membershipTier: 'Gold',
    expiryDate: '2024-12-31'
  });
  
  const [processedTemplate, setProcessedTemplate] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Process template with test data
  useEffect(() => {
    if (template) {
      processTemplate();
    }
  }, [template, testData, processTemplate]);

  const processTemplate = useCallback(() => {
    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      const processed = JSON.parse(JSON.stringify(template));
      
      // Process all field values
      Object.values(processed.fields).forEach((fieldArray: any) => {
        fieldArray.forEach((field: any) => {
          field.processedValue = processFieldValue(field.value, testData);
        });
      });

      setProcessedTemplate(processed);
    } catch (error) {
      setErrors([`Template processing error: ${error}`]);
    } finally {
      setIsProcessing(false);
    }
  }, [template, testData]);

  const processFieldValue = (value: string, data: PassData): string => {
    if (!value) return '';

    // Replace variables with actual values
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const variable = variableService.getVariableByKey(key);
      if (!variable) {
        setWarnings(prev => [...prev, `Unknown variable: ${key}`]);
        return match;
      }

      const dataValue = (data as any)[key];
      if (dataValue === undefined || dataValue === null) {
        setWarnings(prev => [...prev, `Missing value for variable: ${key}`]);
        return match;
      }

      return variableService.formatVariableValue(variable, dataValue);
    });
  };

  const handleTestDataChange = (key: string, value: any) => {
    setTestData(prev => ({ ...prev, [key]: value }));
  };

  const handleResetTestData = () => {
    setTestData({
      campaignId: 'TEST-001',
      campaignName: 'Test Campaign',
      tenantName: 'Test Company',
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
      stampsEarned: 5,
      stampsRequired: 10,
      pointsEarned: 150,
      spendAmount: 25.50,
      nextReward: 'Free Coffee',
      membershipTier: 'Gold',
      expiryDate: '2024-12-31'
    });
  };

  const getFieldTypeLabel = (fieldType: string): string => {
    const labels: Record<string, string> = {
      header: 'Header Fields',
      primary: 'Primary Fields',
      secondary: 'Secondary Fields',
      auxiliary: 'Auxiliary Fields',
      back: 'Back Fields'
    };
    return labels[fieldType] || fieldType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Code className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Variable Tester</h2>
                <div className="flex items-center space-x-2">
                  {errors.length > 0 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.length} errors</span>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{warnings.length} warnings</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetTestData}
                  className="btn-secondary text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex h-96">
              {/* Test Data Panel */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Test Data</h3>
                  
                  <div className="space-y-4">
                    {/* Customer Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="form-label text-xs">Customer Name</label>
                          <input
                            type="text"
                            value={testData.customerName || ''}
                            onChange={(e) => handleTestDataChange('customerName', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Customer Email</label>
                          <input
                            type="email"
                            value={testData.customerEmail || ''}
                            onChange={(e) => handleTestDataChange('customerEmail', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Customer ID</label>
                          <input
                            type="text"
                            value={testData.campaignId || ''}
                            onChange={(e) => handleTestDataChange('campaignId', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campaign Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Campaign Information</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="form-label text-xs">Campaign Name</label>
                          <input
                            type="text"
                            value={testData.campaignName || ''}
                            onChange={(e) => handleTestDataChange('campaignName', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Company Name</label>
                          <input
                            type="text"
                            value={testData.tenantName || ''}
                            onChange={(e) => handleTestDataChange('tenantName', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Data */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Loyalty Data</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="form-label text-xs">Stamps Earned</label>
                          <input
                            type="number"
                            value={testData.stampsEarned || 0}
                            onChange={(e) => handleTestDataChange('stampsEarned', parseInt(e.target.value) || 0)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Stamps Required</label>
                          <input
                            type="number"
                            value={testData.stampsRequired || 0}
                            onChange={(e) => handleTestDataChange('stampsRequired', parseInt(e.target.value) || 0)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Points Earned</label>
                          <input
                            type="number"
                            value={testData.pointsEarned || 0}
                            onChange={(e) => handleTestDataChange('pointsEarned', parseInt(e.target.value) || 0)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Spend Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={testData.spendAmount || 0}
                            onChange={(e) => handleTestDataChange('spendAmount', parseFloat(e.target.value) || 0)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Membership Tier</label>
                          <input
                            type="text"
                            value={testData.membershipTier || ''}
                            onChange={(e) => handleTestDataChange('membershipTier', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rewards & Dates */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Rewards & Dates</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="form-label text-xs">Next Reward</label>
                          <input
                            type="text"
                            value={testData.nextReward || ''}
                            onChange={(e) => handleTestDataChange('nextReward', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs">Expiry Date</label>
                          <input
                            type="date"
                            value={testData.expiryDate || ''}
                            onChange={(e) => handleTestDataChange('expiryDate', e.target.value)}
                            className="form-input text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Processed Template</h3>
                  
                  {isProcessing ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="loading-spinner"></div>
                      <span className="ml-2 text-gray-600">Processing...</span>
                    </div>
                  ) : processedTemplate ? (
                    <div className="space-y-4">
                      {Object.entries(processedTemplate.fields).map(([fieldType, fieldArray]: [string, any]) => {
                        if (!fieldArray || fieldArray.length === 0) return null;
                        
                        return (
                          <div key={fieldType} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-700 mb-3">{getFieldTypeLabel(fieldType)}</h4>
                            <div className="space-y-2">
                              {fieldArray.map((field: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-600">{field.label}</span>
                                      <code className="text-xs bg-gray-200 px-1 py-0.5 rounded text-gray-700">
                                        {field.key}
                                      </code>
                                    </div>
                                    <div className="mt-1">
                                      <span className="text-sm text-gray-500">Original: </span>
                                      <code className="text-xs bg-blue-100 px-1 py-0.5 rounded text-blue-800">
                                        {field.value}
                                      </code>
                                    </div>
                                    <div className="mt-1">
                                      <span className="text-sm text-gray-500">Processed: </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {field.processedValue || '(empty)'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No template loaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Test your variables with different data values
                </div>
                <div className="text-sm text-gray-500">
                  Variables are processed in real-time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableTester;
