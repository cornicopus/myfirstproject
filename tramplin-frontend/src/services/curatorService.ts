import api from './api';

export const curatorService = {
  // Компании на модерацию
  async getPendingEmployers() {
    const response = await api.get('/curator/pending-employers');
    return response.data;
  },

  // Все компании
  async getAllEmployers() {
    const response = await api.get('/curator/employers/all');
    return response.data;
  },

  // Детали конкретной компании
  async getEmployerDetails(employerId: number) {
    const response = await api.get(`/curator/employer/${employerId}`);
    return response.data;
  },

  // Редактирование компании
  async updateEmployer(employerId: number, data: any) {
    const response = await api.put(`/curator/employer/${employerId}`, data);
    return response.data;
  },

  // Удаление компании
  async deleteEmployer(employerId: number) {
    const response = await api.delete(`/curator/employer/${employerId}`);
    return response.data;
  },

  // Верификация компании
  async verifyEmployer(employerId: number) {
    const response = await api.post(`/curator/verify-employer/${employerId}`);
    return response.data;
  },

  // Отклонение компании
  async rejectEmployer(employerId: number, reason: string) {
    const response = await api.post(`/curator/reject-employer/${employerId}`, null, {
      params: { reason }
    });
    return response.data;
  },

  // Вакансии на модерацию
  async getPendingOpportunities() {
    const response = await api.get('/curator/opportunities/pending');
    return response.data;
  },

  // Все вакансии
  async getAllOpportunities() {
    const response = await api.get('/curator/opportunities/all');
    return response.data;
  },

  // Редактирование вакансии
  async updateOpportunity(opportunityId: number, data: any) {
    const response = await api.put(`/curator/opportunity/${opportunityId}`, data);
    return response.data;
  },

  // Удаление вакансии
  async deleteOpportunity(opportunityId: number) {
    const response = await api.delete(`/curator/opportunity/${opportunityId}`);
    return response.data;
  },

  // Одобрение вакансии
  async approveOpportunity(opportunityId: number) {
    const response = await api.post(`/curator/opportunities/${opportunityId}/approve`);
    return response.data;
  },

  // Отклонение вакансии
  async rejectOpportunity(opportunityId: number, reason: string) {
    const response = await api.post(`/curator/opportunities/${opportunityId}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },
  async toggleEmployerActive(employerId: number) {
    const response = await api.put(`/curator/employer/${employerId}/toggle-active`);
    return response.data;
  },
  async toggleOpportunityActive(opportunityId: number) {
    const response = await api.put(`/curator/opportunity/${opportunityId}/toggle-active`);
    return response.data;
  },
};