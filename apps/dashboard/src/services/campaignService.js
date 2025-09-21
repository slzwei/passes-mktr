/**
 * Campaign Service
 * Handles campaign data persistence, design updates, and crash recovery
 */

const API_BASE_URL = 'http://localhost:3000/api';
const CACHE_VERSION = '1.0.0';
const CACHE_PREFIX = 'mktr-campaign-cache';

class CampaignService {
  constructor() {
    this.debounceTimers = new Map();
    this.debounceDelay = 1000; // 1 second debounce
    // In-flight request de-duplication and micro-cache
    this.inflight = new Map(); // key -> Promise
    this.cache = new Map(); // key -> { timestamp, data }
    this.cacheTtlMs = 3000; // 3s micro-cache to avoid bursts
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign');
      }

      // Clear any existing cache for this campaign
      this.clearCrashRecoveryCache(result.data.id);

      return result.data;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId) {
    try {
      const key = `campaign:${campaignId}`;
      const now = Date.now();
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < this.cacheTtlMs) {
        return cached.data;
      }
      if (this.inflight.has(key)) {
        return await this.inflight.get(key);
      }
      const promise = (async () => {
        const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get campaign');
      }
        this.cache.set(key, { timestamp: Date.now(), data: result.data });
        return result.data;
      })().finally(() => this.inflight.delete(key));
      this.inflight.set(key, promise);
      return await promise;
    } catch (error) {
      console.error('Failed to get campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign design by ID
   */
  async getCampaignDesign(campaignId) {
    try {
      const key = `campaignDesign:${campaignId}`;
      const now = Date.now();
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < this.cacheTtlMs) {
        return cached.data;
      }
      if (this.inflight.has(key)) {
        return await this.inflight.get(key);
      }
      const promise = (async () => {
        const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/design`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get campaign design');
      }
        this.cache.set(key, { timestamp: Date.now(), data: result.data });
        return result.data;
      })().finally(() => this.inflight.delete(key));
      this.inflight.set(key, promise);
      return await promise;
    } catch (error) {
      console.error('Failed to get campaign design:', error);
      
      // Try to load from crash recovery cache
      const cachedDesign = this.getCrashRecoveryCache(campaignId);
      if (cachedDesign) {
        console.warn('Using cached design data due to network error');
        return cachedDesign;
      }
      
      throw error;
    }
  }

  /**
   * Update campaign design (debounced)
   */
  updateCampaignDesign(campaignId, design) {
    // Save to crash recovery cache immediately
    this.saveCrashRecoveryCache(campaignId, { campaignId, design });

    // Clear existing debounce timer
    if (this.debounceTimers.has(campaignId)) {
      clearTimeout(this.debounceTimers.get(campaignId));
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        await this.saveCampaignDesign(campaignId, design);
        // Clear cache after successful save
        this.clearCrashRecoveryCache(campaignId);
        console.log('Design saved successfully and cache cleared');
      } catch (error) {
        console.error('Failed to save design:', error);
        // Keep cache for recovery
      }
      this.debounceTimers.delete(campaignId);
    }, this.debounceDelay);

    this.debounceTimers.set(campaignId, timer);
  }

  /**
   * Save campaign design immediately (internal method)
   */
  async saveCampaignDesign(campaignId, design) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/design`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ design })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save campaign design');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to save campaign design:', error);
      throw error;
    }
  }

  /**
   * Upload image and return URL
   */
  async uploadImage(file, campaignId, imageType) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('campaignId', campaignId);
      formData.append('imageType', imageType);

      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      return result.data.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Save data to crash recovery cache
   */
  saveCrashRecoveryCache(campaignId, data) {
    try {
      const cacheKey = `${CACHE_PREFIX}-${campaignId}`;
      const cacheData = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: data
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save crash recovery cache:', error);
    }
  }

  /**
   * Get data from crash recovery cache
   */
  getCrashRecoveryCache(campaignId) {
    try {
      const cacheKey = `${CACHE_PREFIX}-${campaignId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheData.version !== CACHE_VERSION) {
        this.clearCrashRecoveryCache(campaignId);
        return null;
      }

      // Check if cache is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - cacheData.timestamp > maxAge) {
        this.clearCrashRecoveryCache(campaignId);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get crash recovery cache:', error);
      return null;
    }
  }

  /**
   * Clear crash recovery cache
   */
  clearCrashRecoveryCache(campaignId) {
    try {
      const cacheKey = `${CACHE_PREFIX}-${campaignId}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to clear crash recovery cache:', error);
    }
  }

  /**
   * Check if there's cached data available
   */
  hasCrashRecoveryCache(campaignId) {
    return this.getCrashRecoveryCache(campaignId) !== null;
  }

  /**
   * Clear all crash recovery caches (cleanup utility)
   */
  clearAllCrashRecoveryCaches() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all crash recovery caches:', error);
    }
  }

  /**
   * Force save any pending changes
   */
  async flushPendingChanges(campaignId) {
    if (this.debounceTimers.has(campaignId)) {
      clearTimeout(this.debounceTimers.get(campaignId));
      this.debounceTimers.delete(campaignId);
      
      // Get cached data and save it
      const cachedData = this.getCrashRecoveryCache(campaignId);
      if (cachedData && cachedData.design) {
        try {
          await this.saveCampaignDesign(campaignId, cachedData.design);
          this.clearCrashRecoveryCache(campaignId);
          return true;
        } catch (error) {
          console.error('Failed to flush pending changes:', error);
          throw error;
        }
      }
    }
    return false;
  }
}

// Export singleton instance
export default new CampaignService();

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  window.campaignService = new CampaignService();
}
