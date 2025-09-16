/**
 * Image Upload Service
 * Handles image uploads and processing for WYSIWYG editor
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ImageUploadService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'storage', 'images', 'uploads');
    this.processedDir = path.join(process.cwd(), 'storage', 'images', 'processed');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
      logger.info('Image upload service initialized');
    } catch (error) {
      logger.error('Failed to initialize image upload service:', error);
      throw error;
    }
  }

  /**
   * Upload and process image
   */
  async uploadImage(file, imageType) {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileId = uuidv4();
      const extension = this.getFileExtension(file.originalname);
      const filename = `${fileId}.${extension}`;
      const uploadPath = path.join(this.uploadDir, filename);

      // Save uploaded file
      await fs.writeFile(uploadPath, file.buffer);

      // Process image based on type
      const processedImages = await this.processImageForType(uploadPath, imageType, fileId);

      // Clean up uploaded file
      await fs.unlink(uploadPath);

      logger.info('Image uploaded and processed', { imageType, fileId });
      return processedImages;

    } catch (error) {
      logger.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Process image for specific Apple Wallet pass type
   */
  async processImageForType(imagePath, imageType, fileId) {
    const results = {};

    switch (imageType) {
      case 'logo':
        results.logo = await this.processLogo(imagePath, fileId);
        break;
      case 'icon':
        results.icon = await this.processIcon(imagePath, fileId);
        break;
      case 'strip':
        results.strip = await this.processStrip(imagePath, fileId);
        break;
      default:
        throw new Error(`Unknown image type: ${imageType}`);
    }

    return results;
  }

  /**
   * Process logo image (29x29px)
   */
  async processLogo(imagePath, fileId) {
    const logoPath = path.join(this.processedDir, `logo_${fileId}.png`);
    const logo2xPath = path.join(this.processedDir, `logo_${fileId}@2x.png`);

    // Process @1x (29x29)
    await sharp(imagePath)
      .resize(29, 29, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(logoPath);

    // Process @2x (58x58)
    await sharp(imagePath)
      .resize(58, 58, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(logo2xPath);

    return {
      '1x': await this.imageToBase64(logoPath),
      '2x': await this.imageToBase64(logo2xPath)
    };
  }

  /**
   * Process icon image (29x29px)
   */
  async processIcon(imagePath, fileId) {
    const iconPath = path.join(this.processedDir, `icon_${fileId}.png`);
    const icon2xPath = path.join(this.processedDir, `icon_${fileId}@2x.png`);

    // Process @1x (29x29)
    await sharp(imagePath)
      .resize(29, 29, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(iconPath);

    // Process @2x (58x58)
    await sharp(imagePath)
      .resize(58, 58, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(icon2xPath);

    return {
      '1x': await this.imageToBase64(iconPath),
      '2x': await this.imageToBase64(icon2xPath)
    };
  }

  /**
   * Process strip image (320x84px)
   */
  async processStrip(imagePath, fileId) {
    const stripPath = path.join(this.processedDir, `strip_${fileId}.png`);
    const strip2xPath = path.join(this.processedDir, `strip_${fileId}@2x.png`);

    // Process @1x (320x84)
    await sharp(imagePath)
      .resize(320, 84, { fit: 'cover' })
      .png()
      .toFile(stripPath);

    // Process @2x (640x168)
    await sharp(imagePath)
      .resize(640, 168, { fit: 'cover' })
      .png()
      .toFile(strip2xPath);

    return {
      '1x': await this.imageToBase64(stripPath),
      '2x': await this.imageToBase64(strip2xPath)
    };
  }

  /**
   * Convert image to base64
   */
  async imageToBase64(imagePath) {
    const buffer = await fs.readFile(imagePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    const extension = this.getFileExtension(file.originalname);
    if (!this.allowedFormats.includes(extension.toLowerCase())) {
      throw new Error(`File format not supported. Allowed formats: ${this.allowedFormats.join(', ')}`);
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }

  /**
   * Generate stamp image
   */
  async generateStampImage(stampConfig) {
    try {
      const { type, earnedColor, unearnedColor, size = 32, borderWidth = 2 } = stampConfig;
      
      const stampSvg = this.generateStampSVG(type, earnedColor, size, borderWidth);
      const unredeemedSvg = this.generateStampSVG(type, unearnedColor, size, borderWidth);

      // Generate earned stamp
      const earnedBuffer = await sharp(Buffer.from(stampSvg))
        .resize(size, size)
        .png()
        .toBuffer();

      // Generate unredeemed stamp (30% opacity)
      const unredeemedBuffer = await sharp(Buffer.from(unredeemedSvg))
        .resize(size, size)
        .modulate({ brightness: 0.3 })
        .png()
        .toBuffer();

      return {
        earned: `data:image/png;base64,${earnedBuffer.toString('base64')}`,
        unredeemed: `data:image/png;base64,${unredeemedBuffer.toString('base64')}`
      };

    } catch (error) {
      logger.error('Stamp generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate stamp SVG
   */
  generateStampSVG(type, color, size, borderWidth) {
    const center = size / 2;
    const radius = center - borderWidth;

    switch (type) {
      case 'star':
        return `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="white" stroke="${color}" stroke-width="${borderWidth}"/>
            <path d="M${center} ${borderWidth + 4}l2.5 5.1L${size - 4} ${center}l-4.5 4.4L${center + 4.5} ${size - 4}l-4.5-2.4L${center - 4.5} ${size - 4}l1-5.6L${borderWidth + 4} ${center}l5.5-.9L${center} ${borderWidth + 4}z" 
                  fill="${color}"/>
          </svg>
        `;
      case 'coffee':
        return `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="white" stroke="${color}" stroke-width="${borderWidth}"/>
            <path d="M${center - 6} ${center - 4}h12v2h-12z" fill="${color}"/>
            <path d="M${center - 5} ${center - 2}v6h10v-6" fill="none" stroke="${color}" stroke-width="2"/>
            <path d="M${center + 5} ${center}h2v2h-2z" fill="${color}"/>
          </svg>
        `;
      case 'heart':
        return `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="white" stroke="${color}" stroke-width="${borderWidth}"/>
            <path d="M${center} ${center + 2}c-2-2-6-6-6-4s2 2 6 6c4-4 6-6 6-4s-4 2-6 4z" fill="${color}"/>
          </svg>
        `;
      default:
        return `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="white" stroke="${color}" stroke-width="${borderWidth}"/>
            <text x="${center}" y="${center + 4}" text-anchor="middle" font-family="Arial" font-size="12" fill="${color}">✓</text>
          </svg>
        `;
    }
  }

  /**
   * Clean up old files
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.processedDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.processedDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }

      logger.info('Image cleanup completed');
    } catch (error) {
      logger.error('Image cleanup failed:', error);
    }
  }
}

module.exports = ImageUploadService;
