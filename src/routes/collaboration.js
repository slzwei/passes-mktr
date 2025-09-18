const express = require('express');
const router = express.Router();
const CollaborationService = require('../services/collaborationService');
const logger = require('../utils/logger');

const collaborationService = new CollaborationService();

/**
 * @route POST /api/collaboration/join
 * @desc Join a collaboration session
 */
router.post('/join', async (req, res) => {
  try {
    const { templateId, userInfo } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const sessionInfo = collaborationService.joinSession(templateId, userId, userInfo);

    res.json({
      success: true,
      session: sessionInfo
    });

  } catch (error) {
    logger.error('Failed to join collaboration session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join collaboration session',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/leave
 * @desc Leave a collaboration session
 */
router.post('/leave', async (req, res) => {
  try {
    const { templateId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const leaveInfo = collaborationService.leaveSession(templateId, userId);

    res.json({
      success: true,
      leave: leaveInfo
    });

  } catch (error) {
    logger.error('Failed to leave collaboration session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave collaboration session',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/cursor
 * @desc Update cursor position
 */
router.post('/cursor', async (req, res) => {
  try {
    const { templateId, cursor } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !cursor) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and cursor data are required'
      });
    }

    const cursorInfo = collaborationService.updateCursor(templateId, userId, cursor);

    res.json({
      success: true,
      cursor: cursorInfo
    });

  } catch (error) {
    logger.error('Failed to update cursor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cursor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/:templateId/cursors
 * @desc Get active cursors for template
 */
router.get('/:templateId/cursors', async (req, res) => {
  try {
    const { templateId } = req.params;

    const cursors = collaborationService.getActiveCursors(templateId);

    res.json({
      success: true,
      cursors
    });

  } catch (error) {
    logger.error('Failed to get active cursors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active cursors',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/change
 * @desc Apply a change to template
 */
router.post('/change', async (req, res) => {
  try {
    const { templateId, change } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !change) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and change data are required'
      });
    }

    const changeInfo = collaborationService.applyChange(templateId, userId, change);

    res.json({
      success: true,
      change: changeInfo
    });

  } catch (error) {
    logger.error('Failed to apply change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply change',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/:templateId/changes
 * @desc Get recent changes for template
 */
router.get('/:templateId/changes', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { limit = 50 } = req.query;

    const changes = collaborationService.getRecentChanges(templateId, parseInt(limit));

    res.json({
      success: true,
      changes
    });

  } catch (error) {
    logger.error('Failed to get recent changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent changes',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/lock
 * @desc Lock a field for editing
 */
router.post('/lock', async (req, res) => {
  try {
    const { templateId, field } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !field) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and field are required'
      });
    }

    const lockInfo = collaborationService.lockField(templateId, userId, field);

    res.json({
      success: true,
      lock: lockInfo
    });

  } catch (error) {
    logger.error('Failed to lock field:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock field',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/unlock
 * @desc Unlock a field
 */
router.post('/unlock', async (req, res) => {
  try {
    const { templateId, field } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!templateId || !field) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and field are required'
      });
    }

    const unlockInfo = collaborationService.unlockField(templateId, userId, field);

    res.json({
      success: true,
      unlock: unlockInfo
    });

  } catch (error) {
    logger.error('Failed to unlock field:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock field',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/:templateId/locks
 * @desc Get locked fields for template
 */
router.get('/:templateId/locks', async (req, res) => {
  try {
    const { templateId } = req.params;

    const locks = collaborationService.getLockedFields(templateId);

    res.json({
      success: true,
      locks
    });

  } catch (error) {
    logger.error('Failed to get locked fields:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get locked fields',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/:templateId/users
 * @desc Get active users for template
 */
router.get('/:templateId/users', async (req, res) => {
  try {
    const { templateId } = req.params;

    const users = collaborationService.getActiveUsers(templateId);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    logger.error('Failed to get active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active users',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/:templateId/status
 * @desc Get collaboration status for template
 */
router.get('/:templateId/status', async (req, res) => {
  try {
    const { templateId } = req.params;

    const status = collaborationService.getCollaborationStatus(templateId);

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Failed to get collaboration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collaboration status',
      message: error.message
    });
  }
});

/**
 * @route GET /api/collaboration/user/:userId/sessions
 * @desc Get user's active sessions
 */
router.get('/user/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = collaborationService.getUserSessions(userId);

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    logger.error('Failed to get user sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user sessions',
      message: error.message
    });
  }
});

/**
 * @route POST /api/collaboration/cleanup
 * @desc Clean up inactive sessions
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { timeout = 300000 } = req.body; // 5 minutes default

    const cleanedCount = collaborationService.cleanupInactiveSessions(timeout);

    res.json({
      success: true,
      cleanedCount
    });

  } catch (error) {
    logger.error('Failed to cleanup inactive sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup inactive sessions',
      message: error.message
    });
  }
});

module.exports = router;
