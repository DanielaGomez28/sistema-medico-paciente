/**
 * @fileoverview Utilidad de frontend api.
 * @description Agrupa helpers, clientes o transformaciones reutilizadas por los portales del cliente.
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CURRENT_SESSION_STORAGE_KEY = 'plus_salud_user';
const LEGACY_SESSION_STORAGE_KEY = 'zenith_user';

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
 * en la sesión de pestaña de +Salud a cada petición saliente. Si el dato
 * almacenado está corrupto, lo limpia junto con la clave heredada de pestaña.
 */
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const rawSession =
      window.sessionStorage.getItem(CURRENT_SESSION_STORAGE_KEY) ||
      window.sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY);

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as StoredSession;
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        window.sessionStorage.removeItem(CURRENT_SESSION_STORAGE_KEY);
        window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      }
    }
  }

  return config;
});

/** Instancia de Axios usada por todo el frontend para llamar a la API del backend. */
export default apiClient;
