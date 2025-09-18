// solidDimensionCalculator.js
// SOLID: Single Responsibility - Calculate strip dimensions and positioning

class SolidDimensionCalculator {
  constructor(layoutCalculator) {
    this.layoutCalculator = layoutCalculator;
    
    // Default strip dimensions (Apple Wallet standard)
    this.stripWidth = 375;
    this.stripHeight = 144;
    this.stripAspectRatio = this.stripWidth / this.stripHeight; // 2.604
    
    // Safe area configuration (matches live preview)
    this.safeAreaRatio = 0.75; // 75% of strip height
    this.safeAreaPadding = 0.125; // 12.5% top/bottom padding each
    
    // Gap configuration (tiered)
    this.baseGapPx = 6; // Default, overridden per tier
    
    // Size constraints (tiered clamp at 1x)
    this.minSizePx = 10; // Minimum stamp size
    this.maxSizePx = 80; // Maximum stamp size
  }

  /**
   * Calculate dimensions and positioning (matches live preview exactly)
   */
  calculateDimensions(stampCount, scale = 1) {
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
    
    // Clamp diameter (tiered bounds)
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

module.exports = { SolidDimensionCalculator };
