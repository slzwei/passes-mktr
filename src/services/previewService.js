/**
 * Preview Service
 * Handles real-time preview generation for WYSIWYG editor
 */

const PassSigner = require('./passSigner');
const PassConfigService = require('./passConfigService');
const logger = require('../utils/logger');

class PreviewService {
  constructor() {
    this.passSigner = new PassSigner();
    this.configService = new PassConfigService();
    this.previewCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Generate real-time preview
   */
  async generatePreview(template, passData) {
    try {
      const cacheKey = this.getCacheKey(template, passData);
      
      // Check cache first
      if (this.previewCache.has(cacheKey)) {
        const cached = this.previewCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.info('Using cached preview');
          return cached.data;
        }
      }

      // Clean up old preview directories before generating new one
      await this.cleanupOldPreviews();

      logger.info('Generating new preview', { templateId: template.id });

      // Generate preview configuration
      const previewConfig = this.configService.generatePreviewConfig(template, passData);
      
      // Validate configuration
      const validation = this.configService.validateTemplateCompliance(previewConfig);
      
      // Generate preview pass
      const previewDir = await this.passSigner.generatePreview(passData, previewConfig);
      
      // Read preview files
      const fs = require('fs');
      const path = require('path');
      
      const passJsonPath = path.join(previewDir, 'pass.json');
      const passJson = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
      
      // Get preview images (base64 encoded)
      const images = {};
      const imageFiles = ['logo', 'logo@2x', 'icon', 'icon@2x', 'strip', 'strip@2x'];
      
      for (const imageFile of imageFiles) {
        const imagePath = path.join(previewDir, imageFile);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          images[imageFile] = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        }
      }

      // Note: Don't clean up preview directory immediately as frontend may need to access files
      // Cleanup will be handled by a separate cleanup process or on next preview generation

      const previewData = {
        passJson,
        images,
        config: previewConfig,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      };

      // Cache the result
      this.previewCache.set(cacheKey, {
        data: previewData,
        timestamp: Date.now()
      });

      // Clean old cache entries
      this.cleanCache();

      return previewData;

    } catch (error) {
      logger.error('Preview generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate preview for specific pass type
   */
  async generatePreviewByType(templateType, passData) {
    try {
      const template = this.configService.getTemplateByType(templateType, passData);
      return await this.generatePreview(template, passData);
    } catch (error) {
      logger.error('Preview generation by type failed:', error);
      throw error;
    }
  }

  /**
   * Validate template without generating full preview
   */
  async validateTemplate(template) {
    try {
      const validation = this.configService.validateTemplateCompliance(template);
      
      // Additional validation for images
      const imageValidation = this.validateImages(template.images);
      
      return {
        isValid: validation.isValid && imageValidation.isValid,
        errors: [...validation.errors, ...imageValidation.errors],
        warnings: [...validation.warnings, ...imageValidation.warnings]
      };
    } catch (error) {
      logger.error('Template validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate images
   */
  validateImages(images) {
    const errors = [];
    const warnings = [];

    // Check required images
    if (!images.logo) {
      errors.push('Logo image is required');
    }
    if (!images.icon) {
      errors.push('Icon image is required');
    }

    // Validate image formats and sizes if provided
    Object.entries(images).forEach(([type, imageData]) => {
      if (imageData) {
        try {
          // Check if it's base64 data
          if (imageData.startsWith('data:image/')) {
            const format = imageData.split(';')[0].split('/')[1];
            if (!['png', 'jpg', 'jpeg'].includes(format)) {
              errors.push(`${type} image must be PNG or JPEG format`);
            }
          }
        } catch (error) {
          errors.push(`Invalid ${type} image format`);
        }
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get cache key for template and pass data
   */
  getCacheKey(template, passData) {
    const templateHash = this.hashObject(template);
    const dataHash = this.hashObject(passData);
    return `${templateHash}-${dataHash}`;
  }

  /**
   * Simple hash function for objects
   */
  hashObject(obj) {
    return JSON.stringify(obj).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  /**
   * Clean old cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.previewCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.previewCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.previewCache.clear();
    logger.info('Preview cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.previewCache.size,
      maxSize: this.maxHistorySize,
      timeout: this.cacheTimeout
    };
  }

  /**
   * Generate QR code for preview
   */
  generateQRCode(message) {
    try {
      const QRCode = require('qrcode');
      return QRCode.toDataURL(message, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate placeholder QR code
   */
  generatePlaceholderQR() {
    return this.generateQRCode('PASS_ID:placeholder:CAMPAIGN_ID:placeholder');
  }

  /**
   * Clean up old preview directories
   */
  async cleanupOldPreviews() {
    try {
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(process.cwd(), 'temp_preview');
      
      // Check if directory exists
      if (fs.existsSync(tempDir)) {
        // Remove all files in the directory
        const files = await fs.promises.readdir(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          await fs.promises.unlink(filePath);
        }
        logger.info('Cleaned up old preview files');
      }
    } catch (error) {
      logger.warn('Failed to cleanup old previews:', error.message);
    }
  }
}

module.exports = PreviewService;
