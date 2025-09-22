/**
 * Enhanced Auto-Save Service for Editor
 * Provides UX-focused autosave with immediate feedback and background sync
 */

interface AutoSaveOptions {
  delay?: number;
  maxRetries?: number;
  showIndicator?: boolean;
  onSave?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface SaveIndicatorEvent extends CustomEvent {
  detail: {
    campaignId: string;
    message?: string;
    type?: 'info' | 'success' | 'error';
  };
}

class EnhancedAutoSaveService {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private retryCount: Map<string, number> = new Map();
  private cache: Map<string, any> = new Map();
  private isOnline: boolean = true;
  private websocket: WebSocket | null = null;

  constructor() {
    this.setupEventListeners();
    this.connectWebSocket();
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('📡 Back online - resuming auto-save');
        this.syncPendingChanges();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📡 Gone offline - caching changes locally');
      });

      // Listen for beforeunload to force sync pending changes
      window.addEventListener('beforeunload', () => {
        this.forceSyncAll();
      });
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const wsUrl = `ws://${window.location.host}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('🔌 WebSocket connected for real-time updates');
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected - attempting reconnect in 5s');
        setTimeout(() => this.connectWebSocket(), 5000);
      };
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'save-indicator':
        this.handleSaveIndicatorMessage(data);
        break;
      case 'campaign-updated':
        this.handleCampaignUpdate(data);
        break;
      default:
        console.debug('Unknown WebSocket message:', data);
    }
  }

  /**
   * Handle save indicator messages from server
   */
  private handleSaveIndicatorMessage(data: any) {
    if (data.action === 'show') {
      this.showSaveIndicator(data.campaignId, data.message, data.indicatorType);
    } else if (data.action === 'hide') {
      this.hideSaveIndicator(data.campaignId);
    }
  }

  /**
   * Handle campaign update messages
   */
  private handleCampaignUpdate(data: any) {
    // Update local cache with latest data
    if (data.campaignId && data.design) {
      this.cache.set(`design-${data.campaignId}`, {
        design: data.design,
        synced: true,
        lastModified: data.timestamp
      });
    }
  }

  /**
   * Auto-save campaign design with immediate UX feedback
   */
  async autoSaveDesign(
    campaignId: string,
    designData: any,
    options: AutoSaveOptions = {}
  ) {
    const {
      delay = 2000,
      maxRetries = 3,
      showIndicator = true,
      onSave,
      onError
    } = options;

    const key = `design-${campaignId}`;
    
    try {
      // 1. Show immediate save indicator
      if (showIndicator) {
        this.showSaveIndicator(campaignId, 'Saving changes...', 'info');
      }

      // 2. Save to local cache immediately (instant UX feedback)
      this.cache.set(key, {
        design: designData,
        cached: true,
        synced: false,
        lastModified: new Date().toISOString()
      });

      // 3. Clear existing timeout
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key)!);
      }

      // 4. Schedule background sync
      const timeout = setTimeout(async () => {
        try {
          await this.syncToServer(campaignId, designData);
          
          // Update cache to mark as synced
          const cached = this.cache.get(key);
          if (cached) {
            cached.synced = true;
            cached.syncedAt = new Date().toISOString();
          }

          // Notify WebSocket about successful save
          if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
              type: 'campaign-design-update',
              campaignId,
              design: designData,
              userId: 'current-user' // TODO: Get actual user ID
            }));
          }

          if (onSave) {
            onSave({ success: true, synced: true });
          }

          console.log(`✅ Design auto-saved for campaign: ${campaignId}`);
        } catch (error) {
          console.error('Background sync failed:', error);
          
          if (onError) {
            onError(error as Error);
          }

          // Show error indicator briefly
          if (showIndicator) {
            this.showSaveIndicator(campaignId, 'Save failed - will retry', 'error');
            setTimeout(() => this.hideSaveIndicator(campaignId), 3000);
          }
        } finally {
          this.timeouts.delete(key);
        }
      }, delay);

      this.timeouts.set(key, timeout);

      // 5. Hide save indicator after brief delay (UX feedback)
      if (showIndicator) {
        setTimeout(() => {
          this.hideSaveIndicator(campaignId);
        }, 800);
      }

      return {
        success: true,
        cached: true,
        syncing: true
      };

    } catch (error) {
      console.error('Auto-save failed:', error);
      
      if (showIndicator) {
        this.showSaveIndicator(campaignId, 'Save failed', 'error');
        setTimeout(() => this.hideSaveIndicator(campaignId), 2000);
      }

      if (onError) {
        onError(error as Error);
      }

      throw error;
    }
  }

  /**
   * Get cached design data immediately
   */
  getCachedDesign(campaignId: string) {
    return this.cache.get(`design-${campaignId}`);
  }

  /**
   * Sync to server (background operation)
   */
  private async syncToServer(campaignId: string, data: any) {
    if (!this.isOnline) {
      throw new Error('Offline - changes cached locally');
    }

    const response = await fetch(`/api/campaigns/${campaignId}/autosave/design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ design: data }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Sync pending changes when coming back online
   */
  private async syncPendingChanges() {
    const pendingChanges = Array.from(this.cache.entries())
      .filter(([_, data]) => data.cached && !data.synced);

    if (pendingChanges.length === 0) return;

    console.log(`🔄 Syncing ${pendingChanges.length} pending changes...`);

    for (const [key, data] of pendingChanges) {
      const campaignId = key.replace('design-', '');
      try {
        await this.syncToServer(campaignId, data.design);
        data.synced = true;
        data.syncedAt = new Date().toISOString();
        console.log(`✅ Synced pending changes for campaign: ${campaignId}`);
      } catch (error) {
        console.error(`❌ Failed to sync campaign ${campaignId}:`, error);
      }
    }
  }

  /**
   * Force sync all pending changes (for app shutdown)
   */
  private forceSyncAll() {
    const pendingChanges = Array.from(this.cache.entries())
      .filter(([_, data]) => data.cached && !data.synced);

    if (pendingChanges.length === 0) return;

    // Use sendBeacon for reliable delivery during page unload
    for (const [key, data] of pendingChanges) {
      const campaignId = key.replace('design-', '');
      const payload = JSON.stringify({ design: data.design });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/campaigns/${campaignId}/autosave/design`,
          payload
        );
      }
    }
  }

  /**
   * Show save indicator
   */
  private showSaveIndicator(campaignId: string, message: string, type: 'info' | 'success' | 'error' = 'info') {
    if (typeof window !== 'undefined') {
      const event: SaveIndicatorEvent = new CustomEvent('show-save-indicator', {
        detail: { campaignId, message, type }
      }) as SaveIndicatorEvent;
      
      window.dispatchEvent(event);
    }
  }

  /**
   * Hide save indicator
   */
  private hideSaveIndicator(campaignId: string) {
    if (typeof window !== 'undefined') {
      const event: SaveIndicatorEvent = new CustomEvent('hide-save-indicator', {
        detail: { campaignId }
      }) as SaveIndicatorEvent;
      
      window.dispatchEvent(event);
    }
  }

  /**
   * Cancel auto-save for specific campaign
   */
  cancelAutoSave(campaignId: string) {
    const key = `design-${campaignId}`;
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }
    
    this.retryCount.delete(key);
    this.hideSaveIndicator(campaignId);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      pendingSaves: this.timeouts.size,
      cachedItems: this.cache.size,
      isOnline: this.isOnline,
      websocketConnected: this.websocket?.readyState === WebSocket.OPEN,
      pendingSync: Array.from(this.cache.values())
        .filter(data => data.cached && !data.synced).length
    };
  }

  /**
   * Cleanup service
   */
  cleanup() {
    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    
    // Force sync pending changes
    this.forceSyncAll();
    
    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
    }
    
    // Clear cache
    this.cache.clear();
    this.retryCount.clear();
  }
}

// Export singleton instance
export const enhancedAutoSaveService = new EnhancedAutoSaveService();
export default enhancedAutoSaveService;
