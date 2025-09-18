const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.analyticsDir = path.join(process.cwd(), 'storage', 'analytics');
    this.eventsDir = path.join(this.analyticsDir, 'events');
    this.reportsDir = path.join(this.analyticsDir, 'reports');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.analyticsDir, { recursive: true });
      await fs.mkdir(this.eventsDir, { recursive: true });
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize analytics directories:', error);
    }
  }

  /**
   * Track an analytics event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @param {string} userId - User ID (optional)
   * @returns {Promise<void>}
   */
  async trackEvent(eventType, eventData, userId = null) {
    try {
      const event = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        data: eventData,
        userId,
        timestamp: new Date().toISOString(),
        sessionId: eventData.sessionId || null,
        ip: eventData.ip || null,
        userAgent: eventData.userAgent || null
      };

      // Save event to file
      const date = new Date().toISOString().split('T')[0];
      const eventFile = path.join(this.eventsDir, `${date}.jsonl`);
      
      await fs.appendFile(eventFile, JSON.stringify(event) + '\n');

      logger.debug('Analytics event tracked:', {
        eventType,
        userId,
        eventId: event.id
      });
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track template events
   */
  async trackTemplateCreated(templateId, userId, templateData) {
    await this.trackEvent('template_created', {
      templateId,
      templateName: templateData.name,
      templateType: templateData.passType,
      category: templateData.category,
      isPublic: templateData.isPublic
    }, userId);
  }

  async trackTemplateViewed(templateId, userId) {
    await this.trackEvent('template_viewed', {
      templateId
    }, userId);
  }

  async trackTemplateEdited(templateId, userId, changes) {
    await this.trackEvent('template_edited', {
      templateId,
      changesCount: changes.length,
      fieldsChanged: changes.map(c => c.field)
    }, userId);
  }

  async trackTemplateShared(templateId, userId, shareData) {
    await this.trackEvent('template_shared', {
      templateId,
      shareType: shareData.type, // 'public', 'team', 'specific_users'
      recipientCount: shareData.recipientCount || 0
    }, userId);
  }

  async trackTemplateDownloaded(templateId, userId, format) {
    await this.trackEvent('template_downloaded', {
      templateId,
      format
    }, userId);
  }

  /**
   * Track pass events
   */
  async trackPassGenerated(passId, templateId, userId, passData) {
    await this.trackEvent('pass_generated', {
      passId,
      templateId,
      passType: passData.passType,
      hasBarcode: !!passData.barcode,
      fieldCount: this.countFields(passData)
    }, userId);
  }

  async trackPassExported(passId, templateId, userId, exportData) {
    await this.trackEvent('pass_exported', {
      passId,
      templateId,
      fileSize: exportData.fileSize,
      exportTime: exportData.exportTime
    }, userId);
  }

  async trackPassValidated(passId, templateId, userId, validationResult) {
    await this.trackEvent('pass_validated', {
      passId,
      templateId,
      isValid: validationResult.valid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    }, userId);
  }

  /**
   * Track user events
   */
  async trackUserLogin(userId, loginData) {
    await this.trackEvent('user_login', {
      loginMethod: loginData.method, // 'email', 'oauth', 'sso'
      isFirstLogin: loginData.isFirstLogin || false
    }, userId);
  }

  async trackUserLogout(userId) {
    await this.trackEvent('user_logout', {}, userId);
  }

  async trackUserRegistration(userId, registrationData) {
    await this.trackEvent('user_registration', {
      registrationMethod: registrationData.method,
      source: registrationData.source || 'direct'
    }, userId);
  }

  /**
   * Track collaboration events
   */
  async trackCollaborationSessionStarted(templateId, userId, sessionData) {
    await this.trackEvent('collaboration_session_started', {
      templateId,
      participantCount: sessionData.participantCount || 1
    }, userId);
  }

  async trackCollaborationSessionEnded(templateId, userId, sessionData) {
    await this.trackEvent('collaboration_session_ended', {
      templateId,
      duration: sessionData.duration,
      changesCount: sessionData.changesCount || 0
    }, userId);
  }

  async trackRealTimeEdit(templateId, userId, editData) {
    await this.trackEvent('realtime_edit', {
      templateId,
      field: editData.field,
      editType: editData.type
    }, userId);
  }

  /**
   * Track system events
   */
  async trackApiRequest(endpoint, method, userId, responseTime, statusCode) {
    await this.trackEvent('api_request', {
      endpoint,
      method,
      responseTime,
      statusCode
    }, userId);
  }

  async trackError(error, context) {
    await this.trackEvent('error', {
      errorType: error.name,
      errorMessage: error.message,
      stack: error.stack,
      context
    });
  }

  async trackPerformance(metric, value, context) {
    await this.trackEvent('performance', {
      metric,
      value,
      context
    });
  }

  /**
   * Get analytics data for a date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @param {Array} eventTypes - Event types to include
   * @returns {Promise<Array>} - Analytics events
   */
  async getAnalyticsData(startDate, endDate, eventTypes = []) {
    try {
      const events = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all dates in range
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Read events from each date file
      for (const date of dates) {
        try {
          const eventFile = path.join(this.eventsDir, `${date}.jsonl`);
          const fileContent = await fs.readFile(eventFile, 'utf8');
          
          const lines = fileContent.trim().split('\n').filter(line => line);
          for (const line of lines) {
            const event = JSON.parse(line);
            
            // Filter by event types if specified
            if (eventTypes.length === 0 || eventTypes.includes(event.type)) {
              events.push(event);
            }
          }
        } catch (error) {
          // File might not exist for this date
          if (error.code !== 'ENOENT') {
            logger.warn('Failed to read analytics file:', { date, error: error.message });
          }
        }
      }

      return events;
    } catch (error) {
      logger.error('Failed to get analytics data:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {string} reportType - Type of report
   * @returns {Promise<Object>} - Analytics report
   */
  async generateReport(startDate, endDate, reportType = 'overview') {
    try {
      const events = await this.getAnalyticsData(startDate, endDate);
      
      switch (reportType) {
        case 'overview':
          return this.generateOverviewReport(events, startDate, endDate);
        case 'templates':
          return this.generateTemplateReport(events, startDate, endDate);
        case 'users':
          return this.generateUserReport(events, startDate, endDate);
        case 'performance':
          return this.generatePerformanceReport(events, startDate, endDate);
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      logger.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Generate overview report
   */
  generateOverviewReport(events, startDate, endDate) {
    const report = {
      period: { startDate, endDate },
      summary: {
        totalEvents: events.length,
        uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
        eventTypes: {}
      },
      templates: {
        created: events.filter(e => e.type === 'template_created').length,
        viewed: events.filter(e => e.type === 'template_viewed').length,
        edited: events.filter(e => e.type === 'template_edited').length,
        shared: events.filter(e => e.type === 'template_shared').length,
        downloaded: events.filter(e => e.type === 'template_downloaded').length
      },
      passes: {
        generated: events.filter(e => e.type === 'pass_generated').length,
        exported: events.filter(e => e.type === 'pass_exported').length,
        validated: events.filter(e => e.type === 'pass_validated').length
      },
      collaboration: {
        sessionsStarted: events.filter(e => e.type === 'collaboration_session_started').length,
        sessionsEnded: events.filter(e => e.type === 'collaboration_session_ended').length,
        realtimeEdits: events.filter(e => e.type === 'realtime_edit').length
      },
      system: {
        apiRequests: events.filter(e => e.type === 'api_request').length,
        errors: events.filter(e => e.type === 'error').length,
        performanceEvents: events.filter(e => e.type === 'performance').length
      }
    };

    // Count events by type
    events.forEach(event => {
      report.summary.eventTypes[event.type] = (report.summary.eventTypes[event.type] || 0) + 1;
    });

    return report;
  }

  /**
   * Generate template-specific report
   */
  generateTemplateReport(events, startDate, endDate) {
    const templateEvents = events.filter(e => 
      ['template_created', 'template_viewed', 'template_edited', 'template_shared', 'template_downloaded'].includes(e.type)
    );

    const templateStats = {};
    
    templateEvents.forEach(event => {
      const templateId = event.data.templateId;
      if (!templateId) return;

      if (!templateStats[templateId]) {
        templateStats[templateId] = {
          templateId,
          name: event.data.templateName || 'Unknown',
          type: event.data.templateType || 'unknown',
          created: 0,
          viewed: 0,
          edited: 0,
          shared: 0,
          downloaded: 0,
          uniqueViewers: new Set(),
          lastActivity: event.timestamp
        };
      }

      const stats = templateStats[templateId];
      stats[event.type.replace('template_', '')]++;
      
      if (event.userId) {
        stats.uniqueViewers.add(event.userId);
      }
      
      if (new Date(event.timestamp) > new Date(stats.lastActivity)) {
        stats.lastActivity = event.timestamp;
      }
    });

    // Convert sets to counts
    Object.values(templateStats).forEach(stats => {
      stats.uniqueViewers = stats.uniqueViewers.size;
    });

    return {
      period: { startDate, endDate },
      templates: Object.values(templateStats).sort((a, b) => b.viewed - a.viewed),
      summary: {
        totalTemplates: Object.keys(templateStats).length,
        mostViewed: Object.values(templateStats).sort((a, b) => b.viewed - a.viewed)[0],
        mostActive: Object.values(templateStats).sort((a, b) => b.edited - a.edited)[0]
      }
    };
  }

  /**
   * Generate user-specific report
   */
  generateUserReport(events, startDate, endDate) {
    const userEvents = events.filter(e => e.userId);
    const userStats = {};

    userEvents.forEach(event => {
      const userId = event.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          events: 0,
          templatesCreated: 0,
          templatesViewed: 0,
          passesGenerated: 0,
          passesExported: 0,
          collaborationSessions: 0,
          firstActivity: event.timestamp,
          lastActivity: event.timestamp
        };
      }

      const stats = userStats[userId];
      stats.events++;
      
      switch (event.type) {
        case 'template_created':
          stats.templatesCreated++;
          break;
        case 'template_viewed':
          stats.templatesViewed++;
          break;
        case 'pass_generated':
          stats.passesGenerated++;
          break;
        case 'pass_exported':
          stats.passesExported++;
          break;
        case 'collaboration_session_started':
          stats.collaborationSessions++;
          break;
      }

      if (new Date(event.timestamp) < new Date(stats.firstActivity)) {
        stats.firstActivity = event.timestamp;
      }
      if (new Date(event.timestamp) > new Date(stats.lastActivity)) {
        stats.lastActivity = event.timestamp;
      }
    });

    return {
      period: { startDate, endDate },
      users: Object.values(userStats).sort((a, b) => b.events - a.events),
      summary: {
        totalUsers: Object.keys(userStats).length,
        mostActive: Object.values(userStats).sort((a, b) => b.events - a.events)[0],
        newUsers: Object.values(userStats).filter(u => 
          new Date(u.firstActivity) >= new Date(startDate)
        ).length
      }
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(events, startDate, endDate) {
    const performanceEvents = events.filter(e => e.type === 'performance');
    const apiEvents = events.filter(e => e.type === 'api_request');
    const errorEvents = events.filter(e => e.type === 'error');

    const performanceMetrics = {};
    performanceEvents.forEach(event => {
      const metric = event.data.metric;
      if (!performanceMetrics[metric]) {
        performanceMetrics[metric] = [];
      }
      performanceMetrics[metric].push(event.data.value);
    });

    const apiStats = {
      totalRequests: apiEvents.length,
      averageResponseTime: 0,
      statusCodes: {},
      slowestEndpoints: {}
    };

    if (apiEvents.length > 0) {
      const totalResponseTime = apiEvents.reduce((sum, event) => sum + (event.data.responseTime || 0), 0);
      apiStats.averageResponseTime = totalResponseTime / apiEvents.length;

      apiEvents.forEach(event => {
        const statusCode = event.data.statusCode;
        apiStats.statusCodes[statusCode] = (apiStats.statusCodes[statusCode] || 0) + 1;

        const endpoint = event.data.endpoint;
        if (!apiStats.slowestEndpoints[endpoint]) {
          apiStats.slowestEndpoints[endpoint] = [];
        }
        apiStats.slowestEndpoints[endpoint].push(event.data.responseTime || 0);
      });

      // Calculate average response time per endpoint
      Object.keys(apiStats.slowestEndpoints).forEach(endpoint => {
        const times = apiStats.slowestEndpoints[endpoint];
        apiStats.slowestEndpoints[endpoint] = {
          count: times.length,
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          maxTime: Math.max(...times)
        };
      });
    }

    return {
      period: { startDate, endDate },
      performance: performanceMetrics,
      api: apiStats,
      errors: {
        total: errorEvents.length,
        byType: {},
        recent: errorEvents.slice(-10).map(e => ({
          type: e.data.errorType,
          message: e.data.errorMessage,
          timestamp: e.timestamp
        }))
      }
    };
  }

  /**
   * Count fields in pass data
   */
  countFields(passData) {
    let count = 0;
    
    if (passData.generic) {
      Object.values(passData.generic).forEach(fieldArray => {
        if (Array.isArray(fieldArray)) {
          count += fieldArray.length;
        }
      });
    }
    
    if (passData.storeCard) {
      Object.values(passData.storeCard).forEach(fieldArray => {
        if (Array.isArray(fieldArray)) {
          count += fieldArray.length;
        }
      });
    }
    
    return count;
  }

  /**
   * Clean up old analytics data
   * @param {number} daysToKeep - Number of days to keep (default: 90)
   * @returns {Promise<number>} - Number of files cleaned up
   */
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const files = await fs.readdir(this.eventsDir);
      let cleanedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue;
        
        const fileDate = new Date(file.replace('.jsonl', ''));
        if (fileDate < cutoffDate) {
          const filePath = path.join(this.eventsDir, file);
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      logger.info('Cleaned up old analytics data:', {
        cleanedCount,
        daysToKeep
      });

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old analytics data:', error);
      return 0;
    }
  }
}

module.exports = AnalyticsService;
