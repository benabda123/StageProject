import API from './api';

export const getMyMeetings = async () => {
  const response = await API.get('/meetings/mine');
  return response.data;
};

export const getAllMeetings = async (params) => {
  const response = await API.get('/meetings', { params });
  return response.data;
};

export const getMeetingById = async (id) => {
  const response = await API.get(`/meetings/${id}`);
  return response.data;
};

export const createMeeting = async (data) => {
  try {
    const response = await API.post('/meetings', data);
    return response.data;
  } catch (error) {
    console.error('Détail erreur backend createMeeting:', error.response?.data);
    throw error;
  }
};

export const approveMeeting = async (id) => {
  const response = await API.put(`/meetings/${id}/approve`);
  return response.data;
};

export const rejectMeeting = async (id) => {
  const response = await API.put(`/meetings/${id}/reject`);
  return response.data;
};

export const requestMeetingChange = async (id, data) => {
  const response = await API.put(`/meetings/${id}/request-change`, data);
  return response.data;
};

export const resolveMeetingChange = async (id, data) => {
  try {
    const response = await API.put(`/meetings/${id}/resolve-change`, data);
    return response.data;
  } catch (error) {
    console.error('Détail erreur backend resolveMeetingChange:', error.response?.data);
    throw error;
  }
};

export const cancelMeeting = async (id, data) => {
  const response = await API.put(`/meetings/${id}/cancel`, data);
  return response.data;
};

export const getRooms = async () => {
  const response = await API.get('/rooms');
  return response.data;
};

export const createRoom = async (data) => {
  const response = await API.post('/rooms', data);
  return response.data;
};

export const updateRoom = async (id, data) => {
  const response = await API.put(`/rooms/${id}`, data);
  return response.data;
};

export const deleteRoom = async (id) => {
  const response = await API.delete(`/rooms/${id}`);
  return response.data;
};

export const getGoogleCalendarStatus = async () => {
  const response = await API.get('/meetings/google/status');
  return response.data;
};
