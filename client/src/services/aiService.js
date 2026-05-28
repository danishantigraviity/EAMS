import api from './api';
export const aiService = {
  chat: (messages) => api.post('/ai/chat', { messages }),
  ocr: (data) => api.post('/ai/ocr', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  search: (q) => api.get('/search', { params: { q } }),
};
