import axios from "axios";
import { getToken } from "./services/tokenStore";

const api = axios.create({
  baseURL: "http://localhost:8000", // Kong
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
