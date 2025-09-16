import React, { useState, useEffect } from 'react';
import { useEditor } from '../../hooks/useEditor';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../common/LoadingSpinner';
import { Smartphone, Watch, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const PreviewPane: React.FC = () => {
  const { state, generatePreview } = useEditor();
  const { isConnected, error } = useWebSocket();
  const [deviceType, setDeviceType] = useState<'iphone' | 'apple-watch'>('iphone');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isRotated, setIsRotated] = useState(false);

  // Auto-refresh preview when template changes
  useEffect(() => {
    if (state.isDirty && isConnected) {
      const passData = {
        campaignId: '550e8400-e29b-41d4-a716-446655440001',
        campaignName: 'Demo Campaign',
        tenantName: 'MKTR Platform',
        customerEmail: 'demo@mktr.sg',
        customerName: 'John Doe',
        stampsEarned: 7,
        stampsRequired: 10,
        pointsEarned: 150,
        spendAmount: 10,
        nextReward: 'Free coffee at 10 stamps',
        membershipTier: 'Gold',
        expiryDate: '2024-12-31'
      };
      
      generatePreview(passData);
    }
  }, [state.currentTemplate, isConnected, generatePreview, state.isDirty]);

  const handleRefreshPreview = () => {
    const passData = {
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
      campaignName: 'Demo Campaign',
      tenantName: 'MKTR Platform',
      customerEmail: 'demo@mktr.sg',
      customerName: 'John Doe',
      stampsEarned: 7,
      stampsRequired: 10,
      pointsEarned: 150,
      spendAmount: 10,
      nextReward: 'Free coffee at 10 stamps',
      membershipTier: 'Gold',
      expiryDate: '2024-12-31'
    };
    
    generatePreview(passData);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsRotated(false);
  };

  const renderPassPreview = () => {
    if (!state.previewData) {
      return (
        <div className="text-center text-gray-500">
          <div className="mb-4">
            <Smartphone className="w-16 h-16 mx-auto text-gray-300" />
          </div>
          <p className="text-lg font-medium">No preview available</p>
          <p className="text-sm">Start editing fields to see a preview</p>
          <button
            onClick={handleRefreshPreview}
            className="mt-4 btn-primary"
          >
            Generate Preview
          </button>
        </div>
      );
    }

    const { passJson, images } = state.previewData;
    const isWatch = deviceType === 'apple-watch';

    return (
      <div className={`preview-device ${isWatch ? 'watch' : ''}`}>
        {/* Pass Header */}
        <div className="pass-header" style={{ backgroundColor: passJson.backgroundColor }}>
          {images.logo && (
            <img 
              src={images.logo} 
              alt="Logo" 
              className="w-8 h-8 mx-auto mb-2"
            />
          )}
          <h2 className="text-lg font-bold" style={{ color: passJson.foregroundColor }}>
            {passJson.logoText}
          </h2>
        </div>

        {/* Pass Primary Fields */}
        {passJson.storeCard?.primaryFields?.length > 0 && (
          <div className="pass-primary" style={{ backgroundColor: passJson.backgroundColor }}>
            {passJson.storeCard.primaryFields.map((field: any, index: number) => (
              <div key={index} className="text-center">
                <p className="text-sm" style={{ color: passJson.labelColor }}>
                  {field.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: passJson.foregroundColor }}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pass Strip */}
        {images.strip && (
          <div className="pass-strip" style={{ backgroundImage: `url(${images.strip})` }}>
          </div>
        )}

        {/* Pass Secondary Fields */}
        {passJson.storeCard?.secondaryFields?.length > 0 && (
          <div className="pass-secondary" style={{ backgroundColor: passJson.backgroundColor }}>
            {passJson.storeCard.secondaryFields.map((field: any, index: number) => (
              <div key={index} className="flex-1">
                <p className="text-xs" style={{ color: passJson.labelColor }}>
                  {field.label}
                </p>
                <p className="text-sm font-medium" style={{ color: passJson.foregroundColor }}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pass Auxiliary Fields */}
        {passJson.storeCard?.auxiliaryFields?.length > 0 && (
          <div className="pass-auxiliary" style={{ backgroundColor: passJson.backgroundColor }}>
            {passJson.storeCard.auxiliaryFields.map((field: any, index: number) => (
              <div key={index} className="text-center">
                <p className="text-xs" style={{ color: passJson.labelColor }}>
                  {field.label}
                </p>
                <p className="text-sm" style={{ color: passJson.foregroundColor }}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* QR Code */}
        <div className="pass-qr" style={{ backgroundColor: passJson.backgroundColor }}>
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs text-gray-600">QR</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
            
            {/* Device Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDeviceType('iphone')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  deviceType === 'iphone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4 inline mr-1" />
                iPhone
              </button>
              <button
                onClick={() => setDeviceType('apple-watch')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  deviceType === 'apple-watch'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Watch className="w-4 h-4 inline mr-1" />
                Watch
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 hover:bg-gray-100 rounded"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Disconnected</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleRefreshPreview}
              disabled={state.isLoading}
              className="btn-secondary flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {state.isLoading ? (
          <LoadingSpinner
            size="lg"
            text="Generating preview..."
            className="text-center"
          />
        ) : (
          <div 
            className="transform transition-transform duration-200"
            style={{ 
              transform: `scale(${zoomLevel}) ${isRotated ? 'rotate(90deg)' : ''}`,
              transformOrigin: 'center'
            }}
          >
            {renderPassPreview()}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {state.validation && (state.validation.errors.length > 0 || state.validation.warnings.length > 0) && (
        <div className="p-4 border-t border-gray-200 bg-white max-h-32 overflow-y-auto">
          {state.validation.errors.map((error, index) => (
            <div key={index} className="validation-error">
              {error}
            </div>
          ))}
          {state.validation.warnings.map((warning, index) => (
            <div key={index} className="validation-warning">
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewPane;
