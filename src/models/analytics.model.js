/**
 * Analytics Model - Single Responsibility: Analytics data operations
 * Interface Segregation: Only analytics-specific methods
 */
const BaseModel = require('./base.model');

class AnalyticsModel extends BaseModel {
  constructor(dbService) {
    super('analytics_events', dbService);
  }

  // Analytics-specific methods
  async findByCampaignId(campaignId) {
    return this.findAll({ campaign_id: campaignId }, 'created_at', 'DESC');
  }

  async findByEventTypeAndCampaignId(eventType, campaignId) {
    return this.findAll({ event_type: eventType, campaign_id: campaignId }, 'created_at', 'DESC');
  }

  async getCampaignStats(campaignId, startDate, endDate) {
    const query = `
      SELECT
        event_type,
        COUNT(*) as count,
        COUNT(DISTINCT CASE WHEN event_data->>'user_id' IS NOT NULL THEN event_data->>'user_id' END) as unique_users
      FROM ${this.tableName}
      WHERE campaign_id = $1
        AND created_at BETWEEN $2 AND $3
      GROUP BY event_type
      ORDER BY count DESC
    `;
    return this.dbService.executeQuery(query, [campaignId, startDate, endDate]);
  }

  async getRecentEvents(limit = 50) {
    const query = `
      SELECT * FROM ${this.tableName}
      ORDER BY created_at DESC
      LIMIT $1
    `;
    return this.dbService.executeQuery(query, [limit]);
  }

  async aggregateByDate(campaignId, startDate, endDate) {
    const query = `
      SELECT
        DATE(created_at) as date,
        event_type,
        COUNT(*) as count
      FROM ${this.tableName}
      WHERE campaign_id = $1
        AND created_at BETWEEN $2 AND $3
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC, event_type
    `;
    return this.dbService.executeQuery(query, [campaignId, startDate, endDate]);
  }
}

module.exports = AnalyticsModel;
