const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

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
function ensureCampaignExists(campaignId, type = 'redemption') {
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
    mockCampaigns.push(newCampaign);
    logger.info('Auto-created missing campaign for request', { campaignId });
    campaign = newCampaign;
  }
  return campaign;
}

// GET /api/campaigns - List all campaigns
router.get('/', (req, res) => {
  try {
    const { tenantId, type, isActive } = req.query;
    let filteredCampaigns = [...mockCampaigns];
    
    if (tenantId) {
      filteredCampaigns = filteredCampaigns.filter(c => c.tenantId === tenantId);
    }
    
    if (type) {
      filteredCampaigns = filteredCampaigns.filter(c => c.type === type);
    }
    
    if (isActive !== undefined) {
      filteredCampaigns = filteredCampaigns.filter(c => c.isActive === (isActive === 'true'));
    }
    
    logger.info('Fetching campaigns list');
    res.json({
      success: true,
      data: filteredCampaigns,
      count: filteredCampaigns.length
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaign = ensureCampaignExists(id);
    
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
router.post('/', (req, res) => {
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
    
    mockCampaigns.push(newCampaign);
    
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

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, settings, isActive, campaignDetails } = req.body;
    
    
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const updatedCampaign = {
      ...mockCampaigns[campaignIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(type && { type }),
      ...(settings && { settings }),
      ...(isActive !== undefined && { isActive }),
      ...(campaignDetails !== undefined && { campaignDetails }),
      updatedAt: new Date().toISOString()
    };
    
    mockCampaigns[campaignIndex] = updatedCampaign;
    
    logger.info('Updated campaign', { 
      campaignId: id, 
      hasName: !!name,
      hasDescription: !!description,
      hasCampaignDetails: !!campaignDetails
    });
    
    logger.info(`Updated campaign: ${id}`);
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

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaignIndex = mockCampaigns.findIndex(c => c.id === id);
    
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    mockCampaigns.splice(campaignIndex, 1);
    
    logger.info(`Deleted campaign: ${id}`);
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

// GET /api/campaigns/:campaignId/design - Get campaign design
router.get('/:campaignId/design', (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = ensureCampaignExists(campaignId);
    
    logger.info('Retrieved campaign design', { campaignId });
    
    res.json({
      success: true,
      data: {
        campaignId: campaign.id,
        name: campaign.name,
        type: campaign.type,
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
        lastModified: campaign.updatedAt
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

// PUT /api/campaigns/:campaignId/design - Update campaign design
router.put('/:campaignId/design', (req, res) => {
  try {
    const { campaignId } = req.params;
    const { design } = req.body;
    
    // Find or create campaign in mock data (in real app, update database)
    let campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
      ensureCampaignExists(campaignId);
      campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    }
    
    // Update campaign design
    mockCampaigns[campaignIndex] = {
      ...mockCampaigns[campaignIndex],
      design: design,
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Updated campaign design', { 
      campaignId, 
      hasColors: !!design?.colors,
      hasImages: !!design?.images,
      hasFieldConfig: !!design?.fieldConfig
    });
    
    res.json({
      success: true,
      data: {
        campaignId,
        lastModified: mockCampaigns[campaignIndex].updatedAt
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

// PUT /api/campaigns/:campaignId - Update campaign details
router.put('/:campaignId', (req, res) => {
  try {
    const { campaignId } = req.params;
    const { name, description, campaignDetails } = req.body;
    
    // Find campaign in mock data (in real app, update database)
    const campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Update campaign
    mockCampaigns[campaignIndex] = {
      ...mockCampaigns[campaignIndex],
      name: name || mockCampaigns[campaignIndex].name,
      description: description || mockCampaigns[campaignIndex].description,
      campaignDetails: campaignDetails || mockCampaigns[campaignIndex].campaignDetails,
      updatedAt: new Date().toISOString()
    };
    
    logger.info('Updated campaign details', { 
      campaignId, 
      hasName: !!name,
      hasDescription: !!description,
      hasCampaignDetails: !!campaignDetails
    });
    
    res.json({
      success: true,
      data: mockCampaigns[campaignIndex]
    });
  } catch (error) {
    logger.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

module.exports = router;
