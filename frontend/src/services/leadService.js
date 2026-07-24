import api from './api';

/**
 * Lead API Service
 * Endpoints: /api/leads/
 */
export const leadService = {
  /**
   * Fetch all leads
   */
  getLeads: async () => {
    const response = await api.get('leads/');
    return response.data;
  },

  /**
   * Create a manual lead
   * @param {Object} leadData
   */
  createLead: async (leadData) => {
    const response = await api.post('leads/', leadData);
    return response.data;
  },

  /**
   * Update an existing lead
   * @param {number|string} id
   * @param {Object} leadData
   */
  updateLead: async (id, leadData) => {
    const response = await api.put(`leads/${id}/`, leadData);
    return response.data;
  },

  /**
   * Partial update for a lead
   * @param {number|string} id
   * @param {Object} leadData
   */
  patchLead: async (id, leadData) => {
    const response = await api.patch(`leads/${id}/`, leadData);
    return response.data;
  },

  /**
   * Delete a lead
   * @param {number|string} id
   */
  deleteLead: async (id) => {
    const response = await api.delete(`leads/${id}/`);
    return response.data;
  },

  /**
   * Automatically generate leads matching a campaign's ICP
   * @param {number|string} campaignId
   */
  generateLeads: async (campaignId) => {
    const response = await api.post('leads/generate/', { campaign_id: Number(campaignId) });
    return response.data;
  },
};

export default leadService;
