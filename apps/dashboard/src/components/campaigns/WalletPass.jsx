import React from 'react';

// Default pass design configuration matching the editor
const defaultDesign = {
  cardType: 'redemption',
  backgroundColor: '#8B4513',
  foregroundColor: '#FFFFFF',
  labelColor: '#FFFFFF',
  stripBackgroundColor: '#F5F5F5',
  logoText: 'Coffee Shop',
  logoImage: null,
  logoFormat: 'square',
  hideLogoText: false,
  removePlaceholderLogo: false,
  secondaryFields: [
    { label: 'Card Holder', value: 'John Doe' },
    { label: 'Redeemed', value: '4 out of 10' }
  ],
  auxiliaryField: {
    label: 'Next Reward',
    value: 'Free coffee at 10 stamps'
  },
  stampsEarned: 4,
  totalStamps: 10,
  cardWidth: 300,
  cardHeight: 400,
  stripHeight: 120,
  headerHeight: 65,
  secondaryHeight: 80,
  barcodeHeight: 80,
  qrAltText: '',
  hasExpiryDate: false,
  stripBackgroundOpacity: 0.8,
  stampUnredeemedColor: '#e5e7eb',
  useSameStampIcon: true,
  useMilestoneOverlay: true
};

export default function WalletPass({ design = defaultDesign, className = "" }) {
  const passDesign = { ...defaultDesign, ...design };
  
  // Calculate stamp layout
  const cols = Math.ceil(Math.sqrt(passDesign.totalStamps));
  const rows = Math.ceil(passDesign.totalStamps / cols);
  const stampSize = 28;
  const gap = 8;
  
  const renderHeaderSection = () => (
    <div 
      className="flex items-center justify-between px-4 py-3"
      style={{ 
        height: `${passDesign.headerHeight}px`,
        backgroundColor: passDesign.backgroundColor
      }}
    >
      {/* Logo and Logo Text Group */}
      <div className="flex items-center">
        {/* Logo */}
        {!(passDesign.removePlaceholderLogo && !passDesign.logoImage) && (
          <div 
            className="flex-shrink-0 mr-3"
            style={{ 
              width: '40px', 
              height: '40px',
              backgroundColor: 'transparent'
            }}
          >
            {passDesign.logoImage ? (
              <img 
                src={passDesign.logoImage}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div 
                className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg"
              >
                <span className="text-gray-600 text-xs font-medium">LOGO</span>
              </div>
            )}
          </div>
        )}

        {/* Logo Text */}
        {passDesign.logoFormat === 'square' && !passDesign.hideLogoText && (
          <div className="text-left">
            <h1 
              className="font-bold leading-tight text-sm"
              style={{ color: passDesign.foregroundColor }}
            >
              {passDesign.logoText}
            </h1>
          </div>
        )}
      </div>

      {/* Header Fields */}
      <div 
        className="flex-shrink-0 text-right"
        style={{ color: passDesign.foregroundColor }}
      >
        <div>
          <div className="text-xs opacity-75 mb-1" style={{ color: passDesign.labelColor }}>
            {passDesign.cardType === 'redemption' ? 'STAMPS COLLECTED' : passDesign.cardType === 'points' ? 'POINTS' : 'NEXT REWARD'}
          </div>
          <div className="font-medium text-right text-sm">
            {passDesign.cardType === 'redemption' ? (
              passDesign.stampsEarned
            ) : passDesign.cardType === 'points' ? (
              (passDesign.pointsBalance || 0).toLocaleString()
            ) : (
              '2 stamps more'
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStripSection = () => (
    <div 
      className="relative stamp-strip-container flex items-center justify-center"
      style={{ 
        width: `${passDesign.cardWidth}px`,
        height: `${passDesign.stripHeight}px`,
        backgroundColor: passDesign.stripBackgroundColor
      }}
    >
      {/* Stamps Grid */}
      <div 
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${stampSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${stampSize}px)`,
          gap: `${gap}px`
        }}
      >
        {Array.from({ length: passDesign.totalStamps }).map((_, i) => {
          const isEarned = i < passDesign.stampsEarned;
          
          return (
            <div
              key={i}
              className="rounded-full border-2 flex items-center justify-center overflow-hidden relative"
              style={{
                width: `${stampSize}px`,
                height: `${stampSize}px`,
                borderColor: isEarned ? passDesign.backgroundColor : `${passDesign.backgroundColor}40`,
                backgroundColor: isEarned ? (passDesign.stampEarnedColor || passDesign.backgroundColor) : passDesign.stampUnredeemedColor,
                boxShadow: isEarned ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                borderStyle: 'solid'
              }}
            />
          );
        })}
      </div>
    </div>
  );

  const renderSecondaryFields = () => (
    <div 
      className="px-4 py-3"
      style={{ 
        backgroundColor: passDesign.backgroundColor 
      }}
    >
      <div className="flex justify-between items-center h-full">
        {/* Secondary Field 1 */}
        <div className="flex-1">
          <div 
            className="text-xs opacity-75 mb-1"
            style={{ color: passDesign.labelColor }}
          >
            {(passDesign.secondaryFields[0]?.label || '').toUpperCase()}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: passDesign.foregroundColor }}
          >
            {passDesign.secondaryFields[0]?.value}
          </div>
        </div>
        
        {/* Secondary Field 2 */}
        <div className="flex-1 text-right">
          <div 
            className="text-xs opacity-75 mb-1"
            style={{ color: passDesign.labelColor }}
          >
            {(passDesign.secondaryFields[1]?.label || '').toUpperCase()}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: passDesign.foregroundColor }}
          >
            {passDesign.cardType === 'redemption' ? 
              `${passDesign.stampsEarned} out of ${passDesign.totalStamps}` : 
              passDesign.secondaryFields[1]?.value
            }
          </div>
        </div>
      </div>
    </div>
  );

  const renderBarcodeSection = () => (
    <div 
      className="flex items-center justify-center mt-auto"
      style={{ 
        height: `${passDesign.barcodeHeight}px`,
        padding: '16px',
        backgroundColor: passDesign.backgroundColor 
      }}
    >
      <div className="flex flex-col items-center bg-white border-2 border-white rounded-md p-2">
        <div 
          className="bg-white rounded-lg flex items-center justify-center shadow-sm"
          style={{ 
            width: '80px', 
            height: '50px'
          }}
        >
          <div 
            className="bg-black rounded grid grid-cols-8 gap-0.5"
            style={{ 
              width: '64px', 
              height: '40px' 
            }}
          >
            {Array.from({ length: 64 }, (_, i) => (
              <div 
                key={i} 
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}
              />
            ))}
          </div>
        </div>
        {passDesign.qrAltText && (
          <div className="mt-1 text-[10px] text-gray-800 bg-white rounded px-1 py-0.5">
            {passDesign.qrAltText}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`relative rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}
      style={{ 
        width: `${passDesign.cardWidth}px`,
        height: `${passDesign.cardHeight}px`,
        backgroundColor: passDesign.backgroundColor
      }}
    >
      {/* Header Section */}
      {renderHeaderSection()}
      
      {/* Strip Section (Stamps) */}
      {renderStripSection()}
      
      {/* Secondary Fields Section */}
      {renderSecondaryFields()}
      
      {/* Flexible spacer to push barcode to bottom */}
      <div 
        className="flex-1" 
        style={{ backgroundColor: passDesign.backgroundColor }}
      />

      {/* Barcode Section */}
      {renderBarcodeSection()}
    </div>
  );
}
