import api from './api';

/**
 * Email Draft API Service
 * Endpoints: /api/email-drafts/
 */
export const emailDraftService = {
  /**
   * Fetch all email drafts
   */
  getEmailDrafts: async () => {
    const response = await api.get('email-drafts/');
    return response.data;
  },

  /**
   * Generate an AI email draft for a lead
   * @param {number} lead_id
   * @param {string} tone - 'Professional' | 'Friendly' | 'Formal' | 'Casual'
   */
  generateDraft: async (lead_id, tone = 'Professional') => {
    const response = await api.post('email-drafts/generate/', {
      lead_id: Number(lead_id),
      tone,
    });
    return response.data;
  },

  /**
   * Approve an email draft
   * @param {number|string} id
   */
  approveDraft: async (id) => {
    const response = await api.post(`email-drafts/${id}/approve/`);
    return response.data;
  },

  /**
   * Reject an email draft
   * @param {number|string} id
   */
  rejectDraft: async (id) => {
    const response = await api.post(`email-drafts/${id}/reject/`);
    return response.data;
  },

  /**
   * Send an approved email draft
   * @param {number|string} id
   */
  sendDraft: async (id) => {
    const response = await api.post(`email-drafts/${id}/send/`);
    return response.data;
  },
};

export default emailDraftService;
