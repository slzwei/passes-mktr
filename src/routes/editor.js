/**
 * Editor API Routes
 * Handles WYSIWYG editor functionality
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const PassSigner = require('../services/passSigner');
const PassConfigService = require('../services/passConfigService');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize services
const passSigner = new PassSigner();
const configService = new PassConfigService();

/**
 * POST /api/editor/preview
 * Generate real-time preview of pass configuration
 */
router.post('/preview', [
  body('config').isObject().withMessage('Configuration object required'),
  body('passData').isObject().withMessage('Pass data object required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { config, passData } = req.body;

    // Validate configuration
    const validation = configService.validateConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid configuration',
        details: validation.errors
      });
    }

    // Generate preview
    const previewDir = await passSigner.generatePreview(passData, config);
    
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

    // Clean up preview directory
    await fs.promises.rmdir(previewDir, { recursive: true });

    res.json({
      success: true,
      preview: {
        passJson,
        images,
        config
      }
    });

  } catch (error) {
    logger.error('Preview generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

/**
 * POST /api/editor/validate
 * Validate pass configuration
 */
router.post('/validate', [
  body('config').isObject().withMessage('Configuration object required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { config } = req.body;

    // Validate configuration
    const validation = configService.validateConfig(config);
    
    // Additional Apple PassKit validation
    const appleValidation = validateApplePassKit(config);
    
    res.json({
      success: true,
      validation: {
        isValid: validation.isValid && appleValidation.isValid,
        errors: [...validation.errors, ...appleValidation.errors],
        warnings: appleValidation.warnings
      }
    });

  } catch (error) {
    logger.error('Validation failed:', error);
    res.status(500).json({
      error: 'Failed to validate configuration',
      message: error.message
    });
  }
});

/**
 * GET /api/editor/templates
 * Get available field templates
 */
router.get('/templates', (req, res) => {
  try {
    const templates = configService.getAllFieldTemplates();
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Template retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve templates',
      message: error.message
    });
  }
});

/**
 * GET /api/editor/templates/:fieldType
 * Get templates for specific field type
 */
router.get('/templates/:fieldType', (req, res) => {
  try {
    const { fieldType } = req.params;
    const templates = configService.getFieldTemplates(fieldType);
    
    if (Object.keys(templates).length === 0) {
      return res.status(404).json({
        error: 'Field type not found',
        fieldType
      });
    }
    
    res.json({
      success: true,
      fieldType,
      templates
    });

  } catch (error) {
    logger.error('Template retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve templates',
      message: error.message
    });
  }
});

/**
 * POST /api/editor/config/default
 * Get default configuration
 */
router.post('/config/default', [
  body('passData').isObject().withMessage('Pass data object required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { passData } = req.body;
    const defaultConfig = configService.getLoyaltyCardConfig(passData);
    
    res.json({
      success: true,
      config: defaultConfig
    });

  } catch (error) {
    logger.error('Default config generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate default configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/editor/config/merge
 * Merge configuration with defaults
 */
router.post('/config/merge', [
  body('userConfig').isObject().withMessage('User configuration object required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userConfig } = req.body;
    const mergedConfig = configService.mergeWithDefaults(userConfig);
    
    res.json({
      success: true,
      config: mergedConfig
    });

  } catch (error) {
    logger.error('Config merge failed:', error);
    res.status(500).json({
      error: 'Failed to merge configuration',
      message: error.message
    });
  }
});

/**
 * Validate Apple PassKit specific requirements
 */
function validateApplePassKit(config) {
  const errors = [];
  const warnings = [];

  // Validate field limits
  if (config.fields) {
    Object.entries(config.fields).forEach(([fieldType, fields]) => {
      const limits = {
        header: 2,
        primary: 2,
        secondary: 4,
        auxiliary: 4,
        back: -1 // unlimited
      };

      if (limits[fieldType] > 0 && fields.length > limits[fieldType]) {
        errors.push(`${fieldType} fields exceed Apple limit of ${limits[fieldType]}`);
      }
    });
  }

  // Validate color format
  if (config.colors) {
    Object.entries(config.colors).forEach(([colorType, color]) => {
      if (color && !color.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
        errors.push(`Invalid ${colorType} color format. Use rgb(r, g, b) format.`);
      }
    });
  }

  // Warnings for best practices
  if (config.fields && config.fields.primary && config.fields.primary.length === 0) {
    warnings.push('Consider adding primary fields for better user experience');
  }

  if (config.fields && config.fields.header && config.fields.header.length === 0) {
    warnings.push('Consider adding header fields for campaign identification');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = router;
