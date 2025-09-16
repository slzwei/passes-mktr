const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class StampGenerator {
  constructor() {
    this.basePath = path.join(process.cwd(), 'storage', 'images');
    this.stampsPath = path.join(this.basePath, 'stamps');
    this.stampSize = 24; // Size for individual stamps
  }

  /**
   * Generate stamp images for a pass
   */
  async generateStamps(stampsEarned, stampsRequired, logoPath) {
    try {
      // Ensure stamps directory exists
      await fs.promises.mkdir(this.stampsPath, { recursive: true });

      const stamps = [];

      for (let i = 1; i <= stampsRequired; i++) {
        const isRedeemed = i <= stampsEarned;
        const stampPath = await this.createStamp(logoPath, i, isRedeemed);
        stamps.push({
          index: i,
          isRedeemed,
          path: stampPath
        });
      }

      logger.info(`Generated ${stampsRequired} stamps (${stampsEarned} redeemed)`);
      return stamps;

    } catch (error) {
      logger.error('Stamp generation failed:', error);
      throw error;
    }
  }

  /**
   * Create a single stamp image
   */
  async createStamp(logoPath, index, isRedeemed) {
    const opacity = isRedeemed ? 1.0 : 0.3; // High opacity for redeemed, low for unredeemed
    const stampPath = path.join(this.stampsPath, `stamp_${index}_${isRedeemed ? 'redeemed' : 'unredeemed'}.png`);

    try {
      // Load the logo
      const logoBuffer = await sharp(logoPath)
        .resize(this.stampSize, this.stampSize, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();

      // Apply opacity
      await sharp(logoBuffer)
        .composite([{
          input: Buffer.from(`<svg width="${this.stampSize}" height="${this.stampSize}">
            <rect width="${this.stampSize}" height="${this.stampSize}" fill="white" opacity="${opacity}"/>
          </svg>`),
          blend: 'multiply'
        }])
        .png()
        .toFile(stampPath);

      return stampPath;

    } catch (error) {
      logger.error(`Failed to create stamp ${index}:`, error);
      // Fallback to simple colored circle
      return this.createFallbackStamp(index, isRedeemed);
    }
  }

  /**
   * Create a fallback stamp if logo processing fails
   */
  async createFallbackStamp(index, isRedeemed) {
    const stampPath = path.join(this.stampsPath, `stamp_${index}_${isRedeemed ? 'redeemed' : 'unredeemed'}.png`);
    const color = isRedeemed ? '#4CAF50' : '#E0E0E0'; // Green for redeemed, gray for unredeemed

    await sharp({
      create: {
        width: this.stampSize,
        height: this.stampSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: Buffer.from(`<svg width="${this.stampSize}" height="${this.stampSize}">
        <circle cx="${this.stampSize/2}" cy="${this.stampSize/2}" r="${this.stampSize/2 - 2}" 
                fill="${color}" stroke="#333" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="10" fill="white">${index}</text>
      </svg>`),
      top: 0,
      left: 0
    }])
    .png()
    .toFile(stampPath);

    return stampPath;
  }

  /**
   * Create a stamp grid with custom background
   */
  async createStampGridWithBackground(stampsEarned, stampsRequired, iconPath, backgroundPath) {
    try {
      const stampsPerRow = 5; // 5 stamps per row
      const rows = Math.ceil(stampsRequired / stampsPerRow);
      
      // Use Apple Wallet strip dimensions
      const stripWidth = 320;
      const stripHeight = 180;
      const padding = 2; // Minimal padding for maximum size
      
      // Calculate stamp size to use full width
      const availableWidth = stripWidth - (padding * 2);
      const availableHeight = stripHeight - (padding * 2);
      
      // Calculate optimal stamp size to fill the width while maintaining proper height
      const totalGapWidth = (stampsPerRow - 1) * 1; // Minimal gap between stamps for maximum size
      const stampWidth = Math.floor((availableWidth - totalGapWidth) / stampsPerRow);
      const stampHeight = Math.floor((availableHeight - ((rows - 1) * 1)) / rows);
      
      // Use the width for stamp size but ensure we don't exceed the height constraint
      this.stampSize = Math.min(stampWidth, stampHeight);
      
      // Ensure minimum size for visibility
      this.stampSize = Math.max(this.stampSize, 20);

      // Load background image
      const backgroundBuffer = await sharp(backgroundPath)
        .resize(stripWidth, stripHeight)
        .png()
        .toBuffer();

      // Generate stamps
      const stamps = await this.generateStampsWithIcon(stampsEarned, stampsRequired, iconPath);
      
      // Composite stamps onto background
      const composites = [];
      
      // Calculate spacing with no gaps between stamps for maximum size
      const gap = 1; // Minimal gap between stamps for maximum size
      const totalStampsWidth = (stampsPerRow * this.stampSize) + ((stampsPerRow - 1) * gap);
      const startX = padding + Math.floor((stripWidth - (padding * 2) - totalStampsWidth) / 2);
      const startY = padding + Math.floor((stripHeight - (padding * 2) - (rows * this.stampSize + (rows - 1) * gap)) / 2);
      
      for (let i = 0; i < stamps.length; i++) {
        const stamp = stamps[i];
        const row = Math.floor(i / stampsPerRow);
        const col = i % stampsPerRow;
        
        const x = startX + (col * (this.stampSize + gap));
        const y = startY + (row * (this.stampSize + gap));

        composites.push({
          input: stamp.path,
          top: y,
          left: x
        });
      }

      const gridPath = path.join(this.stampsPath, `stamp_grid_with_bg_${stampsEarned}_${stampsRequired}.png`);
      
      await sharp(backgroundBuffer)
        .composite(composites)
        .png()
        .toFile(gridPath);

      logger.info(`Created stamp grid with background: ${stampsEarned}/${stampsRequired} stamps`);
      return gridPath;
    } catch (error) {
      logger.error('Error creating stamp grid with background:', error);
      throw error;
    }
  }

  /**
   * Generate stamps using icon
   */
  async generateStampsWithIcon(stampsEarned, stampsRequired, iconPath) {
    const stamps = [];
    for (let i = 0; i < stampsRequired; i++) {
      const opacity = i < stampsEarned ? 1 : 0.3; // 100% for redeemed, 30% for unredeemed
      const stampPath = await this.createSingleStampWithIcon(iconPath, opacity, i + 1);
      stamps.push({ path: stampPath, opacity });
    }
    logger.info(`Generated ${stampsRequired} stamps with icon (${stampsEarned} redeemed)`);
    return stamps;
  }

  /**
   * Create a single stamp using icon
   */
  async createSingleStampWithIcon(iconPath, opacity, index) {
    await fs.promises.mkdir(this.stampsPath, { recursive: true });
    const stampPath = path.join(this.stampsPath, `stamp_icon_${index}_${opacity === 1 ? 'redeemed' : 'unredeemed'}.png`);

    // Create circular stamp with icon
    const stampBuffer = await sharp(iconPath)
      .resize(this.stampSize, this.stampSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Apply opacity if unredeemed
    if (opacity < 1) {
      await sharp(stampBuffer)
        .modulate({ brightness: opacity })
        .png()
        .toFile(stampPath);
    } else {
      await sharp(stampBuffer)
        .png()
        .toFile(stampPath);
    }

    return stampPath;
  }

  /**
   * Create a stamp grid image for the pass
   */
  async createStampGrid(stampsEarned, stampsRequired, logoPath) {
    try {
      const stampsPerRow = 5; // 5 stamps per row
      const rows = Math.ceil(stampsRequired / stampsPerRow);
      
      // Use Apple Wallet strip dimensions
      const stripWidth = 320;
      const stripHeight = 84;
      const padding = 2; // Minimal padding for maximum size
      
      // Calculate stamp size to use full width
      const availableWidth = stripWidth - (padding * 2);
      const availableHeight = stripHeight - (padding * 2);
      
      // Calculate optimal stamp size to fill the width while maintaining proper height
      const totalGapWidth = (stampsPerRow - 1) * 1; // Minimal gap between stamps for maximum size
      const stampWidth = Math.floor((availableWidth - totalGapWidth) / stampsPerRow);
      const stampHeight = Math.floor((availableHeight - ((rows - 1) * 1)) / rows);
      
      // Use the width for stamp size but ensure we don't exceed the height constraint
      this.stampSize = Math.min(stampWidth, stampHeight);
      
      // Ensure minimum size for visibility
      this.stampSize = Math.max(this.stampSize, 20);

      // Create grid background with Apple Wallet strip dimensions
      const gridBuffer = await sharp({
        create: {
          width: stripWidth,
          height: stripHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .png()
      .toBuffer();

      // Generate stamps
      const stamps = await this.generateStamps(stampsEarned, stampsRequired, logoPath);
      
      // Composite stamps onto grid using full width
      const composites = [];
      
      // Calculate spacing with no gaps between stamps for maximum size
      const gap = 1; // Minimal gap between stamps for maximum size
      const totalStampsWidth = (stampsPerRow * this.stampSize) + ((stampsPerRow - 1) * gap);
      const startX = padding + Math.floor((stripWidth - (padding * 2) - totalStampsWidth) / 2);
      const startY = padding + Math.floor((stripHeight - (padding * 2) - (rows * this.stampSize + (rows - 1) * gap)) / 2);
      
      for (let i = 0; i < stamps.length; i++) {
        const stamp = stamps[i];
        const row = Math.floor(i / stampsPerRow);
        const col = i % stampsPerRow;
        
        const x = startX + (col * (this.stampSize + gap));
        const y = startY + (row * (this.stampSize + gap));

        composites.push({
          input: stamp.path,
          top: y,
          left: x
        });
      }

      const gridPath = path.join(this.stampsPath, `stamp_grid_${stampsEarned}_${stampsRequired}.png`);
      
      await sharp(gridBuffer)
        .composite(composites)
        .png()
        .toFile(gridPath);

      logger.info(`Created stamp grid: ${stampsEarned}/${stampsRequired} stamps`);
      return gridPath;

    } catch (error) {
      logger.error('Stamp grid creation failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old stamp files
   */
  async cleanupStamps() {
    try {
      if (fs.existsSync(this.stampsPath)) {
        const files = await fs.promises.readdir(this.stampsPath);
        for (const file of files) {
          await fs.promises.unlink(path.join(this.stampsPath, file));
        }
        logger.info('Cleaned up old stamp files');
      }
    } catch (error) {
      logger.error('Failed to cleanup stamps:', error);
    }
  }
}

module.exports = StampGenerator;
