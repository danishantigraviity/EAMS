import axios from 'axios';

let store;

export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const state = store?.getState();
    const token = state?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor — handle 401 & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (!store) throw new Error('Store not injected');
        const state = store.getState();
        const storedRefreshToken = state.auth.refreshToken;

        if (!storedRefreshToken) throw new Error('No refresh token');

        // Dynamically import authSlice to break static circular dependency
        const { refreshToken: refreshTokenAction } = await import('../features/auth/authSlice');

        const result = await store.dispatch(refreshTokenAction(storedRefreshToken));
        if (refreshTokenAction.fulfilled.match(result)) {
          const newToken = result.payload.accessToken;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        processQueue(err, null);
        if (store) {
          const { logout: logoutAction } = await import('../features/auth/authSlice');
          store.dispatch(logoutAction());
        }
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
