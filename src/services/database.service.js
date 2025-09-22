/**
 * Database Service Layer - Dependency Inversion Principle
 * Provides clean abstraction over database operations
 * Single Responsibility: Database operations coordination
 */
const CampaignModel = require('../models/campaign.model');
const CampaignDesignModel = require('../models/campaign-design.model');
const CampaignDetailsModel = require('../models/campaign-details.model');
const TemplateModel = require('../models/template.model');
const AnalyticsModel = require('../models/analytics.model');
const { connectDatabase, query, isDatabaseConnected } = require('../config/database');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.campaignModel = null;
    this.campaignDesignModel = null;
    this.campaignDetailsModel = null;
    this.templateModel = null;
    this.analyticsModel = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await connectDatabase();

      if (isDatabaseConnected()) {
        this.campaignModel = new CampaignModel(this);
        this.campaignDesignModel = new CampaignDesignModel(this);
        this.campaignDetailsModel = new CampaignDetailsModel(this);
        this.templateModel = new TemplateModel(this);
        this.analyticsModel = new AnalyticsModel(this);
        this.initialized = true;
        logger.info('Database service initialized successfully');
      } else {
        logger.warn('Database not connected, using file-based storage');
      }
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async executeQuery(text, params) {
    if (!isDatabaseConnected()) {
      throw new Error('Database not connected. Cannot execute query.');
    }
    return query(text, params);
  }

  // Campaign operations
  async createCampaign(data) {
    if (this.campaignModel) {
      return this.campaignModel.create(data);
    }
    throw new Error('Database not initialized');
  }

  async getCampaign(id) {
    if (this.campaignModel) {
      return this.campaignModel.findById(id);
    }
    throw new Error('Database not initialized');
  }

  async getAllCampaigns(where = {}) {
    if (this.campaignModel) {
      return this.campaignModel.findAll(where);
    }
    throw new Error('Database not initialized');
  }

  async updateCampaign(id, data) {
    if (this.campaignModel) {
      return this.campaignModel.update(id, data);
    }
    throw new Error('Database not initialized');
  }

  async deleteCampaign(id) {
    if (this.campaignModel) {
      return this.campaignModel.delete(id);
    }
    throw new Error('Database not initialized');
  }

  // Campaign design operations
  async saveCampaignDesign(campaignId, designData) {
    if (this.campaignDesignModel) {
      const existing = await this.campaignDesignModel.getLatestByCampaignId(campaignId);
      if (existing.rows.length > 0) {
        return this.campaignDesignModel.update(existing.rows[0].id, { design_data: designData });
      }
      return this.campaignDesignModel.create({ campaign_id: campaignId, design_data: designData });
    }
    throw new Error('Database not initialized');
  }

  async getCampaignDesign(campaignId) {
    if (this.campaignDesignModel) {
      return this.campaignDesignModel.getLatestByCampaignId(campaignId);
    }
    throw new Error('Database not initialized');
  }

  async getAllCampaignDesigns(campaignId) {
    if (this.campaignDesignModel) {
      return this.campaignDesignModel.findByCampaignId(campaignId);
    }
    throw new Error('Database not initialized');
  }

  // Campaign details operations
  async saveCampaignDetails(campaignId, detailsData) {
    if (this.campaignDetailsModel) {
      const existing = await this.campaignDetailsModel.getLatestByCampaignId(campaignId);
      if (existing.rows.length > 0) {
        return this.campaignDetailsModel.update(existing.rows[0].id, { details_data: detailsData });
      }
      return this.campaignDetailsModel.create({ campaign_id: campaignId, details_data: detailsData });
    }
    throw new Error('Database not initialized');
  }

  async getCampaignDetails(campaignId) {
    if (this.campaignDetailsModel) {
      return this.campaignDetailsModel.getLatestByCampaignId(campaignId);
    }
    throw new Error('Database not initialized');
  }

  // Template operations
  async createTemplate(data) {
    if (this.templateModel) {
      return this.templateModel.create(data);
    }
    throw new Error('Database not initialized');
  }

  async getTemplate(id) {
    if (this.templateModel) {
      return this.templateModel.findById(id);
    }
    throw new Error('Database not initialized');
  }

  async getAllTemplates(tenantId) {
    if (this.templateModel) {
      return this.templateModel.findByTenantId(tenantId);
    }
    throw new Error('Database not initialized');
  }

  async updateTemplate(id, data) {
    if (this.templateModel) {
      return this.templateModel.update(id, data);
    }
    throw new Error('Database not initialized');
  }

  async deleteTemplate(id) {
    if (this.templateModel) {
      return this.templateModel.delete(id);
    }
    throw new Error('Database not initialized');
  }

  // Analytics operations
  async createAnalyticsEvent(campaignId, eventType, eventData = {}) {
    if (this.analyticsModel) {
      return this.analyticsModel.create({
        campaign_id: campaignId,
        event_type: eventType,
        event_data: eventData
      });
    }
    throw new Error('Database not initialized');
  }

  async getCampaignAnalytics(campaignId, startDate, endDate) {
    if (this.analyticsModel) {
      return this.analyticsModel.getCampaignStats(campaignId, startDate, endDate);
    }
    throw new Error('Database not initialized');
  }

  async getRecentAnalytics(limit = 50) {
    if (this.analyticsModel) {
      return this.analyticsModel.getRecentEvents(limit);
    }
    throw new Error('Database not initialized');
  }

  // Direct query access (for complex operations)
  async directQuery(text, params = []) {
    if (!isDatabaseConnected()) {
      throw new Error('Database not connected. Cannot execute query.');
    }
    return query(text, params);
  }

  // Health check
  async healthCheck() {
    try {
      if (isDatabaseConnected()) {
        const result = await query('SELECT NOW() as current_time');
        return {
          status: 'healthy',
          database: 'connected',
          timestamp: result.rows[0].current_time
        };
      } else {
        return {
          status: 'healthy',
          database: 'disconnected',
          message: 'Using file-based storage'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseService();
