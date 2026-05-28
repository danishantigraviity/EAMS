import api from './api';
export const notificationService = {
  getMyNotifications: (params) => api.get('/notifications/me', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put(`/notifications/read-all/me`),
  delete: (id) => api.delete(`/notifications/${id}`),
};
