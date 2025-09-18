const express = require('express');
const router = express.Router();
const PassValidationService = require('../services/passValidationService');
const logger = require('../utils/logger');

const validationService = new PassValidationService();

/**
 * @route POST /api/validation/validate-pass
 * @desc Validate a pass configuration
 */
router.post('/validate-pass', async (req, res) => {
  try {
    const { passData } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const validationResult = await validationService.validatePass(passData);

    res.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    logger.error('Pass validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Pass validation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/validation/validate-structure
 * @desc Validate pass structure only
 */
router.post('/validate-structure', async (req, res) => {
  try {
    const { passData } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const validationResult = await validationService.validatePassStructure(passData);

    res.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    logger.error('Structure validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Structure validation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/validation/validate-images
 * @desc Validate pass images
 */
router.post('/validate-images', async (req, res) => {
  try {
    const { passData } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const validationResult = await validationService.validateImages(passData);

    res.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    logger.error('Image validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Image validation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/validation/validate-barcodes
 * @desc Validate pass barcodes
 */
router.post('/validate-barcodes', async (req, res) => {
  try {
    const { passData } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const validationResult = await validationService.validateBarcodes(passData);

    res.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    logger.error('Barcode validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Barcode validation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/validation/generate-report
 * @desc Generate validation report
 */
router.post('/generate-report', async (req, res) => {
  try {
    const { passData } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const validationResult = await validationService.validatePass(passData);
    const report = validationService.generateValidationReport(validationResult);

    res.json({
      success: true,
      validation: validationResult,
      report
    });

  } catch (error) {
    logger.error('Report generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Report generation failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/validation/schemas
 * @desc Get validation schemas
 */
router.get('/schemas', (req, res) => {
  try {
    res.json({
      success: true,
      schemas: {
        pass: 'Pass validation schema',
        generic: 'Generic pass validation schema',
        storeCard: 'Store card validation schema',
        field: 'Field validation schema'
      }
    });
  } catch (error) {
    logger.error('Failed to get schemas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schemas'
    });
  }
});

module.exports = router;
