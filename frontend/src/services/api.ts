import axios from 'axios';
import type { User, Client, CreditAnalysis, MetricConfiguration, DashboardStats, ScoreHistory } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) => 
    api.post<{ token: string; user: User }>('/auth/login', credentials),
  
  logout: () => api.post('/auth/logout'),
  
  validateToken: () => api.get<User>('/auth/validate'),
};

// Clients API
export const clientsAPI = {
  getAll: () => api.get<Client[]>('/clients'),
  
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  
  search: (query: string) => api.get<Client[]>(`/clients/search?q=${query}`),
  
  updateCreditLimit: (id: string, limit: number, reason: string) => 
    api.patch(`/clients/${id}/credit-limit`, { limit, reason }),
};

// Analytics API  
export const analyticsAPI = {
  getDashboardStats: () => api.get<DashboardStats>('/analytics/dashboard'),
  
  getClientAnalysis: (clientId: string) => 
    api.get<CreditAnalysis>(`/analytics/client/${clientId}`),
    
  getScoreHistory: (clientId: string) => 
    api.get<ScoreHistory[]>(`/analytics/client/${clientId}/score-history`),
    
  runAnalysis: (clientId: string, customMetrics?: Partial<MetricConfiguration>[]) => 
    api.post<CreditAnalysis>(`/analytics/run`, { clientId, customMetrics }),
};

// Metrics API
export const metricsAPI = {
  getConfigurations: () => api.get<MetricConfiguration[]>('/metrics/configurations'),
  
  updateConfiguration: (id: string, config: Partial<MetricConfiguration>) => 
    api.patch(`/metrics/configurations/${id}`, config),
    
  createConfiguration: (config: Omit<MetricConfiguration, 'id'>) => 
    api.post<MetricConfiguration>('/metrics/configurations', config),
    
  deleteConfiguration: (id: string) => 
    api.delete(`/metrics/configurations/${id}`),
};

export default api;