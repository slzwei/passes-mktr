const express = require('express');
const { body, validationResult } = require('express-validator');
const PassSigner = require('../services/passSigner');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize pass signer
const passSigner = new PassSigner();

/**
 * POST /api/passes/generate
 * Generate a new pass
 */
router.post('/generate', [
  body('campaignId').isUUID().withMessage('Valid campaign ID required'),
  body('customerEmail').isEmail().withMessage('Valid email required'),
  body('campaignName').notEmpty().withMessage('Campaign name required'),
  body('tenantName').notEmpty().withMessage('Tenant name required'),
  body('partnerId').optional().isUUID().withMessage('Partner ID must be a valid UUID'),
  body('stampsRequired').optional().isInt({ min: 1, max: 100 }).withMessage('Stamps required must be 1-100'),
  body('stampsEarned').optional().isInt({ min: 0 }).withMessage('Stamps earned must be non-negative'),
  body('colors').optional().isObject().withMessage('Colors must be an object'),
  body('images').optional().isObject().withMessage('Images must be an object')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      campaignId,
      customerEmail,
      campaignName,
      tenantName,
      partnerId,
      stampsRequired = 10,
      stampsEarned = 0,
      colors = {},
      images = {}
    } = req.body;

    // Check if campaign exists and is active
    const campaignResult = await query(
      'SELECT * FROM campaigns WHERE id = $1 AND is_active = true',
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Campaign not found or inactive'
      });
    }

    const campaign = campaignResult.rows[0];

    // Generate serial number
    const serialNumber = `PASS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create pass data
    const passData = {
      campaignId,
      partnerId,
      serialNumber,
      customerEmail,
      campaignName,
      tenantName,
      stampsRequired: campaign.stamps_required || stampsRequired,
      stampsEarned,
      colors,
      images
    };

    // Validate pass data
    passSigner.validatePassData(passData);

    // Generate pass
    const pkpassPath = await passSigner.generatePass(passData);

    // Save pass record to database
    const passResult = await query(
      `INSERT INTO passes (id, campaign_id, serial_number, customer_email, stamps_earned, stamps_required, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), campaignId, serialNumber, customerEmail, stampsEarned, campaign.stamps_required || stampsRequired]
    );

    const pass = passResult.rows[0];

    logger.logPassOperation('pass_created', {
      passId: pass.id,
      serialNumber: pass.serial_number,
      campaignId,
      customerEmail
    });

    res.json({
      success: true,
      pass: {
        id: pass.id,
        serialNumber: pass.serial_number,
        downloadUrl: `/api/passes/${pass.id}/download`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

  } catch (error) {
    logger.error('Pass generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate pass',
      message: error.message
    });
  }
});

/**
 * GET /api/passes/:id/download
 * Download .pkpass file
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    // Get pass record
    const passResult = await query(
      'SELECT * FROM passes WHERE id = $1',
      [id]
    );

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pass not found'
      });
    }

    const pass = passResult.rows[0];

    // Check if .pkpass file exists
    const fs = require('fs');
    const path = require('path');
    const pkpassPath = path.join(process.cwd(), 'storage', 'passes', `${id}.pkpass`);

    if (!fs.existsSync(pkpassPath)) {
      return res.status(404).json({
        error: 'Pass file not found'
      });
    }

    // Set headers for .pkpass download
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${pass.serial_number}.pkpass"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Stream the file
    const fileStream = fs.createReadStream(pkpassPath);
    fileStream.pipe(res);

    logger.logPassOperation('pass_downloaded', {
      passId: id,
      serialNumber: pass.serial_number
    });

  } catch (error) {
    logger.error('Pass download failed:', error);
    res.status(500).json({
      error: 'Failed to download pass'
    });
  }
});

/**
 * GET /api/passes/:id
 * Get pass details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const passResult = await query(
      `SELECT p.*, c.name as campaign_name, c.description as campaign_description,
              t.name as tenant_name
       FROM passes p
       JOIN campaigns c ON p.campaign_id = c.id
       JOIN tenants t ON c.tenant_id = t.id
       WHERE p.id = $1`,
      [id]
    );

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pass not found'
      });
    }

    const pass = passResult.rows[0];

    res.json({
      pass: {
        id: pass.id,
        serialNumber: pass.serial_number,
        customerEmail: pass.customer_email,
        stampsEarned: pass.stamps_earned,
        stampsRequired: pass.stamps_required,
        isRedeemed: pass.is_redeemed,
        campaign: {
          id: pass.campaign_id,
          name: pass.campaign_name,
          description: pass.campaign_description
        },
        tenant: {
          name: pass.tenant_name
        },
        createdAt: pass.created_at,
        updatedAt: pass.updated_at
      }
    });

  } catch (error) {
    logger.error('Pass retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve pass'
    });
  }
});

/**
 * POST /api/passes/:id/register-device
 * Register device for push notifications
 */
router.post('/:id/register-device', [
  body('deviceToken').notEmpty().withMessage('Device token required'),
  body('pushToken').notEmpty().withMessage('Push token required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { deviceToken, pushToken } = req.body;

    // Check if pass exists
    const passResult = await query(
      'SELECT * FROM passes WHERE id = $1',
      [id]
    );

    if (passResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pass not found'
      });
    }

    // Register device
    await query(
      `INSERT INTO devices (id, pass_id, device_token, push_token, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (pass_id, device_token) 
       DO UPDATE SET push_token = $4, updated_at = NOW()`,
      [uuidv4(), id, deviceToken, pushToken]
    );

    logger.logPassOperation('device_registered', {
      passId: id,
      deviceToken: deviceToken.substring(0, 10) + '...'
    });

    res.json({
      success: true,
      message: 'Device registered successfully'
    });

  } catch (error) {
    logger.error('Device registration failed:', error);
    res.status(500).json({
      error: 'Failed to register device'
    });
  }
});

module.exports = router;
