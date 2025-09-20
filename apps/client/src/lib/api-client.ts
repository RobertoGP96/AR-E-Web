/**
 * API Client Helper - Cliente HTTP para consumir la API de Django
 * 
 * Este módulo proporciona una abstracción sobre axios para realizar
 * peticiones HTTP de manera consistente y manejar errores de forma centralizada.
 */

import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import type { 
  ApiResponse, 
  PaginatedApiResponse, 
  AuthResponse, 
  LoginCredentials,
  RegisterData,
  BaseFilters
} from '../types/api';

// Configuración base de la API
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/arye_system',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Tipos para interceptors y configuraciones
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

// Interfaz extendida para AxiosRequestConfig con propiedades customizadas
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// Interfaz extendida para InternalAxiosRequestConfig
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

interface RequestConfig extends ExtendedAxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// Interface para errores de API
interface ApiErrorResponse {
  message: string;
  status?: number | undefined;
  code?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isServerError?: boolean;
  isClientError?: boolean;
}

// Clase principal del API Client
export class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      ...API_CONFIG,
      ...config,
    });

    this.setupInterceptors();
    this.loadAuthToken();
  }

  /**
   * Configura los interceptors para requests y responses
   */
  private setupInterceptors() {
    // Request interceptor - añade token de autorización
    this.client.interceptors.request.use(
      (config: ExtendedInternalAxiosRequestConfig) => {
        // Añadir token de autorización si existe
        if (this.authToken && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Log de requests en desarrollo
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - maneja respuestas y errores
    this.client.interceptors.response.use(
      (response) => {
        // Log de responses exitosas en desarrollo
        if (import.meta.env.DEV) {
          console.log(`✅ ${response.status} ${response.config.url}`, response.data);
        }

        return response;
      },
      async (error: AxiosError) => {
        // Manejo de errores centralizados
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Maneja errores de respuesta de manera centralizada
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const { response, config } = error;
    const extendedConfig = config as ExtendedInternalAxiosRequestConfig;

    // Log de errores en desarrollo
    if (import.meta.env.DEV) {
      console.error(`❌ ${response?.status} ${config?.url}`, {
        status: response?.status,
        data: response?.data,
        message: error.message,
      });
    }

    // Error 401 - Token expirado o inválido
    if (response?.status === 401 && !extendedConfig?.skipAuth) {
      await this.handleUnauthorized();
    }

    // Error 403 - Sin permisos
    if (response?.status === 403) {
      this.handleForbidden();
    }

    // Error 429 - Rate limiting
    if (response?.status === 429) {
      this.handleRateLimit();
    }

    // Formatear error para el cliente
    const apiError = this.formatError(error);
    return Promise.reject(apiError);
  }

  /**
   * Maneja errores 401 - Unauthorized
   */
  private async handleUnauthorized() {
    // Limpiar token local
    this.clearAuthToken();
    
    // Intentar refresh del token si existe refresh token
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshAuthToken();
        return;
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    // Redirigir a login si no se puede refreshear
    this.redirectToLogin();
  }

  /**
   * Maneja errores 403 - Forbidden
   */
  private handleForbidden() {
    // Mostrar mensaje de error de permisos
    console.warn('Access denied: Insufficient permissions');
    // Aquí podrías disparar una notificación global
  }

  /**
   * Maneja errores 429 - Rate Limit
   */
  private handleRateLimit() {
    console.warn('Rate limit exceeded. Please try again later.');
    // Aquí podrías implementar retry con backoff exponencial
  }

  /**
   * Formatea errores para consumo del cliente
   */
  private formatError(error: AxiosError): ApiErrorResponse {
    const { response } = error;
    
    return {
      message: this.getErrorMessage(error),
      status: response?.status,
      code: (response?.data as Record<string, unknown>)?.code as string,
      details: response?.data,
      isNetworkError: !response,
      isServerError: response ? response.status >= 500 : false,
      isClientError: response ? response.status >= 400 && response.status < 500 : false,
    };
  }

  /**
   * Extrae mensaje de error legible
   */
  private getErrorMessage(error: AxiosError): string {
    const { response } = error;
    
    // Mensajes desde el servidor
    if (response?.data) {
      const data = response.data as Record<string, unknown>;
      
      // Django REST Framework error format
      if (data.detail) return String(data.detail);
      if (data.message) return String(data.message);
      if (data.error) return String(data.error);
      
      // Errores de validación
      if (data.non_field_errors) {
        const errors = data.non_field_errors;
        return Array.isArray(errors) ? String(errors[0]) : String(errors);
      }
      
      // Primer error de campo encontrado
      for (const [field, errors] of Object.entries(data)) {
        if (Array.isArray(errors) && errors.length > 0) {
          return `${field}: ${String(errors[0])}`;
        }
      }
    }

    // Mensajes por código de estado
    if (response?.status) {
      switch (response.status) {
        case 400: return 'Bad request - Please check your input';
        case 401: return 'Authentication required';
        case 403: return 'Access denied';
        case 404: return 'Resource not found';
        case 408: return 'Request timeout';
        case 409: return 'Conflict - Resource already exists';
        case 422: return 'Validation error';
        case 429: return 'Too many requests - Please try again later';
        case 500: return 'Internal server error';
        case 502: return 'Bad gateway';
        case 503: return 'Service unavailable';
        case 504: return 'Gateway timeout';
        default: return `HTTP ${response.status}: ${error.message}`;
      }
    }

    // Error de red
    if (error.code === 'NETWORK_ERROR' || !response) {
      return 'Network error - Please check your connection';
    }

    return error.message || 'An unexpected error occurred';
  }

  /**
   * Carga token de autenticación desde localStorage
   */
  private loadAuthToken() {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.warn('Error loading auth token:', error);
    }
  }

  /**
   * Establece token de autenticación
   */
  public setAuthToken(token: string) {
    this.authToken = token;
    try {
      localStorage.setItem('access_token', token);
    } catch (error) {
      console.warn('Error saving auth token:', error);
    }
  }

  /**
   * Limpia token de autenticación
   */
  public clearAuthToken() {
    this.authToken = null;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.warn('Error clearing auth token:', error);
    }
  }

  /**
   * Obtiene refresh token
   */
  private getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  /**
   * Refresca el token de autenticación
   */
  private async refreshAuthToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await this.client.post('/token/refresh/', {
      refresh: refreshToken,
    }, { skipAuth: true } as ExtendedAxiosRequestConfig);

    const { access, refresh } = response.data;
    this.setAuthToken(access);
    
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
  }

  /**
   * Redirige a la página de login
   */
  private redirectToLogin() {
    // Aquí implementarías la lógica de redirección según tu router
    window.location.href = '/login';
  }

  // Métodos HTTP públicos

  /**
   * GET request
   */
  public async get<T = unknown>(
    url: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T = unknown>(
    url: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * GET request para respuestas paginadas
   */
  public async getPaginated<T = unknown>(
    url: string, 
    params?: BaseFilters & Record<string, unknown>, 
    config?: RequestConfig
  ): Promise<PaginatedApiResponse<T>> {
    const response = await this.client.get<PaginatedApiResponse<T>>(url, {
      ...config,
      params: {
        page: 1,
        per_page: 20,
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Upload de archivos
   */
  public async uploadFile(
    url: string,
    file: File,
    config?: RequestConfig & {
      onUploadProgress?: (progressEvent: unknown) => void;
    }
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<unknown>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });

    return response.data;
  }

  /**
   * Download de archivos
   */
  public async downloadFile(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Crear enlace de descarga
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Métodos de autenticación

  /**
   * Login de usuario
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/token/', credentials, {
      skipAuth: true,
    } as ExtendedAxiosRequestConfig);

    const authData = response.data;
    
    // Guardar tokens
    this.setAuthToken(authData.access_token);
    if (authData.refresh_token) {
      localStorage.setItem('refresh_token', authData.refresh_token);
    }

    return authData;
  }

  /**
   * Registro de usuario
   */
  public async register(userData: RegisterData): Promise<ApiResponse<unknown>> {
    return this.post('/register/', userData, { skipAuth: true });
  }

  /**
   * Logout de usuario
   */
  public async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.post('/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.clearAuthToken();
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Obtiene información del usuario actual
   */
  public async getCurrentUser(): Promise<ApiResponse<unknown>> {
    return this.get('/user/me/');
  }
}

// Error personalizado para el API
export class ApiError extends Error {
  public status: number | undefined;
  public code?: string | undefined;
  public details?: unknown;
  public isNetworkError?: boolean;
  public isServerError?: boolean;
  public isClientError?: boolean;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = !status;
    this.isServerError = status ? status >= 500 : false;
    this.isClientError = status ? status >= 400 && status < 500 : false;
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Export por defecto para mayor compatibilidad


// Export del tipo de error para uso en otras partes
export type { RequestConfig, ApiErrorResponse };
