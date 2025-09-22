/**
 * Campaign Details Model - Single Responsibility: Campaign details data operations
 * Interface Segregation: Only details-specific methods
 */
const BaseModel = require('./base.model');

class CampaignDetailsModel extends BaseModel {
  constructor(dbService) {
    super('campaign_details', dbService);
  }

  // Details-specific methods
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

module.exports = CampaignDetailsModel;
