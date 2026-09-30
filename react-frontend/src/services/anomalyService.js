import API from './api';

export const generateReport = (days = 30) =>
  API.post(`/anomalies/report?days=${days}`);

export const getLatestReport = () =>
  API.get('/anomalies/report/latest');

export const getHistory = (limit = 10) =>
  API.get(`/anomalies/history?limit=${limit}`);

export const getReportById = (id) =>
  API.get(`/anomalies/report/${id}`);
