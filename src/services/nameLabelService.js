// nameLabelService.js
// Renders a name label under the stamp strip as PNG buffers (1x/2x/3x).
// You can composite these into your background just like the stamp strip.

const sharp = require('sharp');

/**
 * Build a name label image
 * @param {Object} opts
 * @param {string} opts.name       - The pass holder's name
 * @param {number} opts.width      - Width of the panel (match your strip width, e.g. 320px)
 * @param {number} opts.height     - Height of the name block (default 40px @1x)
 * @param {string} opts.fontFamily - CSS font family
 * @param {string} opts.fontColor  - Text color
 * @param {number} opts.fontSize   - Font size in px (relative to 1x)
 * @param {string} opts.align      - "center", "left", or "right"
 * @param {string} opts.bgColor    - Optional background (default transparent)
 * @returns {Promise<{x1:Buffer,x2:Buffer,x3:Buffer,size:{w:number,h:number}}>}
 */
async function buildNameLabel({
  name = 'John Doe',
  width = 320,
  height = 40,
  fontFamily = 'Arial, Helvetica, sans-serif',
  fontColor = '#333333',
  fontSize = 11, // 40% smaller than 18 (18 * 0.6 = 10.8, rounded to 11)
  align = 'center',
  bgColor = 'transparent'
} = {}) {
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>
    <text x="${align === 'center' ? '50%' : align === 'right' ? (width - 10) : 10}"
          y="50%"
          dominant-baseline="middle"
          text-anchor="${align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'}"
          font-family="${fontFamily}"
          font-size="${fontSize}"
          fill="${fontColor}"
          font-weight="600"
          letter-spacing="0.5">
      ${name}
    </text>
  </svg>`;

  const x1 = await sharp(Buffer.from(svg)).png().toBuffer();
  const x2 = await sharp(x1).resize(width * 2, height * 2).png().toBuffer();
  const x3 = await sharp(x1).resize(width * 3, height * 3).png().toBuffer();

  return { x1, x2, x3, size: { w: width, h: height } };
}

module.exports = { buildNameLabel };

/* =======================
   Example usage:
   =======================
const fs = require('fs');
(async () => {
  const { x1, x2, x3 } = await buildNameLabel({
    name: 'John Doe',
    width: 320,
    height: 40,
    fontSize: 18,
    fontColor: '#222222',
    align: 'center'
  });
  fs.writeFileSync('name-label.png', x1);
  fs.writeFileSync('name-label@2x.png', x2);
  fs.writeFileSync('name-label@3x.png', x3);
})();
*/
