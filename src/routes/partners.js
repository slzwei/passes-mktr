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
  }
];

// GET /api/partners - List all partners
router.get('/', (req, res) => {
  try {
    const { tenantId, isActive } = req.query;
    let filteredPartners = [...mockPartners];
    
    if (tenantId) {
      filteredPartners = filteredPartners.filter(p => p.tenantId === tenantId);
    }
    
    if (isActive !== undefined) {
      filteredPartners = filteredPartners.filter(p => p.isActive === (isActive === 'true'));
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
    const { tenantId, name, email, phone, address, settings } = req.body;
    
    if (!tenantId || !name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID, name, and email are required'
      });
    }
    
    const newPartner = {
      id: `partner-${Date.now()}`,
      tenantId,
      name,
      email,
      phone: phone || '',
      address: address || {},
      settings: settings || {
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
      ...(email && { email }),
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
