import api from './api';

/**
 * Analytics / Dashboard API Service
 * Base: /api/dashboard/
 */
const analyticsService = {
  /**
   * GET /api/dashboard/
   * Returns campaigns, icps, leads, emails summary counts.
   */
  getOverview: () => api.get('dashboard/').then((r) => r.data),

  /**
   * GET /api/dashboard/campaigns/
   * Returns per-campaign analytics: leads, emails generated, approved, rejected, sent.
   * @param {Object} params - { search, status }
   */
  getCampaignAnalytics: (params = {}) =>
    api.get('dashboard/campaigns/', { params }).then((r) => r.data),

  /**
   * GET /api/dashboard/leads/
   * Returns total_leads, companies, countries.
   */
  getLeadAnalytics: (params = {}) =>
    api.get('dashboard/leads/', { params }).then((r) => r.data),

  /**
   * GET /api/dashboard/emails/
   * Returns draft, approved, rejected, sent, approval_rate, rejection_rate.
   */
  getEmailAnalytics: (params = {}) =>
    api.get('dashboard/emails/', { params }).then((r) => r.data),
};

export default analyticsService;
