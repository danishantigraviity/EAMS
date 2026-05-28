import api from './api';
export const assetService = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/assets/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/assets/${id}`),
  assign: (id, data) => api.post(`/assets/${id}/assign`, data),
  unassign: (id, data) => api.post(`/assets/${id}/unassign`, data),
  getHistory: (id) => api.get(`/assets/${id}/history`),
  getExpiringWarranty: () => api.get('/assets/expiring-warranty'),
};
