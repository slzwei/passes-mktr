/**
 * Simple File-Based Storage Service
 * Much simpler and more reliable than complex database setup
 */
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class SimpleStorageService {
  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage', 'data');
    this.campaignsFile = path.join(this.storageDir, 'campaigns.json');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Initialize campaigns file if it doesn't exist
      try {
        await fs.access(this.campaignsFile);
      } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(this.campaignsFile, JSON.stringify([], null, 2));
        logger.info('Created new campaigns storage file');
      }
      
      this.initialized = true;
      logger.info('Simple storage service initialized');
    } catch (error) {
      logger.error('Failed to initialize simple storage:', error);
      throw error;
    }
  }

  async readCampaigns() {
    await this.initialize();
    try {
      const data = await fs.readFile(this.campaignsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read campaigns:', error);
      return [];
    }
  }

  async writeCampaigns(campaigns) {
    await this.initialize();
    try {
      await fs.writeFile(this.campaignsFile, JSON.stringify(campaigns, null, 2));
      logger.info(`Saved ${campaigns.length} campaigns to storage`);
    } catch (error) {
      logger.error('Failed to write campaigns:', error);
      throw error;
    }
  }

  async saveCampaign(campaignData) {
    const campaigns = await this.readCampaigns();
    
    // Check if campaign already exists
    const existingIndex = campaigns.findIndex(c => c.id === campaignData.id);
    
    if (existingIndex >= 0) {
      // Update existing campaign
      campaigns[existingIndex] = { ...campaigns[existingIndex], ...campaignData };
      logger.info(`Updated campaign: ${campaignData.id}`);
    } else {
      // Add new campaign
      campaigns.push(campaignData);
      logger.info(`Created new campaign: ${campaignData.id}`);
    }
    
    await this.writeCampaigns(campaigns);
    return campaignData;
  }

  async getCampaign(campaignId) {
    const campaigns = await this.readCampaigns();
    return campaigns.find(c => c.id === campaignId) || null;
  }

  async getAllCampaigns(tenantId = null) {
    const campaigns = await this.readCampaigns();
    
    if (tenantId) {
      return campaigns.filter(c => c.tenantId === tenantId);
    }
    
    return campaigns;
  }

  async deleteCampaign(campaignId) {
    const campaigns = await this.readCampaigns();
    const filteredCampaigns = campaigns.filter(c => c.id !== campaignId);
    
    if (filteredCampaigns.length < campaigns.length) {
      await this.writeCampaigns(filteredCampaigns);
      
      // Also delete preview image if it exists
      try {
        const previewPath = path.join(process.cwd(), 'storage', 'previews', `${campaignId}.png`);
        await fs.unlink(previewPath);
        logger.info(`Deleted preview image: ${campaignId}.png`);
      } catch (error) {
        // Preview file might not exist, that's okay
        logger.info(`Preview image not found: ${campaignId}.png`);
      }
      
      logger.info(`Deleted campaign: ${campaignId}`);
      return true;
    }
    
    return false;
  }

  async saveCampaignDesign(campaignId, designData) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    campaign.design = designData;
    campaign.updatedAt = new Date().toISOString();
    
    await this.saveCampaign(campaign);
    return campaign;
  }

  async saveCampaignDetails(campaignId, detailsData) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    // Merge details data into campaign
    Object.assign(campaign, detailsData);
    campaign.updatedAt = new Date().toISOString();
    
    await this.saveCampaign(campaign);
    return campaign;
  }

  async saveLandingPageData(campaignId, landingPageData) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    // Set landing page data
    campaign.landingPageData = landingPageData;
    campaign.updatedAt = new Date().toISOString();
    
    await this.saveCampaign(campaign);
    return campaign;
  }

  async loadCampaignData(campaignId) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return null;
    }
    
    // Ensure campaign has all required fields
    return {
      ...campaign,
      design: campaign.design || {
        colors: {
          primary: '#007AFF',
          secondary: '#34C759',
          background: '#F2F2F7'
        },
        images: {},
        fieldConfig: {},
        layout: {}
      },
      settings: campaign.settings || {},
      isActive: campaign.isActive !== undefined ? campaign.isActive : false,
      status: campaign.status || 'draft'
    };
  }
}

module.exports = new SimpleStorageService();
