import API from './api';

export const searchLearning = async (query) => {
  const response = await API.get('/learning/search', { params: { query } });
  return response.data;
};

export const getFavorites = async () => {
  const response = await API.get('/learning/favorites');
  return response.data;
};

export const addFavorite = async (data) => {
  const response = await API.post('/learning/favorites', data);
  return response.data;
};

export const removeFavorite = async (id) => {
  const response = await API.delete(`/learning/favorites/${id}`);
  return response.data;
};
