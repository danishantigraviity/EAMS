import api from './api';

let cachedPromise = null;

export const assetTypeService = {
  getAll: (force = false) => {
    if (force || !cachedPromise) {
      cachedPromise = api.get('/asset-types').catch((err) => {
        cachedPromise = null; // Clear on error so next call retries
        throw err;
      });
    }
    return cachedPromise;
  },
  create: (data) => {
    cachedPromise = null;
    return api.post('/asset-types', data);
  },
  update: (id, data) => {
    cachedPromise = null;
    return api.put(`/asset-types/${id}`, data);
  },
  delete: (id) => {
    cachedPromise = null;
    return api.delete(`/asset-types/${id}`);
  },
  clearCache: () => {
    cachedPromise = null;
  }
};
