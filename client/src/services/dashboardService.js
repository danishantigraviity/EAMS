import api from './api';
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getAssetReport: () => api.get('/reports/assets'),
  getMaintenanceReport: () => api.get('/reports/maintenance'),
  getLicenseReport: () => api.get('/reports/licenses'),
};
