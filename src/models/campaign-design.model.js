/**
 * Campaign Design Model - Single Responsibility: Campaign design data operations
 * Interface Segregation: Only design-specific methods
 */
const BaseModel = require('./base.model');

class CampaignDesignModel extends BaseModel {
  constructor(dbService) {
    super('campaign_designs', dbService);
  }

  // Design-specific methods
  async findByCampaignId(campaignId) {
    return this.findAll({ campaign_id: campaignId }, 'created_at', 'DESC');
  }

  async getLatestByCampaignId(campaignId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE campaign_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return this.dbService.executeQuery(query, [campaignId]);
  }

  async deleteByCampaignId(campaignId) {
    const query = `DELETE FROM ${this.tableName} WHERE campaign_id = $1`;
    return this.dbService.executeQuery(query, [campaignId]);
  }
}

module.exports = CampaignDesignModel;
