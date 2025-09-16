// stampStrip.js
// Generates a rounded "stamp strip" panel with 10 empty circles (2 rows × 5 columns)

const sharp = require('sharp');

/**
 * Build a stamp strip panel as a PNG buffer (and @2x/@3x variants).
 *
 * @param {Object} opts
 * @param {number} opts.width            - Panel width at 1x (px). Height is derived.
 * @param {number} opts.rows             - Number of rows (default 2).
 * @param {number} opts.cols             - Number of columns (default 5).
 * @param {number} opts.outerPad         - Padding between panel edge and first/last circles (px @1x).
 * @param {number} opts.gap              - Gap between circles (px @1x).
 * @param {number} opts.cornerRadius     - Panel corner radius.
 * @param {string} opts.panelFill        - Panel background color (rgba / hex).
 * @param {string} opts.circleFill       - Circle fill color.
 * @param {string} opts.circleStroke     - Circle stroke color.
 * @param {number} opts.circleStrokePx   - Circle stroke width (px @1x).
 * @param {number} opts.aspect           - Height = width / aspect (default 360/180 ≈ 2:1 panel).
 * @param {string} opts.iconPath         - Path to icon image file (optional).
 * @param {number} opts.stampsEarned     - Number of stamps earned (for opacity).
 * @param {number} opts.stampsRequired   - Total number of stamps required.
 * @returns {Promise<{x1:Buffer,x2:Buffer,x3:Buffer, size:{w:number,h:number}}>}
 */
async function buildStampStrip({
  width = 360,
  rows = 2,
  cols = 5,
  outerPad = 14,
  gap = 12,
  cornerRadius = 12,
  panelFill = '#F5F5F5',
  circleFill = '#FFFFFF',
  circleStroke = '#D0D0D0',
  circleStrokePx = 3,
  aspect = (360 / 180), // width : height ~ 2:1 look
  iconPath = null,
  stampsEarned = 0,
  stampsRequired = 10
} = {}) {
  const height = Math.round(width / (width / (width / aspect))); // simplifies to width / (width/height) -> height
  // compute inner "grid" area
  const innerW = width - outerPad * 2;
  const innerH = height - outerPad * 2;

  // each grid cell size
  const cellW = (innerW - gap * (cols - 1)) / cols;
  const cellH = (innerH - gap * (rows - 1)) / rows;

  // circle diameter fits the smaller dimension of the cell
  const diameter = Math.floor(Math.min(cellW, cellH) * 0.95);
  const radius = diameter / 2;

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
      <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}"
            fill="${panelFill}" filter="url(#shadow)"/>
    </svg>`;

    const panelBuffer = await sharp(Buffer.from(panelSvg)).png().toBuffer();
    
    // Prepare composites for icons
    const composites = [];
    
    for (let i = 0; i < Math.min(rows * cols, stampsRequired); i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = outerPad + c * (cellW + gap) + (cellW - diameter) / 2;
      const y = outerPad + r * (cellH + gap) + (cellH - diameter) / 2;
      
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
    
    // Composite icons onto panel
    const x1 = await sharp(panelBuffer).composite(composites).png().toBuffer();
    const x2 = await sharp(x1).resize(width * 2, height * 2).png().toBuffer();
    const x3 = await sharp(x1).resize(width * 3, height * 3).png().toBuffer();
    
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
      <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}"
            fill="${panelFill}" filter="url(#shadow)"/>

      <!-- circles -->
      ${Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = outerPad + c * (cellW + gap) + cellW / 2;
        const cy = outerPad + r * (cellH + gap) + cellH / 2;
        return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(radius - circleStrokePx/2).toFixed(2)}"
                        fill="${circleFill}" stroke="${circleStroke}" stroke-width="${circleStrokePx}"/>`;
      }).join('\n')}
    </svg>`;

    const x1 = await sharp(Buffer.from(svg)).png().toBuffer();
    const x2 = await sharp(x1).resize(width * 2, height * 2).png().toBuffer();
    const x3 = await sharp(x1).resize(width * 3, height * 3).png().toBuffer();
    
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
