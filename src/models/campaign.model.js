/**
 * Campaign Model - Single Responsibility: Campaign data operations
 * Interface Segregation: Only campaign-specific methods
 */
const BaseModel = require('./base.model');

class CampaignModel extends BaseModel {
  constructor(dbService) {
    super('campaigns', dbService);
  }

  // Campaign-specific methods
  async findByTenantId(tenantId) {
    return this.findAll({ tenant_id: tenantId });
  }

  async findActiveByTenantId(tenantId) {
    return this.findAll({ tenant_id: tenantId, is_active: true });
  }

  async findByStatusAndTenantId(status, tenantId) {
    return this.findAll({ status, tenant_id: tenantId });
  }

  async updateStatus(id, status) {
    return this.update(id, { status, updated_at: new Date() });
  }

  async activate(id) {
    return this.update(id, { is_active: true, status: 'active', updated_at: new Date() });
  }

  async deactivate(id) {
    return this.update(id, { is_active: false, status: 'draft', updated_at: new Date() });
  }

  async findByTypeAndTenantId(type, tenantId) {
    return this.findAll({ type, tenant_id: tenantId });
  }

  async searchByName(name, tenantId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND name ILIKE $2
      ORDER BY name
    `;
    return this.dbService.executeQuery(query, [tenantId, `%${name}%`]);
  }
}

module.exports = CampaignModel;
