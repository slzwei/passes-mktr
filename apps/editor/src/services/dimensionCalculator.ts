// dimensionCalculator.ts
// SOLID: Single Responsibility - Calculate strip dimensions and positioning

import { StripDimensions, DimensionCalculator } from '../types/stripInterfaces';
import { LayoutCalculator } from '../types/stripInterfaces';
import { STRIP_W_1X, STRIP_H_1X } from '../shared/stripConstants';

export class OptimizedDimensionCalculator implements DimensionCalculator {
  // Default strip dimensions (Apple Wallet standard) - use shared constants
  private readonly stripWidth = STRIP_W_1X;
  private readonly stripHeight = STRIP_H_1X;
  private readonly stripAspectRatio = this.stripWidth / this.stripHeight; // 2.604
  
  // Safe area configuration (matches live preview)
  private readonly safeAreaRatio = 0.75; // 75% of strip height
  private readonly safeAreaPadding = 0.125; // 12.5% top/bottom padding each
  
  // Gap configuration (tiered)
  private readonly baseGapPx = 6; // default, overridden per tier
  
  // Size constraints (tiered bounds at 1x)
  private readonly minSizePx = 10; // Minimum stamp size
  private readonly maxSizePx = 80; // Maximum stamp size

  constructor(private layoutCalculator: LayoutCalculator) {}

  /**
   * Calculate dimensions and positioning (matches live preview exactly)
   */
  calculateDimensions(stampCount: number, scale = 1): StripDimensions {
    const { rows, cols } = this.layoutCalculator.calculateOptimalLayout(stampCount);
    
    // Calculate strip dimensions (matches live preview)
    const stripHeight = this.stripHeight * scale;
    const stripWidth = this.stripWidth * scale;
    
    // Calculate safe area (matches live preview)
    const safeAreaHeight = stripHeight * this.safeAreaRatio;
    const safeAreaPadding = stripHeight * this.safeAreaPadding;
    
    // Calculate gap (tiered)
    let gap1x = 6;
    if (stampCount <= 10) gap1x = 12;
    else if (stampCount <= 20) gap1x = 8;
    else gap1x = 6;
    const adjustedGap = gap1x * scale;
    
    // Calculate stamp diameter (matches live preview logic)
    const availableWidth = stripWidth - (cols - 1) * adjustedGap;
    const availableHeight = safeAreaHeight - (rows - 1) * adjustedGap;
    
    const diameterFromWidth = availableWidth / cols;
    const diameterFromHeight = availableHeight / rows;
    const targetDiameter = Math.min(diameterFromWidth, diameterFromHeight);
    
    // Clamp diameter (matches live preview)
    const minSize = this.minSizePx * scale;
    const maxSize = this.maxSizePx * scale;
    const stampDiameter = Math.max(minSize, Math.min(maxSize, targetDiameter));
    
    return {
      rows,
      cols,
      stripWidth,
      stripHeight,
      safeAreaHeight,
      safeAreaPadding,
      adjustedGap,
      stampDiameter,
      scale
    };
  }
}
