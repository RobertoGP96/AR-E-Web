/// <reference types="vite/client" />

// Declaraciones para módulos de la aplicación
declare module '@/lib/utils' {
  import { type ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}

declare module '@/lib/api-client' {
  import type { ApiResponse, AuthResponse, PaginatedApiResponse } from '@/types/api';
  
  interface ApiClient {
    // Métodos de autenticación
    login: (credentials: unknown) => Promise<AuthResponse>;
    register: (userData: unknown) => Promise<ApiResponse>;
    logout: () => Promise<void>;
    isAuthenticated: () => boolean;
    getCurrentUser: () => Promise<ApiResponse>;
    clearAuthToken: () => void;
    setAuthToken: (token: string) => void;
    
    // Métodos HTTP genéricos
    get: <T = unknown>(url: string, params?: Record<string, unknown>) => Promise<ApiResponse<T>>;
    post: <T = unknown>(url: string, data?: unknown) => Promise<ApiResponse<T>>;
    patch: <T = unknown>(url: string, data: unknown) => Promise<ApiResponse<T>>;
    delete: <T = unknown>(url: string) => Promise<ApiResponse<T>>;
    put: <T = unknown>(url: string, data: unknown) => Promise<ApiResponse<T>>;
    
    // Métodos especializados
    getPaginated: <T = unknown>(url: string, params?: Record<string, unknown>) => Promise<PaginatedApiResponse<T>>;
  }
  export const apiClient: ApiClient;
}

declare module '@/lib/*' {
  const content: unknown;
  export default content;
}
