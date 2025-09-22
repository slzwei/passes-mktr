#!/usr/bin/env node

/**
 * Script to generate preview images for all campaigns
 * This helps debug and ensure all campaigns have preview images
 */

const PersistenceService = require('../services/persistenceService');
const PreviewGeneratorService = require('../services/previewGeneratorService');
const logger = require('../utils/logger');

async function generateAllPreviews() {
  try {
    logger.info('🚀 Starting preview generation for all campaigns');

    // Initialize services
    const persistenceService = new PersistenceService();
    const previewGeneratorService = new PreviewGeneratorService();

    // Get all campaigns
    const campaigns = await persistenceService.getAllCampaigns();
    logger.info(`Found ${campaigns.length} campaigns to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each campaign
    for (const campaign of campaigns) {
      try {
        logger.info(`Processing campaign: ${campaign.id}`);

        // Normalize campaign data
        const normalizedCampaign = persistenceService.normalizeDesignData(campaign);

        // Check if preview exists
        const previewExists = await previewGeneratorService.previewExists(campaign.id);

        if (previewExists) {
          logger.info(`✅ Preview already exists for ${campaign.id}`);
          successCount++;
          continue;
        }

        // Generate preview
        logger.info(`🔄 Generating preview for ${campaign.id}`);
        await previewGeneratorService.generateCampaignPreview(campaign.id, normalizedCampaign);

        logger.info(`✅ Successfully generated preview for ${campaign.id}`);
        successCount++;

      } catch (error) {
        logger.error(`❌ Failed to generate preview for ${campaign.id}:`, error);
        errorCount++;
      }
    }

    logger.info(`🎉 Preview generation completed!`);
    logger.info(`✅ Success: ${successCount}`);
    logger.info(`❌ Errors: ${errorCount}`);
    logger.info(`📊 Total: ${campaigns.length}`);

    process.exit(0);

  } catch (error) {
    logger.error('💥 Failed to generate previews:', error);
    process.exit(1);
  }
}

// Run the script
generateAllPreviews();
