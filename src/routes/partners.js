const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock partner data for now
const mockPartners = [
  {
    id: 'partner-1',
    tenantId: 'tenant-1',
    name: 'Coffee Shop Chain',
    email: 'partner@coffeeshop.com',
    phone: '+65 1234 5678',
    address: {
      street: '123 Orchard Road',
      city: 'Singapore',
      postalCode: '238863',
      country: 'Singapore'
    },
    settings: {
      commissionRate: 0.05,
      paymentTerms: 'net30',
      autoApprove: true
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'partner-2',
    tenantId: 'tenant-1',
    name: 'Retail Store',
    email: 'partner@retailstore.com',
    phone: '+65 9876 5432',
    address: {
      street: '456 Marina Bay',
      city: 'Singapore',
      postalCode: '018956',
      country: 'Singapore'
    },
    settings: {
      commissionRate: 0.03,
      paymentTerms: 'net15',
      autoApprove: false
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock campaign data with partner relationships
const mockCampaigns = [
  {
    id: 'campaign-1',
    tenantId: 'tenant-1',
    partnerId: 'partner-1',
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
    partnerId: 'partner-1',
    name: 'Coffee Points Rewards',
    description: 'Accumulate points for coffee purchases',
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
    id: 'campaign-3',
    tenantId: 'tenant-1',
    partnerId: 'partner-2',
    name: 'Retail Rewards',
    description: 'Earn points for retail purchases',
    type: 'points',
    settings: {
      pointsPerDollar: 2,
      redemptionRate: 200,
      expiryDays: 365
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock pass statistics data
const mockPassStats = [
  {
    campaignId: 'campaign-1',
    partnerId: 'partner-1',
    totalPasses: 1250,
    activePasses: 980,
    redeemedPasses: 270,
    lastUpdated: new Date().toISOString()
  },
  {
    campaignId: 'campaign-2',
    partnerId: 'partner-1',
    totalPasses: 2100,
    activePasses: 1850,
    redeemedPasses: 250,
    lastUpdated: new Date().toISOString()
  },
  {
    campaignId: 'campaign-3',
    partnerId: 'partner-2',
    totalPasses: 850,
    activePasses: 720,
    redeemedPasses: 130,
    lastUpdated: new Date().toISOString()
  }
];

// GET /api/partners - List all partners
router.get('/', (req, res) => {
  try {
    const { tenantId, isActive, search } = req.query;
    let filteredPartners = [...mockPartners];
    
    if (tenantId) {
      filteredPartners = filteredPartners.filter(p => p.tenantId === tenantId);
    }
    
    if (isActive !== undefined) {
      filteredPartners = filteredPartners.filter(p => p.isActive === (isActive === 'true'));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPartners = filteredPartners.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        (p.phone && p.phone.includes(search))
      );
    }
    
    logger.info('Fetching partners list');
    res.json({
      success: true,
      data: filteredPartners,
      count: filteredPartners.length
    });
  } catch (error) {
    logger.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partners'
    });
  }
});

// GET /api/partners/:id/campaigns - Get campaigns for a partner
router.get('/:id/campaigns', (req, res) => {
  try {
    const { id } = req.params;
    const partner = mockPartners.find(p => p.id === id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    const partnerCampaigns = mockCampaigns.filter(c => c.partnerId === id);
    
    logger.info(`Fetching campaigns for partner: ${id}`);
    res.json({
      success: true,
      data: partnerCampaigns,
      count: partnerCampaigns.length
    });
  } catch (error) {
    logger.error('Error fetching partner campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner campaigns'
    });
  }
});

// GET /api/partners/:id/statistics - Get pass statistics for a partner
router.get('/:id/statistics', (req, res) => {
  try {
    const { id } = req.params;
    const partner = mockPartners.find(p => p.id === id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    const partnerStats = mockPassStats.filter(s => s.partnerId === id);
    const campaigns = mockCampaigns.filter(c => c.partnerId === id);
    
    // Combine campaign data with statistics
    const campaignStats = campaigns.map(campaign => {
      const stats = partnerStats.find(s => s.campaignId === campaign.id);
      return {
        ...campaign,
        statistics: stats || {
          totalPasses: 0,
          activePasses: 0,
          redeemedPasses: 0,
          lastUpdated: new Date().toISOString()
        }
      };
    });
    
    // Calculate totals
    const totals = partnerStats.reduce((acc, stat) => ({
      totalPasses: acc.totalPasses + stat.totalPasses,
      activePasses: acc.activePasses + stat.activePasses,
      redeemedPasses: acc.redeemedPasses + stat.redeemedPasses
    }), { totalPasses: 0, activePasses: 0, redeemedPasses: 0 });
    
    logger.info(`Fetching statistics for partner: ${id}`);
    res.json({
      success: true,
      data: {
        partner,
        campaigns: campaignStats,
        totals
      }
    });
  } catch (error) {
    logger.error('Error fetching partner statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner statistics'
    });
  }
});

// GET /api/partners/:id - Get partner by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const partner = mockPartners.find(p => p.id === id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    logger.info(`Fetching partner: ${id}`);
    res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    logger.error('Error fetching partner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner'
    });
  }
});

// POST /api/partners - Create new partner
router.post('/', (req, res) => {
  try {
    const { tenantId, name, email, phone, address } = req.body;
    
    if (!tenantId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and name are required'
      });
    }
    
    const newPartner = {
      id: `partner-${Date.now()}`,
      tenantId,
      name,
      email: email || '',
      phone: phone || '',
      address: address || {},
      settings: {
        commissionRate: 0.05,
        paymentTerms: 'net30',
        autoApprove: true
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockPartners.push(newPartner);
    
    logger.info(`Created new partner: ${newPartner.id}`);
    res.status(201).json({
      success: true,
      data: newPartner
    });
  } catch (error) {
    logger.error('Error creating partner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create partner'
    });
  }
});

// PUT /api/partners/:id - Update partner
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, settings, isActive } = req.body;
    
    const partnerIndex = mockPartners.findIndex(p => p.id === id);
    if (partnerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    const updatedPartner = {
      ...mockPartners[partnerIndex],
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address && { address }),
      ...(settings && { settings }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString()
    };
    
    mockPartners[partnerIndex] = updatedPartner;
    
    logger.info(`Updated partner: ${id}`);
    res.json({
      success: true,
      data: updatedPartner
    });
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update partner'
    });
  }
});

// DELETE /api/partners/:id - Delete partner
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const partnerIndex = mockPartners.findIndex(p => p.id === id);
    
    if (partnerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    mockPartners.splice(partnerIndex, 1);
    
    logger.info(`Deleted partner: ${id}`);
    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting partner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete partner'
    });
  }
});

module.exports = router;
