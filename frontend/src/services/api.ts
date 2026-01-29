import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  validateToken: () => api.post('/auth/validate'),
};

export const clientsAPI = {
  getAll: (page = 1, limit = 10, filters?: Record<string, string>) =>
    api.get('/clients', { params: { page, limit, ...filters } }),
  getById: (id: number) => api.get(`/clients/${id}`),
  getStatistics: (id: number) => api.get(`/clients/${id}/statistics`),
};

export const scoreAPI = {
  calculate: (clienteId: number) => api.post(`/score/calculate/${clienteId}`),
  getLatest: (clienteId: number) => api.get(`/score/${clienteId}`),
  getHistory: (clienteId: number) => api.get(`/score/${clienteId}/history`),
  getDefaults: () => api.get('/score/defaults'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const limitsAPI = {
  request: (data: { cliente_id: number; limite_solicitado: number; motivo: string }) =>
    api.post('/limits/request', data),
  getByClient: (clienteId: number) => api.get(`/limits/client/${clienteId}`),
  getCurrentByClient: (clienteId: number) => api.get(`/limits/client/${clienteId}/current`),
  getPending: (page = 1, limit = 10) => api.get('/limits/pending', { params: { page, limit } }),
  approve: (id: number, data: { limite_aprovado: number; observacoes?: string }) =>
    api.post(`/limits/${id}/approve`, data),
  reject: (id: number, data: { motivo: string }) =>
    api.post(`/limits/${id}/reject`, data),
};

export const configAPI = {
  getScoring: () => api.get('/config/scoring'),
  updateScoringWeights: (weights: Record<string, number>) =>
    api.put('/config/scoring/weights', weights),
};

export default api;
