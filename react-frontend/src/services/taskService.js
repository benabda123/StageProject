import API from './api';

export const getMyTasks = async () => {
  const response = await API.get('/tasks/my');
  return response.data;
};

export const getAllTasks = async (params) => {
  const response = await API.get('/tasks', { params });
  return response.data;
};

export const getTaskById = async (id) => {
  const response = await API.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data) => {
  const response = await API.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await API.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await API.delete(`/tasks/${id}`);
  return response.data;
};

export const updateTaskStatus = async (id, status) => {
  const response = await API.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const getEmployees = async () => {
  const response = await API.get('/auth/employees');
  return response.data;
};
