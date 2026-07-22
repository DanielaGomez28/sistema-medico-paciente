/**
 * @fileoverview Utilidad de frontend api.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type StoredSession = {
  token?: string | null;
};

/** Cliente Axios preconfigurado con la URL base del backend y timeout de 10s. */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Interceptor de request que adjunta el token Bearer de la sesión almacenada
 * en `localStorage` (clave `zenith_user`) a cada petición saliente. Si el dato
 * almacenado está corrupto, lo limpia.
 */
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const rawSession = window.sessionStorage.getItem('zenith_user') || window.localStorage.getItem('zenith_user');

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as StoredSession;
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        window.sessionStorage.removeItem('zenith_user');
        window.localStorage.removeItem('zenith_user');
      }
    }
  }

  return config;
});

/** Instancia de Axios usada por todo el frontend para llamar a la API del backend. */
export default apiClient;
