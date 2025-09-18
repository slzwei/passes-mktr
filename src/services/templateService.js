const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class TemplateService {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'storage', 'templates');
    this.versionsDir = path.join(process.cwd(), 'storage', 'template-versions');
    this.commentsDir = path.join(process.cwd(), 'storage', 'template-comments');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
      await fs.mkdir(this.versionsDir, { recursive: true });
      await fs.mkdir(this.commentsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize template directories:', error);
    }
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template configuration
   * @param {string} userId - User creating the template
   * @returns {Promise<Object>} - Created template
   */
  async createTemplate(templateData, userId) {
    try {
      const templateId = uuidv4();
      const now = new Date().toISOString();

      const template = {
        id: templateId,
        name: templateData.name,
        description: templateData.description || '',
        category: templateData.category || 'general',
        passType: templateData.passType || 'generic',
        config: templateData.config,
        metadata: {
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
          version: 1,
          status: 'draft',
          tags: templateData.tags || [],
          isPublic: templateData.isPublic || false,
          teamId: templateData.teamId || null
        },
        permissions: {
          owner: userId,
          editors: [],
          viewers: [],
          collaborators: []
        },
        stats: {
          views: 0,
          downloads: 0,
          uses: 0,
          lastUsed: null
        }
      };

      // Save template
      const templatePath = path.join(this.templatesDir, `${templateId}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

      // Create initial version
      await this.createVersion(templateId, template.config, userId, 'Initial version');

      logger.info('Template created successfully:', {
        templateId,
        name: template.name,
        userId
      });

      return template;
    } catch (error) {
      logger.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @param {string} userId - User requesting the template
   * @returns {Promise<Object>} - Template data
   */
  async getTemplate(templateId, userId) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateId}.json`);
      const templateData = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(templateData);

      // Check permissions
      if (!this.hasPermission(template, userId, 'view')) {
        throw new Error('Insufficient permissions to view template');
      }

      // Increment view count
      template.stats.views++;
      await this.updateTemplate(templateId, { stats: template.stats }, userId);

      return template;
    } catch (error) {
      logger.error('Failed to get template:', error);
      throw error;
    }
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} - Updated template
   */
  async updateTemplate(templateId, updates, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);

      // Check permissions
      if (!this.hasPermission(template, userId, 'edit')) {
        throw new Error('Insufficient permissions to edit template');
      }

      // Update template
      const updatedTemplate = {
        ...template,
        ...updates,
        metadata: {
          ...template.metadata,
          ...updates.metadata,
          updatedAt: new Date().toISOString(),
          version: template.metadata.version + 1
        }
      };

      // Save updated template
      const templatePath = path.join(this.templatesDir, `${templateId}.json`);
      await fs.writeFile(templatePath, JSON.stringify(updatedTemplate, null, 2));

      // Create version if config changed
      if (updates.config) {
        await this.createVersion(templateId, updates.config, userId, updates.versionMessage || 'Template updated');
      }

      logger.info('Template updated successfully:', {
        templateId,
        userId,
        version: updatedTemplate.metadata.version
      });

      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @param {string} userId - User deleting the template
   * @returns {Promise<boolean>} - Success status
   */
  async deleteTemplate(templateId, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);

      // Check permissions (only owner can delete)
      if (template.permissions.owner !== userId) {
        throw new Error('Only template owner can delete template');
      }

      // Delete template file
      const templatePath = path.join(this.templatesDir, `${templateId}.json`);
      await fs.unlink(templatePath);

      // Delete versions
      const versionsPath = path.join(this.versionsDir, templateId);
      try {
        await fs.rmdir(versionsPath, { recursive: true });
      } catch (error) {
        // Versions directory might not exist
      }

      // Delete comments
      const commentsPath = path.join(this.commentsDir, templateId);
      try {
        await fs.rmdir(commentsPath, { recursive: true });
      } catch (error) {
        // Comments directory might not exist
      }

      logger.info('Template deleted successfully:', {
        templateId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * List templates with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} userId - User requesting templates
   * @returns {Promise<Object>} - List of templates
   */
  async listTemplates(filters = {}, userId) {
    try {
      const {
        category,
        passType,
        status,
        isPublic,
        teamId,
        search,
        page = 1,
        limit = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = filters;

      const files = await fs.readdir(this.templatesDir);
      const templates = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const templatePath = path.join(this.templatesDir, file);
          const templateData = await fs.readFile(templatePath, 'utf8');
          const template = JSON.parse(templateData);

          // Check permissions
          if (!this.hasPermission(template, userId, 'view')) continue;

          // Apply filters
          if (category && template.category !== category) continue;
          if (passType && template.passType !== passType) continue;
          if (status && template.metadata.status !== status) continue;
          if (isPublic !== undefined && template.metadata.isPublic !== isPublic) continue;
          if (teamId && template.metadata.teamId !== teamId) continue;
          if (search && !this.matchesSearch(template, search)) continue;

          templates.push(template);
        } catch (error) {
          logger.warn('Failed to read template file:', { file, error: error.message });
        }
      }

      // Sort templates
      templates.sort((a, b) => {
        const aValue = a.metadata[sortBy] || a[sortBy];
        const bValue = b.metadata[sortBy] || b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTemplates = templates.slice(startIndex, endIndex);

      return {
        templates: paginatedTemplates,
        pagination: {
          page,
          limit,
          total: templates.length,
          pages: Math.ceil(templates.length / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to list templates:', error);
      throw error;
    }
  }

  /**
   * Create a new version of a template
   * @param {string} templateId - Template ID
   * @param {Object} config - Template configuration
   * @param {string} userId - User creating the version
   * @param {string} message - Version message
   * @returns {Promise<Object>} - Created version
   */
  async createVersion(templateId, config, userId, message) {
    try {
      const versionId = uuidv4();
      const now = new Date().toISOString();

      const version = {
        id: versionId,
        templateId,
        config,
        message,
        createdBy: userId,
        createdAt: now,
        isActive: true
      };

      // Save version
      const versionsPath = path.join(this.versionsDir, templateId);
      await fs.mkdir(versionsPath, { recursive: true });
      
      const versionPath = path.join(versionsPath, `${versionId}.json`);
      await fs.writeFile(versionPath, JSON.stringify(version, null, 2));

      logger.info('Template version created:', {
        templateId,
        versionId,
        userId
      });

      return version;
    } catch (error) {
      logger.error('Failed to create template version:', error);
      throw error;
    }
  }

  /**
   * Get template versions
   * @param {string} templateId - Template ID
   * @param {string} userId - User requesting versions
   * @returns {Promise<Array>} - List of versions
   */
  async getTemplateVersions(templateId, userId) {
    try {
      // Check template access
      await this.getTemplate(templateId, userId);

      const versionsPath = path.join(this.versionsDir, templateId);
      const files = await fs.readdir(versionsPath);
      const versions = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const versionPath = path.join(versionsPath, file);
          const versionData = await fs.readFile(versionPath, 'utf8');
          const version = JSON.parse(versionData);
          versions.push(version);
        } catch (error) {
          logger.warn('Failed to read version file:', { file, error: error.message });
        }
      }

      // Sort by creation date (newest first)
      versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return versions;
    } catch (error) {
      logger.error('Failed to get template versions:', error);
      throw error;
    }
  }

  /**
   * Add comment to template
   * @param {string} templateId - Template ID
   * @param {Object} comment - Comment data
   * @param {string} userId - User adding comment
   * @returns {Promise<Object>} - Created comment
   */
  async addComment(templateId, comment, userId) {
    try {
      // Check template access
      await this.getTemplate(templateId, userId);

      const commentId = uuidv4();
      const now = new Date().toISOString();

      const newComment = {
        id: commentId,
        templateId,
        content: comment.content,
        type: comment.type || 'comment', // comment, suggestion, approval
        status: comment.status || 'open',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        replies: [],
        mentions: comment.mentions || []
      };

      // Save comment
      const commentsPath = path.join(this.commentsDir, templateId);
      await fs.mkdir(commentsPath, { recursive: true });
      
      const commentPath = path.join(commentsPath, `${commentId}.json`);
      await fs.writeFile(commentPath, JSON.stringify(newComment, null, 2));

      logger.info('Comment added to template:', {
        templateId,
        commentId,
        userId
      });

      return newComment;
    } catch (error) {
      logger.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Get template comments
   * @param {string} templateId - Template ID
   * @param {string} userId - User requesting comments
   * @returns {Promise<Array>} - List of comments
   */
  async getTemplateComments(templateId, userId) {
    try {
      // Check template access
      await this.getTemplate(templateId, userId);

      const commentsPath = path.join(this.commentsDir, templateId);
      const files = await fs.readdir(commentsPath);
      const comments = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const commentPath = path.join(commentsPath, file);
          const commentData = await fs.readFile(commentPath, 'utf8');
          const comment = JSON.parse(commentData);
          comments.push(comment);
        } catch (error) {
          logger.warn('Failed to read comment file:', { file, error: error.message });
        }
      }

      // Sort by creation date (oldest first)
      comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return comments;
    } catch (error) {
      logger.error('Failed to get template comments:', error);
      throw error;
    }
  }

  /**
   * Update template permissions
   * @param {string} templateId - Template ID
   * @param {Object} permissions - New permissions
   * @param {string} userId - User updating permissions
   * @returns {Promise<Object>} - Updated template
   */
  async updatePermissions(templateId, permissions, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);

      // Check permissions (only owner can update permissions)
      if (template.permissions.owner !== userId) {
        throw new Error('Only template owner can update permissions');
      }

      const updatedTemplate = {
        ...template,
        permissions: {
          ...template.permissions,
          ...permissions
        }
      };

      // Save updated template
      const templatePath = path.join(this.templatesDir, `${templateId}.json`);
      await fs.writeFile(templatePath, JSON.stringify(updatedTemplate, null, 2));

      logger.info('Template permissions updated:', {
        templateId,
        userId,
        permissions
      });

      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission for template
   * @param {Object} template - Template object
   * @param {string} userId - User ID
   * @param {string} action - Action (view, edit, admin)
   * @returns {boolean} - Has permission
   */
  hasPermission(template, userId, action) {
    const { permissions } = template;

    // Owner has all permissions
    if (permissions.owner === userId) return true;

    // Check specific permissions
    switch (action) {
      case 'view':
        return permissions.viewers.includes(userId) || 
               permissions.editors.includes(userId) || 
               permissions.collaborators.includes(userId) ||
               template.metadata.isPublic;
      
      case 'edit':
        return permissions.editors.includes(userId) || 
               permissions.collaborators.includes(userId);
      
      case 'admin':
        return permissions.collaborators.includes(userId);
      
      default:
        return false;
    }
  }

  /**
   * Check if template matches search query
   * @param {Object} template - Template object
   * @param {string} search - Search query
   * @returns {boolean} - Matches search
   */
  matchesSearch(template, search) {
    const searchLower = search.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get template statistics
   * @param {string} templateId - Template ID
   * @param {string} userId - User requesting stats
   * @returns {Promise<Object>} - Template statistics
   */
  async getTemplateStats(templateId, userId) {
    try {
      const template = await this.getTemplate(templateId, userId);
      const versions = await this.getTemplateVersions(templateId, userId);
      const comments = await this.getTemplateComments(templateId, userId);

      return {
        template: {
          id: template.id,
          name: template.name,
          views: template.stats.views,
          downloads: template.stats.downloads,
          uses: template.stats.uses,
          lastUsed: template.stats.lastUsed
        },
        versions: {
          total: versions.length,
          latest: versions[0] || null
        },
        comments: {
          total: comments.length,
          open: comments.filter(c => c.status === 'open').length,
          closed: comments.filter(c => c.status === 'closed').length
        }
      };
    } catch (error) {
      logger.error('Failed to get template stats:', error);
      throw error;
    }
  }
}

module.exports = TemplateService;
