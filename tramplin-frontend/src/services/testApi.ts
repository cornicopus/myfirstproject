import api from './api';

export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('API connection successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('API connection failed:', error);
    return null;
  }
};