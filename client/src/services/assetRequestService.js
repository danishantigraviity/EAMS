import api from './api';

export const assetRequestService = {
  getAll: (params) => api.get('/asset-requests', { params }),
  create: (data) => api.post('/asset-requests', data),
  update: (id, data) => api.put(`/asset-requests/${id}`, data),
};
