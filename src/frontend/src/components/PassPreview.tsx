import React from 'react';
import { PassDesign } from '../types';
import { OptimizedLayoutCalculator } from '../services/layoutCalculator';
import { OptimizedDimensionCalculator } from '../services/dimensionCalculator';

interface PassPreviewProps {
  design: PassDesign;
}

const PassPreview: React.FC<PassPreviewProps> = ({ design }) => {
  // Determine logo dimensions based on format property
  const getLogoDimensions = () => {
    // Use the format from design properties if available
    const format = design.logoFormat || 'square';
    
    return format === 'wide' 
      ? { width: 160, height: 50, format: 'wide' }
      : { width: 50, height: 50, format: 'square' };
  };

  const logoDimensions = getLogoDimensions();

  // Apple Wallet Store Card specifications (in points)
  const APPLE_SPECS = {
    // Store card dimensions (exact Apple specifications)
    cardWidth: design.cardWidth, // Apple Wallet store card width
    cardHeight: design.cardHeight, // Apple Wallet store card height
    
    // Header section
    headerHeight: design.headerHeight, // Header section height
    logoWidth: logoDimensions.width, // Dynamic logo width
    logoHeight: logoDimensions.height, // Dynamic logo height
    logoFormat: logoDimensions.format, // Logo format (square/wide)
    logoTextMaxWidth: 160, // Logo text max width (exact Apple spec)
    
    // Strip section (Primary fields area) - exact Apple specifications
    stripWidth: design.cardWidth, // Strip width (375pt) - exact Apple spec
    stripHeight: design.stripHeight, // Strip height (144pt for store card) - exact Apple spec
    
    // Secondary fields section
    secondaryHeight: design.secondaryHeight, // Secondary fields section height
    
    
    // Barcode section
    barcodeHeight: design.barcodeHeight, // Barcode section height
    
    // Spacing (Apple standard)
    padding: 16, // Standard padding
    fieldSpacing: 8, // Spacing between fields
    headerPadding: 20, // Header specific padding
  };

  const renderHeaderSection = () => (
    <div 
      className="flex items-center justify-between"
      style={{ 
        height: `${APPLE_SPECS.headerHeight}px`,
        padding: `${APPLE_SPECS.headerPadding}px`,
        backgroundColor: design.backgroundColor
      }}
    >
      {/* Logo and Logo Text Group */}
      <div className="flex items-center">
        {/* Logo */}
        <div 
          className="flex-shrink-0"
          style={{ 
            width: `${APPLE_SPECS.logoWidth}px`, 
            height: `${APPLE_SPECS.logoHeight}px`,
            backgroundColor: 'transparent'
          }}
        >
          {design.logoImage ? (
            <img 
              src={design.logoImage}
              alt="Logo"
              style={{ 
                width: '100%',
                height: '100%',
                maxWidth: `${APPLE_SPECS.logoWidth}px`, 
                maxHeight: `${APPLE_SPECS.logoHeight}px`,
                objectFit: 'contain',
                backgroundColor: 'transparent',
                imageRendering: 'auto'
              } as React.CSSProperties}
            />
          ) : (
            <div 
              className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg"
              style={{ width: `${APPLE_SPECS.logoWidth}px`, height: `${APPLE_SPECS.logoHeight}px` }}
            >
              <span className="text-gray-600 text-sm font-medium">LOGO</span>
            </div>
          )}
        </div>

        {/* Logo Text - Hidden when using wide logo format */}
        {APPLE_SPECS.logoFormat === 'square' && !design.hideLogoText && (
          <div 
            className="text-left px-3"
            style={{ maxWidth: `${APPLE_SPECS.logoTextMaxWidth}px` }}
          >
            <h1 
              className="font-bold leading-tight"
              style={{ color: design.foregroundColor, fontSize: '12px' }}
            >
              {design.logoText}
            </h1>
          </div>
        )}
      </div>

      {/* Header Fields */}
      <div 
        className="flex-shrink-0 text-right"
        style={{ color: design.foregroundColor }}
      >
        <div>
          <div className="text-xs opacity-75 mb-1" style={{ color: design.labelColor }}>
            {design.cardType === 'redemption' ? 'EXPIRY' : design.cardType === 'points' ? 'POINTS' : design.cardType === 'milestone' ? 'NEXT REWARD' : 'STAMPS COLLECTED'}
          </div>
          <div className="font-medium text-right" style={{ fontSize: '12px' }}>
            {design.cardType === 'redemption' ? (
              design.hasExpiryDate && design.expirationDate ? (
                new Date(design.expirationDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).replace(/\//g, '/')
              ) : (
                'No Expiry'
              )
            ) : design.cardType === 'points' ? (
              (design.pointsBalance || 0).toLocaleString()
            ) : design.cardType === 'milestone' ? (
              (() => {
                // Calculate next milestone
                const milestonePositions = design.milestonePositions || [];
                const nextMilestone = milestonePositions.find(pos => pos > design.stampsEarned);
                
                if (nextMilestone) {
                  const stampsNeeded = nextMilestone - design.stampsEarned;
                  return `${stampsNeeded} stamp${stampsNeeded !== 1 ? 's' : ''} more`;
                } else {
                  // All milestones achieved
                  return 'Fully Redeemed';
                }
              })()
            ) : (
              '1836'
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStripSection = () => {
    // Account for margins in available width
    const marginSpace = 24; // 12px left + 12px right
    const availableWidth = APPLE_SPECS.stripWidth - marginSpace;
    
    // Unified tiered layout and dimensions (same as backend)
    const layoutCalc = new OptimizedLayoutCalculator();
    const dimCalc = new OptimizedDimensionCalculator(layoutCalc);
    const dims = dimCalc.calculateDimensions(design.totalStamps, 1);
    const rows = dims.rows;
    const cols = dims.cols;
    let stampSize = dims.stampDiameter;
    const gap = dims.adjustedGap;
    
    // Adjust stamp size if needed to fit within available width
    const maxStampSize = (availableWidth - (cols - 1) * gap) / cols;
    if (stampSize > maxStampSize) {
      stampSize = maxStampSize;
    }
    
    const gridW = (cols * stampSize) + ((cols - 1) * gap);
    const gridH = (rows * stampSize) + ((rows - 1) * gap);
    const startX = Math.floor((availableWidth - gridW) / 2);
    const safeTop = Math.round(dims.safeAreaPadding);
    const safeH = Math.round(dims.safeAreaHeight);
    const startY = safeTop + Math.floor((safeH - gridH) / 2);

    return (
      <div 
        className="relative stamp-strip-container"
        style={{ 
          width: `${APPLE_SPECS.stripWidth}px`,
          height: `${APPLE_SPECS.stripHeight}px`,
          backgroundColor: design.stripBackgroundColor
        }}
      >
        {/* Background Image Layer with Opacity */}
        {design.stripBackgroundImage && (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${design.stripBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: design.stripBackgroundOpacity || 0.8
            }}
          />
        )}
        
        {/* Primary Fields - Stamps Grid (for redemption and milestone cards) */}
        {(design.cardType === 'redemption' || design.cardType === 'milestone') && (
          <div className="relative z-10 h-full flex items-center justify-center" style={{ 
            paddingTop: `${safeTop}px`, 
            paddingBottom: `${APPLE_SPECS.stripHeight - safeTop - safeH}px`,
            marginLeft: '12px',
            marginRight: '12px'
          }}>
            <div 
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${stampSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${stampSize}px)`,
                gap: `${gap}px`,
                width: `${gridW}px`,
                height: `${gridH}px`
              }}
            >
              {Array.from({ length: design.totalStamps }).map((_, i) => {
                const isEarned = i < design.stampsEarned;
                const isMilestone = design.cardType === 'milestone' && design.milestonePositions?.includes(i + 1);
                const iconSrc = (() => {
                  // For milestone cards, use milestone icon only if custom icon exists
                  if (isMilestone && design.stampIconMilestone) {
                    return design.stampIconMilestone;
                  }
                  
                  if (isEarned) {
                    return (design.useSameStampIcon ? (design.stampIconUnredeemed || null) : (design.stampIconRedeemed || null)) || null;
                  }
                  return design.stampIconUnredeemed || null;
                })();
                
                return (
                  <div
                    key={i}
                    className="rounded-full border-2 flex items-center justify-center overflow-hidden relative"
                    style={{
                      width: `${stampSize}px`,
                      height: `${stampSize}px`,
                      borderColor: iconSrc ? 'transparent' : (isEarned ? design.backgroundColor : `${design.backgroundColor}40`),
                      backgroundColor: iconSrc ? 'transparent' : (isEarned ? (isMilestone ? (design.stampMilestoneCircleColor || design.backgroundColor) : (design.stampEarnedColor || design.backgroundColor)) : design.stampUnredeemedColor),
                      boxShadow: isEarned ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                      borderStyle: 'solid',
                      // Special styling for milestone stamps
                      ...(isMilestone && {
                        borderWidth: '3px',
                        boxShadow: `0 0 0 2px ${design.stampMilestoneColor}, 0 2px 8px ${design.stampMilestoneColor}50`
                      })
                    }}
                  >
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt={isEarned ? 'redeemed' : 'unredeemed'}
                        style={{ width: `${stampSize}px`, height: `${stampSize}px`, objectFit: 'contain', opacity: isEarned ? 1 : 0.4 }}
                      />
                    ) : null}
                    
                    {/* Milestone indicator */}
                    {isMilestone && (
                      <div 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ fontSize: '8px' }}
                      >
                        ★
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
      </div>
    );
  };

  const renderSecondaryFields = () => (
    <div 
      className="px-4 py-3"
      style={{ 
        backgroundColor: design.backgroundColor 
      }}
    >
      <div className="flex justify-between items-center h-full">
        {/* Secondary Field 1 */}
        <div className="flex-1">
          <div 
            className="text-xs opacity-75 mb-1"
            style={{ color: design.labelColor }}
          >
            {(design.secondaryFields[0].label || '').toUpperCase()}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: design.foregroundColor }}
          >
            {design.secondaryFields[0].value}
          </div>
        </div>
        
        {/* Secondary Field 2 */}
        <div className="flex-1 text-right">
          <div 
            className="text-xs opacity-75 mb-1"
            style={{ color: design.labelColor }}
          >
            {(design.secondaryFields[1].label || '').toUpperCase()}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: design.foregroundColor }}
          >
            {(() => {
              const label = (design.secondaryFields[1]?.label || '').toLowerCase();
              const looksLikeRedeemed = label.includes('redeem');
              const looksLikeNextReward = label.includes('next reward');
              
              if (looksLikeRedeemed && design.cardType === 'redemption') {
                return `${design.stampsEarned} out of ${design.totalStamps}`;
              } else if (looksLikeNextReward && design.cardType === 'points') {
                return `at 2,000 points`; // Fixed value since we removed the input
              } else if (looksLikeNextReward && design.cardType === 'milestone') {
                // Calculate next milestone
                const milestonePositions = design.milestonePositions || [];
                const nextMilestone = milestonePositions.find(pos => pos > design.stampsEarned);
                
                if (nextMilestone) {
                  return `Free coffee at ${nextMilestone} stamps`;
                } else {
                  // All milestones achieved
                  return 'All rewards earned!';
                }
              }
              return design.secondaryFields[1]?.value;
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuxiliaryFields = () => (
    <div 
      className="px-4 py-2"
      style={{ 
        backgroundColor: design.backgroundColor 
      }}
    >
      <div className="flex justify-end items-center">
        {/* Auxiliary Field - Points like Hilton Honors */}
        <div className="text-right">
          <div 
            className="text-xs opacity-75 mb-1"
            style={{ color: design.labelColor }}
          >
            {(design.auxiliaryField.label || '').toUpperCase()}
          </div>
          <div 
            className="text-sm font-medium"
            style={{ color: design.foregroundColor }}
          >
            {design.cardType === 'points' ? (
              `Next Reward at ${(design.pointsRequired || 0).toLocaleString()} points`
            ) : (
              design.auxiliaryField.value
            )}
          </div>
        </div>
      </div>
    </div>
  );


  const renderBarcodeSection = () => (
    <div 
      className="flex items-center justify-center mt-auto"
      style={{ 
        height: `${APPLE_SPECS.barcodeHeight}px`,
        padding: `${APPLE_SPECS.padding}px`,
        backgroundColor: design.backgroundColor 
      }}
    >
      <div className="flex flex-col items-center bg-white border-2 border-white rounded-md p-2">
        <div 
          className="bg-white rounded-lg flex items-center justify-center shadow-sm"
          style={{ 
            width: '80px', 
            height: '60px'
          }}
        >
          <div 
            className="bg-black rounded grid grid-cols-8 gap-0.5"
            style={{ 
              width: '64px', 
              height: '48px' 
            }}
          >
            {Array.from({ length: 64 }, (_, i) => (
              <div 
                key={i} 
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}
              />
            ))}
          </div>
          {/* Alt text for accessibility */}
          {design.qrAltText && (
            <span className="sr-only">{design.qrAltText}</span>
          )}
        </div>
        {design.qrAltText && (
          <div className="mt-1 text-[10px] text-gray-800 bg-white rounded px-1 py-0.5">
            {design.qrAltText}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{ 
        width: `${APPLE_SPECS.cardWidth}px`,
        height: `${APPLE_SPECS.cardHeight}px`,
        backgroundColor: design.backgroundColor
      }}
    >
      {/* Header Section */}
      {renderHeaderSection()}
      
      {/* Strip Section (Stamps) */}
      {renderStripSection()}
      
      {/* Secondary Fields Section */}
      {renderSecondaryFields()}
      
      {/* Auxiliary Fields Section - Only show for milestone cards (currently disabled) */}
      {/* {design.cardType === 'milestone' && renderAuxiliaryFields()} */}
      
      {/* Flexible spacer to push barcode to bottom */}
      <div 
        className="flex-1" 
        style={{ backgroundColor: design.backgroundColor }}
      ></div>

      {/* Barcode Section */}
      {renderBarcodeSection()}
    </div>
  );
};

export default PassPreview;
