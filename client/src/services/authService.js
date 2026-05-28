import api from './api';
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};
