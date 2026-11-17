import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getToken, AUTH_EXPIRED_EVENT } from './auth-token';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based authentication
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses
    if (import.meta.env.DEV) console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      logoId: response.data?.logoId,
    });

    return response;
  },
  (error: AxiosError) => {
    // Handle errors globally
    const errorMessage = error.response?.data 
      ? (error.response.data as any).userMessage || (error.response.data as any).message || 'An error occurred'
      : error.message || 'Network error';

    console.error('[API Error]', {
      status: error.response?.status,
      message: errorMessage,
      logoId: (error.response?.data as any)?.logoId,
      url: error.config?.url,
    });

    // Expired / invalid token: let the app sign the user out (login attempts handle their own 401)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    // You can add global error handling here (e.g., show toast notification)
    // toast.error(errorMessage);

    return Promise.reject(error);
  }
);

// Named export for consistency
export { axiosInstance };

// Default export for backward compatibility
export default axiosInstance;

// Export for type-safe API responses
export interface ApiResponse<T = any> {
  logoId: string | null;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: T;
}

export interface PaginatedData<T> {
  result: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

