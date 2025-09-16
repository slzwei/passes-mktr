const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ImageProcessor {
  constructor() {
    this.basePath = path.join(process.cwd(), 'storage', 'images');
    this.processedPath = path.join(this.basePath, 'processed');
    
    // Apple Wallet required dimensions
    this.dimensions = {
      logo: { width: 29, height: 29 },
      logo2x: { width: 58, height: 58 },
      icon: { width: 29, height: 29 },
      icon2x: { width: 58, height: 58 },
      strip: { width: 320, height: 84 },
      strip2x: { width: 640, height: 168 }
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

      // Process logos
      processedImages.logo = await this.processImage('logos', 'logo.png', this.dimensions.logo);
      processedImages.logo2x = await this.processImage('logos', 'logo@2x.png', this.dimensions.logo2x);

      // Process icons
      processedImages.icon = await this.processImage('icons', 'icon.png', this.dimensions.icon);
      processedImages.icon2x = await this.processImage('icons', 'icon@2x.png', this.dimensions.icon2x);

      // Process strips only if requested
      if (includeStrips) {
        processedImages.strip = await this.processImage('strips', 'strip.png', this.dimensions.strip);
        processedImages.strip2x = await this.processImage('strips', 'strip@2x.png', this.dimensions.strip2x);
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

      // Process image with Sharp
      await sharp(sourcePath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      logger.info(`Image processed: ${filename}`);
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
      icon: processedImages.icon,
      icon2x: processedImages.icon2x
    };
    
    if (includeStrips) {
      imagePaths.strip = processedImages.strip;
      imagePaths.strip2x = processedImages.strip2x;
    }
    
    return imagePaths;
  }

  /**
   * Copy processed images to pass directory
   */
  async copyImagesToPassDir(passDir, imagePaths) {
    try {
      for (const [key, imagePath] of Object.entries(imagePaths)) {
        if (imagePath && fs.existsSync(imagePath)) {
          const filename = path.basename(imagePath);
          const destPath = path.join(passDir, filename);
          await fs.promises.copyFile(imagePath, destPath);
          logger.debug(`Copied ${filename} to pass directory`);
        }
      }
    } catch (error) {
      logger.error('Failed to copy images to pass directory:', error);
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
