const cacheManager = require('./cacheManager');
const logger = require('../utils/logger');

class UXAutoSaveService {
  constructor() {
    this.pendingSaves = new Map();
    this.saveIndicators = new Map();
    this.websocketService = null;
    this.initialized = false;
  }

  async initialize(websocketService = null) {
    if (this.initialized) return;

    // Initialize cache manager
    await cacheManager.initialize();
    
    // Store WebSocket service reference for real-time updates
    this.websocketService = websocketService;
    
    this.initialized = true;
    logger.info('✅ UX AutoSave service initialized');
  }

  /**
   * Auto-save campaign design with immediate UX feedback
   */
  async autoSaveDesign(campaignId, designData, options = {}) {
    const {
      showIndicator = true,
      syncDelay = 2000,
      onSave,
      onError
    } = options;

    try {
      // 1. Show immediate save indicator
      if (showIndicator) {
        this.showSaveIndicator(campaignId, 'Saving changes...');
      }
      
      // 2. Save to cache immediately (instant UX feedback)
      const cacheKey = `design-${campaignId}`;
      await cacheManager.set(cacheKey, {
        design: designData,
        version: Date.now(),
        lastModified: new Date().toISOString(),
        cached: true
      }, 300); // 5 minutes TTL
      
      logger.debug('Design cached immediately', { campaignId });
      
      // 3. Clear any existing pending save
      const existingPending = this.pendingSaves.get(campaignId);
      if (existingPending) {
        clearTimeout(existingPending.timeout);
        logger.debug('Cancelled previous pending save', { campaignId });
      }
      
      // 4. Schedule background database sync
      const timeout = setTimeout(async () => {
        try {
          await this.syncToDatabase(campaignId, designData);
          
          // Notify success
          if (onSave) {
            onSave({ success: true, campaignId, synced: true });
          }
          
          // Broadcast update via WebSocket
          if (this.websocketService) {
            this.websocketService.broadcastCampaignUpdate(campaignId, {
              type: 'design_updated',
              design: designData,
              timestamp: new Date().toISOString()
            });
          }
          
          logger.debug('Background sync completed', { campaignId });
        } catch (error) {
          logger.error('Background sync failed', { campaignId, error: error.message });
          
          if (onError) {
            onError(error);
          }
        } finally {
          this.pendingSaves.delete(campaignId);
        }
      }, syncDelay);
      
      // Store pending save info
      this.pendingSaves.set(campaignId, {
        timeout,
        data: designData,
        timestamp: Date.now()
      });
      
      // 5. Hide save indicator after brief delay (UX feedback)
      if (showIndicator) {
        setTimeout(() => {
          this.hideSaveIndicator(campaignId);
        }, 800); // Show "Saving..." for 800ms
      }
      
      // Return immediate success (data is cached)
      return {
        success: true,
        cached: true,
        syncing: true,
        campaignId
      };
      
    } catch (error) {
      logger.error('AutoSave failed', { campaignId, error: error.message });
      
      if (showIndicator) {
        this.showSaveIndicator(campaignId, 'Save failed - retrying...', 'error');
        setTimeout(() => this.hideSaveIndicator(campaignId), 2000);
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Auto-save campaign details
   */
  async autoSaveDetails(campaignId, detailsData, options = {}) {
    const cacheKey = `details-${campaignId}`;
    
    // Save to cache immediately
    await cacheManager.set(cacheKey, {
      details: detailsData,
      version: Date.now(),
      lastModified: new Date().toISOString(),
      cached: true
    }, 300);
    
    // Schedule background sync
    return this.autoSaveDesign(campaignId, { details: detailsData }, options);
  }

  /**
   * Get cached design data immediately
   */
  async getCachedDesign(campaignId) {
    const cacheKey = `design-${campaignId}`;
    return await cacheManager.get(cacheKey);
  }

  /**
   * Get cached details data immediately
   */
  async getCachedDetails(campaignId) {
    const cacheKey = `details-${campaignId}`;
    return await cacheManager.get(cacheKey);
  }

  /**
   * Background sync to database (non-blocking)
   */
  async syncToDatabase(campaignId, data) {
    try {
      // This will be implemented when database service is ready
      const persistenceService = require('./persistenceService');
      
      if (data.design) {
        await persistenceService.saveCampaignDesign(campaignId, data.design);
      }
      
      if (data.details) {
        await persistenceService.saveCampaignDetails(campaignId, data.details);
      }
      
      // Update cache to mark as synced
      const cacheKey = `design-${campaignId}`;
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        cached.synced = true;
        cached.syncedAt = new Date().toISOString();
        await cacheManager.set(cacheKey, cached);
      }
      
      logger.info('Campaign synced to database', { campaignId });
    } catch (error) {
      logger.error('Database sync failed', { campaignId, error: error.message });
      throw error;
    }
  }

  /**
   * Show save indicator (emit event for UI)
   */
  showSaveIndicator(campaignId, message = 'Saving...', type = 'info') {
    const indicator = {
      campaignId,
      message,
      type,
      timestamp: Date.now()
    };
    
    this.saveIndicators.set(campaignId, indicator);
    
    // Emit event for frontend to catch
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      // Server-side: use WebSocket if available
      if (this.websocketService) {
        this.websocketService.broadcastCampaignUpdate(campaignId, {
          type: 'save_indicator',
          action: 'show',
          message,
          indicatorType: type
        });
      }
    }
    
    logger.debug('Save indicator shown', { campaignId, message, type });
  }

  /**
   * Hide save indicator
   */
  hideSaveIndicator(campaignId) {
    this.saveIndicators.delete(campaignId);
    
    // Emit event for frontend
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      if (this.websocketService) {
        this.websocketService.broadcastCampaignUpdate(campaignId, {
          type: 'save_indicator',
          action: 'hide'
        });
      }
    }
    
    logger.debug('Save indicator hidden', { campaignId });
  }

  /**
   * Force sync all pending saves (useful for app shutdown)
   */
  async forceSyncAll() {
    const pendingCampaigns = Array.from(this.pendingSaves.keys());
    
    if (pendingCampaigns.length === 0) {
      return { synced: 0 };
    }
    
    logger.info('Force syncing pending saves', { count: pendingCampaigns.length });
    
    const results = await Promise.allSettled(
      pendingCampaigns.map(async (campaignId) => {
        const pending = this.pendingSaves.get(campaignId);
        if (pending) {
          clearTimeout(pending.timeout);
          await this.syncToDatabase(campaignId, pending.data);
          this.pendingSaves.delete(campaignId);
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info('Force sync completed', { successful, failed });
    
    return { synced: successful, failed };
  }

  /**
   * Cancel auto-save for specific campaign
   */
  cancelAutoSave(campaignId) {
    const pending = this.pendingSaves.get(campaignId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingSaves.delete(campaignId);
      logger.debug('AutoSave cancelled', { campaignId });
    }
    
    this.hideSaveIndicator(campaignId);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      pendingSaves: this.pendingSaves.size,
      activeIndicators: this.saveIndicators.size,
      initialized: this.initialized,
      cacheStats: cacheManager.getStats()
    };
  }

  /**
   * Cleanup and close service
   */
  async close() {
    // Force sync all pending saves
    await this.forceSyncAll();
    
    // Clear all indicators
    this.saveIndicators.clear();
    
    this.initialized = false;
    logger.info('UX AutoSave service closed');
  }
}

// Export singleton instance
module.exports = new UXAutoSaveService();
