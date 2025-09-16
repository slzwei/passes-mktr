const { connectDatabase, query } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function setupDatabase() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Create tables
    await createTables();
    logger.info('Database tables created successfully');

    // Create indexes
    await createIndexes();
    logger.info('Database indexes created successfully');

    logger.info('Database setup completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
}

async function createTables() {
  // Tenants table
  await query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      apple_team_id VARCHAR(20),
      pass_type_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Campaigns table
  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      stamps_required INTEGER DEFAULT 10,
      reward_description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Passes table
  await query(`
    CREATE TABLE IF NOT EXISTS passes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      serial_number VARCHAR(255) UNIQUE NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      stamps_earned INTEGER DEFAULT 0,
      stamps_required INTEGER DEFAULT 10,
      is_redeemed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Devices table (for APNs)
  await query(`
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pass_id UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
      device_token VARCHAR(255) NOT NULL,
      push_token VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(pass_id, device_token)
    )
  `);

  // Partners table
  await query(`
    CREATE TABLE IF NOT EXISTS partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Redemptions table
  await query(`
    CREATE TABLE IF NOT EXISTS redemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pass_id UUID NOT NULL REFERENCES passes(id) ON DELETE CASCADE,
      partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      stamps_added INTEGER DEFAULT 0,
      redemption_type VARCHAR(20) NOT NULL CHECK (redemption_type IN ('stamp', 'reward')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Pass designs table (for WYSIWYG editor)
  await query(`
    CREATE TABLE IF NOT EXISTS pass_designs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      design_data JSONB NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function createIndexes() {
  // Performance indexes
  await query('CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active)');
  await query('CREATE INDEX IF NOT EXISTS idx_passes_campaign_id ON passes(campaign_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_passes_serial_number ON passes(serial_number)');
  await query('CREATE INDEX IF NOT EXISTS idx_passes_customer_email ON passes(customer_email)');
  await query('CREATE INDEX IF NOT EXISTS idx_devices_pass_id ON devices(pass_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_partners_tenant_id ON partners(tenant_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_redemptions_pass_id ON redemptions(pass_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_redemptions_partner_id ON redemptions(partner_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_pass_designs_campaign_id ON pass_designs(campaign_id)');
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, createTables, createIndexes };
