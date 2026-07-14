/**
 * @fileoverview Utilidad de frontend api.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type StoredSession = {
  token?: string | null;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const rawSession = window.localStorage.getItem('zenith_user');

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as StoredSession;
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        window.localStorage.removeItem('zenith_user');
      }
    }
  }

  return config;
});

export default apiClient;
