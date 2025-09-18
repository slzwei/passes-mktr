const express = require('express');
const router = express.Router();
const DynamicStampService = require('../services/dynamicStampService');
const PassSigner = require('../services/passSigner');
const logger = require('../utils/logger');

const dynamicStampService = new DynamicStampService();
const passSigner = new PassSigner();

/**
 * Update stamps for a specific pass
 * POST /api/stamp-updates/:passId
 */
router.post('/:passId', async (req, res) => {
  try {
    const { passId } = req.params;
    const { stampsEarned, baseStripPath, stampIconPath } = req.body;

    // Validate input
    if (typeof stampsEarned !== 'number' || stampsEarned < 0) {
      return res.status(400).json({
        success: false,
        error: 'stampsEarned must be a non-negative number'
      });
    }

    if (!baseStripPath) {
      return res.status(400).json({
        success: false,
        error: 'baseStripPath is required'
      });
    }

    // Update pass with new stamp status
    const updatedStrips = await dynamicStampService.updatePassStamps(
      passId,
      stampsEarned,
      baseStripPath,
      stampIconPath
    );

    logger.info(`Pass ${passId} stamps updated to ${stampsEarned}`);

    res.json({
      success: true,
      passId,
      stampsEarned,
      updatedStrips: {
        strip: updatedStrips.strip,
        strip2x: updatedStrips.strip2x,
        strip3x: updatedStrips.strip3x
      },
      message: `Pass updated with ${stampsEarned} stamps earned`
    });

  } catch (error) {
    logger.error('Failed to update pass stamps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pass stamps',
      details: error.message
    });
  }
});

/**
 * Award a stamp to a pass
 * POST /api/stamp-updates/:passId/award
 */
router.post('/:passId/award', async (req, res) => {
  try {
    const { passId } = req.params;
    const { baseStripPath, stampIconPath } = req.body;

    // Get current pass data
    const passData = await dynamicStampService.getPassData(passId);
    const currentStampsEarned = passData.stampsEarned || 0;
    const stampsRequired = passData.stampsRequired || 10;

    // Check if pass is already complete
    if (currentStampsEarned >= stampsRequired) {
      return res.status(400).json({
        success: false,
        error: 'Pass is already complete',
        stampsEarned: currentStampsEarned,
        stampsRequired
      });
    }

    // Award one stamp
    const newStampsEarned = currentStampsEarned + 1;
    const isComplete = newStampsEarned >= stampsRequired;

    // Update pass with new stamp status
    const updatedStrips = await dynamicStampService.updatePassStamps(
      passId,
      newStampsEarned,
      baseStripPath,
      stampIconPath
    );

    logger.info(`Pass ${passId} awarded stamp: ${newStampsEarned}/${stampsRequired}`);

    res.json({
      success: true,
      passId,
      stampsEarned: newStampsEarned,
      stampsRequired,
      isComplete,
      updatedStrips: {
        strip: updatedStrips.strip,
        strip2x: updatedStrips.strip2x,
        strip3x: updatedStrips.strip3x
      },
      message: isComplete 
        ? `Pass completed! ${newStampsEarned}/${stampsRequired} stamps earned`
        : `Stamp awarded! ${newStampsEarned}/${stampsRequired} stamps earned`
    });

  } catch (error) {
    logger.error('Failed to award stamp:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award stamp',
      details: error.message
    });
  }
});

/**
 * Get current stamp status for a pass
 * GET /api/stamp-updates/:passId
 */
router.get('/:passId', async (req, res) => {
  try {
    const { passId } = req.params;

    // Get current pass data
    const passData = await dynamicStampService.getPassData(passId);

    res.json({
      success: true,
      passId,
      stampsEarned: passData.stampsEarned || 0,
      stampsRequired: passData.stampsRequired || 10,
      isComplete: (passData.stampsEarned || 0) >= (passData.stampsRequired || 10)
    });

  } catch (error) {
    logger.error('Failed to get pass stamp status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pass stamp status',
      details: error.message
    });
  }
});

/**
 * Clean up old dynamic stamp files
 * POST /api/stamp-updates/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours

    await dynamicStampService.cleanupOldFiles(maxAge);

    res.json({
      success: true,
      message: 'Old dynamic stamp files cleaned up',
      maxAge
    });

  } catch (error) {
    logger.error('Failed to cleanup old files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old files',
      details: error.message
    });
  }
});

module.exports = router;
