-- Database initialization for Passes MKTR
-- This file will be executed when the PostgreSQL container starts

-- Create custom types
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE campaign_type AS ENUM ('redemption', 'points', 'milestone');

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type campaign_type NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    status campaign_status DEFAULT 'draft',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    design JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create campaign designs table
CREATE TABLE IF NOT EXISTS campaign_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    design_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create campaign details table
CREATE TABLE IF NOT EXISTS campaign_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    details_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create campaign previews table
CREATE TABLE IF NOT EXISTS campaign_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    preview_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create passes table for storing pass metadata (not .pkpass files)
CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_email VARCHAR(255),
    stamps_earned INTEGER DEFAULT 0,
    stamps_required INTEGER DEFAULT 10,
    is_redeemed BOOLEAN DEFAULT false,
    auth_token VARCHAR(255), -- For Apple PassKit authentication
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create device registrations table for Apple PassKit web service
CREATE TABLE IF NOT EXISTS device_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_library_identifier VARCHAR(255) NOT NULL,
    pass_type_identifier VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) REFERENCES passes(serial_number) ON DELETE CASCADE,
    push_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(device_library_identifier, pass_type_identifier, serial_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_designs_campaign_id ON campaign_designs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_details_campaign_id ON campaign_details(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_previews_campaign_id ON campaign_previews(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign_id ON analytics_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_tenant_id ON templates(tenant_id);

-- Indexes for passes and device registrations
CREATE INDEX IF NOT EXISTS idx_passes_serial_number ON passes(serial_number);
CREATE INDEX IF NOT EXISTS idx_passes_campaign_id ON passes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_passes_updated_at ON passes(updated_at);
CREATE INDEX IF NOT EXISTS idx_device_registrations_device ON device_registrations(device_library_identifier);
CREATE INDEX IF NOT EXISTS idx_device_registrations_serial ON device_registrations(serial_number);

-- Insert default tenant
INSERT INTO tenants (id, name, settings)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Default Tenant', '{}')
ON CONFLICT DO NOTHING;

-- Insert default tenant with string ID for compatibility
INSERT INTO tenants (id, name, settings)
VALUES ('tenant-1', 'Default Tenant', '{}')
ON CONFLICT DO NOTHING;
