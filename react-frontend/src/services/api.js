import axios from 'axios';
import { getToken } from './tokenStore';

// On pointe vers Kong Gateway (Port 8000)
const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// Intercepteur pour ajouter le token JWT à chaque requête
API.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

export const getEmployees = async () => {
  const response = await API.get('/employees');
  return response.data;
};
export const getEmployeeById = async (id) => {
  const response = await API.get(`/employees/${id}`);
  return response.data;
};
export const createEmployee = async (data) => {
  const response = await API.post('/employees', data);
  return response.data;
};
export const deleteEmployee = async (id) => {
  const response = await API.delete(`/employees/${id}`);
  return response.data;
};
export const updateEmployee = async (id, data) => {
  const response = await API.put(`/employees/${id}`, data);
  return response.data;
};
