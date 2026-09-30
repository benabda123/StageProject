import API from './api';

export const getMyTickets = async () => {
  const response = await API.get('/tickets/mine');
  return response.data;
};

export const getAllTickets = async (params) => {
  const response = await API.get('/tickets', { params });
  return response.data;
};

export const getTicketDetails = async (id) => {
  const response = await API.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (data) => {
  const response = await API.post('/tickets', data);
  return response.data;
};

export const assignTicket = async (id, data) => {
  const response = await API.put(`/tickets/${id}/assign`, data || {});
  return response.data;
};

export const updateTicketStatus = async (id, status) => {
  const response = await API.put(`/tickets/${id}/status`, { status });
  return response.data;
};

export const closeTicket = async (id) => {
  const response = await API.put(`/tickets/${id}/close`);
  return response.data;
};

export const addComment = async (id, message) => {
  const response = await API.post(`/tickets/${id}/comments`, { message });
  return response.data;
};

export const analyzeImage = async (image) => {
  const response = await API.post('/tickets/analyze-image', { image });
  return response.data;
};
