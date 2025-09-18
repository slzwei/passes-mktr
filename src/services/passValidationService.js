const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const BarcodeService = require('./barcodeService');

class PassValidationService {
  constructor() {
    this.barcodeService = new BarcodeService();
    this.setupValidationSchemas();
  }

  setupValidationSchemas() {
    // Field validation schema (defined first)
    this.fieldSchema = Joi.object({
      key: Joi.string().required(),
      label: Joi.string().optional(),
      value: Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.date()
      ).required(),
      dateStyle: Joi.string().valid('PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull').optional(),
      timeStyle: Joi.string().valid('PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull').optional(),
      isRelative: Joi.boolean().optional(),
      changeMessage: Joi.string().optional(),
      textAlignment: Joi.string().valid('PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural').optional()
    });

    // Base pass validation schema
    this.passSchema = Joi.object({
      formatVersion: Joi.number().valid(1).required(),
      passTypeIdentifier: Joi.string().required(),
      serialNumber: Joi.string().required(),
      teamIdentifier: Joi.string().required(),
      organizationName: Joi.string().required(),
      description: Joi.string().required(),
      logoText: Joi.string().optional(),
      foregroundColor: Joi.string().pattern(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
      backgroundColor: Joi.string().pattern(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
      labelColor: Joi.string().pattern(/^rgb\(\d+,\s*\d+,\s*\d+\)$/).optional(),
      webServiceURL: Joi.string().uri().optional(),
      authenticationToken: Joi.string().optional(),
      barcode: Joi.object({
        message: Joi.string().required(),
        format: Joi.string().valid(
          'PKBarcodeFormatQR',
          'PKBarcodeFormatCode128',
          'PKBarcodeFormatCode39',
          'PKBarcodeFormatEAN13',
          'PKBarcodeFormatEAN8',
          'PKBarcodeFormatUPCA',
          'PKBarcodeFormatPDF417'
        ).required(),
        messageEncoding: Joi.string().valid('iso-8859-1', 'utf-8').optional(),
        altText: Joi.string().optional()
      }).optional(),
      barcodes: Joi.array().items(Joi.object({
        message: Joi.string().required(),
        format: Joi.string().valid(
          'PKBarcodeFormatQR',
          'PKBarcodeFormatCode128',
          'PKBarcodeFormatCode39',
          'PKBarcodeFormatEAN13',
          'PKBarcodeFormatEAN8',
          'PKBarcodeFormatUPCA',
          'PKBarcodeFormatPDF417'
        ).required(),
        messageEncoding: Joi.string().valid('iso-8859-1', 'utf-8').optional(),
        altText: Joi.string().optional()
      })).optional(),
      relevantDate: Joi.string().isoDate().optional(),
      expirationDate: Joi.string().isoDate().optional(),
      voided: Joi.boolean().optional(),
      locations: Joi.array().items(Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        altitude: Joi.number().optional(),
        relevantText: Joi.string().optional()
      })).optional(),
      maxDistance: Joi.number().positive().optional(),
      nfc: Joi.object({
        message: Joi.string().required(),
        encryptionPublicKey: Joi.string().optional()
      }).optional()
    });

    // Generic pass specific schema
    this.genericPassSchema = this.passSchema.keys({
      generic: Joi.object({
        primaryFields: Joi.array().items(this.fieldSchema).optional(),
        secondaryFields: Joi.array().items(this.fieldSchema).optional(),
        auxiliaryFields: Joi.array().items(this.fieldSchema).optional(),
        backFields: Joi.array().items(this.fieldSchema).optional(),
        headerFields: Joi.array().items(this.fieldSchema).optional()
      }).required()
    });

    // Store card specific schema
    this.storeCardSchema = this.passSchema.keys({
      storeCard: Joi.object({
        primaryFields: Joi.array().items(this.fieldSchema).optional(),
        secondaryFields: Joi.array().items(this.fieldSchema).optional(),
        auxiliaryFields: Joi.array().items(this.fieldSchema).optional(),
        backFields: Joi.array().items(this.fieldSchema).optional(),
        headerFields: Joi.array().items(this.fieldSchema).optional()
      }).required()
    });
  }

  /**
   * Validate a complete pass configuration
   * @param {Object} passData - The pass data to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validatePass(passData) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Basic structure validation
      const structureValidation = await this.validatePassStructure(passData);
      result.details.structure = structureValidation;

      if (!structureValidation.valid) {
        result.errors.push(...structureValidation.errors);
        result.warnings.push(...structureValidation.warnings);
      }

      // Image validation
      const imageValidation = await this.validateImages(passData);
      result.details.images = imageValidation;

      if (!imageValidation.valid) {
        result.errors.push(...imageValidation.errors);
        result.warnings.push(...imageValidation.warnings);
      }

      // Barcode validation
      const barcodeValidation = await this.validateBarcodes(passData);
      result.details.barcodes = barcodeValidation;

      if (!barcodeValidation.valid) {
        result.errors.push(...barcodeValidation.errors);
        result.warnings.push(...barcodeValidation.warnings);
      }

      // Apple PassKit specific validation
      const passkitValidation = await this.validatePassKitRequirements(passData);
      result.details.passkit = passkitValidation;

      if (!passkitValidation.valid) {
        result.errors.push(...passkitValidation.errors);
        result.warnings.push(...passkitValidation.warnings);
      }

      // Overall validation result
      result.valid = result.errors.length === 0;

      logger.info('Pass validation completed:', {
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;
    } catch (error) {
      logger.error('Pass validation failed:', error);
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Validate pass structure and schema
   */
  async validatePassStructure(passData) {
    const result = { valid: false, errors: [], warnings: [] };

    try {
      // Determine pass type and use appropriate schema
      let schema;
      if (passData.generic) {
        schema = this.genericPassSchema;
      } else if (passData.storeCard) {
        schema = this.storeCardSchema;
      } else {
        result.errors.push('Pass must specify either generic or storeCard type');
        return result;
      }

      // Validate against schema
      const { error, value } = schema.validate(passData, { abortEarly: false });

      if (error) {
        result.errors.push(...error.details.map(detail => detail.message));
      } else {
        result.valid = true;
      }

      // Additional business logic validation
      if (passData.generic) {
        const genericValidation = this.validateGenericPassFields(passData.generic);
        if (!genericValidation.valid) {
          result.errors.push(...genericValidation.errors);
        }
      }

      if (passData.storeCard) {
        const storeCardValidation = this.validateStoreCardFields(passData.storeCard);
        if (!storeCardValidation.valid) {
          result.errors.push(...storeCardValidation.errors);
        }
      }

    } catch (error) {
      result.errors.push(`Structure validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate generic pass fields
   */
  validateGenericPassFields(genericData) {
    const result = { valid: true, errors: [] };

    // Check for required fields
    const hasPrimaryFields = genericData.primaryFields && genericData.primaryFields.length > 0;
    const hasSecondaryFields = genericData.secondaryFields && genericData.secondaryFields.length > 0;

    if (!hasPrimaryFields && !hasSecondaryFields) {
      result.errors.push('Generic pass must have at least primary or secondary fields');
      result.valid = false;
    }

    // Validate field uniqueness
    const allFields = [
      ...(genericData.primaryFields || []),
      ...(genericData.secondaryFields || []),
      ...(genericData.auxiliaryFields || []),
      ...(genericData.backFields || []),
      ...(genericData.headerFields || [])
    ];

    const fieldKeys = allFields.map(field => field.key);
    const uniqueKeys = new Set(fieldKeys);
    if (fieldKeys.length !== uniqueKeys.size) {
      result.errors.push('Field keys must be unique across all field arrays');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate store card fields
   */
  validateStoreCardFields(storeCardData) {
    const result = { valid: true, errors: [] };

    // Store card validation logic
    const hasPrimaryFields = storeCardData.primaryFields && storeCardData.primaryFields.length > 0;
    const hasSecondaryFields = storeCardData.secondaryFields && storeCardData.secondaryFields.length > 0;

    if (!hasPrimaryFields && !hasSecondaryFields) {
      result.errors.push('Store card must have at least primary or secondary fields');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate pass images
   */
  async validateImages(passData) {
    const result = { valid: true, errors: [], warnings: [] };
    const requiredImages = ['icon', 'logo'];
    const optionalImages = ['background', 'strip', 'thumbnail'];

    try {
      // Check for required images
      for (const imageType of requiredImages) {
        const imagePath = this.getImagePath(passData, imageType);
        if (!imagePath) {
          result.errors.push(`Required image missing: ${imageType}`);
          result.valid = false;
        } else {
          const imageValidation = await this.validateImageFile(imagePath, imageType);
          if (!imageValidation.valid) {
            result.errors.push(...imageValidation.errors);
            result.valid = false;
          }
        }
      }

      // Check optional images
      for (const imageType of optionalImages) {
        const imagePath = this.getImagePath(passData, imageType);
        if (imagePath) {
          const imageValidation = await this.validateImageFile(imagePath, imageType);
          if (!imageValidation.valid) {
            result.warnings.push(...imageValidation.errors);
          }
        }
      }

    } catch (error) {
      result.errors.push(`Image validation error: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Get image path from pass data
   */
  getImagePath(passData, imageType) {
    // This would typically check the pass bundle structure
    // For now, we'll assume images are in a standard location
    return passData.images && passData.images[imageType];
  }

  /**
   * Validate individual image file
   */
  async validateImageFile(imagePath, imageType) {
    const result = { valid: true, errors: [] };

    try {
      const stats = await fs.stat(imagePath);
      
      // Check file size (max 1MB for images)
      if (stats.size > 1024 * 1024) {
        result.errors.push(`${imageType} image is too large (max 1MB)`);
        result.valid = false;
      }

      // Check file extension
      const ext = path.extname(imagePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        result.errors.push(`${imageType} image must be PNG or JPEG format`);
        result.valid = false;
      }

      // Additional image-specific validation could be added here
      // (e.g., checking dimensions, color space, etc.)

    } catch (error) {
      result.errors.push(`Cannot access ${imageType} image: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate barcodes
   */
  async validateBarcodes(passData) {
    const result = { valid: true, errors: [], warnings: [] };

    try {
      const barcodes = [];
      
      // Check single barcode
      if (passData.barcode) {
        barcodes.push(passData.barcode);
      }
      
      // Check multiple barcodes
      if (passData.barcodes && Array.isArray(passData.barcodes)) {
        barcodes.push(...passData.barcodes);
      }

      if (barcodes.length === 0) {
        result.warnings.push('No barcodes specified');
        return result;
      }

      // Validate each barcode
      for (const barcode of barcodes) {
        const barcodeValidation = this.barcodeService.validateBarcodeData(
          barcode.message,
          this.getBarcodeFormat(barcode.format)
        );

        if (!barcodeValidation.valid) {
          result.errors.push(...barcodeValidation.errors);
          result.valid = false;
        }

        if (barcodeValidation.warnings.length > 0) {
          result.warnings.push(...barcodeValidation.warnings);
        }
      }

    } catch (error) {
      result.errors.push(`Barcode validation error: ${error.message}`);
      result.valid = false;
    }

    return result;
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
   * Validate Apple PassKit specific requirements
   */
  async validatePassKitRequirements(passData) {
    const result = { valid: true, errors: [], warnings: [] };

    try {
      // Check required fields
      const requiredFields = [
        'formatVersion',
        'passTypeIdentifier',
        'serialNumber',
        'teamIdentifier',
        'organizationName',
        'description'
      ];

      for (const field of requiredFields) {
        if (!passData[field]) {
          result.errors.push(`Required field missing: ${field}`);
          result.valid = false;
        }
      }

      // Check format version
      if (passData.formatVersion !== 1) {
        result.errors.push('Format version must be 1');
        result.valid = false;
      }

      // Check pass type identifier format
      if (passData.passTypeIdentifier && !/^pass\./.test(passData.passTypeIdentifier)) {
        result.warnings.push('Pass type identifier should start with "pass."');
      }

      // Check team identifier format
      if (passData.teamIdentifier && !/^[A-Z0-9]{10}$/.test(passData.teamIdentifier)) {
        result.warnings.push('Team identifier should be 10 alphanumeric characters');
      }

      // Check date formats
      if (passData.relevantDate && !this.isValidISODate(passData.relevantDate)) {
        result.errors.push('Relevant date must be in ISO 8601 format');
        result.valid = false;
      }

      if (passData.expirationDate && !this.isValidISODate(passData.expirationDate)) {
        result.errors.push('Expiration date must be in ISO 8601 format');
        result.valid = false;
      }

      // Check color formats
      const colorFields = ['foregroundColor', 'backgroundColor', 'labelColor'];
      for (const field of colorFields) {
        if (passData[field] && !this.isValidRGBColor(passData[field])) {
          result.errors.push(`${field} must be in RGB format (e.g., "rgb(255, 0, 0)")`);
          result.valid = false;
        }
      }

    } catch (error) {
      result.errors.push(`PassKit validation error: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Check if date is valid ISO 8601 format
   */
  isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString();
  }

  /**
   * Check if color is valid RGB format
   */
  isValidRGBColor(colorString) {
    return /^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(colorString);
  }

  /**
   * Generate validation report
   * @param {Object} validationResult - The validation result
   * @returns {string} - Formatted validation report
   */
  generateValidationReport(validationResult) {
    let report = 'Pass Validation Report\n';
    report += '========================\n\n';

    report += `Overall Status: ${validationResult.valid ? 'VALID' : 'INVALID'}\n\n`;

    if (validationResult.errors.length > 0) {
      report += 'Errors:\n';
      validationResult.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }

    if (validationResult.warnings.length > 0) {
      report += 'Warnings:\n';
      validationResult.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    // Add detailed section reports
    Object.entries(validationResult.details).forEach(([section, details]) => {
      report += `${section.toUpperCase()} Validation:\n`;
      report += `Status: ${details.valid ? 'PASS' : 'FAIL'}\n`;
      if (details.errors && details.errors.length > 0) {
        report += 'Errors:\n';
        details.errors.forEach((error, index) => {
          report += `  ${index + 1}. ${error}\n`;
        });
      }
      if (details.warnings && details.warnings.length > 0) {
        report += 'Warnings:\n';
        details.warnings.forEach((warning, index) => {
          report += `  ${index + 1}. ${warning}\n`;
        });
      }
      report += '\n';
    });

    return report;
  }
}

module.exports = PassValidationService;
