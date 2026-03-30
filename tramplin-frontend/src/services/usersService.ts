import api from './api';

export const usersService = {
  async getSeekerProfile() {
    const response = await api.get('/users/me/seeker-profile');
    return response.data;
  },

  async updateSeekerProfile(data: any) {
    const response = await api.put('/users/me/seeker-profile', data);
    return response.data;
  },

  async getEmployerProfile() {
    const response = await api.get('/users/me/employer-profile');
    return response.data;
  },

  async updateEmployerProfile(data: any) {
    const response = await api.put('/users/me/employer-profile', data);
    return response.data;
  },

  async getMyApplications() {
    const response = await api.get('/users/me/applications');
    return response.data;
  },

  async getMyConnections() {
    const response = await api.get('/users/me/connections');
    return response.data;
  },

  async createConnection(toSeekerId: number) {
    const response = await api.post('/users/me/connections', { to_seeker_id: toSeekerId });
    return response.data;
  },

  async getMyRecommendations() {
    const response = await api.get('/users/me/recommendations');
    return response.data;
  },

  async createRecommendation(data: any) {
    const response = await api.post('/users/me/recommendations', data);
    return response.data;
  },
  async getSeekerProfileById(seekerId: number) {
    const response = await api.get(`/users/seeker/${seekerId}`);
    return response.data;
  },
};