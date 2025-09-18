const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class LogoProcessor {
  constructor() {
    this.basePath = path.join(process.cwd(), 'storage', 'images');
    this.processedPath = path.join(this.basePath, 'processed');
    
    // Apple Wallet logo dimensions - supports both square and wide formats
    this.logoDimensions = {
      square: {
        width: 50,   // Square logo (1:1 aspect ratio)
        height: 50
      },
      wide: {
        width: 160,  // Wide logo (3.2:1 aspect ratio) - Apple's official spec
        height: 50
      }
    };
  }

  /**
   * Determine logo format based on aspect ratio
   * @param {Object} metadata - Image metadata from Sharp
   * @returns {string} 'square' or 'wide'
   */
  determineLogoFormat(metadata) {
    const aspectRatio = metadata.width / metadata.height;
    // If aspect ratio is greater than 1.5, use wide format, otherwise square
    return aspectRatio > 1.5 ? 'wide' : 'square';
  }

  /**
   * Process logo with dynamic sizing based on aspect ratio
   * @param {string} sourcePath - Path to source logo
   * @param {string} outputPath - Path for processed logo
   * @param {Object} options - Processing options (width/height for @2x/@3x, format override)
   * @returns {Promise<Object>} Object with path and format info
   */
  async processLogo(sourcePath, outputPath, options = {}) {
    try {
      if (!fs.existsSync(sourcePath)) {
        logger.warn(`Source logo not found: ${sourcePath}`);

        // New: try project fallback placeholder first
        const fallbackPath = path.join(process.cwd(), 'pass-assets', 'logo-placeholder.png');
        if (fs.existsSync(fallbackPath)) {
          logger.info(`Using fallback placeholder logo at ${fallbackPath}`);
          // Re-run logic with fallback as the source
          const metadata = await sharp(fallbackPath).metadata();
          const format = options.format || this.determineLogoFormat(metadata);
          const dimensions = options.width && options.height
            ? { width: options.width, height: options.height }
            : this.logoDimensions[format] || this.logoDimensions.square;

          const hideLogoText = format === 'wide';

          await sharp(fallbackPath)
            .resize(dimensions.width, dimensions.height, {
              fit: 'contain',
              position: 'center',
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .png({ quality: 100, compressionLevel: 9 })
            .toFile(outputPath);

          return { path: outputPath, format, hideLogoText, dimensions, source: fallbackPath };
        }

        logger.warn(`Fallback placeholder not found, generating vector placeholder`);
        const targetDimensions = (options.width && options.height)
          ? { width: options.width, height: options.height }
          : this.logoDimensions.square;

        const defaultPath = await this.createDefaultLogo(
          outputPath,
          targetDimensions.width,
          targetDimensions.height
        );

        return {
          path: defaultPath,
          format: 'square',
          hideLogoText: false,
          dimensions: targetDimensions
        };
      }

      // Get image metadata
      const metadata = await sharp(sourcePath).metadata();
      
      // Determine format based on aspect ratio (unless overridden)
      const format = options.format || this.determineLogoFormat(metadata);
      const dimensions = options.width && options.height 
        ? { width: options.width, height: options.height }
        : this.logoDimensions[format];
      
      const hideLogoText = format === 'wide';
      
      logger.info(`Processing logo: ${metadata.width}x${metadata.height} -> ${dimensions.width}x${dimensions.height} (${format} format)`);

      // Resize logo to determined dimensions
      await sharp(sourcePath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      logger.info(`Logo processed successfully: ${dimensions.width}x${dimensions.height} (${format} format, hideLogoText: ${hideLogoText})`);
      return { path: outputPath, format, hideLogoText, dimensions, source: sourcePath };

    } catch (error) {
      logger.error(`Failed to process logo:`, error);
      const targetDimensions = (options.width && options.height)
        ? { width: options.width, height: options.height }
        : this.logoDimensions.square;
      const defaultPath = await this.createDefaultLogo(
        outputPath,
        targetDimensions.width,
        targetDimensions.height
      );
      return {
        path: defaultPath,
        format: 'square',
        hideLogoText: false,
        dimensions: targetDimensions,
        source: 'vector-default'
      };
    }
  }


  /**
   * Create default logo when source is missing
   */
  async createDefaultLogo(outputPath, width, height) {
    const w = width || this.logoDimensions.square.width;
    const h = height || this.logoDimensions.square.height;
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${w}" height="${h}" fill="#ffffff"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, sans-serif" font-size="20" fill="#666">
          LOGO
        </text>
      </svg>`;

    await sharp(Buffer.from(svg))
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Process logos for all required sizes (@1x, @2x, @3x) with dynamic sizing
   */
  async processLogosForPass(logoPath) {
    try {
      await fs.promises.mkdir(this.processedPath, { recursive: true });

      const results = {};

      // Process @1x logo (determine format automatically)
      const logo1xPath = path.join(this.processedPath, 'logo.png');
      const logo1xResult = await this.processLogo(logoPath, logo1xPath);
      results.logo = logo1xResult.path;
      results.format = logo1xResult.format;
      results.hideLogoText = logo1xResult.hideLogoText;
      results.dimensions = logo1xResult.dimensions;

      // Get the determined dimensions for @2x and @3x
      const baseDimensions = logo1xResult.dimensions;

      // Process @2x logo (double resolution)
      const logo2xPath = path.join(this.processedPath, 'logo@2x.png');
      const logo2xResult = await this.processLogo(logoPath, logo2xPath, {
        width: baseDimensions.width * 2,
        height: baseDimensions.height * 2,
        format: logo1xResult.format
      });
      results.logo2x = logo2xResult.path;

      // Process @3x logo (triple resolution)
      const logo3xPath = path.join(this.processedPath, 'logo@3x.png');
      const logo3xResult = await this.processLogo(logoPath, logo3xPath, {
        width: baseDimensions.width * 3,
        height: baseDimensions.height * 3,
        format: logo1xResult.format
      });
      results.logo3x = logo3xResult.path;

      logger.info(`All logo variants processed successfully (${results.format} format, hideLogoText: ${results.hideLogoText})`);
      return results;

    } catch (error) {
      logger.error('Failed to process logos for pass:', error);
      throw error;
    }
  }

  /**
   * Get logo preview information for the editor
   */
  async getLogoPreview(logoPath) {
    try {
      if (!fs.existsSync(logoPath)) {
        return {
          dimensions: this.logoDimensions,
          aspectRatio: 1,
          strategy: 'square',
          recommended: 'Logo will be resized to 160x50px (Apple Wallet standard)'
        };
      }

      const metadata = await sharp(logoPath).metadata();
      const aspectRatio = metadata.width / metadata.height;

      return {
        dimensions: this.logoDimensions,
        aspectRatio,
        strategy: 'square',
        recommended: 'Logo will be resized to 160x50px (Apple Wallet standard)',
        originalDimensions: { width: metadata.width, height: metadata.height }
      };

    } catch (error) {
      logger.error('Failed to get logo preview:', error);
      return {
        dimensions: this.logoDimensions,
        aspectRatio: 1,
        strategy: 'square',
        recommended: 'Error analyzing logo, using default square processing'
      };
    }
  }
}

module.exports = LogoProcessor;
