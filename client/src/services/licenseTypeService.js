import api from './api';

export const licenseTypeService = {
  getAll: () => api.get('/license-types'),
  create: (data) => api.post('/license-types', data),
  update: (id, data) => api.put(`/license-types/${id}`, data),
  delete: (id) => api.delete(`/license-types/${id}`),
};
