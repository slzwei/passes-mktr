/**
 * Template Model - Single Responsibility: Template data operations
 * Interface Segregation: Only template-specific methods
 */
const BaseModel = require('./base.model');

class TemplateModel extends BaseModel {
  constructor(dbService) {
    super('templates', dbService);
  }

  // Template-specific methods
  async findByTenantId(tenantId) {
    return this.findAll({ tenant_id: tenantId });
  }

  async searchByName(name, tenantId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND name ILIKE $2
      ORDER BY name
    `;
    return this.dbService.executeQuery(query, [tenantId, `%${name}%`]);
  }

  async findActiveByTenantId(tenantId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `;
    return this.dbService.executeQuery(query, [tenantId]);
  }
}

module.exports = TemplateModel;
