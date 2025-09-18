const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

const analyticsService = new AnalyticsService();

/**
 * @route POST /api/analytics/track
 * @desc Track an analytics event
 */
router.post('/track', async (req, res) => {
  try {
    const { eventType, eventData } = req.body;
    const userId = req.user?.id || null;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required'
      });
    }

    await analyticsService.trackEvent(eventType, eventData, userId);

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/data
 * @desc Get analytics data for date range
 */
router.get('/data', async (req, res) => {
  try {
    const { startDate, endDate, eventTypes } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const eventTypesArray = eventTypes ? eventTypes.split(',') : [];
    const data = await analyticsService.getAnalyticsData(startDate, endDate, eventTypesArray);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Failed to get analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/reports/:type
 * @desc Generate analytics report
 */
router.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const report = await analyticsService.generateReport(startDate, endDate, type);

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Failed to generate analytics report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics report',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/templates
 * @desc Get template analytics
 */
router.get('/templates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const report = await analyticsService.generateReport(startDate, endDate, 'templates');

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Failed to get template analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/users
 * @desc Get user analytics
 */
router.get('/users', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const report = await analyticsService.generateReport(startDate, endDate, 'users');

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Failed to get user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/performance
 * @desc Get performance analytics
 */
router.get('/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const report = await analyticsService.generateReport(startDate, endDate, 'performance');

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Failed to get performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/analytics/overview
 * @desc Get overview analytics
 */
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const report = await analyticsService.generateReport(startDate, endDate, 'overview');

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error('Failed to get overview analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get overview analytics',
      message: error.message
    });
  }
});

/**
 * @route POST /api/analytics/cleanup
 * @desc Clean up old analytics data
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cleanedCount = await analyticsService.cleanupOldData(daysToKeep);

    res.json({
      success: true,
      cleanedCount,
      message: `Cleaned up ${cleanedCount} files older than ${daysToKeep} days`
    });

  } catch (error) {
    logger.error('Failed to cleanup analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup analytics data',
      message: error.message
    });
  }
});

/**
 * @route POST /api/analytics/track/template-created
 * @desc Track template creation
 */
router.post('/track/template-created', async (req, res) => {
  try {
    const { templateId, templateData } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !templateData) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and data are required'
      });
    }

    await analyticsService.trackTemplateCreated(templateId, userId, templateData);

    res.json({
      success: true,
      message: 'Template creation tracked'
    });

  } catch (error) {
    logger.error('Failed to track template creation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track template creation',
      message: error.message
    });
  }
});

/**
 * @route POST /api/analytics/track/template-viewed
 * @desc Track template view
 */
router.post('/track/template-viewed', async (req, res) => {
  try {
    const { templateId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    await analyticsService.trackTemplateViewed(templateId, userId);

    res.json({
      success: true,
      message: 'Template view tracked'
    });

  } catch (error) {
    logger.error('Failed to track template view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track template view',
      message: error.message
    });
  }
});

/**
 * @route POST /api/analytics/track/pass-generated
 * @desc Track pass generation
 */
router.post('/track/pass-generated', async (req, res) => {
  try {
    const { passId, templateId, passData } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!passId || !templateId || !passData) {
      return res.status(400).json({
        success: false,
        error: 'Pass ID, template ID, and pass data are required'
      });
    }

    await analyticsService.trackPassGenerated(passId, templateId, userId, passData);

    res.json({
      success: true,
      message: 'Pass generation tracked'
    });

  } catch (error) {
    logger.error('Failed to track pass generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track pass generation',
      message: error.message
    });
  }
});

/**
 * @route POST /api/analytics/track/collaboration-session
 * @desc Track collaboration session
 */
router.post('/track/collaboration-session', async (req, res) => {
  try {
    const { templateId, action, sessionData } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and action are required'
      });
    }

    if (action === 'started') {
      await analyticsService.trackCollaborationSessionStarted(templateId, userId, sessionData);
    } else if (action === 'ended') {
      await analyticsService.trackCollaborationSessionEnded(templateId, userId, sessionData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Action must be "started" or "ended"'
      });
    }

    res.json({
      success: true,
      message: `Collaboration session ${action} tracked`
    });

  } catch (error) {
    logger.error('Failed to track collaboration session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track collaboration session',
      message: error.message
    });
  }
});

module.exports = router;
