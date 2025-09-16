const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock redemption data for now
const mockRedemptions = [
  {
    id: 'redemption-1',
    campaignId: 'campaign-1',
    customerId: 'customer-1',
    customerEmail: 'customer@example.com',
    partnerId: 'partner-1',
    type: 'stamp',
    status: 'completed',
    details: {
      stampsEarned: 1,
      totalStamps: 7,
      stampsRequired: 10,
      reward: 'Free coffee'
    },
    metadata: {
      transactionId: 'txn-123',
      amount: 5.50,
      currency: 'SGD'
    },
    redeemedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/redemptions - List all redemptions
router.get('/', (req, res) => {
  try {
    const { campaignId, customerId, partnerId, status, type } = req.query;
    let filteredRedemptions = [...mockRedemptions];
    
    if (campaignId) {
      filteredRedemptions = filteredRedemptions.filter(r => r.campaignId === campaignId);
    }
    
    if (customerId) {
      filteredRedemptions = filteredRedemptions.filter(r => r.customerId === customerId);
    }
    
    if (partnerId) {
      filteredRedemptions = filteredRedemptions.filter(r => r.partnerId === partnerId);
    }
    
    if (status) {
      filteredRedemptions = filteredRedemptions.filter(r => r.status === status);
    }
    
    if (type) {
      filteredRedemptions = filteredRedemptions.filter(r => r.type === type);
    }
    
    logger.info('Fetching redemptions list');
    res.json({
      success: true,
      data: filteredRedemptions,
      count: filteredRedemptions.length
    });
  } catch (error) {
    logger.error('Error fetching redemptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemptions'
    });
  }
});

// GET /api/redemptions/:id - Get redemption by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const redemption = mockRedemptions.find(r => r.id === id);
    
    if (!redemption) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found'
      });
    }
    
    logger.info(`Fetching redemption: ${id}`);
    res.json({
      success: true,
      data: redemption
    });
  } catch (error) {
    logger.error('Error fetching redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemption'
    });
  }
});

// POST /api/redemptions - Create new redemption
router.post('/', (req, res) => {
  try {
    const { campaignId, customerId, customerEmail, partnerId, type, details, metadata } = req.body;
    
    if (!campaignId || !customerId || !customerEmail || !type) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID, customer ID, customer email, and type are required'
      });
    }
    
    const newRedemption = {
      id: `redemption-${Date.now()}`,
      campaignId,
      customerId,
      customerEmail,
      partnerId: partnerId || null,
      type,
      status: 'pending',
      details: details || {},
      metadata: metadata || {},
      redeemedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockRedemptions.push(newRedemption);
    
    logger.info(`Created new redemption: ${newRedemption.id}`);
    res.status(201).json({
      success: true,
      data: newRedemption
    });
  } catch (error) {
    logger.error('Error creating redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create redemption'
    });
  }
});

// PUT /api/redemptions/:id - Update redemption
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, details, metadata } = req.body;
    
    const redemptionIndex = mockRedemptions.findIndex(r => r.id === id);
    if (redemptionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found'
      });
    }
    
    const updatedRedemption = {
      ...mockRedemptions[redemptionIndex],
      ...(status && { status }),
      ...(details && { details }),
      ...(metadata && { metadata }),
      ...(status === 'completed' && { redeemedAt: new Date().toISOString() }),
      updatedAt: new Date().toISOString()
    };
    
    mockRedemptions[redemptionIndex] = updatedRedemption;
    
    logger.info(`Updated redemption: ${id}`);
    res.json({
      success: true,
      data: updatedRedemption
    });
  } catch (error) {
    logger.error('Error updating redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update redemption'
    });
  }
});

// DELETE /api/redemptions/:id - Delete redemption
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const redemptionIndex = mockRedemptions.findIndex(r => r.id === id);
    
    if (redemptionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found'
      });
    }
    
    mockRedemptions.splice(redemptionIndex, 1);
    
    logger.info(`Deleted redemption: ${id}`);
    res.json({
      success: true,
      message: 'Redemption deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete redemption'
    });
  }
});

// POST /api/redemptions/:id/complete - Complete redemption
router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const redemptionIndex = mockRedemptions.findIndex(r => r.id === id);
    
    if (redemptionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Redemption not found'
      });
    }
    
    const redemption = mockRedemptions[redemptionIndex];
    if (redemption.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Redemption already completed'
      });
    }
    
    redemption.status = 'completed';
    redemption.redeemedAt = new Date().toISOString();
    redemption.updatedAt = new Date().toISOString();
    
    logger.info(`Completed redemption: ${id}`);
    res.json({
      success: true,
      data: redemption
    });
  } catch (error) {
    logger.error('Error completing redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete redemption'
    });
  }
});

module.exports = router;
