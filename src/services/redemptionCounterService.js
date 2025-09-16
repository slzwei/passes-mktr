// redemptionCounterService.js
// Renders a redemption counter (e.g., "4 out of 10") as PNG buffers (1x/2x/3x).
// Designed to align right and work alongside the name label service.

const sharp = require('sharp');

/**
 * Build a redemption counter image
 * @param {Object} opts
 * @param {number} opts.redeemed     - Number of stamps redeemed
 * @param {number} opts.total        - Total number of stamps required
 * @param {number} opts.width        - Width of the counter (default 120px)
 * @param {number} opts.height       - Height of the counter (default 40px)
 * @param {string} opts.fontFamily   - CSS font family
 * @param {string} opts.fontColor    - Text color
 * @param {number} opts.fontSize     - Font size in px (relative to 1x)
 * @param {string} opts.bgColor      - Optional background (default transparent)
 * @returns {Promise<{x1:Buffer,x2:Buffer,x3:Buffer,size:{w:number,h:number}}>}
 */
async function buildRedemptionCounter({
  redeemed = 4,
  total = 10,
  width = 120,
  height = 40,
  fontFamily = 'Arial, Helvetica, sans-serif',
  fontColor = '#666666',
  fontSize = 14,
  bgColor = 'transparent'
} = {}) {
  const text = `${redeemed} out of ${total}`;
  
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>
    <text x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          fill="${fontColor}"
          font-weight="500"
          letter-spacing="0.3">
      ${text}
    </text>
  </svg>`;

  const x1 = await sharp(Buffer.from(svg)).png().toBuffer();
  const x2 = await sharp(x1).resize(width * 2, height * 2).png().toBuffer();
  const x3 = await sharp(x1).resize(width * 3, height * 3).png().toBuffer();

  return { x1, x2, x3, size: { w: width, h: height } };
}

module.exports = { buildRedemptionCounter };

/* =======================
   Example usage:
   =======================
const fs = require('fs');
(async () => {
  const { x1, x2, x3 } = await buildRedemptionCounter({
    redeemed: 4,
    total: 10,
    width: 120,
    height: 40,
    fontSize: 14,
    fontColor: '#666666',
    align: 'center'
  });
  fs.writeFileSync('redemption-counter.png', x1);
  fs.writeFileSync('redemption-counter@2x.png', x2);
  fs.writeFileSync('redemption-counter@3x.png', x3);
})();
*/
