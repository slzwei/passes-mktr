const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const LogoProcessor = require('./logoProcessor');

class ImageProcessor {
  constructor() {
    this.basePath = path.join(process.cwd(), 'storage', 'images');
    this.processedPath = path.join(this.basePath, 'processed');
    this.logoProcessor = new LogoProcessor();
    
    // Apple Wallet required dimensions
    this.dimensions = {
      // Logo dimensions are now handled by LogoProcessor
      icon: { width: 29, height: 29 },
      icon2x: { width: 58, height: 58 },
      strip: { width: 320, height: 84 },
      strip2x: { width: 640, height: 168 },
      strip3x: { width: 960, height: 252 }
    };
  }

  /**
   * Process all images for Apple Wallet pass
   */
  async processImagesForPass(includeStrips = true) {
    try {
      // Ensure processed directory exists
      await fs.promises.mkdir(this.processedPath, { recursive: true });

      const processedImages = {};

      // Process logos using the new LogoProcessor with dynamic sizing
      const logoPath = path.join(this.basePath, 'logos', 'logo.png');
      const logoResults = await this.logoProcessor.processLogosForPass(logoPath);
      processedImages.logo = logoResults.logo;
      processedImages.logo2x = logoResults.logo2x;
      processedImages.logo3x = logoResults.logo3x;
      processedImages.logoFormat = logoResults.format;
      processedImages.hideLogoText = logoResults.hideLogoText;
      processedImages.logoDimensions = logoResults.dimensions;
      processedImages.logoSource = logoResults.source;

      // Process icons
      processedImages.icon = await this.processImage('icons', 'icon.png', this.dimensions.icon);
      processedImages.icon2x = await this.processImage('icons', 'icon@2x.png', this.dimensions.icon2x);

      // Process strips only if requested
      if (includeStrips) {
        processedImages.strip = await this.processImage('strips', 'strip.png', this.dimensions.strip);
        processedImages.strip2x = await this.processImage('strips', 'strip@2x.png', this.dimensions.strip2x);
        processedImages.strip3x = await this.processImage('strips', 'strip@3x.png', this.dimensions.strip3x);
      }

      logger.info('Images processed successfully for Apple Wallet pass');
      return processedImages;

    } catch (error) {
      logger.error('Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Process a single image
   */
  async processImage(category, filename, dimensions) {
    const sourcePath = path.join(this.basePath, category, filename);
    const outputPath = path.join(this.processedPath, filename);

    try {
      // Check if source image exists
      if (!fs.existsSync(sourcePath)) {
        logger.warn(`Source image not found: ${sourcePath}, using default`);
        return this.createDefaultImage(dimensions, outputPath);
      }

      // Get image info
      const imageInfo = await sharp(sourcePath).metadata();
      logger.info(`Processing ${filename}: ${imageInfo.width}x${imageInfo.height} -> ${dimensions.width}x${dimensions.height}`);

      // Determine if this is a strip image for special compression
      const isStripImage = filename.includes('strip') || filename.includes('stripBackground');
      
      // Check if source image is very large and needs aggressive compression
      const sourceStats = await fs.stat(sourcePath);
      const sourceSizeKB = Math.round(sourceStats.size / 1024);
      const needsAggressiveCompression = isStripImage && sourceSizeKB > 500; // > 500KB
      const needsVeryAggressiveCompression = isStripImage && sourceSizeKB > 2000; // > 2MB
      
      // Process image with Sharp
      await sharp(sourcePath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .png({
          quality: isStripImage ? (needsVeryAggressiveCompression ? 65 : needsAggressiveCompression ? 75 : 85) : 100,  // Lower quality for strip images
          compressionLevel: 9,
          adaptiveFiltering: true,  // Better compression
          palette: isStripImage     // Use palette for strip images if beneficial
        })
        .toFile(outputPath);

      // Get file size for logging
      const stats = await fs.stat(outputPath);
      const fileSizeKB = Math.round(stats.size / 1024);
      
      if (isStripImage) {
        const compressionRatio = Math.round((1 - fileSizeKB / sourceSizeKB) * 100);
        let compressionInfo = ` (${compressionRatio}% reduction)`;
        if (needsVeryAggressiveCompression) {
          compressionInfo = ` (very aggressive compression: ${compressionRatio}% reduction)`;
        } else if (needsAggressiveCompression) {
          compressionInfo = ` (aggressive compression: ${compressionRatio}% reduction)`;
        }
        logger.info(`Strip image processed: ${filename} (${fileSizeKB}KB${compressionInfo})`);
      } else {
        logger.info(`Image processed: ${filename}`);
      }
      
      return outputPath;

    } catch (error) {
      logger.error(`Failed to process ${filename}:`, error);
      // Fallback to default image
      return this.createDefaultImage(dimensions, outputPath);
    }
  }

  /**
   * Create a default image if source is missing
   */
  async createDefaultImage(dimensions, outputPath) {
    try {
      // Create a simple colored rectangle as default
      await sharp({
        create: {
          width: dimensions.width,
          height: dimensions.height,
          channels: 4,
          background: { r: 60, g: 65, b: 76, alpha: 1 }
        }
      })
      .png()
      .toFile(outputPath);

      logger.info(`Created default image: ${path.basename(outputPath)}`);
      return outputPath;

    } catch (error) {
      logger.error(`Failed to create default image:`, error);
      throw error;
    }
  }

  /**
   * Get processed image paths for pass generation
   */
  async getProcessedImagePaths(includeStrips = true) {
    const processedImages = await this.processImagesForPass(includeStrips);
    
    const imagePaths = {
      logo: processedImages.logo,
      logo2x: processedImages.logo2x,
      logo3x: processedImages.logo3x,
      logoSource: processedImages.logoSource,
      icon: processedImages.icon,
      icon2x: processedImages.icon2x,
      // Include logo format information
      logoFormat: processedImages.logoFormat,
      hideLogoText: processedImages.hideLogoText,
      logoDimensions: processedImages.logoDimensions
    };
    
    if (includeStrips) {
      imagePaths.strip = processedImages.strip;
      imagePaths.strip2x = processedImages.strip2x;
      imagePaths.strip3x = processedImages.strip3x;
    }
    
    return imagePaths;
  }

  /**
   * Get uploaded image paths for pass generation
   */
  async getUploadedImagePaths(uploadedImages, includeStrips = true) {
    // First, get the processed images as fallback
    const fallbackImages = await this.processImagesForPass(includeStrips);
    
    const imagePaths = {
      logo: fallbackImages.logo,
      logo2x: fallbackImages.logo2x,
      icon: fallbackImages.icon,
      icon2x: fallbackImages.icon2x
    };
    
    if (includeStrips) {
      imagePaths.strip = fallbackImages.strip;
      imagePaths.strip2x = fallbackImages.strip2x;
    }
    
    // Override with uploaded images if they exist
    if (uploadedImages.logo) {
      const logoPath = path.join(this.basePath, 'logos', 'logo.png');
      const logo2xPath = path.join(this.basePath, 'logos', 'logo@2x.png');
      
      if (fs.existsSync(logoPath)) {
        imagePaths.logo = logoPath;
      }
      if (fs.existsSync(logo2xPath)) {
        imagePaths.logo2x = logo2xPath;
      }
    }
    
    if (uploadedImages.icon) {
      const iconPath = path.join(this.basePath, 'icons', 'icon.png');
      const icon2xPath = path.join(this.basePath, 'icons', 'icon@2x.png');
      
      if (fs.existsSync(iconPath)) {
        imagePaths.icon = iconPath;
      }
      if (fs.existsSync(icon2xPath)) {
        imagePaths.icon2x = icon2xPath;
      }
    }
    
    if (uploadedImages.strip && includeStrips) {
      const stripPath = path.join(this.basePath, 'strips', 'strip.png');
      const strip2xPath = path.join(this.basePath, 'strips', 'strip@2x.png');
      
      if (fs.existsSync(stripPath)) {
        imagePaths.strip = stripPath;
      }
      if (fs.existsSync(strip2xPath)) {
        imagePaths.strip2x = strip2xPath;
      }
    }
    
    logger.info('Using uploaded images for pass generation', {
      logo: !!imagePaths.logo,
      logo2x: !!imagePaths.logo2x,
      icon: !!imagePaths.icon,
      icon2x: !!imagePaths.icon2x,
      strip: !!imagePaths.strip,
      strip2x: !!imagePaths.strip2x
    });
    
    return imagePaths;
  }

  /**
   * Copy processed images to pass directory
   */
  async copyImagesToPassDir(passDir, imagePaths) {
    try {
      // Map image keys to expected filenames for Apple Wallet
      const filenameMap = {
        logo: 'logo.png',
        logo2x: 'logo@2x.png',
        logo3x: 'logo@3x.png',
        icon: 'icon.png',
        icon2x: 'icon@2x.png',
        strip: 'strip.png',
        strip2x: 'strip@2x.png'
      };

      for (const [key, imagePath] of Object.entries(imagePaths)) {
        if (imagePath && fs.existsSync(imagePath)) {
          const expectedFilename = filenameMap[key];
          if (expectedFilename) {
            const destPath = path.join(passDir, expectedFilename);
            await fs.promises.copyFile(imagePath, destPath);
            logger.info(`Copied ${key} from ${imagePath} as ${expectedFilename} to pass directory`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to copy images to pass directory:', error);
      throw error;
    }
  }

  /**
   * Process uploaded images for pass generation
   */
  async processUploadedImages(uploadedImages, includeStrips = true) {
    try {
      const processedImages = {};
      
      // Ensure processed directory exists
      await fs.promises.mkdir(this.processedPath, { recursive: true });
      
      // Process uploaded logo if provided
      if (uploadedImages.logo || uploadedImages.logoImage) {
        const logoSrc = uploadedImages.logo || uploadedImages.logoImage;
        const logoPath = await this.saveUploadedImage(logoSrc, 'logo.png');
        const logoResults = await this.logoProcessor.processLogosForPass(logoPath);
        processedImages.logo = logoResults.logo;
        processedImages.logo2x = logoResults.logo2x;
        processedImages.logo3x = logoResults.logo3x;
        processedImages.logoFormat = logoResults.format;
        processedImages.hideLogoText = logoResults.hideLogoText;
        processedImages.logoDimensions = logoResults.dimensions;
        processedImages.logoSource = logoResults.source;
      } else {
        // Use default logo processing
        const logoPath = path.join(this.basePath, 'logos', 'logo.png');
        const logoResults = await this.logoProcessor.processLogosForPass(logoPath);
        processedImages.logo = logoResults.logo;
        processedImages.logo2x = logoResults.logo2x;
        processedImages.logo3x = logoResults.logo3x;
        processedImages.logoFormat = logoResults.format;
        processedImages.hideLogoText = logoResults.hideLogoText;
        processedImages.logoDimensions = logoResults.dimensions;
        processedImages.logoSource = logoResults.source;
      }
      
      // Process uploaded icon if provided, or use stamp icon as main icon if available
      if (uploadedImages.icon) {
        const iconPath = await this.saveUploadedImage(uploadedImages.icon, 'icon.png');
        processedImages.icon = await this.processImage('temp', 'icon.png', this.dimensions.icon);
        processedImages.icon2x = await this.processImage('temp', 'icon@2x.png', this.dimensions.icon2x);
      } else if (uploadedImages.stampIcon) {
        // Use uploaded stamp icon as main pass icon if no main icon is uploaded
        const stampIconPath = await this.saveUploadedImage(uploadedImages.stampIcon, 'icon.png');
        processedImages.icon = await this.processImage('temp', 'icon.png', this.dimensions.icon);
        processedImages.icon2x = await this.processImage('temp', 'icon@2x.png', this.dimensions.icon2x);
        logger.info('Using uploaded stamp icon as main pass icon');
      } else {
        // Use default icon processing
        processedImages.icon = await this.processImage('icons', 'icon.png', this.dimensions.icon);
        processedImages.icon2x = await this.processImage('icons', 'icon@2x.png', this.dimensions.icon2x);
      }
      
      // Process uploaded stamp icon(s)
      if (uploadedImages.stampIcon || uploadedImages.stampIconUnredeemed) {
        const unredeemedSrc = uploadedImages.stampIconUnredeemed || uploadedImages.stampIcon;
        const stampIconPath = await this.saveUploadedImage(unredeemedSrc, 'stampIcon.unredeemed.png');
        processedImages.stampIcon = stampIconPath; // Backward compatible
        processedImages.stampIconUnredeemed = stampIconPath;
        logger.info('Uploaded unredeemed stamp icon processed successfully');

        // Redeemed icon
        const useSame = uploadedImages.useSameStampIcon;
        if (!useSame && uploadedImages.stampIconRedeemed) {
          const redeemedPath = await this.saveUploadedImage(uploadedImages.stampIconRedeemed, 'stampIcon.redeemed.png');
          processedImages.stampIconRedeemed = redeemedPath;
          logger.info('Uploaded redeemed stamp icon processed successfully');
        } else {
          processedImages.stampIconRedeemed = stampIconPath; // same as unredeemed
        }
      } else {
        // Use coffee stamp as default fallback instead of regular icon
        const coffeeStampPath = path.join(this.basePath, 'icons', 'coffee.png');
        const testCoffeePath = path.join(this.basePath, 'icons', 'test-coffee-icon.png');
        
        // Check if coffee.png exists, otherwise use test-coffee-icon.png
        let defaultStampPath;
        try {
          await fs.promises.access(coffeeStampPath);
          defaultStampPath = coffeeStampPath;
          logger.info('Using coffee.png as default stamp icon');
        } catch {
          try {
            await fs.promises.access(testCoffeePath);
            defaultStampPath = testCoffeePath;
            logger.info('Using test-coffee-icon.png as default stamp icon');
          } catch {
            // Final fallback to numbered circles (handled in stampGenerator)
            defaultStampPath = null;
            logger.info('No coffee stamp found, will use fallback stamp generation');
          }
        }
        
        processedImages.stampIcon = defaultStampPath;
        processedImages.stampIconUnredeemed = defaultStampPath;
        processedImages.stampIconRedeemed = defaultStampPath;
      }
      
      // Process strips only if requested
      if (includeStrips) {
        if (uploadedImages.strip) {
          const stripPath = await this.saveUploadedImage(uploadedImages.strip, 'strip.png');
          processedImages.strip = await this.processImage('temp', 'strip.png', this.dimensions.strip);
          processedImages.strip2x = await this.processImage('temp', 'strip@2x.png', this.dimensions.strip2x);
        } else {
          // Use default strip processing
          processedImages.strip = await this.processImage('strips', 'strip.png', this.dimensions.strip);
          processedImages.strip2x = await this.processImage('strips', 'strip@2x.png', this.dimensions.strip2x);
        }
        
        // Process strip background if provided
        if (uploadedImages.stripBackground) {
          const stripBackgroundPath = await this.saveUploadedImage(uploadedImages.stripBackground, 'stripBackground.png');
          processedImages.stripBackground = await this.processImage('temp', 'stripBackground.png', this.dimensions.strip);
          processedImages.stripBackground2x = await this.processImage('temp', 'stripBackground@2x.png', this.dimensions.strip2x);
          logger.info('Custom strip background processed successfully');
        }
      }
      
      logger.info('Uploaded images processed successfully for Apple Wallet pass');
      return processedImages;
      
    } catch (error) {
      logger.error('Uploaded image processing failed:', error);
      throw error;
    }
  }

  /**
   * Save uploaded image (base64 data URL) to appropriate directory
   */
  async saveUploadedImage(base64DataUrl, filename) {
    try {
      // Create temp directory for uploaded images
      const tempPath = path.join(this.basePath, 'temp');
      await fs.promises.mkdir(tempPath, { recursive: true });
      
      // Extract base64 data
      const base64Data = base64DataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Save to temp directory
      const filePath = path.join(tempPath, filename);
      await fs.promises.writeFile(filePath, imageBuffer);
      
      logger.info(`Uploaded image saved: ${filename}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to save uploaded image ${filename}:`, error);
      throw error;
    }
  }

  /**
   * List available source images
   */
  async listSourceImages() {
    const categories = ['logos', 'icons', 'strips'];
    const availableImages = {};

    for (const category of categories) {
      const categoryPath = path.join(this.basePath, category);
      
      if (fs.existsSync(categoryPath)) {
        const files = await fs.promises.readdir(categoryPath);
        availableImages[category] = files.filter(file => 
          /\.(png|jpg|jpeg|webp)$/i.test(file)
        );
      } else {
        availableImages[category] = [];
      }
    }

    return availableImages;
  }

  /**
   * Validate image requirements
   */
  async validateImages() {
    const issues = [];
    const availableImages = await this.listSourceImages();

    // Check for required images
    const requiredImages = {
      logos: ['logo.png', 'logo@2x.png'],
      icons: ['icon.png', 'icon@2x.png'],
      strips: ['strip.png', 'strip@2x.png']
    };

    for (const [category, files] of Object.entries(requiredImages)) {
      for (const file of files) {
        if (!availableImages[category].includes(file)) {
          issues.push(`Missing ${category}/${file}`);
        }
      }
    }

    if (issues.length === 0) {
      logger.info('All required images are available');
    } else {
      logger.warn('Missing images:', issues);
    }

    return {
      valid: issues.length === 0,
      issues,
      availableImages
    };
  }
}

module.exports = ImageProcessor;
