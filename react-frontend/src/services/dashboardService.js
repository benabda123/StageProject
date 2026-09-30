import API from './api';

/**
 * Dashboard Service — appelle le dashboard-service backend via Kong
 * Toutes les routes nécessitent un token admin
 */

export const getDashboardStats = () => API.get('/dashboard/stats');
export const getEmployeeStats = () => API.get('/dashboard/stats/employees');
export const getLeaveStats = () => API.get('/dashboard/stats/leaves');
export const getMeetingStats = () => API.get('/dashboard/stats/meetings');
export const getTaskStats = () => API.get('/dashboard/stats/tasks');
