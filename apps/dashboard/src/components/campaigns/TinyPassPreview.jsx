import React from 'react';
import WalletPass from './WalletPass.jsx';

/**
 * TinyPassPreview
 * Renders a miniature wallet pass preview using the existing WalletPass component.
 * Scales dimensions proportionally to keep aspect and layout consistent with editor.
 */
export default function TinyPassPreview({ design, className = '' }) {
  // Target tiny width in pixels; height scales proportionally
  const targetWidth = 180;

  // Base dimensions used in WalletPass defaults if none provided
  const baseWidth = (design && typeof design.cardWidth === 'number') ? design.cardWidth : 300;
  const baseHeight = (design && typeof design.cardHeight === 'number') ? design.cardHeight : 400;

  const scale = targetWidth / baseWidth;

  const scaled = {
    ...design,
    cardWidth: Math.round(baseWidth * scale),
    cardHeight: Math.round(baseHeight * scale),
    headerHeight: Math.round(((design && design.headerHeight) || 65) * scale),
    stripHeight: Math.round(((design && design.stripHeight) || 120) * scale),
    secondaryHeight: Math.round(((design && design.secondaryHeight) || 80) * scale),
    barcodeHeight: Math.round(((design && design.barcodeHeight) || 80) * scale)
  };

  return (
    <div className={`inline-block`} style={{ width: scaled.cardWidth, height: scaled.cardHeight }}>
      <WalletPass design={scaled} className={className} />
    </div>
  );
}


