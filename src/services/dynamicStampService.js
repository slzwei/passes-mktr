const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
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

class DynamicStampService {
  constructor() {
    this.basePath = path.join(process.cwd(), 'storage', 'images');
    this.stampsPath = path.join(this.basePath, 'stamps');
    this.dynamicStampsPath = path.join(this.basePath, 'dynamic-stamps');

    // SOLID: use shared calculators to match live preview exactly
    this.layoutCalculator = new SolidLayoutCalculator();
    this.dimensionCalculator = new SolidDimensionCalculator(this.layoutCalculator);
  }

  /**
   * Create a dynamic strip image with stamps overlaid
   * This generates a new strip image with current stamp status
   * @param {string} stripImagePath - Path to the base strip image
   * @param {number} stampsEarned - Number of stamps earned
   * @param {number} stampsRequired - Total number of stamps required
   * @param {string} stampIconPath - Path to the stamp icon (optional)
   * @param {Object} options - Additional options
   * @returns {Promise<{strip: string, strip2x: string, strip3x: string}>} Paths to generated strip images
   */
  async createDynamicStripWithStamps(stripImagePath, stampsEarned, stampsRequired, stampIconPath = null, options = {}) {
    try {
      // Ensure directories exist
      await fs.mkdir(this.dynamicStampsPath, { recursive: true });
      await fs.mkdir(this.stampsPath, { recursive: true });

      // Unified dimensions (matches live preview): ignore ad-hoc overrides for layout
      const dims = this.dimensionCalculator.calculateDimensions(stampsRequired, 1);
      const layout = this.layoutCalculator.calculateOptimalLayout(stampsRequired);
      const stripWidth = STRIP_W_1X;
      const stripHeight = STRIP_H_1X;
      const rows = layout.rows;
      const cols = layout.cols;
      const gap = Math.round(dims.adjustedGap);
      const stampDiameter = Math.round(dims.stampDiameter);
      const safeAreaTop = Math.round(dims.safeAreaPadding);
      const safeAreaHeight = Math.round(dims.safeAreaHeight);
      const opticalAdjustY = 0; // set to +1 or +2 if needed
      const opacity = options.opacity != null ? options.opacity : 0.4;

      // Load and process the base strip image
      const baseStripBuffer = await sharp(stripImagePath)
        .resize(stripWidth, stripHeight)
        .png()
        .toBuffer();

      // Generate stamps first (with full opacity)
      const stamps = await this.generateDynamicStamps(stampsEarned, stampsRequired, stampIconPath, { stampSize: stampDiameter, iconRedeemedPath: options.iconRedeemedPath || null });

      // Calculate stamp positioning with unified safe area
      const gridWidth = (cols * stampDiameter) + ((cols - 1) * gap);
      const gridHeight = (rows * stampDiameter) + ((rows - 1) * gap);
      const startX = Math.floor((stripWidth - gridWidth) / 2);
      
      // ALWAYS center within the safe area (even for single-row)
      let startY = Math.round(safeAreaTop + (safeAreaHeight - gridHeight) / 2) + opticalAdjustY;

      // Create composites for stamps
      const stampComposites = [];
      
      for (let i = 0; i < Math.min(cols * rows, stampsRequired); i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = Math.round(startX + (col * (stampDiameter + gap)));
        const y = Math.round(startY + (row * (stampDiameter + gap)));
        
        const stampPath = stamps[i];
        
        if (stampPath && await this.fileExists(stampPath)) {
          // Load and resize stamp
          const stampBuffer = await sharp(stampPath)
            .resize(stampDiameter, stampDiameter)
            .png()
            .toBuffer();
          
          stampComposites.push({
            input: stampBuffer,
            top: y,
            left: x
          });
        }
      }

      // Create the final strip: background with opacity + stamps with full opacity
      let finalStripSharp = sharp(baseStripBuffer)
        .composite([
          // First, apply opacity to the background
          {
            input: Buffer.from(`
              <svg width="${stripWidth}" height="${stripHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${stripWidth}" height="${stripHeight}" fill="white" opacity="${opacity}"/>
              </svg>`),
            blend: 'multiply'
          },
          // Then, add stamps with full opacity
          ...stampComposites
        ]);

      // Add magenta border for debug mode
      if (STRIP_DEBUG) {
        finalStripSharp = finalStripSharp.composite([{
          input: Buffer.from(`
            <svg width="${stripWidth}" height="${stripHeight}" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="${stripWidth}" height="${stripHeight}" 
                    fill="none" stroke="magenta" stroke-width="1"/>
              <!-- safe area guide -->
              <rect x="0" y="${safeAreaTop}" width="${stripWidth}" height="${safeAreaHeight}"
                    fill="none" stroke="cyan" stroke-dasharray="4,3" stroke-width="1"/>
              <!-- true midline of safe area -->
              <line x1="0" y1="${Math.round(safeAreaTop + safeAreaHeight/2)}" x2="${stripWidth}"
                    y2="${Math.round(safeAreaTop + safeAreaHeight/2)}" stroke="cyan" stroke-width="1"/>
            </svg>`),
          blend: 'over'
        }]);
      }

      const finalStrip = await finalStripSharp.png().toBuffer();

      // Generate @2x and @3x versions using constants
      let finalStrip2xSharp = sharp(finalStrip).resize(STRIP_W_2X, STRIP_H_2X);
      let finalStrip3xSharp = sharp(finalStrip).resize(STRIP_W_3X, STRIP_H_3X);

      // Add magenta border for debug mode on @2x and @3x
      if (STRIP_DEBUG) {
        finalStrip2xSharp = finalStrip2xSharp.composite([{
          input: Buffer.from(`
            <svg width="${STRIP_W_2X}" height="${STRIP_H_2X}" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="${STRIP_W_2X}" height="${STRIP_H_2X}" 
                    fill="none" stroke="magenta" stroke-width="2"/>
            </svg>`),
          blend: 'over'
        }]);

        finalStrip3xSharp = finalStrip3xSharp.composite([{
          input: Buffer.from(`
            <svg width="${STRIP_W_3X}" height="${STRIP_H_3X}" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="${STRIP_W_3X}" height="${STRIP_H_3X}" 
                    fill="none" stroke="magenta" stroke-width="3"/>
            </svg>`),
          blend: 'over'
        }]);
      }

      const finalStrip2x = await finalStrip2xSharp.png().toBuffer();
      const finalStrip3x = await finalStrip3xSharp.png().toBuffer();

      // Generate unique filename based on stamp status
      const timestamp = Date.now();
      const filename = `dynamic_strip_${stampsEarned}_${stampsRequired}_${timestamp}`;
      
      // Validate dimensions before writing
      const strip1xMeta = await sharp(finalStrip).metadata();
      const strip2xMeta = await sharp(finalStrip2x).metadata();
      const strip3xMeta = await sharp(finalStrip3x).metadata();

      // Hard failure assertions
      if (strip1xMeta.width !== STRIP_W_1X || strip1xMeta.height !== STRIP_H_1X) {
        throw new Error(`STRIP ERROR: 1x dimensions ${strip1xMeta.width}x${strip1xMeta.height} !== ${STRIP_W_1X}x${STRIP_H_1X}`);
      }
      if (strip2xMeta.width !== STRIP_W_2X || strip2xMeta.height !== STRIP_H_2X) {
        throw new Error(`STRIP ERROR: 2x dimensions ${strip2xMeta.width}x${strip2xMeta.height} !== ${STRIP_W_2X}x${STRIP_H_2X}`);
      }
      if (strip3xMeta.width !== STRIP_W_3X || strip3xMeta.height !== STRIP_H_3X) {
        throw new Error(`STRIP ERROR: 3x dimensions ${strip3xMeta.width}x${strip3xMeta.height} !== ${STRIP_W_3X}x${STRIP_H_3X}`);
      }

      // Save generated strips
      const stripOutputPath = path.join(this.dynamicStampsPath, `${filename}.png`);
      const strip2xOutputPath = path.join(this.dynamicStampsPath, `${filename}@2x.png`);
      const strip3xOutputPath = path.join(this.dynamicStampsPath, `${filename}@3x.png`);

      await fs.writeFile(stripOutputPath, finalStrip);
      await fs.writeFile(strip2xOutputPath, finalStrip2x);
      await fs.writeFile(strip3xOutputPath, finalStrip3x);

      // Debug logging and duplicate saves
      if (STRIP_DEBUG) {
        const sha1_1x = crypto.createHash('sha1').update(finalStrip).digest('hex');
        const sha1_2x = crypto.createHash('sha1').update(finalStrip2x).digest('hex');
        const sha1_3x = crypto.createHash('sha1').update(finalStrip3x).digest('hex');

        console.log(`STRIP DEBUG: finalWidth=${strip1xMeta.width}, finalHeight=${strip1xMeta.height}`);
        console.log(`STRIP DEBUG: extract/trim rectangles used: NONE`);
        console.log(`STRIP OK | 1x:${STRIP_W_1X}x${STRIP_H_1X} sha1=${sha1_1x} | 2x:${STRIP_W_2X}x${STRIP_H_2X} sha1=${sha1_2x} | 3x:${STRIP_W_3X}x${STRIP_H_3X} sha1=${sha1_3x} | extract=NONE`);

        // Save debug duplicates
        const debugDir = path.dirname(stripOutputPath);
        await fs.writeFile(path.join(debugDir, `${filename}.debug.1x.png`), finalStrip);
        await fs.writeFile(path.join(debugDir, `${filename}.debug.2x.png`), finalStrip2x);
        await fs.writeFile(path.join(debugDir, `${filename}.debug.3x.png`), finalStrip3x);
      }

      logger.info(`Dynamic strip with stamps created: ${stampsEarned}/${stampsRequired} stamps`);
      
      return {
        strip: stripOutputPath,
        strip2x: strip2xOutputPath,
        strip3x: strip3xOutputPath,
        filename: filename
      };

    } catch (error) {
      logger.error('Failed to create dynamic strip with stamps:', error);
      throw error;
    }
  }

  /**
   * Generate individual stamp images for dynamic overlay
   */
  async generateDynamicStamps(stampsEarned, stampsRequired, iconPath, options = {}) {
    const { stampSize = 28, iconRedeemedPath = null } = options;
    const stamps = [];

    for (let i = 0; i < stampsRequired; i++) {
      const isRedeemed = i < stampsEarned;
      const stampPath = path.join(this.stampsPath, `dynamic_stamp_${i}_${isRedeemed ? 'redeemed' : 'unredeemed'}_${stampSize}.png`);

      try {
        const resolvedIconPath = isRedeemed ? (iconRedeemedPath || iconPath) : iconPath;
        if (resolvedIconPath && await this.fileExists(resolvedIconPath)) {
          // Create stamp with icon
          const opacity = isRedeemed ? 1.0 : 0.3;
          
          const iconBuffer = await sharp(resolvedIconPath)
            .resize(stampSize, stampSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .modulate({ brightness: opacity })
            .png()
            .toBuffer();

          // Create circular stamp with better contrast
          const stampBuffer = await sharp({
            create: {
              width: stampSize,
              height: stampSize,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            }
          })
          .composite([{
            input: Buffer.from(`
              <svg width="${stampSize}" height="${stampSize}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${stampSize/2}" cy="${stampSize/2}" r="${stampSize/2 - 2}" 
                        fill="${isRedeemed ? '#FCD34D' : '#FFFFFF'}" 
                        stroke="${isRedeemed ? '#F59E0B' : '#374151'}" 
                        stroke-width="3"/>
                <circle cx="${stampSize/2}" cy="${stampSize/2}" r="${stampSize/2 - 4}" 
                        fill="${isRedeemed ? '#FCD34D' : '#F9FAFB'}" 
                        stroke="white" 
                        stroke-width="1"/>
              </svg>`),
            blend: 'over'
          }, {
            input: iconBuffer,
            blend: 'over'
          }])
          .png()
          .toBuffer();

          await fs.writeFile(stampPath, stampBuffer);
        } else {
          // Create simple circular stamp
          const stampBuffer = await sharp({
            create: {
              width: stampSize,
              height: stampSize,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            }
          })
          .composite([{
            input: Buffer.from(`
              <svg width="${stampSize}" height="${stampSize}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${stampSize/2}" cy="${stampSize/2}" r="${stampSize/2 - 2}" 
                        fill="${isRedeemed ? '#FCD34D' : '#FFFFFF'}" 
                        stroke="${isRedeemed ? '#F59E0B' : '#374151'}" 
                        stroke-width="3"/>
                <circle cx="${stampSize/2}" cy="${stampSize/2}" r="${stampSize/2 - 4}" 
                        fill="${isRedeemed ? '#FCD34D' : '#F9FAFB'}" 
                        stroke="white" 
                        stroke-width="1"/>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                      font-family="Arial, sans-serif" font-size="12" font-weight="bold"
                      fill="${isRedeemed ? '#92400E' : '#374151'}">
                  ${isRedeemed ? '✓' : i + 1}
                </text>
              </svg>`),
            blend: 'over'
          }])
          .png()
          .toBuffer();

          await fs.writeFile(stampPath, stampBuffer);
        }

        stamps.push(stampPath);
      } catch (error) {
        logger.error(`Failed to create dynamic stamp ${i}:`, error);
        stamps.push(null);
      }
    }

    return stamps;
  }

  /**
   * Update a pass with new stamp status
   * @param {string} passId - The pass ID to update
   * @param {number} newStampsEarned - New number of stamps earned
   * @param {string} baseStripPath - Path to the base strip image
   * @param {string} stampIconPath - Path to the stamp icon
   * @returns {Promise<{strip: string, strip2x: string, strip3x: string}>} Updated strip paths
   */
  async updatePassStamps(passId, newStampsEarned, baseStripPath, stampIconPath = null) {
    try {
      // Get current pass data to determine stamps required
      const passData = await this.getPassData(passId);
      const stampsRequired = passData.stampsRequired || 10;

      // Create new dynamic strip with updated stamps
      const updatedStrips = await this.createDynamicStripWithStamps(
        baseStripPath,
        newStampsEarned,
        stampsRequired,
        stampIconPath
      );

      // Update pass data
      await this.updatePassData(passId, { stampsEarned: newStampsEarned });

      logger.info(`Pass ${passId} updated with ${newStampsEarned}/${stampsRequired} stamps`);
      
      return updatedStrips;

    } catch (error) {
      logger.error(`Failed to update pass ${passId} stamps:`, error);
      throw error;
    }
  }

  /**
   * Get pass data (placeholder - implement based on your data storage)
   */
  async getPassData(passId) {
    // TODO: Implement based on your database/storage system
    // This should return the current pass configuration
    return {
      stampsRequired: 10,
      stampsEarned: 0
    };
  }

  /**
   * Update pass data (placeholder - implement based on your data storage)
   */
  async updatePassData(passId, updates) {
    // TODO: Implement based on your database/storage system
    // This should update the pass configuration
    logger.info(`Updating pass ${passId} with:`, updates);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up old dynamic stamp files
   * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
   */
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(this.dynamicStampsPath);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.dynamicStampsPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
    }
  }
}

module.exports = DynamicStampService;
