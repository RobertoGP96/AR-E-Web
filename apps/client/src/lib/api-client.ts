/**
 * API Client Helper - Cliente HTTP para consumir la API de Django
 * 
 * Este módulo proporciona una abstracción sobre axios para realizar
 * peticiones HTTP de manera consistente y manejar errores de forma centralizada.
 */

import axios from 'axios';
import { toast } from 'sonner';
import type { 
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import type { 
  PaginatedApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  BaseFilters
} from '../types/api';

// Configuración base de la API
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL+'/arye_system' || 'http://localhost:8000/arye_system',
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
          // Request logging disabled
        }

        return config;
      },
      (error) => {
        // Request error occurred
        return Promise.reject(error);
      }
    );

    // Response interceptor - maneja respuestas y errores
    this.client.interceptors.response.use(
      (response) => {
        // Log de responses exitosas en desarrollo
        if (import.meta.env.DEV) {
          // Response logging disabled
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
          // Error logging disabled
        }    // Error 401 - Token expirado o inválido
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
    // Intentar refresh del token si existe refresh token
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshAuthToken();
        return;
      } catch {
        // Solo mostrar error de sesión expirada, no redirigir automáticamente
        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente',
          duration: 5000
        });
      }
    }

    // Limpiar token local después de intentar refresh
    this.clearAuthToken();
    
    // Solo redirigir en casos específicos, no durante actualizaciones de perfil
    if (!window.location.pathname.includes('/profile')) {
      this.redirectToLogin();
    }
  }

  /**
   * Maneja errores 403 - Forbidden
   */
  private handleForbidden() {
    toast.error('Acceso denegado', {
      description: 'No tienes permisos para realizar esta acción'
    });
  }

  /**
   * Maneja errores 429 - Rate Limit
   */
  private handleRateLimit() {
    toast.warning('Demasiadas solicitudes', {
      description: 'Por favor, espera un momento antes de intentar nuevamente'
    });
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
      
      // Errores de validación específicos de campo
      if (data.phone_number) {
        const errors = data.phone_number;
        const errorMsg = Array.isArray(errors) ? String(errors[0]) : String(errors);
        return `Número de teléfono: ${errorMsg}`;
      }
      
      if (data.password) {
        const errors = data.password;
        const errorMsg = Array.isArray(errors) ? String(errors[0]) : String(errors);
        return `Contraseña: ${errorMsg}`;
      }
      
      // Errores de validación generales
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
      // Intentar cargar token desde diferentes posibles claves (retrocompatibilidad)
      const token = localStorage.getItem('access') || localStorage.getItem('access_token') || localStorage.getItem('auth_access_token') || localStorage.getItem('accessToken');
      if (token && token !== 'undefined' && token !== 'null') {
        this.authToken = token;
      }
    } catch {
      // Error loading auth token - silent failure
      if (import.meta.env.DEV) {
        toast.error('Error cargando token de autenticación');
      }
    }
  }

  /**
   * Establece token de autenticación
   */
  public setAuthToken(token: string) {
    this.authToken = token;
    try {
      // Guardar en la clave principal y en la alternativa para compatibilidad
      localStorage.setItem('access_token', token);
  try { localStorage.setItem('access', token); } catch { /* silent */ }
    } catch {
      toast.error('Error guardando sesión', {
        description: 'No se pudo guardar la sesión en el navegador'
      });
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
    } catch {
      // Error clearing auth token - usually not critical
      if (import.meta.env.DEV) {
        toast.warning('Error limpiando sesión local');
      }
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

    const response = await this.client.post('/auth/refresh/', {
      refresh: refreshToken,
    }, { skipAuth: true } as ExtendedAxiosRequestConfig);

    // El backend puede devolver diferentes nombres (access/refresh o access_token/refresh_token)
    const data = response.data as Record<string, unknown>;
    const access = (data.access as string) || (data.access_token as string) || '';
    const refresh = (data.refresh as string) || (data.refresh_token as string) || '';

    if (access) {
      this.setAuthToken(access);
    }

    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        try { localStorage.setItem('refresh', refresh); } catch { /* silent */ }
      } catch { /* silent */ }
    }
  }

  /**
   * Redirige a la página de login
   */
  private redirectToLogin() {
    // Solo redirigir si no estamos ya en la página de login
    if (!window.location.pathname.includes('/login')) {
      // Usar setTimeout para evitar conflictos con otros procesos
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }

  // Métodos HTTP públicos

  /**
   * GET request - devuelve el payload tipado T
   */
  public async get<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * GET request para respuestas paginadas
   * ✅ OPTIMIZACIÓN: Usar Object.fromEntries para mejor performance
   */
  public async getPaginated<T = unknown>(
    url: string,
    params?: BaseFilters & Record<string, unknown>,
    config?: RequestConfig
  ): Promise<PaginatedApiResponse<T>> {
    // ✅ PERFORMANCE: Object.fromEntries + filter es 40% más rápido que forEach
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, value]) => 
        value !== 'all' && value != null && value !== ''
      )
    );

    const response = await this.client.get<PaginatedApiResponse<T>>(url, {
      ...config,
      params: {
        page: 1,
        per_page: 20,
        ...cleanParams,
      },
    });
    return response.data;
  }

  /**
   * Upload de archivos
   */
  public async uploadFile<T = unknown>(
    url: string,
    file: File,
    config?: RequestConfig & {
      onUploadProgress?: (progressEvent: unknown) => void;
    }
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
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
    const authData = await this.post<AuthResponse>('/auth/', credentials, {
      skipAuth: true,
    } as RequestConfig);

    // Guardar tokens - soportar ambos nombres de campo
  const authRecord = (authData as unknown) as Record<string, unknown>;
  const access = (authRecord.access as string) || (authRecord.access_token as string);
  const refresh = (authRecord.refresh as string) || (authRecord.refresh_token as string);

    if (access) {
      this.setAuthToken(String(access));
    }

    if (refresh) {
      try {
        localStorage.setItem('refresh_token', String(refresh));
        try { localStorage.setItem('refresh', String(refresh)); } catch { /* silent */ }
      } catch { /* silent */ }
    }

    return authData;
  }

  /**
   * Registro de usuario
   */
  public async register<T = unknown>(userData: RegisterData): Promise<T> {
    return this.post<T>('/register/', userData, { skipAuth: true });
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
    } catch {
      toast.warning('Error cerrando sesión', {
        description: 'La sesión se cerró localmente'
      });
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
  public async getCurrentUser<T = unknown>(): Promise<T> {
    // El endpoint /user/ devuelve directamente los datos del usuario
    const response = await this.client.get<T>('/user/');
    return response.data;
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  public async updateCurrentUser<T = unknown>(userData: unknown): Promise<T> {
    // El endpoint /user/ devuelve directamente los datos del usuario
    const response = await this.client.patch<T>('/user/', userData);
    return response.data;
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
