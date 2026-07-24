import api from './api';

/**
 * Dashboard API Service
 * Endpoint: GET dashboard/
 */
export const dashboardService = {
  /**
   * Fetches high-level metrics across Campaigns, ICPs, Leads, and Email Drafts.
   * @returns {Promise<Object>} Dashboard overview stats object
   */
  getDashboardOverview: async () => {
    try {
      const response = await api.get('dashboard/');
      console.log('Dashboard API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Response:', error.response);
      console.error('Request:', error.request);
      throw error;
    }
  },
};

export default dashboardService;
