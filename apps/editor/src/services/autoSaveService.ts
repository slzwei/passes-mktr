/**
 * Auto-Save Service for Editor
 * Handles automatic saving of editor state and campaign details
 */

interface AutoSaveOptions {
  delay?: number;
  maxRetries?: number;
  onSave?: (data: any) => void;
  onError?: (error: Error) => void;
}

class AutoSaveService {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private retryCount: Map<string, number> = new Map();
  private isOnline: boolean = true;

  constructor() {
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
   * Auto-save campaign design (Step 1 Editor)
   */
  autoSaveDesign(
    campaignId: string,
    designData: any,
    options: AutoSaveOptions = {}
  ) {
    const {
      delay = 2000,
      maxRetries = 3,
      onSave,
      onError
    } = options;

    const key = `design-${campaignId}`;
    
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.saveDesign(campaignId, designData, maxRetries, onSave, onError);
      this.timeouts.delete(key);
    }, delay);

    this.timeouts.set(key, timeout);
  }

  /**
   * Auto-save campaign details (Step 2 Campaign Details)
   */
  autoSaveDetails(
    campaignId: string,
    detailsData: any,
    options: AutoSaveOptions = {}
  ) {
    const {
      delay = 2000,
      maxRetries = 3,
      onSave,
      onError
    } = options;

    const key = `details-${campaignId}`;
    
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this.saveDetails(campaignId, detailsData, maxRetries, onSave, onError);
      this.timeouts.delete(key);
    }, delay);

    this.timeouts.set(key, timeout);
  }

  /**
   * Save design data to backend
   */
  private async saveDesign(
    campaignId: string,
    designData: any,
    maxRetries: number,
    onSave?: (data: any) => void,
    onError?: (error: Error) => void
  ) {
    if (!this.isOnline) {
      console.log('Auto-save: Skipping save (offline)');
      return;
    }

    const key = `design-${campaignId}`;
    const retryCount = this.retryCount.get(key) || 0;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/autosave/design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ design: designData }),
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Auto-save: Design saved successfully', result);
      
      // Reset retry count on success
      this.retryCount.delete(key);
      
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Auto-save: Design save failed', error);
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000;
        this.retryCount.set(key, retryCount + 1);
        
        console.log(`Auto-save: Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          this.saveDesign(campaignId, designData, maxRetries, onSave, onError);
        }, retryDelay);
      } else {
        // Max retries reached
        this.retryCount.delete(key);
        
        if (onError) {
          onError(error as Error);
        }
      }
    }
  }

  /**
   * Save details data to backend
   */
  private async saveDetails(
    campaignId: string,
    detailsData: any,
    maxRetries: number,
    onSave?: (data: any) => void,
    onError?: (error: Error) => void
  ) {
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
          onError(error as Error);
        }
      }
    }
  }

  /**
   * Cancel auto-save for a specific campaign
   */
  cancelAutoSave(campaignId: string, type: 'design' | 'details' = 'design') {
    const key = `${type}-${campaignId}`;
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
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
  getPendingCount(): number {
    return this.timeouts.size;
  }

  /**
   * Check if there are pending saves
   */
  hasPendingSaves(): boolean {
    return this.timeouts.size > 0;
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();
export default autoSaveService;
