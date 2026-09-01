import axios, { type AxiosRequestConfig } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AUTH_STATE_CHANGED_EVENT = 'roadresq:auth-state-changed';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;

  const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('mechanicId');
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
  };

  const handleAuthRedirect = () => {
    const path = window.location.pathname;
    if (path.startsWith('/admin') && path !== '/admin/login') {
      window.location.href = '/admin/login';
    } else if (path.startsWith('/partner') && path !== '/partner/login') {
      window.location.href = '/partner/login';
    } else if (path.startsWith('/customer') && path !== '/customer/login') {
      window.location.href = '/customer/login';
    }
  };

  if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.error || error.message || 'An error occurred';
      error.message = errorMsg;
      handleAuthRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    
    // Don't attempt to refresh if we're hitting the login or refresh endpoint
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      clearStoredAuth();
      const errorMsg = error.response?.data?.error || error.message || 'An error occurred';
      error.message = errorMsg;
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
        
        // Update the original request's authorization header and retry it
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect
        clearStoredAuth();
        handleAuthRedirect();
      }
    } else {
      clearStoredAuth();
      handleAuthRedirect();
    }
  }
  
  const errorMsg = error.response?.data?.error || error.message || 'An error occurred';
  error.message = errorMsg;
  
  return Promise.reject(error);
});

interface FetchOptions {
  method?: string;
  data?: any;
  headers?: any;
  params?: any;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method: options.method || 'GET',
    data: options.data,
    headers: options.headers,
    params: options.params,
  };
  
  const response = await axiosInstance(config);
  return response.data;
}

export async function apiClientWithHeaders<T>(endpoint: string, options: FetchOptions = {}): Promise<{ data: T; headers: any }> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method: options.method || 'GET',
    data: options.data,
    headers: options.headers,
    params: options.params,
  };
  
  const response = await axiosInstance(config);
  return { data: response.data, headers: response.headers };
}
