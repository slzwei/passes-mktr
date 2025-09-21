// Mock user authentication for development
export const User = {
  // Mock user object for development
  isAuthenticated: true,
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User'
  }
};

// Partner API functions
export const Partners = {
  // Get all partners
  async getAll(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetch(`/api/partners?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch partners');
    }
    
    return data;
  },

  // Get partner by ID
  async getById(id) {
    const response = await fetch(`/api/partners/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch partner');
    }
    
    return data;
  },

  // Get campaigns for a partner
  async getCampaigns(id) {
    const response = await fetch(`/api/partners/${id}/campaigns`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch partner campaigns');
    }
    
    return data;
  },

  // Get statistics for a partner
  async getStatistics(id) {
    const response = await fetch(`/api/partners/${id}/statistics`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch partner statistics');
    }
    
    return data;
  },

  // Create new partner
  async create(partnerData) {
    const response = await fetch('/api/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partnerData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create partner');
    }
    
    return data;
  },

  // Update partner
  async update(id, partnerData) {
    const response = await fetch(`/api/partners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partnerData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update partner');
    }
    
    return data;
  },

  // Delete partner
  async delete(id) {
    const response = await fetch(`/api/partners/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete partner');
    }
    
    return data;
  }
};