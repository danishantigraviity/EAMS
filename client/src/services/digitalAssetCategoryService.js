import api from './api';

export const digitalAssetCategoryService = {
  getAll: () => api.get('/digital-asset-categories'),
  create: (data) => api.post('/digital-asset-categories', data),
  update: (id, data) => api.put(`/digital-asset-categories/${id}`, data),
  delete: (id) => api.delete(`/digital-asset-categories/${id}`),
};
