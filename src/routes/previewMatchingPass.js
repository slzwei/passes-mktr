/**
 * Preview Matching Pass API Route
 * Generates passes that match the live preview exactly
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const PreviewMatchingPassGenerator = require('../services/previewMatchingPassGenerator');
const logger = require('../utils/logger');

const passGenerator = new PreviewMatchingPassGenerator();

/**
 * POST /api/generate-preview-matching-pass
 * Generate a pass that matches the live preview exactly
 */
router.post('/generate-preview-matching-pass', async (req, res) => {
  try {
    const {
      campaignId,
      campaignName,
      tenantName,
      customerEmail,
      customerName,
      stampsEarned,
      stampsRequired,
      colors,
      images,
      template
    } = req.body;

    // Validate required fields
    if (!campaignName || !tenantName || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: campaignName, tenantName, customerEmail, customerName'
      });
    }

    // Prepare preview data
    const previewData = {
      campaignId: campaignId || '550e8400-e29b-41d4-a716-446655440001',
      campaignName,
      tenantName,
      customerEmail,
      customerName,
      stampsEarned: stampsEarned || 0,
      stampsRequired: stampsRequired || 10
    };

    // Use template from request or default coffee template
    const passTemplate = template || {
      id: 'coffee-pass-template',
      name: 'Coffee Shop Loyalty Card',
      type: 'redemption',
      fields: {
        header: [
          {
            key: 'campaign',
            label: 'Campaign',
            value: '{{campaignName}}',
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        primary: [],
        secondary: [
          {
            key: 'customerInfo',
            label: 'Card Holder',
            value: '{{customerName}}',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'redemptionCounter',
            label: 'Progress',
            value: '{{stampsEarned}} stamps earned',
            textAlignment: 'PKTextAlignmentRight'
          }
        ],
        auxiliary: [
          {
            key: 'nextReward',
            label: 'Next Reward',
            value: 'Free coffee at {{stampsRequired}} stamps',
            textAlignment: 'PKTextAlignmentCenter'
          }
        ],
        back: [
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: 'Valid at participating locations. Not transferable.',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'contact',
            label: 'Contact',
            value: '{{tenantName}} - {{customerEmail}}',
            textAlignment: 'PKTextAlignmentLeft'
          },
          {
            key: 'instructions',
            label: 'Instructions',
            value: 'Show this pass to earn stamps on purchases.',
            textAlignment: 'PKTextAlignmentLeft'
          }
        ]
      },
      colors: {
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(139, 69, 19)',
        label: 'rgb(255, 255, 255)',
        stripBackground: '#DC143C',
        ...colors // Merge with provided colors
      },
      images: {
        logo: null,
        stampIcon: null,
        ...images // Merge with provided images
      },
      rewards: {
        numberOfRewards: 2,
        milestones: [8, 10]
      }
    };

    // Ensure template has required properties
    if (!passTemplate.rewards) {
      passTemplate.rewards = {
        numberOfRewards: 2,
        milestones: [8, 10]
      };
    }

    logger.info('Generating preview-matching pass for:', {
      campaignName,
      customerName,
      stampsEarned,
      stampsRequired
    });

    // Extract custom strip image if provided
    const customStripImage = images && images.stripImage ? images.stripImage : null;
    
    logger.info('Images received:', {
      hasImages: !!images,
      hasStripImage: !!(images && images.stripImage),
      stripImageLength: customStripImage ? customStripImage.length : 0,
      stripImagePrefix: customStripImage ? customStripImage.substring(0, 50) + '...' : 'none'
    });
    
    if (customStripImage) {
      logger.info('Custom strip image provided from frontend');
    } else {
      logger.info('No custom strip image provided, will use server-side generation');
    }

    // Generate the pass
    const passPath = await passGenerator.generatePass(passTemplate, previewData, customStripImage);

    res.json({
      success: true,
      message: 'Preview-matching pass generated successfully',
      passPath,
      passData: {
        campaignName,
        customerName,
        stampsEarned,
        stampsRequired,
        colors: passTemplate.colors
      }
    });

  } catch (error) {
    logger.error('Error generating preview-matching pass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview-matching pass',
      details: error.message
    });
  }
});

/**
 * GET /api/preview-matching-pass/:filename
 * Download the generated pass file
 */
router.get('/preview-matching-pass/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({
      success: false,
      error: 'Pass file not found'
    });
  }
});

module.exports = router;
