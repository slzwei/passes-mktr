/**
 * Auto-Save Service for Dashboard
 * Handles automatic saving of campaign details and other form data
 */

class AutoSaveService {
  constructor() {
    this.timeouts = new Map();
    this.retryCount = new Map();
    this.isOnline = true;

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Auto-save: Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Auto-save: Gone offline');
    });
  }

  /**
   * Auto-save campaign details
   */
  autoSaveDetails(campaignId, detailsData, options = {}) {
    const {
      delay = 2000,
      maxRetries = 3,
      onSave,
      onError
    } = options;

    const key = `details-${campaignId}`;
    
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.saveDetails(campaignId, detailsData, maxRetries, onSave, onError);
      this.timeouts.delete(key);
    }, delay);

    this.timeouts.set(key, timeout);
  }

  /**
   * Save details data to backend
   */
  async saveDetails(campaignId, detailsData, maxRetries, onSave, onError) {
    if (!this.isOnline) {
      console.log('Auto-save: Skipping save (offline)');
      return;
    }

    const key = `details-${campaignId}`;
    const retryCount = this.retryCount.get(key) || 0;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/autosave/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignDetails: detailsData }),
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Auto-save: Details saved successfully', result);
      
      // Reset retry count on success
      this.retryCount.delete(key);
      
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Auto-save: Details save failed', error);
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000;
        this.retryCount.set(key, retryCount + 1);
        
        console.log(`Auto-save: Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          this.saveDetails(campaignId, detailsData, maxRetries, onSave, onError);
        }, retryDelay);
      } else {
        // Max retries reached
        this.retryCount.delete(key);
        
        if (onError) {
          onError(error);
        }
      }
    }
  }

  /**
   * Cancel auto-save for a specific campaign
   */
  cancelAutoSave(campaignId, type = 'details') {
    const key = `${type}-${campaignId}`;
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    
    this.retryCount.delete(key);
  }

  /**
   * Cancel all auto-saves
   */
  cancelAllAutoSaves() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.retryCount.clear();
  }

  /**
   * Get pending auto-saves count
   */
  getPendingCount() {
    return this.timeouts.size;
  }

  /**
   * Check if there are pending saves
   */
  hasPendingSaves() {
    return this.timeouts.size > 0;
  }
}

// Export singleton instance
const autoSaveService = new AutoSaveService();
export default autoSaveService;
