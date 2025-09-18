const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const logger = require('../utils/logger');
const PassSigner = require('./passSigner');
const PassValidationService = require('./passValidationService');
const BarcodeService = require('./barcodeService');
const ImageProcessor = require('./imageProcessor');

class PassExportService {
  constructor() {
    this.validationService = new PassValidationService();
    this.barcodeService = new BarcodeService();
    this.imageProcessor = new ImageProcessor();
    this.exportDir = path.join(process.cwd(), 'storage', 'passes');
    
    // Initialize pass signer only if certificates are available
    try {
      this.passSigner = new PassSigner();
    } catch (error) {
      logger.warn('Pass signer not available - using mock signing for development');
      this.passSigner = null;
    }
  }

  /**
   * Export a pass as .pkpass file
   * @param {Object} passData - The pass configuration
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportPass(passData, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting pass export:', {
        passId: passData.id || passData.serialNumber,
        options
      });

      // Validate pass before export
      const validationResult = await this.validationService.validatePass(passData);
      if (!validationResult.valid) {
        throw new Error(`Pass validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Generate pass ID
      const passId = passData.id || this.generatePassId();
      const exportPath = path.join(this.exportDir, `${passId}.pkpass`);

      // Create temporary directory for pass bundle
      const tempDir = path.join(process.cwd(), 'temp', `export_${passId}`);
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Generate pass.json
        const passJson = await this.generatePassJson(passData, options);
        await fs.writeFile(
          path.join(tempDir, 'pass.json'),
          JSON.stringify(passJson, null, 2)
        );

        // Process and add images
        await this.addImagesToPass(tempDir, passData, options);

        // Generate barcodes if needed
        await this.addBarcodesToPass(tempDir, passData, options);

        // Create manifest.json
        const manifest = await this.generateManifest(tempDir);
        await fs.writeFile(
          path.join(tempDir, 'manifest.json'),
          JSON.stringify(manifest, null, 2)
        );

        // Sign the pass
        const signature = await this.signPass(tempDir, passData);
        await fs.writeFile(path.join(tempDir, 'signature'), signature);

        // Create .pkpass file
        await this.createPkpassFile(tempDir, exportPath);

        const exportTime = Date.now() - startTime;
        
        logger.info('Pass export completed successfully:', {
          passId,
          exportPath,
          exportTime: `${exportTime}ms`,
          fileSize: (await fs.stat(exportPath)).size
        });

        return {
          success: true,
          passId,
          exportPath,
          fileSize: (await fs.stat(exportPath)).size,
          exportTime,
          validationResult
        };

      } finally {
        // Clean up temporary directory
        await this.cleanupTempDir(tempDir);
      }

    } catch (error) {
      logger.error('Pass export failed:', {
        error: error.message,
        stack: error.stack,
        passId: passData.id || passData.serialNumber
      });
      
      throw error;
    }
  }

  /**
   * Generate pass.json with proper structure
   */
  async generatePassJson(passData, options) {
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passData.passTypeIdentifier || process.env.PASS_TYPE_ID,
      serialNumber: passData.serialNumber || this.generateSerialNumber(),
      teamIdentifier: passData.teamIdentifier || process.env.APPLE_TEAM_ID,
      organizationName: passData.organizationName || 'MKTR',
      description: passData.description || 'Loyalty Pass',
      logoText: passData.logoText,
      foregroundColor: passData.foregroundColor || 'rgb(255, 255, 255)',
      backgroundColor: passData.backgroundColor || 'rgb(60, 65, 76)',
      labelColor: passData.labelColor || 'rgb(255, 255, 255)',
      webServiceURL: passData.webServiceURL,
      authenticationToken: passData.authenticationToken,
      relevantDate: passData.relevantDate,
      expirationDate: passData.expirationDate,
      voided: passData.voided || false
    };

    // Add locations if provided
    if (passData.locations && passData.locations.length > 0) {
      passJson.locations = passData.locations;
    }

    // Add max distance if provided
    if (passData.maxDistance) {
      passJson.maxDistance = passData.maxDistance;
    }

    // Add NFC if provided
    if (passData.nfc) {
      passJson.nfc = passData.nfc;
    }

    // Add barcodes
    if (passData.barcode) {
      passJson.barcode = passData.barcode;
    }

    if (passData.barcodes && passData.barcodes.length > 0) {
      passJson.barcodes = passData.barcodes;
    }

    // Add pass type specific data
    if (passData.generic) {
      passJson.generic = passData.generic;
    } else if (passData.storeCard) {
      passJson.storeCard = passData.storeCard;
    }

    return passJson;
  }

  /**
   * Add images to pass bundle
   */
  async addImagesToPass(tempDir, passData, options) {
    const imageTypes = ['icon', 'logo', 'background', 'strip', 'thumbnail'];
    
    for (const imageType of imageTypes) {
      const imagePath = this.getImagePath(passData, imageType);
      if (imagePath && await this.fileExists(imagePath)) {
        await this.copyImageToPass(tempDir, imagePath, imageType);
      } else if (imageType === 'icon' || imageType === 'logo') {
        // Generate default images for required types
        await this.generateDefaultImage(tempDir, imageType);
      }
    }
  }

  /**
   * Get image path from pass data
   */
  getImagePath(passData, imageType) {
    if (passData.images && passData.images[imageType]) {
      return passData.images[imageType];
    }
    
    // Check for standard image locations
    const standardPath = path.join(process.cwd(), 'storage', 'images', `${imageType}.png`);
    return standardPath;
  }

  /**
   * Copy image to pass bundle with proper naming
   */
  async copyImageToPass(tempDir, imagePath, imageType) {
    const destPath = path.join(tempDir, `${imageType}.png`);
    await fs.copyFile(imagePath, destPath);

    // Generate @2x and @3x versions if needed
    if (imageType === 'icon' || imageType === 'logo') {
      await this.generateRetinaVersions(imagePath, tempDir, imageType);
    }
  }

  /**
   * Generate retina versions of images
   */
  async generateRetinaVersions(imagePath, tempDir, imageType) {
    try {
      // Generate @2x version
      const retina2xPath = path.join(tempDir, `${imageType}@2x.png`);
      await this.imageProcessor.resizeImage(imagePath, retina2xPath, 2);

      // Generate @3x version
      const retina3xPath = path.join(tempDir, `${imageType}@3x.png`);
      await this.imageProcessor.resizeImage(imagePath, retina3xPath, 3);
    } catch (error) {
      logger.warn('Failed to generate retina versions:', {
        imageType,
        error: error.message
      });
    }
  }

  /**
   * Generate default image for required types
   */
  async generateDefaultImage(tempDir, imageType) {
    const defaultImagePath = path.join(process.cwd(), 'pass-assets', `${imageType}.png`);
    
    if (await this.fileExists(defaultImagePath)) {
      await this.copyImageToPass(tempDir, defaultImagePath, imageType);
    } else {
      logger.warn(`No default ${imageType} image found`);
    }
  }

  /**
   * Add barcodes to pass bundle
   */
  async addBarcodesToPass(tempDir, passData, options) {
    if (!passData.barcode && (!passData.barcodes || passData.barcodes.length === 0)) {
      return;
    }

    const barcodes = [];
    if (passData.barcode) {
      barcodes.push(passData.barcode);
    }
    if (passData.barcodes) {
      barcodes.push(...passData.barcodes);
    }

    for (const barcode of barcodes) {
      try {
        const barcodeFormat = this.getBarcodeFormat(barcode.format);
        const barcodeBuffer = await this.barcodeService.generateBarcode(
          barcode.message,
          barcodeFormat,
          options.barcodeOptions || {}
        );

        // Save barcode image to pass bundle
        const barcodePath = path.join(tempDir, `barcode_${Date.now()}.png`);
        await fs.writeFile(barcodePath, barcodeBuffer);

        logger.info('Barcode added to pass:', {
          format: barcode.format,
          message: barcode.message.substring(0, 50)
        });
      } catch (error) {
        logger.error('Failed to add barcode to pass:', {
          error: error.message,
          barcode: barcode
        });
      }
    }
  }

  /**
   * Get barcode format from PassKit format
   */
  getBarcodeFormat(passkitFormat) {
    const formatMap = {
      'PKBarcodeFormatQR': 'qr',
      'PKBarcodeFormatCode128': 'code128',
      'PKBarcodeFormatCode39': 'code39',
      'PKBarcodeFormatEAN13': 'ean13',
      'PKBarcodeFormatEAN8': 'ean8',
      'PKBarcodeFormatUPCA': 'upc',
      'PKBarcodeFormatPDF417': 'pdf417'
    };
    
    return formatMap[passkitFormat] || 'qr';
  }

  /**
   * Generate manifest.json with SHA-1 hashes
   */
  async generateManifest(tempDir) {
    const manifest = {};
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      if (file === 'manifest.json') continue;
      
      const filePath = path.join(tempDir, file);
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
      manifest[file] = hash;
    }

    return manifest;
  }

  /**
   * Sign the pass bundle
   */
  async signPass(tempDir, passData) {
    try {
      if (this.passSigner) {
        // Use the existing pass signer
        return await this.passSigner.signPassBundle(tempDir);
      } else {
        logger.warn('Pass signer not available, using mock signature for development');
        // Return a mock signature for development
        return Buffer.from('MOCK_SIGNATURE_FOR_DEVELOPMENT');
      }
    } catch (error) {
      logger.warn('Pass signing failed, using mock signature:', error.message);
      // Return a mock signature for development
      return Buffer.from('MOCK_SIGNATURE_FOR_DEVELOPMENT');
    }
  }

  /**
   * Create .pkpass file from pass bundle
   */
  async createPkpassFile(tempDir, outputPath) {
    const zip = new AdmZip();
    
    // Add all files from temp directory
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileBuffer = await fs.readFile(filePath);
      zip.addFile(file, fileBuffer);
    }

    // Write zip file
    await fs.writeFile(outputPath, zip.toBuffer());
  }

  /**
   * Generate unique pass ID
   */
  generatePassId() {
    return `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate serial number
   */
  generateSerialNumber() {
    return `SN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
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
   * Clean up temporary directory
   */
  async cleanupTempDir(tempDir) {
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      logger.warn('Failed to cleanup temp directory:', error.message);
    }
  }

  /**
   * Get export statistics
   */
  async getExportStats() {
    try {
      const files = await fs.readdir(this.exportDir);
      const stats = {
        totalExports: files.length,
        totalSize: 0,
        recentExports: []
      };

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const fileStats = await fs.stat(filePath);
        stats.totalSize += fileStats.size;

        if (fileStats.mtime > Date.now() - 24 * 60 * 60 * 1000) { // Last 24 hours
          stats.recentExports.push({
            file,
            size: fileStats.size,
            created: fileStats.mtime
          });
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get export stats:', error);
      return { totalExports: 0, totalSize: 0, recentExports: [] };
    }
  }

  /**
   * Clean up old exports
   */
  async cleanupOldExports(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const fileStats = await fs.stat(filePath);
        
        if (now - fileStats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      logger.info('Cleaned up old exports:', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old exports:', error);
      return 0;
    }
  }
}

module.exports = PassExportService;
