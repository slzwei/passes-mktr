const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class BarcodeService {
  constructor() {
    this.supportedFormats = {
      qr: 'QR Code',
      code128: 'Code 128',
      code39: 'Code 39',
      ean13: 'EAN-13',
      ean8: 'EAN-8',
      upc: 'UPC-A',
      pdf417: 'PDF417'
    };
    
    this.defaultOptions = {
      qr: {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      },
      code128: {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      },
      pdf417: {
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      }
    };
  }

  /**
   * Generate a barcode image
   * @param {string} data - The data to encode
   * @param {string} format - The barcode format (qr, code128, etc.)
   * @param {Object} options - Custom options for the barcode
   * @returns {Promise<Buffer>} - The generated barcode image buffer
   */
  async generateBarcode(data, format = 'qr', options = {}) {
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Data is required and must be a string');
      }

      if (!this.supportedFormats[format]) {
        throw new Error(`Unsupported barcode format: ${format}`);
      }

      const mergedOptions = { ...this.defaultOptions[format], ...options };
      
      switch (format) {
        case 'qr':
          return await this.generateQRCode(data, mergedOptions);
        case 'code128':
        case 'code39':
        case 'ean13':
        case 'ean8':
        case 'upc':
          return await this.generateLinearBarcode(data, format, mergedOptions);
      case 'pdf417':
        throw new Error('PDF417 barcode format not yet supported');
        default:
          throw new Error(`Barcode generation not implemented for format: ${format}`);
      }
    } catch (error) {
      logger.error('Barcode generation failed:', {
        error: error.message,
        data: data.substring(0, 100),
        format,
        options
      });
      throw error;
    }
  }

  /**
   * Generate QR Code
   */
  async generateQRCode(data, options) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: options.type || 'png',
        quality: options.quality || 0.92,
        margin: options.margin || 1,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: options.width || 200,
        height: options.height || 200
      };

      const qrDataURL = await QRCode.toDataURL(data, qrOptions);
      const base64Data = qrDataURL.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      logger.error('QR Code generation failed:', error);
      throw new Error(`QR Code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate linear barcode (Code128, Code39, etc.)
   */
  async generateLinearBarcode(data, format, options) {
    try {
      const canvas = createCanvas(options.width || 200, options.height || 100);
      
      const barcodeOptions = {
        format: format.toUpperCase(),
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 20,
        margin: options.margin || 10,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000',
        textAlign: options.textAlign || 'center',
        textPosition: options.textPosition || 'bottom',
        textMargin: options.textMargin || 2
      };

      JsBarcode(canvas, data, barcodeOptions);
      
      return canvas.toBuffer('image/png');
    } catch (error) {
      logger.error('Linear barcode generation failed:', error);
      throw new Error(`Linear barcode generation failed: ${error.message}`);
    }
  }

  /**
   * Generate PDF417 barcode
   */
  async generatePDF417(data, options) {
    try {
      const canvas = createCanvas(options.width || 200, options.height || 100);
      
      const barcodeOptions = {
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: options.fontSize || 20,
        margin: options.margin || 10,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000'
      };

      // PDF417 requires different syntax for JsBarcode
      JsBarcode(canvas, data, {
        format: 'PDF417',
        ...barcodeOptions
      });
      
      return canvas.toBuffer('image/png');
    } catch (error) {
      logger.error('PDF417 barcode generation failed:', error);
      throw new Error(`PDF417 barcode generation failed: ${error.message}`);
    }
  }

  /**
   * Generate barcode and save to file
   * @param {string} data - The data to encode
   * @param {string} format - The barcode format
   * @param {string} filePath - The output file path
   * @param {Object} options - Custom options
   * @returns {Promise<string>} - The saved file path
   */
  async generateAndSaveBarcode(data, format, filePath, options = {}) {
    try {
      const barcodeBuffer = await this.generateBarcode(data, format, options);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Save file
      await fs.writeFile(filePath, barcodeBuffer);
      
      logger.info('Barcode saved successfully:', {
        filePath,
        format,
        dataLength: data.length
      });
      
      return filePath;
    } catch (error) {
      logger.error('Failed to save barcode:', {
        error: error.message,
        filePath,
        format
      });
      throw error;
    }
  }

  /**
   * Generate barcode for Apple Wallet pass
   * @param {Object} passData - The pass data
   * @param {Object} barcodeConfig - Barcode configuration
   * @returns {Promise<Object>} - Barcode data for pass.json
   */
  async generatePassBarcode(passData, barcodeConfig) {
    try {
      const {
        format = 'qr',
        message = passData.serialNumber || passData.id,
        altText = 'Barcode',
        options = {}
      } = barcodeConfig;

      // Generate barcode image
      const barcodeBuffer = await this.generateBarcode(message, format, options);
      
      // Save to storage
      const fileName = `barcode_${Date.now()}.png`;
      const filePath = path.join(process.cwd(), 'storage', 'images', 'barcodes', fileName);
      await this.generateAndSaveBarcode(message, format, filePath, options);

      // Return barcode configuration for pass.json
      return {
        message,
        format: this.getPassKitFormat(format),
        messageEncoding: 'iso-8859-1',
        altText,
        // Note: In a real implementation, you'd need to include the image in the pass bundle
        // For now, we'll return the configuration
        imagePath: filePath
      };
    } catch (error) {
      logger.error('Pass barcode generation failed:', error);
      throw error;
    }
  }

  /**
   * Convert internal format to PassKit format
   */
  getPassKitFormat(format) {
    const formatMap = {
      'qr': 'PKBarcodeFormatQR',
      'code128': 'PKBarcodeFormatCode128',
      'code39': 'PKBarcodeFormatCode39',
      'ean13': 'PKBarcodeFormatEAN13',
      'ean8': 'PKBarcodeFormatEAN8',
      'upc': 'PKBarcodeFormatUPCA',
      'pdf417': 'PKBarcodeFormatPDF417'
    };
    
    return formatMap[format] || 'PKBarcodeFormatQR';
  }

  /**
   * Validate barcode data
   * @param {string} data - The data to validate
   * @param {string} format - The barcode format
   * @returns {Object} - Validation result
   */
  validateBarcodeData(data, format) {
    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'string') {
      errors.push('Data is required and must be a string');
      return { valid: false, errors, warnings };
    }

    // Format-specific validation
    switch (format) {
      case 'qr':
        if (data.length > 2953) {
          warnings.push('QR code data is very long and may not scan reliably');
        }
        break;
      case 'code128':
        if (!/^[\x00-\x7F]*$/.test(data)) {
          errors.push('Code128 only supports ASCII characters');
        }
        break;
      case 'code39':
        if (!/^[A-Z0-9\-\.\s\$\/\+\%]*$/.test(data)) {
          errors.push('Code39 only supports uppercase letters, numbers, and specific symbols');
        }
        break;
      case 'ean13':
        if (!/^\d{13}$/.test(data)) {
          warnings.push('EAN-13 should be exactly 13 digits for best results');
        }
        break;
      case 'ean8':
        if (!/^\d{8}$/.test(data)) {
          warnings.push('EAN-8 should be exactly 8 digits for best results');
        }
        break;
      case 'upc':
        if (!/^\d{12}$/.test(data)) {
          warnings.push('UPC-A should be exactly 12 digits for best results');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get supported barcode formats
   * @returns {Object} - Supported formats
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }

  /**
   * Get default options for a format
   * @param {string} format - The barcode format
   * @returns {Object} - Default options
   */
  getDefaultOptions(format) {
    return this.defaultOptions[format] || {};
  }
}

module.exports = BarcodeService;
