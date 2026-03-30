import api from './api';

export const favoritesService = {
  async getFavorites() {
    const response = await api.get('/favorites');
    return response.data;
  },

  async toggleFavorite(opportunityId: number) {
    const response = await api.post(`/favorites/toggle/${opportunityId}`);
    return response.data;
  },
};