const express = require('express');
const router = express.Router();
const TemplateService = require('../services/templateService');
const logger = require('../utils/logger');

const templateService = new TemplateService();

/**
 * @route POST /api/templates
 * @desc Create a new template
 */
router.post('/', async (req, res) => {
  try {
    const { templateData } = req.body;
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth middleware

    if (!templateData || !templateData.name) {
      return res.status(400).json({
        success: false,
        error: 'Template name is required'
      });
    }

    const template = await templateService.createTemplate(templateData, userId);

    res.status(201).json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('Failed to create template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error.message
    });
  }
});

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const template = await templateService.getTemplate(id, userId);

    res.json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('Failed to get template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updates } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!updates) {
      return res.status(400).json({
        success: false,
        error: 'Updates are required'
      });
    }

    const template = await templateService.updateTemplate(id, updates, userId);

    res.json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('Failed to update template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/templates/:id
 * @desc Delete template
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    await templateService.deleteTemplate(id, userId);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.message
    });
  }
});

/**
 * @route GET /api/templates
 * @desc List templates with filtering
 */
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const userId = req.user?.id || 'anonymous';

    const result = await templateService.listTemplates(filters, userId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Failed to list templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list templates',
      message: error.message
    });
  }
});

/**
 * @route GET /api/templates/:id/versions
 * @desc Get template versions
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const versions = await templateService.getTemplateVersions(id, userId);

    res.json({
      success: true,
      versions
    });

  } catch (error) {
    logger.error('Failed to get template versions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template versions',
      message: error.message
    });
  }
});

/**
 * @route POST /api/templates/:id/comments
 * @desc Add comment to template
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!comment || !comment.content) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    const newComment = await templateService.addComment(id, comment, userId);

    res.status(201).json({
      success: true,
      comment: newComment
    });

  } catch (error) {
    logger.error('Failed to add comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: error.message
    });
  }
});

/**
 * @route GET /api/templates/:id/comments
 * @desc Get template comments
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const comments = await templateService.getTemplateComments(id, userId);

    res.json({
      success: true,
      comments
    });

  } catch (error) {
    logger.error('Failed to get template comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template comments',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/templates/:id/permissions
 * @desc Update template permissions
 */
router.put('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'Permissions are required'
      });
    }

    const template = await templateService.updatePermissions(id, permissions, userId);

    res.json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('Failed to update template permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template permissions',
      message: error.message
    });
  }
});

/**
 * @route GET /api/templates/:id/stats
 * @desc Get template statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const stats = await templateService.getTemplateStats(id, userId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Failed to get template stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template stats',
      message: error.message
    });
  }
});

module.exports = router;
