import api from './api';

export const applicationsService = {
  async createApplication(opportunityId: number, coverLetter?: string) {
    const response = await api.post('/applications', {
      opportunity_id: opportunityId,
      cover_letter: coverLetter
    });
    return response.data;
  },

  async getMyApplications() {
    const response = await api.get('/applications/my');
    return response.data;
  },

  async getApplicationsForOpportunity(opportunityId: number) {
    const response = await api.get(`/applications/opportunity/${opportunityId}`);
    return response.data;
  },

  async updateApplicationStatus(applicationId: number, status: string) {
    const response = await api.put(`/applications/${applicationId}/status`, null, {
      params: { status }
    });
    return response.data;
  },
};