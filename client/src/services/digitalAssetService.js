import api from './api';

export const digitalAssetService = {
  getAll: (params) => api.get('/digital-assets', { params }),
  upload: (data, onUploadProgress) => api.post('/digital-assets', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  }),
  update: (id, data) => api.put(`/digital-assets/${id}`, data),
  delete: (id) => api.delete(`/digital-assets/${id}`),
  getDownloadUrl: (id) => api.get(`/digital-assets/${id}/download`),
  getPreviewFile: (id, path) => api.get(`/digital-assets/${id}/preview-file`, { params: { path } }),
};
