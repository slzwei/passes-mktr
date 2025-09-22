/**
 * Migration script to move from JSON file storage to PostgreSQL
 * Run this after setting up the PostgreSQL database
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

async function migrateData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/passes_mktr_dev'
  });

  try {
    console.log('🔄 Starting data migration...');
    await client.connect();

    // 1. Migrate campaigns
    await migrateCampaigns(client);

    // 2. Migrate templates
    await migrateTemplates(client);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

async function migrateCampaigns(client) {
  const campaignsDir = path.join(process.cwd(), 'storage', 'campaigns');

  try {
    const files = await fs.readdir(campaignsDir);
    const campaignFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📁 Found ${campaignFiles.length} campaign files to migrate`);

    for (const file of campaignFiles) {
      const filePath = path.join(campaignsDir, file);
      const campaignId = path.basename(file, '.json');

      try {
        const data = await fs.readFile(filePath, 'utf8');
        const campaign = JSON.parse(data);

        // Insert or update campaign
        await client.query(`
          INSERT INTO campaigns (id, name, description, type, tenant_id, is_active, settings, created_at, updated_at)
          VALUES ($1, $2, $3, $4::campaign_type, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            type = EXCLUDED.type,
            is_active = EXCLUDED.is_active,
            settings = EXCLUDED.settings,
            updated_at = EXCLUDED.updated_at
        `, [
          campaign.id || campaignId,
          campaign.name || 'Untitled Campaign',
          campaign.description || '',
          campaign.type || 'redemption',
          campaign.tenantId || '550e8400-e29b-41d4-a716-446655440000', // Default tenant
          campaign.isActive !== false,
          campaign.settings || {},
          campaign.createdAt || new Date(),
          campaign.updatedAt || new Date()
        ]);

        // Insert campaign design if exists
        if (campaign.design) {
          await client.query(`
            INSERT INTO campaign_designs (campaign_id, design_data, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (campaign_id) DO UPDATE SET
              design_data = EXCLUDED.design_data,
              created_at = EXCLUDED.created_at
          `, [
            campaign.id || campaignId,
            campaign.design,
            new Date()
          ]);
        }

        // Insert campaign details if exists
        if (campaign.details || campaign.campaignDetails) {
          await client.query(`
            INSERT INTO campaign_details (campaign_id, details_data, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (campaign_id) DO UPDATE SET
              details_data = EXCLUDED.details_data,
              created_at = EXCLUDED.created_at
          `, [
            campaign.id || campaignId,
            campaign.details || campaign.campaignDetails || {},
            new Date()
          ]);
        }

        console.log(`✅ Migrated campaign: ${campaign.name || campaignId}`);

      } catch (error) {
        console.error(`❌ Failed to migrate campaign ${campaignId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Failed to read campaigns directory:', error);
  }
}

async function migrateTemplates(client) {
  const templatesDir = path.join(process.cwd(), 'storage', 'templates');

  try {
    const files = await fs.readdir(templatesDir);
    const templateFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📁 Found ${templateFiles.length} template files to migrate`);

    for (const file of templateFiles) {
      const filePath = path.join(templatesDir, file);
      const templateId = path.basename(file, '.json');

      try {
        const data = await fs.readFile(filePath, 'utf8');
        const template = JSON.parse(data);

        await client.query(`
          INSERT INTO templates (id, name, description, template_data, tenant_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            template_data = EXCLUDED.template_data,
            updated_at = EXCLUDED.updated_at
        `, [
          template.id || templateId,
          template.name || 'Untitled Template',
          template.description || '',
          template,
          '550e8400-e29b-41d4-a716-446655440000', // Default tenant
          template.createdAt || new Date(),
          template.updatedAt || new Date()
        ]);

        console.log(`✅ Migrated template: ${template.name || templateId}`);

      } catch (error) {
        console.error(`❌ Failed to migrate template ${templateId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Failed to read templates directory:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
