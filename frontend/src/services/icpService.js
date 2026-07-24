import api from './api';

/**
 * ICP (Ideal Customer Profile) API Service
 * Endpoints: /api/icp/
 */
export const icpService = {
  /**
   * Fetch all ICP profiles
   */
  getICPs: async () => {
    const response = await api.get('icp/');
    return response.data;
  },

  /**
   * Create a new ICP profile
   * @param {Object} icpData - { campaign, industry, company_size, keywords, ... }
   */
  createICP: async (icpData) => {
    const response = await api.post('icp/', icpData);
    return response.data;
  },

  /**
   * Update an existing ICP profile
   * @param {number|string} id
   * @param {Object} icpData
   */
  updateICP: async (id, icpData) => {
    const response = await api.put(`icp/${id}/`, icpData);
    return response.data;
  },

  /**
   * Partial update for an ICP profile
   * @param {number|string} id
   * @param {Object} icpData
   */
  patchICP: async (id, icpData) => {
    const response = await api.patch(`icp/${id}/`, icpData);
    return response.data;
  },

  /**
   * Delete an ICP profile
   * @param {number|string} id
   */
  deleteICP: async (id) => {
    const response = await api.delete(`icp/${id}/`);
    return response.data;
  },
};

export default icpService;
