import api from './api';
export const licenseService = {
  getAll: (params) => api.get('/licenses', { params }),
  getById: (id) => api.get(`/licenses/${id}`),
  create: (data) => api.post('/licenses', data),
  update: (id, data) => api.put(`/licenses/${id}`, data),
  delete: (id) => api.delete(`/licenses/${id}`),
  assignSeat: (id, userId) => api.post(`/licenses/${id}/assign`, { userId }),
  unassignSeat: (id, userId) => api.post(`/licenses/${id}/unassign`, { userId }),
  getExpiring: () => api.get('/licenses/expiring'),
};
