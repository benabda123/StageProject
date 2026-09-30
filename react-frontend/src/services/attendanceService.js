import API from './api';

export const checkIn = (lat, lng) =>
  API.post('/attendance/checkin', { lat, lng });

export const checkOut = (lat, lng) =>
  API.post('/attendance/checkout', { lat: lat ?? null, lng: lng ?? null });

export const getMyAttendance = (days = 30) =>
  API.get('/attendance/my', { params: { days } });

export const getTodayAttendance = () =>
  API.get('/attendance/today');

export const getTeamAttendance = (date) =>
  API.get('/attendance/team', { params: date ? { date } : {} });
