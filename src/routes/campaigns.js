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
  }
];

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
    const campaign = mockCampaigns.find(c => c.id === id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
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
    const { tenantId, name, description, type, settings } = req.body;
    
    if (!tenantId || !name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID, name, and type are required'
      });
    }
    
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      tenantId,
      name,
      description: description || '',
      type,
      settings: settings || {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockCampaigns.push(newCampaign);
    
    logger.info(`Created new campaign: ${newCampaign.id}`);
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
    const { name, description, type, settings, isActive } = req.body;
    
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
      updatedAt: new Date().toISOString()
    };
    
    mockCampaigns[campaignIndex] = updatedCampaign;
    
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

module.exports = router;
