/**
 * Persistence Service - Single Responsibility: Database persistence operations
 * Dependency Inversion: Depends on database service abstraction
 */
const fs = require('fs').promises;
const path = require('path');
const simpleStorage = require('./simpleStorage');
const databaseService = require('./database.service');
const logger = require('../utils/logger');

class PersistenceService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize persistence service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await simpleStorage.initialize();
      this.initialized = true;
      logger.info('Persistence service initialized with simple storage');
    } catch (error) {
      logger.error('Failed to initialize persistence service:', error);
      throw error;
    }
  }

  /**
   * Save campaign basic info
   */
  async saveCampaign(campaignData) {
    try {
      await this.initialize();

      // Try database first, fall back to simple storage
      try {
        await databaseService.initialize();
        const result = await databaseService.createCampaign(campaignData);
        logger.info(`Saved campaign to database: ${campaignData.id}`);
        return {
          success: true,
          campaignId: campaignData.id,
          data: result
        };
      } catch (dbError) {
        logger.warn(`Database save failed for campaign ${campaignData.id}, using simple storage:`, dbError.message);
        const result = await simpleStorage.saveCampaign(campaignData);
        logger.info(`Saved campaign to simple storage: ${campaignData.id}`);
        return {
          success: true,
          campaignId: campaignData.id,
          data: result
        };
      }
    } catch (error) {
      logger.error(`Failed to save campaign ${campaignData.id}:`, error);
      throw error;
    }
  }

  /**
   * Save campaign design (Step 1 Editor data)
   */
  async saveCampaignDesign(campaignId, designData) {
    try {
      await this.initialize();

      const result = await simpleStorage.saveCampaignDesign(campaignId, designData);
      logger.info(`Saved campaign design for ${campaignId}`);

      return {
        success: true,
        campaignId,
        lastModified: new Date().toISOString(),
        version: 1
      };
    } catch (error) {
      logger.error(`Failed to save campaign design for ${campaignId}:`, error);
      throw error;
    }
  }
      

  /**
   * Save campaign details (Step 2 data)
   */
  async saveCampaignDetails(campaignId, detailsData) {
    try {
      await this.initialize();

      const result = await simpleStorage.saveCampaignDetails(campaignId, detailsData);
      logger.info(`Saved campaign details for ${campaignId}`);

      return {
        success: true,
        campaignId,
        lastModified: new Date().toISOString(),
        version: 1
      };
    } catch (error) {
      logger.error(`Failed to save campaign details for ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Save landing page data (Step 3 data)
   */
  async saveLandingPageData(campaignId, landingPageData) {
    try {
      await this.initialize();

      const result = await simpleStorage.saveLandingPageData(campaignId, landingPageData);
      logger.info(`Saved landing page data for ${campaignId}`);

      return {
        success: true,
        campaignId,
        lastModified: new Date().toISOString(),
        version: 1
      };
    } catch (error) {
      logger.error(`Failed to save landing page data for ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Load campaign data (both design and details)
   */
  async loadCampaignData(campaignId) {
    try {
      await this.initialize();

      // Get campaign data from simple storage
      const campaign = await simpleStorage.loadCampaignData(campaignId);
      if (!campaign) {
        logger.info(`No campaign found with ID ${campaignId}`);
        return null;
      }

      logger.info(`Loaded campaign data for ${campaignId}`, {
        hasDesign: Object.keys(campaign.design || {}).length > 0,
        hasDetails: Object.keys(campaign).length > 0
      });

      return campaign;
    } catch (error) {
      logger.error(`Failed to load campaign data for ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Save template version (for undo/redo functionality)
   */
  async saveTemplateVersion(campaignId, templateId, templateData) {
    try {
      const versionDir = path.join(this.versionsDir, campaignId);
      await fs.mkdir(versionDir, { recursive: true });
      
      const versionPath = path.join(versionDir, `${templateId}.json`);
      await fs.writeFile(versionPath, JSON.stringify(templateData, null, 2));
      
      logger.info(`Saved template version for ${campaignId}/${templateId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to save template version for ${campaignId}/${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Load template version
   */
  async loadTemplateVersion(campaignId, templateId) {
    try {
      const versionPath = path.join(this.versionsDir, campaignId, `${templateId}.json`);
      const data = await fs.readFile(versionPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      logger.error(`Failed to load template version for ${campaignId}/${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get all saved campaigns
   */
  async getAllCampaigns(tenantId = '550e8400-e29b-41d4-a716-446655440000') {
    try {
      await this.initialize();

      // Try database first, fall back to simple storage
      try {
        await databaseService.initialize();
        const campaigns = await databaseService.getAllCampaigns({ tenantId });
        logger.info(`Loaded ${campaigns.rows ? campaigns.rows.length : 0} campaigns from database`);
        return campaigns.rows || [];
      } catch (dbError) {
        logger.warn(`Database read failed, using simple storage:`, dbError.message);
        const campaigns = await simpleStorage.getAllCampaigns(tenantId);
        logger.info(`Loaded ${campaigns.length} campaigns from simple storage`);
        return campaigns;
      }
    } catch (error) {
      logger.error('Failed to get all campaigns:', error);
      return [];
    }
  }

  /**
   * Save mock campaigns to persistent storage
   */
  async saveMockCampaignsToStorage(mockCampaigns) {
    try {
      // Save each campaign as a separate JSON file
      for (const campaign of mockCampaigns) {
        const campaignPath = path.join(this.campaignsDir, `${campaign.id}.json`);
        await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2));
      }
      logger.info(`✅ Saved ${mockCampaigns.length} mock campaigns to persistent storage`);
    } catch (error) {
      logger.error('Failed to save mock campaigns to persistent storage:', error);
      throw error;
    }
  }

  /**
   * Delete campaign data - Single Responsibility: Delete all campaign-related data
   * Open-Closed: Can be extended to delete additional related files
   */
  async deleteCampaign(campaignId) {
    try {
      await this.initialize();

      // Delete preview image file from filesystem
      const previewPath = path.join(process.cwd(), 'storage', 'previews', `${campaignId}.png`);
      let deletedFiles = 0;

      try {
        await fs.access(previewPath);
        await fs.unlink(previewPath);
        deletedFiles++;
        logger.info(`✅ Deleted preview image: ${campaignId}.png`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.info(`ℹ️ Preview image not found: ${campaignId}.png`);
        } else {
          logger.error(`❌ Error deleting preview image ${campaignId}.png:`, error);
        }
      }

      // Delete campaign from simple storage
      const deleted = await simpleStorage.deleteCampaign(campaignId);

      logger.info(`Successfully deleted campaign data for ${campaignId}`, {
        filesDeleted: deletedFiles,
        storageDeleted: deleted
      });
      return true;
    } catch (error) {
      logger.error(`Failed to delete campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get preview URL for campaign (now handled by frontend)
   */
  getPreviewUrl(campaignId) {
    return `/storage/previews/${campaignId}.png`;
  }

  /**
   * Health check for persistence service
   */
  async healthCheck() {
    try {
      await this.initialize();
      return await databaseService.healthCheck();
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Normalize design data structure for preview generation
   */
  normalizeDesignData(campaignData) {
    // Handle nested design structure (legacy format)
    if (campaignData.design && campaignData.design.design) {
      return {
        ...campaignData,
        design: campaignData.design.design
      };
    }

    // Handle missing design structure
    if (!campaignData.design) {
      return {
        ...campaignData,
        design: {
          colors: {
            primary: '#007AFF',
            secondary: '#34C759',
            background: '#F2F2F7'
          },
          images: {},
          fieldConfig: {},
          layout: {}
        }
      };
    }

    return campaignData;
  }

  /**
   * Auto-save with debouncing
   */
  createAutoSave(campaignId, saveFunction, delay = 2000) {
    let timeoutId = null;
    
    return (data) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        try {
          await saveFunction(campaignId, data);
        } catch (error) {
          logger.error(`Auto-save failed for ${campaignId}:`, error);
        }
      }, delay);
    };
  }
}

module.exports = PersistenceService;
