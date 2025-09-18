const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
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
  body('customerName').optional().isString().withMessage('Customer name must be a string'),
  body('campaignName').notEmpty().withMessage('Campaign name required'),
  body('tenantName').notEmpty().withMessage('Tenant name required'),
  body('partnerId').optional().isUUID().withMessage('Partner ID must be a valid UUID'),
  body('stampsRequired').optional().isInt({ min: 0, max: 100 }).withMessage('Stamps required must be 0-100'),
  body('stampsEarned').optional().isInt({ min: 0 }).withMessage('Stamps earned must be non-negative'),
  body('cleanStrip').optional().isBoolean().withMessage('Clean strip must be a boolean'),
  body('colors').optional().isObject().withMessage('Colors must be an object'),
  body('images').optional().isObject().withMessage('Images must be an object'),
  body('fieldConfig').optional().isObject().withMessage('Field configuration must be an object')
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
      customerName,
      campaignName,
      tenantName,
      partnerId,
      stampsRequired = 10,
      stampsEarned = 0,
      cleanStrip = false,
      colors = {},
      images = {},
      fieldConfig = null
    } = req.body;

    // Check if campaign exists and is active (or use mock data)
    let campaign;
    try {
      const campaignResult = await query(
        'SELECT * FROM campaigns WHERE id = $1 AND is_active = true',
        [campaignId]
      );

      if (campaignResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Campaign not found or inactive'
        });
      }

      campaign = campaignResult.rows[0];
    } catch (error) {
      // Use mock data when database is not available
      logger.warn('Database not available, using mock campaign data');
      campaign = {
        id: campaignId,
        stamps_required: stampsRequired,
        is_active: true
      };
    }

    // Generate serial number
    const serialNumber = `PASS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create pass data
    const passData = {
      campaignId,
      partnerId,
      serialNumber,
      customerEmail,
      customerName,
      campaignName,
      tenantName,
      stampsRequired: campaign.stamps_required || stampsRequired,
      stampsEarned,
      cleanStrip,
      colors,
      images,
      fieldConfig
    };

    // Debug logging
    console.log('Backend received pass data:', {
      customerName: passData.customerName,
      campaignName: passData.campaignName,
      stampsEarned: passData.stampsEarned,
      stampsRequired: passData.stampsRequired
    });

    // Validate pass data
    passSigner.validatePassData(passData);

    // Generate pass
    const pkpassPath = await passSigner.generatePass(passData);

    // Save pass record to database (or skip if database not available)
    let pass;
    try {
      const passResult = await query(
        `INSERT INTO passes (id, campaign_id, serial_number, customer_email, stamps_earned, stamps_required, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [uuidv4(), campaignId, serialNumber, customerEmail, stampsEarned, campaign.stamps_required || stampsRequired]
      );

      pass = passResult.rows[0];
    } catch (error) {
      // Use mock data when database is not available
      logger.warn('Database not available, using mock pass data');
      pass = {
        id: uuidv4(),
        campaign_id: campaignId,
        serial_number: serialNumber,
        customer_email: customerEmail,
        stamps_earned: stampsEarned,
        stamps_required: campaign.stamps_required || stampsRequired
      };
    }

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
    // Attach provenance headers for Chrome console debugging
    try {
      const prov = passSigner.lastProvenance || {};
      if (prov) {
        if (prov.logo) res.setHeader('X-Pass-Logo', prov.logo);
        if (prov.logo2x) res.setHeader('X-Pass-Logo2x', prov.logo2x);
        if (prov.logo3x) res.setHeader('X-Pass-Logo3x', prov.logo3x);
        if (prov.logoSource) res.setHeader('X-Pass-Logo-Source', String(prov.logoSource));
        if (prov.icon) res.setHeader('X-Pass-Icon', prov.icon);
        if (prov.icon2x) res.setHeader('X-Pass-Icon2x', prov.icon2x);
        if (prov.strip) res.setHeader('X-Pass-Strip', prov.strip);
        if (prov.strip2x) res.setHeader('X-Pass-Strip2x', prov.strip2x);
        if (prov.strip3x) res.setHeader('X-Pass-Strip3x', prov.strip3x);
      }
    } catch {}

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

// Working pass generation route using the existing generator approach
router.post('/generate-working', async (req, res) => {
  try {
    const {
      campaignId,
      campaignName,
      tenantName,
      customerEmail,
      customerName,
      stampsEarned = 0,
      stampsRequired = 10,
      colors = {},
      images = {},
      qrAltText,
      expirationDate,
      hasExpiryDate = false,
      fieldConfig = null
    } = req.body;

    // Use the working PassSigner directly (like in your generator scripts)
    const passSigner = new PassSigner();

    const passData = {
      campaignId: campaignId || '550e8400-e29b-41d4-a716-446655440001',
      campaignName: campaignName || '',
      tenantName: tenantName || 'MKTR Platform',
      customerEmail: customerEmail || 'test@mktr.sg',
      customerName: customerName || 'John Doe',
      stampsEarned: stampsEarned || 0,
      stampsRequired: stampsRequired || 10,
      expirationDate: expirationDate,
      hasExpiryDate: hasExpiryDate,
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)', // Coffee brown
        label: 'rgb(255, 255, 255)',
        ...colors // Use colors from editor
      },
      images: images || {}, // Use images from editor
      qrAltText: qrAltText,
      fieldConfig: fieldConfig
    };

    logger.info('Generating pass using working generator approach', { passData });

    // Map stripImage (from live preview) to "strip" and pass via passData.images
    const imagesPayload = (() => {
      if (images && images.stripImage && !images.strip) {
        const { stripImage, ...rest } = images;
        logger.info('Mapped stripImage to strip for pass generation');
        return { ...rest, strip: stripImage };
      }
      return images || {};
    })();
    // Ensure images are included in passData for PassSigner
    passData.images = imagesPayload;

    // Generate the pass using the provided images/colors
    const pkpassPath = await passSigner.generatePass(passData);

    // Read the generated file and send it
    const passBuffer = await fs.readFile(pkpassPath);
    
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${campaignName.replace(/\s+/g, '_')}_pass.pkpass"`);
    res.send(passBuffer);

    logger.info('Pass generated successfully using working approach', {
      campaignId: passData.campaignId,
      serialNumber: passData.serialNumber,
      fileSize: passBuffer.length
    });

  } catch (error) {
    logger.error('Working pass generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate pass',
      message: error.message
    });
  }
});

module.exports = router;
