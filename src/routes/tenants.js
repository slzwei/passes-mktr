const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock tenant data for now
const mockTenants = [
  {
    id: 'tenant-1',
    name: 'MKTR Platform',
    domain: 'mktr.sg',
    settings: {
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logo: null
      },
      features: {
        passGeneration: true,
        analytics: true,
        customFields: true
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/tenants - List all tenants
router.get('/', (req, res) => {
  try {
    logger.info('Fetching tenants list');
    res.json({
      success: true,
      data: mockTenants,
      count: mockTenants.length
    });
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
});

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tenant = mockTenants.find(t => t.id === id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    logger.info(`Fetching tenant: ${id}`);
    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant'
    });
  }
});

// POST /api/tenants - Create new tenant
router.post('/', (req, res) => {
  try {
    const { name, domain, settings } = req.body;
    
    if (!name || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Name and domain are required'
      });
    }
    
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name,
      domain,
      settings: settings || {
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          logo: null
        },
        features: {
          passGeneration: true,
          analytics: true,
          customFields: true
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockTenants.push(newTenant);
    
    logger.info(`Created new tenant: ${newTenant.id}`);
    res.status(201).json({
      success: true,
      data: newTenant
    });
  } catch (error) {
    logger.error('Error creating tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tenant'
    });
  }
});

// PUT /api/tenants/:id - Update tenant
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, settings } = req.body;
    
    const tenantIndex = mockTenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    const updatedTenant = {
      ...mockTenants[tenantIndex],
      ...(name && { name }),
      ...(domain && { domain }),
      ...(settings && { settings }),
      updatedAt: new Date().toISOString()
    };
    
    mockTenants[tenantIndex] = updatedTenant;
    
    logger.info(`Updated tenant: ${id}`);
    res.json({
      success: true,
      data: updatedTenant
    });
  } catch (error) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant'
    });
  }
});

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tenantIndex = mockTenants.findIndex(t => t.id === id);
    
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    mockTenants.splice(tenantIndex, 1);
    
    logger.info(`Deleted tenant: ${id}`);
    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tenant'
    });
  }
});

module.exports = router;
