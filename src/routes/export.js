const express = require('express');
const router = express.Router();
const PassExportService = require('../services/passExportService');
const logger = require('../utils/logger');

const exportService = new PassExportService();

/**
 * @route POST /api/export/generate
 * @desc Generate and export a .pkpass file
 */
router.post('/generate', async (req, res) => {
  try {
    const { passData, options = {} } = req.body;

    if (!passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass data is required'
      });
    }

    const exportResult = await exportService.exportPass(passData, options);

    res.json({
      success: true,
      result: exportResult
    });

  } catch (error) {
    logger.error('Pass export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Pass export failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/export/download/:passId
 * @desc Download a .pkpass file
 */
router.get('/download/:passId', async (req, res) => {
  try {
    const { passId } = req.params;
    const filePath = `${exportService.exportDir}/${passId}.pkpass`;

    // Check if file exists
    const fs = require('fs').promises;
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Pass file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${passId}.pkpass"`);

    // Stream the file
    const fsStream = require('fs').createReadStream(filePath);
    fsStream.pipe(res);

  } catch (error) {
    logger.error('Pass download failed:', error);
    res.status(500).json({
      success: false,
      error: 'Pass download failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/export/stats
 * @desc Get export statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await exportService.getExportStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Failed to get export stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get export stats'
    });
  }
});

/**
 * @route POST /api/export/cleanup
 * @desc Clean up old exports
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge } = req.body;
    const cleanedCount = await exportService.cleanupOldExports(maxAge);

    res.json({
      success: true,
      cleanedCount
    });

  } catch (error) {
    logger.error('Export cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Export cleanup failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/export/list
 * @desc List exported passes
 */
router.get('/list', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const fs = require('fs').promises;
    const path = require('path');

    const files = await fs.readdir(exportService.exportDir);
    const passFiles = files
      .filter(file => file.endsWith('.pkpass'))
      .slice(offset, offset + parseInt(limit));

    const passes = await Promise.all(
      passFiles.map(async (file) => {
        const filePath = path.join(exportService.exportDir, file);
        const stats = await fs.stat(filePath);
        return {
          id: file.replace('.pkpass', ''),
          fileName: file,
          size: stats.size,
          created: stats.mtime,
          modified: stats.mtime
        };
      })
    );

    res.json({
      success: true,
      passes,
      total: files.filter(file => file.endsWith('.pkpass')).length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Failed to list exports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list exports'
    });
  }
});

/**
 * @route DELETE /api/export/:passId
 * @desc Delete an exported pass
 */
router.delete('/:passId', async (req, res) => {
  try {
    const { passId } = req.params;
    const filePath = `${exportService.exportDir}/${passId}.pkpass`;

    const fs = require('fs').promises;
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Pass file not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Pass deleted successfully'
    });

  } catch (error) {
    logger.error('Pass deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Pass deletion failed',
      message: error.message
    });
  }
});

module.exports = router;
