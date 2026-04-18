import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function createApiClient({ getAccessToken, setAccessToken, onUnauthenticated }) {
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  let isRefreshing = false;
  let pendingQueue = [];

  const flushQueue = (error, accessToken) => {
    pendingQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
        return;
      }

      const nextConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`
        }
      };

      resolve(api(nextConfig));
    });

    pendingQueue = [];
  };

  api.interceptors.request.use((config) => {
    const accessToken = getAccessToken?.();
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {};
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');

      if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post('/auth/refresh');
        setAccessToken?.(data.accessToken || null);
        flushQueue(null, data.accessToken);

        return api({
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${data.accessToken}`
          }
        });
      } catch (refreshError) {
        setAccessToken?.(null);
        flushQueue(refreshError, null);
        onUnauthenticated?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return api;
}
