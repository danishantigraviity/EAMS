import api from './api';
export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};
