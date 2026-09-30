import API from './api';

export const getMyNotifications = async () => {
  const response = await API.get('/notifications/my');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await API.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await API.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await API.delete(`/notifications/${id}`);
  return response.data;
};

export const getAllNotifications = async (params) => {
  const response = await API.get('/notifications', { params });
  return response.data;
};

export const broadcastNotification = async (data) => {
  const response = await API.post('/notifications/broadcast', data);
  return response.data;
};
