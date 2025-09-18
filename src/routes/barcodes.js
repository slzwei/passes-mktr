const express = require('express');
const router = express.Router();
const BarcodeService = require('../services/barcodeService');
const logger = require('../utils/logger');

const barcodeService = new BarcodeService();

/**
 * @route GET /api/barcodes/formats
 * @desc Get supported barcode formats
 */
router.get('/formats', (req, res) => {
  try {
    const formats = barcodeService.getSupportedFormats();
    res.json({
      success: true,
      formats
    });
  } catch (error) {
    logger.error('Failed to get barcode formats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get barcode formats'
    });
  }
});

/**
 * @route POST /api/barcodes/generate
 * @desc Generate a barcode
 */
router.post('/generate', async (req, res) => {
  try {
    const { data, format = 'qr', options = {} } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    // Validate barcode data
    const validation = barcodeService.validateBarcodeData(data, format);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid barcode data',
        details: validation
      });
    }

    // Generate barcode
    const barcodeBuffer = await barcodeService.generateBarcode(data, format, options);

    // Return as base64 data URL
    const base64 = barcodeBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    res.json({
      success: true,
      dataUrl,
      format,
      data,
      warnings: validation.warnings
    });

  } catch (error) {
    logger.error('Barcode generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Barcode generation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/barcodes/generate-and-save
 * @desc Generate a barcode and save to file
 */
router.post('/generate-and-save', async (req, res) => {
  try {
    const { data, format = 'qr', fileName, options = {} } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    // Generate filename if not provided
    const finalFileName = fileName || `barcode_${Date.now()}.png`;
    const filePath = `storage/images/barcodes/${finalFileName}`;

    // Generate and save barcode
    const savedPath = await barcodeService.generateAndSaveBarcode(
      data,
      format,
      filePath,
      options
    );

    res.json({
      success: true,
      filePath: savedPath,
      fileName: finalFileName,
      format,
      data
    });

  } catch (error) {
    logger.error('Barcode generation and save failed:', error);
    res.status(500).json({
      success: false,
      error: 'Barcode generation and save failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/barcodes/validate
 * @desc Validate barcode data
 */
router.post('/validate', (req, res) => {
  try {
    const { data, format = 'qr' } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    const validation = barcodeService.validateBarcodeData(data, format);

    res.json({
      success: true,
      validation
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
 * @route GET /api/barcodes/options/:format
 * @desc Get default options for a barcode format
 */
router.get('/options/:format', (req, res) => {
  try {
    const { format } = req.params;
    const options = barcodeService.getDefaultOptions(format);

    if (Object.keys(options).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Format not found'
      });
    }

    res.json({
      success: true,
      format,
      options
    });

  } catch (error) {
    logger.error('Failed to get barcode options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get barcode options'
    });
  }
});

module.exports = router;
