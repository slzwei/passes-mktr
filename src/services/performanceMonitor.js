const logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      apiCallDuration: 1000, // 1 second
      databaseQueryDuration: 500, // 500ms
      cacheHitRatio: 0.8, // 80%
      memoryUsage: 0.85, // 85%
      errorRate: 0.05 // 5%
    };
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Start periodic metrics collection
    this.startMetricsCollection();
    
    this.initialized = true;
    logger.info('✅ Performance monitor initialized');
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint, method, duration, success, metadata = {}) {
    const key = `api_${method}_${endpoint}`;
    
    this.recordMetric(key, {
      type: 'api_call',
      endpoint,
      method,
      duration,
      success,
      timestamp: Date.now(),
      ...metadata
    });

    // Check for performance alerts
    if (duration > this.thresholds.apiCallDuration) {
      this.triggerAlert('slow_api_call', {
        endpoint,
        method,
        duration,
        threshold: this.thresholds.apiCallDuration
      });
    }

    logger.debug('API call tracked', {
      endpoint,
      method,
      duration: `${duration}ms`,
      success,
      ...metadata
    });
  }

  /**
   * Track database operation performance
   */
  trackDatabaseOperation(operation, query, duration, success, metadata = {}) {
    const key = `db_${operation}`;
    
    this.recordMetric(key, {
      type: 'database_operation',
      operation,
      query: query?.substring(0, 100), // Truncate long queries
      duration,
      success,
      timestamp: Date.now(),
      ...metadata
    });

    // Check for performance alerts
    if (duration > this.thresholds.databaseQueryDuration) {
      this.triggerAlert('slow_database_query', {
        operation,
        query: query?.substring(0, 100),
        duration,
        threshold: this.thresholds.databaseQueryDuration
      });
    }

    logger.debug('Database operation tracked', {
      operation,
      duration: `${duration}ms`,
      success,
      ...metadata
    });
  }

  /**
   * Track cache performance
   */
  trackCacheOperation(operation, key, hit, duration, metadata = {}) {
    const metricKey = `cache_${operation}`;
    
    this.recordMetric(metricKey, {
      type: 'cache_operation',
      operation,
      cacheKey: key,
      hit,
      duration,
      timestamp: Date.now(),
      ...metadata
    });

    logger.debug('Cache operation tracked', {
      operation,
      key,
      hit,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Track image processing performance
   */
  trackImageProcessing(operation, originalSize, optimizedSize, duration, success) {
    const compressionRatio = originalSize > 0 ? 
      ((originalSize - optimizedSize) / originalSize * 100) : 0;
    
    this.recordMetric('image_processing', {
      type: 'image_processing',
      operation,
      originalSize,
      optimizedSize,
      compressionRatio,
      duration,
      success,
      timestamp: Date.now()
    });

    logger.debug('Image processing tracked', {
      operation,
      originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
      optimizedSize: `${(optimizedSize / 1024).toFixed(1)}KB`,
      compression: `${compressionRatio.toFixed(1)}%`,
      duration: `${duration}ms`,
      success
    });
  }

  /**
   * Track WebSocket events
   */
  trackWebSocketEvent(event, data, duration = 0) {
    this.recordMetric('websocket_events', {
      type: 'websocket_event',
      event,
      duration,
      timestamp: Date.now(),
      ...data
    });

    logger.debug('WebSocket event tracked', {
      event,
      duration: duration > 0 ? `${duration}ms` : 'instant',
      ...data
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usageRatio = memUsage.heapUsed / totalMemory;

    this.recordMetric('memory_usage', {
      type: 'memory_usage',
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      usageRatio,
      timestamp: Date.now()
    });

    // Check for memory alerts
    if (usageRatio > this.thresholds.memoryUsage) {
      this.triggerAlert('high_memory_usage', {
        usageRatio,
        threshold: this.thresholds.memoryUsage,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`
      });
    }

    return {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      usageRatio: `${(usageRatio * 100).toFixed(1)}%`
    };
  }

  /**
   * Track error rates
   */
  trackError(type, error, context = {}) {
    this.recordMetric('errors', {
      type: 'error',
      errorType: type,
      message: error.message,
      stack: error.stack?.substring(0, 500), // Truncate stack trace
      timestamp: Date.now(),
      ...context
    });

    logger.error('Error tracked', {
      type,
      message: error.message,
      ...context
    });
  }

  /**
   * Record a metric
   */
  recordMetric(key, data) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key);
    metrics.push(data);

    // Keep only last 1000 entries per metric type
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(alertType, data) {
    const alertKey = `${alertType}_${Date.now()}`;
    
    this.alerts.set(alertKey, {
      type: alertType,
      data,
      timestamp: Date.now(),
      resolved: false
    });

    logger.warn('Performance alert triggered', {
      type: alertType,
      ...data
    });

    // Clean up old alerts (keep last 100)
    if (this.alerts.size > 100) {
      const oldestKey = this.alerts.keys().next().value;
      this.alerts.delete(oldestKey);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow = 300000) { // 5 minutes default
    const now = Date.now();
    const cutoff = now - timeWindow;
    const summary = {};

    for (const [key, metrics] of this.metrics) {
      const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
      
      if (recentMetrics.length === 0) continue;

      summary[key] = this.calculateMetricStats(recentMetrics);
    }

    return {
      timeWindow: `${timeWindow / 1000}s`,
      generatedAt: new Date().toISOString(),
      metrics: summary,
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      memoryUsage: this.trackMemoryUsage()
    };
  }

  /**
   * Calculate statistics for metrics
   */
  calculateMetricStats(metrics) {
    if (metrics.length === 0) return null;

    const durations = metrics
      .filter(m => typeof m.duration === 'number')
      .map(m => m.duration);
    
    const successes = metrics.filter(m => m.success === true).length;
    const total = metrics.length;

    const stats = {
      count: total,
      successRate: total > 0 ? (successes / total) : 0
    };

    if (durations.length > 0) {
      durations.sort((a, b) => a - b);
      
      stats.duration = {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)]
      };
    }

    return stats;
  }

  /**
   * Get cache hit ratio
   */
  getCacheHitRatio(timeWindow = 300000) {
    const now = Date.now();
    const cutoff = now - timeWindow;
    
    const cacheMetrics = this.metrics.get('cache_get') || [];
    const recentMetrics = cacheMetrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) return null;

    const hits = recentMetrics.filter(m => m.hit === true).length;
    const total = recentMetrics.length;
    const hitRatio = hits / total;

    // Check for cache performance alerts
    if (hitRatio < this.thresholds.cacheHitRatio) {
      this.triggerAlert('low_cache_hit_ratio', {
        hitRatio,
        threshold: this.thresholds.cacheHitRatio,
        timeWindow: `${timeWindow / 1000}s`
      });
    }

    return {
      hits,
      total,
      hitRatio,
      missRatio: 1 - hitRatio
    };
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    // Collect memory usage every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);

    // Generate performance summary every 5 minutes
    setInterval(() => {
      const summary = this.getPerformanceSummary();
      logger.info('Performance summary', summary);
    }, 300000);
  }

  /**
   * Create middleware for Express to track API calls
   */
  createExpressMiddleware() {
    const monitor = this; // Capture the PerformanceMonitor instance

    return (req, res, next) => {
      const startTime = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        // Track the API call
        monitor.trackApiCall(
          req.route?.path || req.path,
          req.method,
          duration,
          success,
          {
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        );

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      totalMetrics: Array.from(this.metrics.values())
        .reduce((sum, metrics) => sum + metrics.length, 0),
      metricTypes: this.metrics.size,
      activeAlerts: Array.from(this.alerts.values())
        .filter(a => !a.resolved).length,
      thresholds: this.thresholds
    };
  }

  /**
   * Clear old metrics and alerts
   */
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [key, metrics] of this.metrics) {
      const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(key, recentMetrics);
    }

    // Clear resolved alerts older than 1 hour
    const alertCutoff = Date.now() - (60 * 60 * 1000);
    for (const [key, alert] of this.alerts) {
      if (alert.resolved && alert.timestamp < alertCutoff) {
        this.alerts.delete(key);
      }
    }

    logger.debug('Performance monitor cleanup completed');
  }
}

// Export singleton instance
module.exports = new PerformanceMonitor();
