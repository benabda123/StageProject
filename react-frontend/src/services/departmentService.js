import axios from 'axios';
import { getToken } from './tokenStore';

const API_URL = 'http://localhost:8000/departments';

const API = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token JWT à chaque requête
API.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAllDepartments = async () => {
  const response = await API.get('/');
  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await API.post('/', departmentData);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await API.delete(`/${id}`);
  return response.data;
};
