/**
 * API Client Helper - Cliente HTTP para consumir la API de Django
 * 
 * Este módulo proporciona una abstracción sobre axios para realizar
 * peticiones HTTP de manera consistente y manejar errores de forma centralizada.
 */

import axios from 'axios';
import { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';
import type { 
  PaginatedApiResponse, 
  AuthResponse, 
  LoginCredentials,
  RegisterData,
  BaseFilters
} from '../types/api';
import type { CustomUser } from '../types/models/user';
import { AUTH_ENDPOINTS } from '@/constants/auth';

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
  _retry?: boolean; // Interno para evitar loops de reintento
}

// Interfaz extendida para InternalAxiosRequestConfig
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  _retry?: boolean;
}

interface RequestConfig extends ExtendedAxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

// Interface para errores de API
type ApiErrorResponse = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isServerError?: boolean;
  isClientError?: boolean;
}

// Callback para redirigir al login
let redirectToLoginCallback: (() => void) | null = null;

// Callback para mostrar notificaciones
let showNotificationCallback: ((message: string, type: 'success' | 'error' | 'info' | 'warning') => void) | null = null;

// Callback para actualizar el estado de autenticación
let authStateChangeCallback: ((isAuthenticated: boolean) => void) | null = null;

// Flag para evitar múltiples redirecciones simultáneas
let isRedirecting = false;

// Variables para el manejo del refresh token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Timestamp de la última redirección
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 1000;

export function setRedirectToLoginCallback(callback: () => void) {
  redirectToLoginCallback = callback;
}

export function setShowNotificationCallback(callback: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  showNotificationCallback = callback;
}

export function setAuthStateChangeCallback(callback: (isAuthenticated: boolean) => void) {
  authStateChangeCallback = callback;
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
   * Suscribe peticiones fallidas a la espera del nuevo token
   */
  private subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
  }

  /**
   * Notifica a todos los suscriptores con el nuevo token
   */
  private onTokenRefreshed(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
  }

  /**
   * Configura los interceptors para requests y responses
   */
  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: ExtendedInternalAxiosRequestConfig) => {
        if (this.authToken && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedInternalAxiosRequestConfig;

        // Error 401 - Token expirado o inválido
        if (error.response?.status === 401 && !originalRequest?.skipAuth && !originalRequest?._retry) {
          
          if (isRefreshing) {
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const newToken = await this.refreshAuthToken();
            isRefreshing = false;
            this.onTokenRefreshed(newToken);
            
            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch {
            isRefreshing = false;
            refreshSubscribers = [];
            await this.handleUnauthorized();
            return Promise.reject(this.formatError(error));
          }
        }

        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Maneja errores de respuesta de manera centralizada
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const { response, config } = error;

    if (import.meta.env.DEV) {
      console.error(`❌ ${response?.status} ${config?.url}`, {
        status: response?.status,
        data: response?.data,
        message: error.message,
      });
    }

    if (response?.status === 403) {
      this.handleForbidden();
    }

    if (response?.status === 429) {
      this.handleRateLimit();
    }

    const apiError = this.formatError(error);
    return Promise.reject(apiError);
  }

  /**
   * Maneja errores 401 - Unauthorized
   */
  private async handleUnauthorized() {
    const now = Date.now();
    if (isRedirecting || (now - lastRedirectTime < REDIRECT_COOLDOWN)) {
      return;
    }
    
    isRedirecting = true;
    this.clearAuthToken();
    
    if (authStateChangeCallback) {
      authStateChangeCallback(false);
    }
    
    if (showNotificationCallback) {
      showNotificationCallback('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
    }

    lastRedirectTime = now;
    this.redirectToLogin();
    
    setTimeout(() => {
      isRedirecting = false;
    }, REDIRECT_COOLDOWN);
  }

  private handleForbidden() {
    console.warn('Access denied: Insufficient permissions');
    if (showNotificationCallback) {
      showNotificationCallback('No tienes permisos para realizar esta acción.', 'error');
    }
  }

  private handleRateLimit() {
    console.warn('Rate limit exceeded. Please try again later.');
    if (showNotificationCallback) {
      showNotificationCallback('Demasiadas solicitudes. Por favor, intenta más tarde.', 'warning');
    }
  }

  public formatError(error: AxiosError): ApiErrorResponse {
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

  public getErrorMessage(error: AxiosError | Error): string {
    if (!(error instanceof AxiosError)) {
      return error.message || 'An unexpected error occurred';
    }

    const { response } = error;
    
    if (response?.data) {
      const data = response.data as Record<string, unknown>;
      
      if (data.detail) return String(data.detail);
      if (data.message) return String(data.message);
      if (data.error) return String(data.error);
      
      if (data.non_field_errors) {
        const errors = data.non_field_errors;
        return Array.isArray(errors) ? String(errors[0]) : String(errors);
      }
      
      for (const [field, errors] of Object.entries(data)) {
        if (field === 'code') continue;
        if (Array.isArray(errors) && errors.length > 0) {
          return `${field}: ${String(errors[0])}`;
        }
        if (typeof errors === 'string') return errors;
      }
    }

    if (response?.status) {
      switch (response.status) {
        case 400: return 'Petición inválida - Por favor verifica tus datos';
        case 401: return 'Autenticación requerida';
        case 403: return 'Acceso denegado';
        case 404: return 'Recurso no encontrado';
        case 408: return 'Tiempo de espera agotado';
        case 422: return 'Error de validación';
        case 429: return 'Demasiadas solicitudes - Intenta más tarde';
        case 500: return 'Error interno del servidor';
        default: return `Error ${response.status}: ${error.message}`;
      }
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Error de red - Verifica tu conexión a internet';
    }

    return error.message || 'Ocurrió un error inesperado';
  }

  private loadAuthToken() {
    try {
      this.authToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    } catch (error) {
      console.warn('Error loading auth token:', error);
    }
  }

  public setAuthToken(token: string, persist: boolean = true) {
    this.authToken = token;
    try {
      if (persist) {
        localStorage.setItem('access_token', token);
      } else {
        sessionStorage.setItem('access_token', token);
      }
      if (authStateChangeCallback) {
        authStateChangeCallback(true);
      }
    } catch (error) {
      console.warn('Error saving auth token:', error);
    }
  }

  public clearAuthToken() {
    this.authToken = null;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      if (authStateChangeCallback) {
        authStateChangeCallback(false);
      }
    } catch (error) {
      console.warn('Error clearing auth token:', error);
    }
  }

  private getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  private async refreshAuthToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const isPersistent = !!localStorage.getItem('refresh_token');

    // Usamos axios directamente para evitar interceptores que podrían causar bucles
    const response = await axios.post(`${API_CONFIG.baseURL}${AUTH_ENDPOINTS.REFRESH}`, {
      refresh: refreshToken,
    });

    const { access, refresh } = response.data;
    this.setAuthToken(access, isPersistent);
    
    if (refresh) {
      if (isPersistent) {
        localStorage.setItem('refresh_token', refresh);
      } else {
        sessionStorage.setItem('refresh_token', refresh);
      }
    }

    return access;
  }

  private redirectToLogin() {
    if (redirectToLoginCallback) {
      redirectToLoginCallback();
    } else {
      window.location.href = '/login';
    }
  }

  public async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public async getPaginated<T = unknown>(
    url: string, 
    params?: BaseFilters & Record<string, unknown>, 
    config?: RequestConfig
  ): Promise<PaginatedApiResponse<T>> {
    const cleanParams: Record<string, unknown> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== 'all' && value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });
    }
    const response = await this.client.get<PaginatedApiResponse<T>>(url, {
      ...config,
      params: { page: 1, page_size: 1000, ...cleanParams },
    });
    return response.data;
  }

  public async login(credentials: LoginCredentials & { rememberMe?: boolean }): Promise<AuthResponse> {
    const { rememberMe, ...apiCredentials } = credentials;
    const response = await this.client.post<{
      access: string;
      refresh: string;
      user: CustomUser;
    }>(AUTH_ENDPOINTS.LOGIN, apiCredentials, { skipAuth: true } as ExtendedAxiosRequestConfig);

    const backendData = response.data;
    const authData: AuthResponse = {
      access_token: backendData.access,
      refresh_token: backendData.refresh,
      user: backendData.user,
      expires_in: 3600,
    };
    
    this.setAuthToken(authData.access_token, rememberMe);
    if (authData.refresh_token) {
      if (rememberMe) {
        localStorage.setItem('refresh_token', authData.refresh_token);
      } else {
        sessionStorage.setItem('refresh_token', authData.refresh_token);
      }
    }

    return authData;
  }

  public async register(userData: RegisterData): Promise<unknown> {
    return this.post(AUTH_ENDPOINTS.REGISTER, userData, { skipAuth: true });
  }

  public async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.post(AUTH_ENDPOINTS.LOGOUT, { refresh_token: refreshToken });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.clearAuthToken();
    }
  }

  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  public async getCurrentUser(): Promise<CustomUser> {
    return this.get<CustomUser>(AUTH_ENDPOINTS.CURRENT_USER);
  }
}

export const apiClient = new ApiClient();
export type { RequestConfig, ApiErrorResponse };
