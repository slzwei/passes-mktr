const sharp = require('sharp');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizer {
  constructor() {
    this.initialized = false;
    this.tempDir = path.join(process.cwd(), 'temp', 'image-optimization');
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      this.initialized = true;
      logger.info('✅ Image optimizer initialized');
    } catch (error) {
      logger.error('Failed to initialize image optimizer:', error);
      throw error;
    }
  }

  /**
   * Optimize preview image from base64 data URL
   */
  async optimizePreviewFromDataUrl(dataUrl, options = {}) {
    const {
      quality = 85,
      maxWidth = 800,
      maxHeight = 600,
      format = 'webp',
      generateThumbnails = true
    } = options;

    try {
      // Convert base64 data URL to buffer
      const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const inputBuffer = Buffer.from(base64Data, 'base64');
      
      logger.debug('Starting image optimization', {
        originalSize: inputBuffer.length,
        targetFormat: format,
        quality
      });

      // Get original metadata
      const metadata = await sharp(inputBuffer).metadata();
      logger.debug('Original image metadata', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels
      });

      // Create optimization pipeline
      let pipeline = sharp(inputBuffer);
      
      // Resize if too large (maintain aspect ratio)
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
      }
      
      // Apply format-specific optimization
      let optimizedBuffer;
      if (format === 'webp') {
        optimizedBuffer = await pipeline
          .webp({ 
            quality,
            effort: 4, // Balance between compression and speed
            smartSubsample: true
          })
          .toBuffer();
      } else if (format === 'jpeg') {
        optimizedBuffer = await pipeline
          .jpeg({ 
            quality,
            progressive: true,
            mozjpeg: true // Better compression
          })
          .toBuffer();
      } else {
        // PNG with compression
        optimizedBuffer = await pipeline
          .png({
            compressionLevel: 9,
            quality
          })
          .toBuffer();
      }

      const compressionRatio = ((1 - optimizedBuffer.length / inputBuffer.length) * 100);
      
      logger.info('Image optimized successfully', {
        originalSize: `${(inputBuffer.length / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedBuffer.length / 1024).toFixed(1)}KB`,
        compression: `${compressionRatio.toFixed(1)}%`,
        format
      });

      const result = {
        buffer: optimizedBuffer,
        dataUrl: `data:image/${format};base64,${optimizedBuffer.toString('base64')}`,
        metadata: {
          originalSize: inputBuffer.length,
          optimizedSize: optimizedBuffer.length,
          compressionRatio,
          format,
          width: metadata.width,
          height: metadata.height
        }
      };

      // Generate thumbnails if requested
      if (generateThumbnails) {
        result.thumbnails = await this.generateThumbnails(inputBuffer, {
          sizes: [200, 400],
          format: 'webp',
          quality: 80
        });
      }

      return result;
    } catch (error) {
      logger.error('Image optimization failed:', error);
      // Return original data as fallback
      return {
        buffer: Buffer.from(dataUrl.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'),
        dataUrl,
        metadata: { error: error.message },
        fallback: true
      };
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateThumbnails(inputBuffer, options = {}) {
    const {
      sizes = [200, 400],
      format = 'webp',
      quality = 80
    } = options;

    const thumbnails = {};
    
    try {
      for (const size of sizes) {
        const thumbnailBuffer = await sharp(inputBuffer)
          .resize(size, size, { 
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality })
          .toBuffer();
        
        thumbnails[`${size}x${size}`] = {
          buffer: thumbnailBuffer,
          dataUrl: `data:image/${format};base64,${thumbnailBuffer.toString('base64')}`,
          size: thumbnailBuffer.length
        };
      }
      
      logger.debug('Thumbnails generated', {
        sizes: sizes.map(s => `${s}x${s}`),
        totalSize: Object.values(thumbnails).reduce((sum, thumb) => sum + thumb.size, 0)
      });
      
      return thumbnails;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      return {};
    }
  }

  /**
   * Optimize multiple images in batch
   */
  async optimizeBatch(images, options = {}) {
    const {
      concurrency = 3, // Process 3 images at once
      ...optimizationOptions
    } = options;

    const results = [];
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < images.length; i += concurrency) {
      batches.push(images.slice(i, i + concurrency));
    }
    
    logger.info('Starting batch optimization', {
      totalImages: images.length,
      batches: batches.length,
      concurrency
    });

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (image, index) => {
          try {
            const result = await this.optimizePreviewFromDataUrl(image.dataUrl, optimizationOptions);
            return {
              id: image.id || index,
              success: true,
              ...result
            };
          } catch (error) {
            logger.error(`Batch optimization failed for image ${image.id || index}:`, error);
            return {
              id: image.id || index,
              success: false,
              error: error.message
            };
          }
        })
      );
      
      results.push(...batchResults.map(r => r.value || r.reason));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    logger.info('Batch optimization completed', {
      successful,
      failed,
      totalProcessed: results.length
    });
    
    return results;
  }

  /**
   * Create responsive image set
   */
  async createResponsiveSet(dataUrl, breakpoints = [400, 800, 1200]) {
    try {
      const inputBuffer = Buffer.from(dataUrl.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      const responsiveSet = {};
      
      for (const width of breakpoints) {
        const optimized = await sharp(inputBuffer)
          .resize(width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: 85 })
          .toBuffer();
        
        responsiveSet[`${width}w`] = {
          buffer: optimized,
          dataUrl: `data:image/webp;base64,${optimized.toString('base64')}`,
          width,
          size: optimized.length
        };
      }
      
      logger.debug('Responsive image set created', {
        breakpoints,
        totalVariants: Object.keys(responsiveSet).length
      });
      
      return responsiveSet;
    } catch (error) {
      logger.error('Responsive set creation failed:', error);
      return {};
    }
  }

  /**
   * Validate image before processing
   */
  async validateImage(dataUrl) {
    try {
      const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Check file size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('Image too large (max 10MB)');
      }
      
      // Validate with Sharp
      const metadata = await sharp(buffer).metadata();
      
      // Check dimensions (max 4000x4000)
      if (metadata.width > 4000 || metadata.height > 4000) {
        throw new Error('Image dimensions too large (max 4000x4000)');
      }
      
      return {
        valid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
          channels: metadata.channels
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get optimization stats
   */
  getStats() {
    return {
      initialized: this.initialized,
      tempDir: this.tempDir,
      supportedFormats: ['webp', 'jpeg', 'png'],
      features: {
        thumbnails: true,
        responsiveImages: true,
        batchProcessing: true,
        validation: true
      }
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.tempDir, file)))
      );
      logger.debug('Image optimizer cleanup completed');
    } catch (error) {
      logger.warn('Image optimizer cleanup failed:', error.message);
    }
  }
}

// Export singleton instance
module.exports = new ImageOptimizer();
