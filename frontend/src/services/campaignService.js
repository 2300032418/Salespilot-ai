import api from './api';

/**
 * Campaign API Service
 * Endpoints: /api/campaigns/
 */
export const campaignService = {
  /**
   * Fetch all campaigns
   */
  getCampaigns: async () => {
    const response = await api.get('campaigns/');
    return response.data;
  },

  /**
   * Create a new campaign
   * @param {Object} campaignData - { name, description, status }
   */
  createCampaign: async (campaignData) => {
    const response = await api.post('campaigns/', campaignData);
    return response.data;
  },

  /**
   * Update an existing campaign (Full update)
   * @param {number|string} id
   * @param {Object} campaignData - { name, description, status }
   */
  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`campaigns/${id}/`, campaignData);
    return response.data;
  },

  /**
   * Partial update for a campaign
   * @param {number|string} id
   * @param {Object} campaignData
   */
  patchCampaign: async (id, campaignData) => {
    const response = await api.patch(`campaigns/${id}/`, campaignData);
    return response.data;
  },

  /**
   * Delete a campaign
   * @param {number|string} id
   */
  deleteCampaign: async (id) => {
    const response = await api.delete(`campaigns/${id}/`);
    return response.data;
  },
};

export default campaignService;
