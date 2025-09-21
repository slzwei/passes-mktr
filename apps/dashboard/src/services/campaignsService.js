/**
 * Campaigns Service
 * Manages campaign data including drafts and published campaigns
 */

class CampaignsService {
  constructor() {
    this.storageKey = 'mktr_campaigns';
    this.draftsKey = 'mktr_draft_campaigns';
    this.initializeStorage();
  }

  /**
   * Initialize storage with default data if needed
   */
  initializeStorage() {
    // Initialize with empty arrays - no mock data
    const existingCampaigns = this.getCampaigns();
    const existingDrafts = this.getDrafts();
    
    // Only initialize if storage doesn't exist at all
    if (existingCampaigns === null) {
      this.saveCampaigns([]);
    }
    if (existingDrafts === null) {
      this.saveDrafts([]);
    }
  }

  /**
   * Get all campaigns (published and drafts)
   */
  getCampaigns() {
    try {
      const campaigns = localStorage.getItem(this.storageKey);
      return campaigns ? JSON.parse(campaigns) : [];
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return [];
    }
  }

  /**
   * Get only draft campaigns
   */
  getDrafts() {
    try {
      const drafts = localStorage.getItem(this.draftsKey);
      return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  /**
   * Get all campaigns including drafts
   */
  getAllCampaigns() {
    const campaigns = this.getCampaigns();
    const drafts = this.getDrafts();
    return [...campaigns, ...drafts];
  }

  /**
   * Save campaigns to storage
   */
  saveCampaigns(campaigns) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(campaigns));
    } catch (error) {
      console.error('Error saving campaigns:', error);
      throw new Error('Failed to save campaigns');
    }
  }

  /**
   * Save drafts to storage
   */
  saveDrafts(drafts) {
    try {
      localStorage.setItem(this.draftsKey, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving drafts:', error);
      throw new Error('Failed to save drafts');
    }
  }

  /**
   * Save a draft campaign
   */
  saveDraft(draftData) {
    try {
      const drafts = this.getDrafts();
      const existingDraftIndex = drafts.findIndex(draft => draft.id === draftData.id);
      
      const draftCampaign = {
        id: draftData.id || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: draftData.name || `${draftData.passType || 'Card'} Campaign Draft`,
        description: draftData.description || `Draft ${draftData.passType || 'card'} campaign`,
        status: "draft",
        type: "draft",
        passType: draftData.passType || draftData.cardType || 'redemption',
        users: "0",
        engagement: 0,
        revenue: "$0",
        passData: draftData.passData || {},
        designData: draftData.designData || {},
        createdAt: draftData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: true
      };

      if (existingDraftIndex >= 0) {
        // Update existing draft
        drafts[existingDraftIndex] = draftCampaign;
      } else {
        // Add new draft
        drafts.push(draftCampaign);
      }

      this.saveDrafts(drafts);
      return draftCampaign;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  /**
   * Delete a draft campaign
   */
  deleteDraft(draftId) {
    try {
      const drafts = this.getDrafts();
      const filteredDrafts = drafts.filter(draft => draft.id !== draftId);
      this.saveDrafts(filteredDrafts);
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw new Error('Failed to delete draft');
    }
  }

  /**
   * Delete a published campaign
   */
  deleteCampaign(campaignId) {
    try {
      const campaigns = this.getCampaigns();
      const filteredCampaigns = campaigns.filter(campaign => campaign.id !== campaignId);
      this.saveCampaigns(filteredCampaigns);
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw new Error('Failed to delete campaign');
    }
  }

  /**
   * Publish a draft campaign (move from drafts to campaigns)
   */
  publishDraft(draftId) {
    try {
      const drafts = this.getDrafts();
      const campaigns = this.getCampaigns();
      
      const draftIndex = drafts.findIndex(draft => draft.id === draftId);
      if (draftIndex === -1) {
        throw new Error('Draft not found');
      }

      const draft = drafts[draftIndex];
      const publishedCampaign = {
        ...draft,
        status: "active",
        type: "loyalty", // or determine based on passType
        isDraft: false,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove from drafts
      drafts.splice(draftIndex, 1);
      
      // Add to campaigns
      campaigns.push(publishedCampaign);

      this.saveDrafts(drafts);
      this.saveCampaigns(campaigns);
      
      return publishedCampaign;
    } catch (error) {
      console.error('Error publishing draft:', error);
      throw new Error('Failed to publish draft');
    }
  }

  /**
   * Get campaign by ID (searches both campaigns and drafts)
   */
  getCampaignById(id) {
    const campaigns = this.getCampaigns();
    const drafts = this.getDrafts();
    const allCampaigns = [...campaigns, ...drafts];
    return allCampaigns.find(campaign => campaign.id === id);
  }

  /**
   * Update campaign
   */
  updateCampaign(id, updates) {
    try {
      const campaigns = this.getCampaigns();
      const drafts = this.getDrafts();
      
      // Check if it's in campaigns
      const campaignIndex = campaigns.findIndex(campaign => campaign.id === id);
      if (campaignIndex >= 0) {
        campaigns[campaignIndex] = {
          ...campaigns[campaignIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.saveCampaigns(campaigns);
        return campaigns[campaignIndex];
      }
      
      // Check if it's in drafts
      const draftIndex = drafts.findIndex(draft => draft.id === id);
      if (draftIndex >= 0) {
        drafts[draftIndex] = {
          ...drafts[draftIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.saveDrafts(drafts);
        return drafts[draftIndex];
      }
      
      throw new Error('Campaign not found');
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error('Failed to update campaign');
    }
  }

  /**
   * Clear all campaigns and drafts (useful for testing or reset)
   */
  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.draftsKey);
      this.initializeStorage();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }
}

// Create singleton instance
const campaignsService = new CampaignsService();

// Make clearAllData available globally for easy cleanup
if (typeof window !== 'undefined') {
  window.clearCampaignsData = () => campaignsService.clearAllData();
}

export default campaignsService;
