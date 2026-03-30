import api from './api';
import type { Filters } from '../types';

export const opportunitiesService = {
  async getOpportunities(bounds?: any, filters?: Filters, page: number = 1) {
    const params = new URLSearchParams();
    
    if (bounds) {
      params.append('north', bounds.north.toString());
      params.append('south', bounds.south.toString());
      params.append('east', bounds.east.toString());
      params.append('west', bounds.west.toString());
    }
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.skills?.length) params.append('skills', filters.skills.join(','));
      if (filters.salaryMin) params.append('salary_min', filters.salaryMin.toString());
      if (filters.salaryMax) params.append('salary_max', filters.salaryMax.toString());
      if (filters.workFormat?.length) params.append('work_format', filters.workFormat.join(','));
      if (filters.type?.length) params.append('type', filters.type.join(','));
    }
    
    params.append('page', page.toString());
    params.append('limit', '20');

    const response = await api.get('/opportunities', { params });
    console.log('API Response:', response.data); // Для отладки
    return response.data;
  },

  async getOpportunityById(id: number) {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  async createOpportunity(data: any) {
    const response = await api.post('/opportunities', data);
    return response.data;
  },

  async updateOpportunity(id: number, data: any) {
    const response = await api.put(`/opportunities/${id}`, data);
    return response.data;
  },

  async deleteOpportunity(id: number) {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
  },
};