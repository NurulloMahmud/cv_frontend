import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiTokens, ApiUser, ApiCV } from '@shared/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Token storage helpers
const TOKEN_KEY = 'tezcv_access';
const REFRESH_KEY = 'tezcv_refresh';
const SESSION_KEY_STORAGE = 'tezcv_session_key';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (tokens: ApiTokens) => {
    localStorage.setItem(TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const sessionStorage_ = {
  get: () => localStorage.getItem(SESSION_KEY_STORAGE) ?? '',
  set: (key: string) => localStorage.setItem(SESSION_KEY_STORAGE, key),
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Authorization + X-Session-Key headers
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionKey = sessionStorage_.get();
  if (sessionKey) {
    config.headers['X-Session-Key'] = sessionKey;
  }
  return config;
});

// Response interceptor: on 401, try refreshing the token once
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Capture X-Session-Key from response headers
    const sk = response.headers['x-session-key'];
    if (sk) sessionStorage_.set(sk);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refresh = tokenStorage.getRefresh();
      if (!refresh) {
        tokenStorage.clear();
        isRefreshing = false;
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post<ApiTokens>(`${BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        });
        tokenStorage.setTokens(data);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; first_name?: string; last_name?: string }) =>
    api.post<{ user: ApiUser } & ApiTokens>('/api/auth/register/', data),

  login: (email: string, password: string) =>
    api.post<{ user: ApiUser } & ApiTokens>('/api/auth/login/', { email, password }),

  logout: (refresh: string) =>
    api.post('/api/auth/logout/', { refresh }),

  getProfile: () =>
    api.get<ApiUser>('/api/auth/profile/'),

  updateProfile: (data: Partial<ApiUser>) =>
    api.put<ApiUser>('/api/auth/profile/', data),
};

// ─── CV API ───────────────────────────────────────────────────────────────────

export const cvApi = {
  list: () =>
    api.get<ApiCV[]>('/api/cv/'),

  create: (data?: Partial<ApiCV>) =>
    api.post<ApiCV>('/api/cv/', data ?? { title: 'My CV', template_choice: 1 }),

  get: (id: string) =>
    api.get<ApiCV>(`/api/cv/${id}/`),

  update: (id: string, data: Partial<ApiCV>) =>
    api.patch<ApiCV>(`/api/cv/${id}/`, data),

  delete: (id: string) =>
    api.delete(`/api/cv/${id}/`),

  exportPdfUrl: (id: string) =>
    `${BASE_URL}/api/pdf/${id}/export-pdf/`,
};

export default api;
