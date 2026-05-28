import api from './api';
export const employeeService = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/employees/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/employees/${id}`),
  getAssets: (id) => api.get(`/employees/${id}/assets`),
};
