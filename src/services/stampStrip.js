// stampStrip.js
// Generates a rounded "stamp strip" panel with 10 empty circles (2 rows × 5 columns)

const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs').promises;
const { 
  STRIP_W_1X, 
  STRIP_H_1X, 
  STRIP_W_2X, 
  STRIP_H_2X, 
  STRIP_W_3X, 
  STRIP_H_3X, 
  STRIP_SAFE_AREA_TOP,
  STRIP_SAFE_AREA_BOTTOM,
  STRIP_DEBUG 
} = require('../shared/stripConstants.js');
const { SolidLayoutCalculator } = require('./solidLayoutCalculator');
const { SolidDimensionCalculator } = require('./solidDimensionCalculator');

/**
 * Build a stamp strip panel as a PNG buffer (and @2x/@3x variants).
 * Apple Wallet strip dimensions with safe area constraints.
 *
 * @param {Object} opts
 * @param {number} opts.width            - Panel width at 1x (px). Default 375 for Apple Wallet.
 * @param {number} opts.height           - Panel height at 1x (px). Default 144 for Apple Wallet.
 * @param {number} opts.rows             - Number of rows (default 2).
 * @param {number} opts.cols             - Number of columns (default 5).
 * @param {number} opts.safeAreaTop      - Top safe area padding (px @1x). Default 20.
 * @param {number} opts.safeAreaBottom   - Bottom safe area padding (px @1x). Default 20.
 * @param {number} opts.gap              - Gap between circles (px @1x).
 * @param {string} opts.panelFill        - Panel background color (rgba / hex).
 * @param {string} opts.circleFill       - Circle fill color.
 * @param {string} opts.circleStroke     - Circle stroke color.
 * @param {number} opts.circleStrokePx   - Circle stroke width (px @1x).
 * @param {string} opts.iconPath         - Path to icon image file (optional).
 * @param {number} opts.stampsEarned     - Number of stamps earned (for opacity).
 * @param {number} opts.stampsRequired   - Total number of stamps required.
 * @returns {Promise<{x1:Buffer,x2:Buffer,x3:Buffer, size:{w:number,h:number}}>}
 */
async function buildStampStrip({
  width = STRIP_W_1X,        // Apple Wallet store card strip width (EXACT)
  height = STRIP_H_1X,        // Apple Wallet store card strip height (EXACT)
  rows = undefined,
  cols = undefined,
  safeAreaTop = undefined,
  safeAreaBottom = undefined,
  gap = undefined,
  panelFill = '#F5F5F5',
  circleFill = '#FFFFFF',
  circleStroke = '#D0D0D0',
  circleStrokePx = 2, // Stroke width
  iconPath = null,
  stampsEarned = 0,
  stampsRequired = 10
} = {}) {
  // Unify to SOLID calculators (same as live preview)
  const layoutCalculator = new SolidLayoutCalculator();
  const dimensionCalculator = new SolidDimensionCalculator(layoutCalculator);
  const dims = dimensionCalculator.calculateDimensions(stampsRequired, 1);
  const layout = layoutCalculator.calculateOptimalLayout(stampsRequired);

  const finalRows = rows ?? layout.rows;
  const finalCols = cols ?? layout.cols;
  const finalGap = Math.round(gap ?? dims.adjustedGap);
  const finalSafeTop = Math.round(safeAreaTop ?? dims.safeAreaPadding);
  const safeAreaHFromDims = Math.round(dims.safeAreaHeight);
  const finalSafeBottom = Math.max(0, (safeAreaBottom ?? (height - finalSafeTop - safeAreaHFromDims)));
  const opticalAdjustY = 0; // set to +1 or +2 if you want a tiny visual nudge down

  // compute safe area for stamp artwork
  const safeAreaWidth = width;
  const safeAreaHeight = height - finalSafeTop - finalSafeBottom;
  
  // Compute diameter based on available space
  const gridWForCells = safeAreaWidth;
  const gridHForCells = safeAreaHeight; // ALWAYS use safe area, even for single-row
  const cellW = (gridWForCells - finalGap * (finalCols - 1)) / finalCols;
  const cellH = (gridHForCells - finalGap * (finalRows - 1)) / finalRows;
  let diameter = Math.max(1, Math.round(Math.min(cellW, cellH)));
  const radius = diameter / 2;

  // Compute actual grid dimensions
  const actualGridWidth  = (finalCols * diameter) + ((finalCols - 1) * finalGap);
  const actualGridHeight = (finalRows * diameter) + ((finalRows - 1) * finalGap);
  const startX = Math.round((width  - actualGridWidth)  / 2);
  let startY = Math.round(finalSafeTop + (safeAreaHeight - actualGridHeight) / 2) + opticalAdjustY;

  // If iconPath is provided, use composite approach with icons
  if (iconPath) {
    // Create the background panel first
    const panelSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}"
            fill="${panelFill}" filter="url(#shadow)"/>
    </svg>`;

    const panelBuffer = await sharp(Buffer.from(panelSvg)).png().toBuffer();
    
    // Prepare composites for icons
    const composites = [];
    
    for (let i = 0; i < Math.min(finalRows * finalCols, stampsRequired); i++) {
      const r = Math.floor(i / finalCols);
      const c = i % finalCols;
      const x = startX + c * (diameter + finalGap);
      const y = startY + r * (diameter + finalGap);
      
      const isRedeemed = i < stampsEarned;
      const opacity = isRedeemed ? 1.0 : 0.3;
      
      // Process the icon with circular mask
      const iconBuffer = await sharp(iconPath)
        .resize(diameter, diameter, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .modulate({ brightness: opacity })
        .composite([{
          input: Buffer.from(`
            <svg width="${diameter}" height="${diameter}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="circleMask">
                  <rect width="${diameter}" height="${diameter}" fill="black"/>
                  <circle cx="${diameter/2}" cy="${diameter/2}" r="${diameter/2}" fill="white"/>
                </mask>
              </defs>
              <rect width="${diameter}" height="${diameter}" fill="white" mask="url(#circleMask)"/>
            </svg>`),
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();
      
      composites.push({
        input: iconBuffer,
        top: Math.round(y),
        left: Math.round(x)
      });
    }
    
    // Composite icons onto panel and generate all three variants
    let x1Sharp = sharp(panelBuffer).composite(composites);
    
    // Add magenta border for debug mode
    if (STRIP_DEBUG) {
      x1Sharp = x1Sharp.composite([{
        input: Buffer.from(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${width}" height="${height}" 
                  fill="none" stroke="magenta" stroke-width="1"/>
            <!-- safe area guide -->
            <rect x="0" y="${finalSafeTop}" width="${width}" height="${safeAreaHeight}"
                  fill="none" stroke="cyan" stroke-dasharray="4,3" stroke-width="1"/>
            <!-- true midline of safe area -->
            <line x1="0" y1="${Math.round(finalSafeTop + safeAreaHeight/2)}" x2="${width}"
                  y2="${Math.round(finalSafeTop + safeAreaHeight/2)}" stroke="cyan" stroke-width="1"/>
          </svg>`),
        blend: 'over'
      }]);
    }
    
    const x1 = await x1Sharp.png().toBuffer();
    
    let x2Sharp = sharp(x1).resize(STRIP_W_2X, STRIP_H_2X);
    let x3Sharp = sharp(x1).resize(STRIP_W_3X, STRIP_H_3X);
    
    // Add magenta border for debug mode on @2x and @3x
    if (STRIP_DEBUG) {
      x2Sharp = x2Sharp.composite([{
        input: Buffer.from(`
          <svg width="${STRIP_W_2X}" height="${STRIP_H_2X}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${STRIP_W_2X}" height="${STRIP_H_2X}" 
                  fill="none" stroke="magenta" stroke-width="2"/>
          </svg>`),
        blend: 'over'
      }]);

      x3Sharp = x3Sharp.composite([{
        input: Buffer.from(`
          <svg width="${STRIP_W_3X}" height="${STRIP_H_3X}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${STRIP_W_3X}" height="${STRIP_H_3X}" 
                  fill="none" stroke="magenta" stroke-width="3"/>
          </svg>`),
        blend: 'over'
      }]);
    }
    
    const x2 = await x2Sharp.png().toBuffer();  // @2x: STRIP_W_2X×STRIP_H_2X - EXACT Apple spec
    const x3 = await x3Sharp.png().toBuffer(); // @3x: STRIP_W_3X×STRIP_H_3X - EXACT Apple spec
    
    // Validate dimensions and add debug logging (icon path)
    const x1Meta = await sharp(x1).metadata();
    const x2Meta = await sharp(x2).metadata();
    const x3Meta = await sharp(x3).metadata();

    // Hard failure assertions
    if (x1Meta.width !== width || x1Meta.height !== height) {
      throw new Error(`STRIP ERROR: 1x dimensions ${x1Meta.width}x${x1Meta.height} !== ${width}x${height}`);
    }
    if (x2Meta.width !== STRIP_W_2X || x2Meta.height !== STRIP_H_2X) {
      throw new Error(`STRIP ERROR: 2x dimensions ${x2Meta.width}x${x2Meta.height} !== ${STRIP_W_2X}x${STRIP_H_2X}`);
    }
    if (x3Meta.width !== STRIP_W_3X || x3Meta.height !== STRIP_H_3X) {
      throw new Error(`STRIP ERROR: 3x dimensions ${x3Meta.width}x${x3Meta.height} !== ${STRIP_W_3X}x${STRIP_H_3X}`);
    }

    // Debug logging
    if (STRIP_DEBUG) {
      const sha1_1x = crypto.createHash('sha1').update(x1).digest('hex');
      const sha1_2x = crypto.createHash('sha1').update(x2).digest('hex');
      const sha1_3x = crypto.createHash('sha1').update(x3).digest('hex');

      console.log(`STRIP DEBUG (buildStampStrip-icon): finalWidth=${x1Meta.width}, finalHeight=${x1Meta.height}`);
      console.log(`STRIP DEBUG (buildStampStrip-icon): extract/trim rectangles used: NONE`);
      console.log(`STRIP OK | 1x:${width}x${height} sha1=${sha1_1x} | 2x:${STRIP_W_2X}x${STRIP_H_2X} sha1=${sha1_2x} | 3x:${STRIP_W_3X}x${STRIP_H_3X} sha1=${sha1_3x} | extract=NONE`);
    }
    
    return { x1, x2, x3, size: { w: width, h: height } };
  } else {
    // Original circle-based approach
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.18"/>
        </filter>
      </defs>

      <!-- panel -->
      <rect x="0" y="0" width="${width}" height="${height}"
            fill="${panelFill}" filter="url(#shadow)"/>

      <!-- circles -->
      ${Array.from({ length: finalRows * finalCols }).map((_, i) => {
        const r = Math.floor(i / finalCols);
        const c = i % finalCols;
        const cx = startX + c * (diameter + finalGap) + radius;
        const cy = startY + r * (diameter + finalGap) + radius;
        return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(radius - circleStrokePx/2).toFixed(2)}"
                        fill="${circleFill}" stroke="${circleStroke}" stroke-width="${circleStrokePx}"/>`;
      }).join('\n')}
    </svg>`;

    let x1Sharp = sharp(Buffer.from(svg));
    
    // Add magenta border for debug mode
    if (STRIP_DEBUG) {
      x1Sharp = x1Sharp.composite([{
        input: Buffer.from(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${width}" height="${height}" 
                  fill="none" stroke="magenta" stroke-width="1"/>
            <!-- safe area guide -->
            <rect x="0" y="${finalSafeTop}" width="${width}" height="${safeAreaHeight}"
                  fill="none" stroke="cyan" stroke-dasharray="4,3" stroke-width="1"/>
            <!-- true midline of safe area -->
            <line x1="0" y1="${Math.round(finalSafeTop + safeAreaHeight/2)}" x2="${width}"
                  y2="${Math.round(finalSafeTop + safeAreaHeight/2)}" stroke="cyan" stroke-width="1"/>
          </svg>`),
        blend: 'over'
      }]);
    }
    
    const x1 = await x1Sharp.png().toBuffer();
    
    let x2Sharp = sharp(x1).resize(STRIP_W_2X, STRIP_H_2X);
    let x3Sharp = sharp(x1).resize(STRIP_W_3X, STRIP_H_3X);
    
    // Add magenta border for debug mode on @2x and @3x
    if (STRIP_DEBUG) {
      x2Sharp = x2Sharp.composite([{
        input: Buffer.from(`
          <svg width="${STRIP_W_2X}" height="${STRIP_H_2X}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${STRIP_W_2X}" height="${STRIP_H_2X}" 
                  fill="none" stroke="magenta" stroke-width="2"/>
          </svg>`),
        blend: 'over'
      }]);

      x3Sharp = x3Sharp.composite([{
        input: Buffer.from(`
          <svg width="${STRIP_W_3X}" height="${STRIP_H_3X}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${STRIP_W_3X}" height="${STRIP_H_3X}" 
                  fill="none" stroke="magenta" stroke-width="3"/>
          </svg>`),
        blend: 'over'
      }]);
    }
    
    const x2 = await x2Sharp.png().toBuffer();  // @2x: STRIP_W_2X×STRIP_H_2X - EXACT Apple spec
    const x3 = await x3Sharp.png().toBuffer(); // @3x: STRIP_W_3X×STRIP_H_3X - EXACT Apple spec
    
    // Validate dimensions and add debug logging (circle-based)
    const x1Meta = await sharp(x1).metadata();
    const x2Meta = await sharp(x2).metadata();
    const x3Meta = await sharp(x3).metadata();

    // Hard failure assertions
    if (x1Meta.width !== width || x1Meta.height !== height) {
      throw new Error(`STRIP ERROR: 1x dimensions ${x1Meta.width}x${x1Meta.height} !== ${width}x${height}`);
    }
    if (x2Meta.width !== STRIP_W_2X || x2Meta.height !== STRIP_H_2X) {
      throw new Error(`STRIP ERROR: 2x dimensions ${x2Meta.width}x${x2Meta.height} !== ${STRIP_W_2X}x${STRIP_H_2X}`);
    }
    if (x3Meta.width !== STRIP_W_3X || x3Meta.height !== STRIP_H_3X) {
      throw new Error(`STRIP ERROR: 3x dimensions ${x3Meta.width}x${x3Meta.height} !== ${STRIP_W_3X}x${STRIP_H_3X}`);
    }

    // Debug logging
    if (STRIP_DEBUG) {
      const sha1_1x = crypto.createHash('sha1').update(x1).digest('hex');
      const sha1_2x = crypto.createHash('sha1').update(x2).digest('hex');
      const sha1_3x = crypto.createHash('sha1').update(x3).digest('hex');

      console.log(`STRIP DEBUG (buildStampStrip-circle): finalWidth=${x1Meta.width}, finalHeight=${x1Meta.height}`);
      console.log(`STRIP DEBUG (buildStampStrip-circle): extract/trim rectangles used: NONE`);
      console.log(`STRIP OK | 1x:${width}x${height} sha1=${sha1_1x} | 2x:${STRIP_W_2X}x${STRIP_H_2X} sha1=${sha1_2x} | 3x:${STRIP_W_3X}x${STRIP_H_3X} sha1=${sha1_3x} | extract=NONE`);
    }
    
    return { x1, x2, x3, size: { w: width, h: height } };
  }
}

module.exports = { buildStampStrip };

/* =======================
   Example usage (save files)
   =======================
const fs = require('fs');
(async () => {
  const { x1, x2, x3 } = await buildStampStrip({
    width: 340,         // tweak to taste
    rows: 2, cols: 5,   // 10 empty circles
    outerPad: 16, gap: 12, cornerRadius: 14,
    panelFill: '#F5D56B',    // soft yellow like your screenshot
    circleFill: '#FFFFFF',
    circleStroke: '#C8B36A', // warm neutral stroke
    circleStrokePx: 3
  });
  fs.writeFileSync('stamp-strip.png', x1);
  fs.writeFileSync('stamp-strip@2x.png', x2);
  fs.writeFileSync('stamp-strip@3x.png', x3);
})();
*/
