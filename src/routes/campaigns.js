const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const PersistenceService = require('../services/persistenceService');
const PreviewGeneratorService = require('../services/previewGeneratorService');

// Initialize persistence service
const persistenceService = new PersistenceService();

// Initialize preview generator service (only used for checking if preview exists)
const previewGeneratorService = new PreviewGeneratorService();

// Add multer for handling file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Mock campaign data for now
const mockCampaigns = [
  {
    id: 'campaign-1',
    tenantId: 'tenant-1',
    name: 'Coffee Loyalty Program',
    description: 'Earn stamps for every coffee purchase',
    type: 'redemption',
    settings: {
      stampsRequired: 10,
      reward: 'Free coffee',
      expiryDays: 365,
      maxStamps: 20
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'campaign-2',
    tenantId: 'tenant-1',
    name: 'Points Rewards',
    description: 'Accumulate points for purchases',
    type: 'points',
    settings: {
      pointsPerDollar: 1,
      redemptionRate: 100,
      expiryDays: 180
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'campaign-1758440279428',
    tenantId: 'tenant-1',
    name: 'New Campaign ccc',
    description: 'A new digital wallet campaigncccc',
    type: 'redemption',
    settings: {
      stampsRequired: 5,
      reward: 'Free coffee',
      expiryDays: 365,
      maxStamps: 10
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    design: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#34C759',
        background: '#F2F2F7'
      },
      images: {},
      fieldConfig: {
        auxiliary: 0,
        header: 0,
        secondary: 0
      }
    }
  }
];

// Helper: ensure a campaign exists; create with defaults if missing (dev/mock only)
async function ensureCampaignExists(campaignId, type = 'redemption') {
  // First try to get from database
  try {
    const campaignData = await persistenceService.loadCampaignData(campaignId);
    if (campaignData) {
      return campaignData;
    }
  } catch (error) {
    logger.warn(`Failed to load campaign ${campaignId} from database:`, error.message);
  }
  
  // Fallback to mock data
  let campaign = mockCampaigns.find(c => c.id === campaignId);
  
  if (!campaign) {
    const newCampaign = {
      id: campaignId,
      tenantId: 'tenant-1',
      name: 'New Campaign',
      description: '',
      type,
      settings: {
        stampsRequired: type === 'redemption' ? 5 : undefined,
        pointsPerDollar: type === 'points' ? 1 : undefined,
        expiryDays: 365
      },
      design: {
        colors: {
          primary: '#007AFF',
          secondary: '#34C759',
          background: '#F2F2F7'
        },
        images: {},
        fieldConfig: {},
        layout: {}
      },
      isActive: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Try to save to database
    try {
      await persistenceService.saveCampaign(newCampaign);
      await persistenceService.saveCampaignDesign(campaignId, newCampaign.design);
      await persistenceService.saveCampaignDetails(campaignId, {
        name: newCampaign.name,
        description: newCampaign.description,
        type: newCampaign.type,
        settings: newCampaign.settings
      });
      logger.info('Auto-created and saved missing campaign to database', { campaignId });
    } catch (error) {
      logger.warn(`Failed to save auto-created campaign ${campaignId} to database:`, error.message);
      mockCampaigns.push(newCampaign);
      logger.info('Auto-created missing campaign in mock data', { campaignId });
    }
    
    campaign = newCampaign;
  }
  return campaign;
}

// GET /api/campaigns - List all campaigns (removed duplicate - using the one with previews below)

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await ensureCampaignExists(id);
    
    logger.info(`Fetching campaign: ${id}`);
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res) => {
  try {
    const { name, description, type = 'redemption', tenantId = 'tenant-1', settings } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }
    
    const campaignId = 'campaign-' + Date.now();
    const newCampaign = {
      id: campaignId,
      tenantId,
      name,
      description: description || '',
      type,
      settings: settings || {
        stampsRequired: type === 'redemption' ? 5 : undefined,
        pointsPerDollar: type === 'points' ? 1 : undefined,
        expiryDays: 365
      },
      design: {
        colors: {
          primary: '#007AFF',
          secondary: '#34C759',
          background: '#F2F2F7'
        },
        images: {},
        fieldConfig: {},
        layout: {}
      },
      isActive: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to database
    await persistenceService.saveCampaign(newCampaign);
    
    // Also save design data to database
    await persistenceService.saveCampaignDesign(campaignId, newCampaign.design);
    
    // Also save details data to database
    await persistenceService.saveCampaignDetails(campaignId, {
      name: newCampaign.name,
      description: newCampaign.description,
      type: newCampaign.type,
      settings: newCampaign.settings
    });
    
    logger.info('Created new campaign', { campaignId, name, type });
    res.status(201).json({
      success: true,
      data: newCampaign
    });
  } catch (error) {
    logger.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});


// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('🗑️ Deleting campaign', { campaignId: id });

    // Delete campaign from database
    await persistenceService.deleteCampaign(id);
    logger.info('✅ Campaign deleted from database', { campaignId: id });

    logger.info(`Successfully deleted campaign: ${id}`);
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error('❌ Error deleting campaign:', { campaignId: req.params?.id, error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

// GET /api/campaigns/:campaignId/design - Get campaign design
router.get('/:campaignId/design', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Load campaign data from database
    const campaignData = await persistenceService.loadCampaignData(campaignId);

    if (!campaignData) {
      logger.warn('Campaign not found in database', { campaignId });
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    logger.info('Retrieved campaign design with persistence', { 
      campaignId,
      fromPersistence: !!campaignData.design,
      version: campaignData.version
    });
    
    res.json({
      success: true,
      data: {
        campaignId: campaignData.id,
        name: campaignData.name,
        type: campaignData.type,
        design: campaignData.design,
        lastModified: campaignData.lastModified,
        version: campaignData.version || 0
      }
    });
  } catch (error) {
    logger.error('Error retrieving campaign design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve campaign design'
    });
  }
});

// PUT /api/campaigns/:campaignId/design - Update campaign design (Step 1 Editor)
router.put('/:campaignId/design', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { design } = req.body;
    
    // Save to persistent storage
    const savedData = await persistenceService.saveCampaignDesign(campaignId, design);
    
    // Also update mock data for backward compatibility
    let campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
      ensureCampaignExists(campaignId);
      campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    }
    
    mockCampaigns[campaignIndex] = {
      ...mockCampaigns[campaignIndex],
      design: design,
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Updated campaign design with persistence', { 
      campaignId, 
      hasColors: !!design?.colors,
      hasImages: !!design?.images,
      hasFieldConfig: !!design?.fieldConfig,
      version: savedData.version
    });
    
    res.json({
      success: true,
      data: {
        campaignId,
        design: design,
        lastModified: savedData.lastModified,
        version: savedData.version
      }
    });
  } catch (error) {
    logger.error('Error updating campaign design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign design'
    });
  }
});

// PUT /api/campaigns/:campaignId - Update campaign details (Step 2 Campaign Details)
router.put('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { name, description, type, settings, isActive, campaignDetails, landingPageData } = req.body;
    
    // Ensure campaign exists first
    const existingCampaign = await ensureCampaignExists(campaignId);
    
    // Save campaign details to persistent storage if provided
    if (campaignDetails) {
      await persistenceService.saveCampaignDetails(campaignId, campaignDetails);
    }
    
    // Save landing page data to persistent storage if provided
    if (landingPageData) {
      await persistenceService.saveLandingPageData(campaignId, landingPageData);
    }
    
    // Find campaign in mock data and update it
    let campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    
    if (campaignIndex === -1) {
      // If not found in mock data, add it
      mockCampaigns.push(existingCampaign);
      campaignIndex = mockCampaigns.length - 1;
    }
    
    // Update campaign with all possible fields
    const updatedCampaign = {
      ...mockCampaigns[campaignIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(type && { type }),
      ...(settings && { settings }),
      ...(isActive !== undefined && { isActive }),
      ...(campaignDetails && { campaignDetails }),
      ...(landingPageData && { landingPageData }),
      updatedAt: new Date().toISOString()
    };
    
    mockCampaigns[campaignIndex] = updatedCampaign;
    
    // Also try to save basic campaign data to persistence
    try {
      if (name || description || type || settings || isActive !== undefined) {
        const campaignToSave = {
          ...updatedCampaign,
          id: campaignId
        };
        await persistenceService.saveCampaign(campaignToSave);
      }
    } catch (persistError) {
      logger.warn('Failed to save campaign to persistence:', persistError.message);
    }
    
    logger.info('Updated campaign details with persistence', { 
      campaignId, 
      hasName: !!name,
      hasDescription: !!description,
      hasType: !!type,
      hasSettings: !!settings,
      hasIsActive: isActive !== undefined,
      hasCampaignDetails: !!campaignDetails
    });
    
    res.json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    logger.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

// POST /api/campaigns/:campaignId/images - Upload campaign images
router.post('/:campaignId/images', upload.single('image'), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { imageType = 'general' } = req.query;

    logger.info('🖼️ Received image upload request', {
      campaignId,
      imageType,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype
    });

    // Ensure campaign exists first
    const existingCampaign = await ensureCampaignExists(campaignId);

    // Validate file
    if (!req.file) {
      logger.error('❌ Image upload failed: No file provided', { campaignId });
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      logger.error('❌ Image upload failed: Invalid file type', {
        campaignId,
        fileType: req.file.mimetype
      });
      return res.status(400).json({
        success: false,
        error: 'File must be an image'
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      logger.error('❌ Image upload failed: File too large', {
        campaignId,
        fileSize: req.file.size,
        maxSize
      });
      return res.status(400).json({
        success: false,
        error: 'Image size must be less than 5MB'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop();
    const filename = `${campaignId}-${imageType}-${timestamp}.${extension}`;

    // Save file to storage/images/campaigns directory
    const imagesDir = path.join(process.cwd(), 'storage', 'images', 'campaigns');
    await fs.mkdir(imagesDir, { recursive: true });

    const filePath = path.join(imagesDir, filename);

    // Write file to disk
    await fs.writeFile(filePath, req.file.buffer);

    // Generate URL for the uploaded image
    const imageUrl = `/storage/images/campaigns/${filename}`;

    logger.info('✅ Image uploaded successfully', {
      campaignId,
      imageType,
      filename,
      url: imageUrl
    });

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('❌ Error uploading image:', {
      campaignId: req.params?.campaignId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// POST /api/campaigns/:campaignId/analytics - Track analytics events
router.post('/:campaignId/analytics', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const eventData = req.body;

    logger.info('📊 Analytics event received', {
      campaignId,
      event: eventData.event,
      timestamp: eventData.timestamp
    });

    // Ensure campaign exists
    await ensureCampaignExists(campaignId);

    // Save analytics event to storage
    const analyticsDir = path.join(process.cwd(), 'storage', 'analytics', 'events');
    await fs.mkdir(analyticsDir, { recursive: true });

    const eventId = `${campaignId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const eventFile = path.join(analyticsDir, `${eventId}.json`);

    const analyticsEvent = {
      id: eventId,
      campaignId,
      ...eventData,
      receivedAt: new Date().toISOString()
    };

    await fs.writeFile(eventFile, JSON.stringify(analyticsEvent, null, 2));

    logger.info('✅ Analytics event saved', {
      campaignId,
      eventId,
      event: eventData.event
    });

    res.json({
      success: true,
      data: {
        eventId,
        message: 'Analytics event tracked successfully'
      }
    });
  } catch (error) {
    logger.error('❌ Error tracking analytics:', {
      campaignId: req.params?.campaignId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to track analytics event'
    });
  }
});

// POST /api/campaigns/:campaignId/autosave - Auto-save campaign design (Step 1)
router.post('/:campaignId/autosave/design', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { design } = req.body;
    
    // Auto-save to persistent storage
    const savedData = await persistenceService.saveCampaignDesign(campaignId, design);
    
    res.json({
      success: true,
      message: 'Design auto-saved',
      version: savedData.version,
      lastModified: savedData.lastModified
    });
  } catch (error) {
    logger.error('Auto-save design failed:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-save failed'
    });
  }
});

// POST /api/campaigns/:campaignId/autosave - Auto-save campaign details (Step 2)
router.post('/:campaignId/autosave/details', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { campaignDetails } = req.body;
    
    // Auto-save to persistent storage
    const savedData = await persistenceService.saveCampaignDetails(campaignId, campaignDetails);
    
    res.json({
      success: true,
      message: 'Details auto-saved',
      version: savedData.version,
      lastModified: savedData.lastModified
    });
  } catch (error) {
    logger.error('Auto-save details failed:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-save failed'
    });
  }
});

// GET /api/campaigns - Get all campaigns with previews
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;

    let filteredCampaigns = [];

    try {
      // Try to load campaigns from database service
      const campaigns = await persistenceService.getAllCampaigns(tenantId);
      logger.info('✅ Loaded campaigns from database', { count: campaigns.length, campaignIds: campaigns.map(c => c.id) });

      // Add default tenantId to campaigns that don't have one
      const campaignsWithTenant = campaigns.map(campaign => ({
        ...campaign,
        tenantId: campaign.tenantId || 'tenant-1'
      }));

      // Filter campaigns by tenant if specified
      filteredCampaigns = campaignsWithTenant;
      if (tenantId) {
        filteredCampaigns = campaignsWithTenant.filter(campaign => campaign.tenantId === tenantId);
      }
    } catch (dbError) {
      logger.error('❌ Database connection failed, falling back to mock data', { error: dbError.message });
      
      // Fallback to mock data
      filteredCampaigns = [...mockCampaigns];
      if (tenantId) {
        filteredCampaigns = mockCampaigns.filter(campaign => campaign.tenantId === tenantId);
      }
      
      logger.warn('⚠️ Using mock data as fallback', { count: filteredCampaigns.length });
    }
    
    // Add preview URLs to campaigns (only use frontend-generated previews)
    const campaignsWithPreviews = await Promise.all(filteredCampaigns.map(async (campaign) => {
      // Normalize campaign data structure
      const normalizedCampaign = persistenceService.normalizeDesignData(campaign);

      // Only check if preview exists, don't generate server-side previews
      // The frontend will upload live preview snapshots via POST /api/campaigns/:id/preview
      const previewExists = await previewGeneratorService.previewExists(campaign.id);
      let previewUrl = null;
      
      if (previewExists) {
        previewUrl = persistenceService.getPreviewUrl(campaign.id);
        logger.info(`Using existing preview for campaign: ${campaign.id}`);
      } else {
        logger.info(`No preview found for campaign: ${campaign.id} - will show placeholder until frontend uploads one`);
      }

      return {
        id: campaign.id,
        name: campaign.name || campaign.details?.campaignName || 'Untitled Campaign',
        description: campaign.description || campaign.details?.description || 'No description',
        type: campaign.type || 'redemption',
        isActive: campaign.isActive !== false,
        createdAt: campaign.createdAt || campaign.lastModified || new Date().toISOString(),
        updatedAt: campaign.updatedAt || campaign.lastModified || new Date().toISOString(),
        settings: campaign.settings || {},
        tenantId: campaign.tenantId || 'tenant-1',
        design: normalizedCampaign.design || {},
        details: campaign.details || campaign.campaignDetails || {},
        previewUrl: previewUrl
      };
    }));
    
    logger.info('Fetching campaigns list', { tenantId, count: campaignsWithPreviews.length });
    
    res.json({
      success: true,
      data: campaignsWithPreviews
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

// POST /api/campaigns/:campaignId/preview - Save frontend-generated preview
router.post('/:campaignId/preview', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { previewData } = req.body;

    logger.info('📸 Received preview upload request', {
      campaignId,
      hasPreviewData: !!previewData,
      previewDataLength: previewData?.length || 0
    });

    if (!previewData) {
      logger.error('❌ Preview upload failed: No preview data provided', { campaignId });
      return res.status(400).json({
        success: false,
        error: 'Preview data is required'
      });
    }

    // Convert base64 data URL to buffer
    const base64Data = previewData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    logger.info('📊 Preview buffer created', {
      campaignId,
      bufferSize: buffer.length,
      base64Length: base64Data.length
    });

    // Save preview to file
    const previewPath = path.join(process.cwd(), 'storage', 'previews', `${campaignId}.png`);
    await fs.writeFile(previewPath, buffer);

    logger.info('✅ Frontend preview saved successfully', {
      campaignId,
      previewPath,
      fileSize: buffer.length
    });

    res.json({
      success: true,
      previewUrl: `/storage/previews/${campaignId}.png`,
      fileSize: buffer.length
    });
  } catch (error) {
    logger.error('❌ Failed to save frontend preview:', {
      campaignId: req.params?.campaignId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to save preview'
    });
  }
});

// GET /api/campaigns/:campaignId/preview-status - Check if preview exists
router.get('/:campaignId/preview-status', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const previewPath = path.join(process.cwd(), 'storage', 'previews', `${campaignId}.png`);

    // Check if file exists
    const fs = require('fs').promises;
    try {
      const stats = await fs.stat(previewPath);
      res.json({
        success: true,
        exists: true,
        fileSize: stats.size,
        lastModified: stats.mtime,
        previewUrl: `/storage/previews/${campaignId}.png`
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          exists: false,
          previewUrl: `/storage/previews/${campaignId}.png`
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('❌ Failed to check preview status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check preview status'
    });
  }
});

module.exports = router;
