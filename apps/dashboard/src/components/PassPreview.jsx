/**
 * Pass Preview Component for Campaign List
 * Renders a pass preview that can be captured with html2canvas
 * Same structure as the Pass Design Preview
 */

import React from 'react';

const PassPreview = ({ 
  campaignId, 
  design = {}, 
  details = {},
  className = "",
  style = {}
}) => {
  // Default design values
  const defaultDesign = {
    backgroundColor: '#8B5CF6',
    primaryColor: '#8B5CF6',
    secondaryColor: '#34C759',
    foregroundColor: '#FFFFFF',
    labelColor: '#FFFFFF',
    cardWidth: 320,
    cardHeight: 200,
    headerHeight: 60,
    stripHeight: 40,
    secondaryHeight: 60,
    barcodeHeight: 40,
    logoFormat: 'square',
    logoWidth: 50,
    logoHeight: 50,
    logoText: 'SAMPLE',
    stampsEarned: 4,
    totalStamps: 10,
    secondaryFields: [
      { label: 'Card Holder', value: 'John Doe' },
      { label: 'Redeemed', value: '4 out of 10' }
    ],
    auxiliaryField: {
      label: 'POINTS',
      value: '12,345'
    }
  };

  // Merge with provided design
  const mergedDesign = { ...defaultDesign, ...design };

  // Apple Wallet Store Card specifications
  const APPLE_SPECS = {
    cardWidth: mergedDesign.cardWidth,
    cardHeight: mergedDesign.cardHeight,
    headerHeight: mergedDesign.headerHeight,
    logoWidth: mergedDesign.logoWidth,
    logoHeight: mergedDesign.logoHeight,
    logoFormat: mergedDesign.logoFormat,
    stripHeight: mergedDesign.stripHeight,
    secondaryHeight: mergedDesign.secondaryHeight,
    barcodeHeight: mergedDesign.barcodeHeight,
    padding: 16,
    fieldSpacing: 8,
    headerPadding: 20,
  };

  const renderHeaderSection = () => (
    <div 
      className="pass-header"
      style={{
        height: `${APPLE_SPECS.headerHeight}px`,
        background: `linear-gradient(135deg, ${mergedDesign.primaryColor}, ${mergedDesign.secondaryColor})`,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${APPLE_SPECS.headerPadding}px`,
        position: 'relative'
      }}
    >
      <div 
        className="logo"
        style={{
          width: `${APPLE_SPECS.logoWidth}px`,
          height: `${APPLE_SPECS.logoHeight}px`,
          background: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: mergedDesign.primaryColor,
          fontSize: '18px'
        }}
      >
        M
      </div>
      <div 
        className="logo-text"
        style={{
          marginLeft: '12px',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {details.campaignName || mergedDesign.logoText || 'Sample Campaign'}
      </div>
    </div>
  );

  const renderStripSection = () => (
    <div 
      className="pass-strip"
      style={{
        height: `${APPLE_SPECS.stripHeight}px`,
        background: `linear-gradient(90deg,
          rgba(255,255,255,0.8) 0%,
          rgba(255,255,255,0.8) ${(mergedDesign.stampsEarned / mergedDesign.totalStamps) * 100}%,
          rgba(255,255,255,0.3) ${(mergedDesign.stampsEarned / mergedDesign.totalStamps) * 100}%,
          rgba(255,255,255,0.3) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <div 
        style={{
          color: mergedDesign.foregroundColor,
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        {mergedDesign.stampsEarned} of {mergedDesign.totalStamps}
      </div>
    </div>
  );

  const renderSecondaryFields = () => (
    <div 
      className="pass-secondary-fields"
      style={{
        height: `${APPLE_SPECS.secondaryHeight}px`,
        padding: `${APPLE_SPECS.padding}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around'
      }}
    >
      {mergedDesign.secondaryFields.map((field, index) => (
        <div 
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div 
            style={{
              color: mergedDesign.labelColor,
              fontSize: '12px',
              opacity: 0.8
            }}
          >
            {field.label}
          </div>
          <div 
            style={{
              color: mergedDesign.foregroundColor,
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {field.value}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAuxiliaryField = () => (
    <div 
      className="pass-auxiliary-field"
      style={{
        padding: `0 ${APPLE_SPECS.padding}px`,
        textAlign: 'right'
      }}
    >
      <div 
        style={{
          color: mergedDesign.labelColor,
          fontSize: '10px',
          opacity: 0.8,
          marginBottom: '2px'
        }}
      >
        {mergedDesign.auxiliaryField.label}
      </div>
      <div 
        style={{
          color: mergedDesign.foregroundColor,
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {mergedDesign.auxiliaryField.value}
      </div>
    </div>
  );

  const renderBarcodeSection = () => (
    <div 
      className="pass-barcode"
      style={{
        height: `${APPLE_SPECS.barcodeHeight}px`,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px'
      }}
    >
      QR Code
    </div>
  );

  return (
    <div 
      className={`pass-preview ${className}`}
      style={{
        width: `${APPLE_SPECS.cardWidth}px`,
        height: `${APPLE_SPECS.cardHeight}px`,
        background: mergedDesign.backgroundColor,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        transform: 'scale(1.5)',
        transformOrigin: 'center',
        ...style
      }}
    >
      {/* Header Section */}
      {renderHeaderSection()}
      
      {/* Strip Section (Stamps) */}
      {renderStripSection()}
      
      {/* Secondary Fields Section */}
      {renderSecondaryFields()}
      
      {/* Auxiliary Field */}
      {renderAuxiliaryField()}
      
      {/* Flexible spacer to push barcode to bottom */}
      <div 
        className="flex-1" 
        style={{ 
          backgroundColor: mergedDesign.backgroundColor,
          flex: 1
        }}
      ></div>

      {/* Barcode Section */}
      {renderBarcodeSection()}
    </div>
  );
};

export default PassPreview;
