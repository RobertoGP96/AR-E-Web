/// <reference types="vite/client" />

// Declaraciones para módulos de la aplicación
declare module '@/lib/utils' {
  import { type ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}

declare module '@/lib/api-client' {
  import type { ApiResponse, AuthResponse } from '@/types/api';
  
  interface ApiClient {
    login: (credentials: unknown) => Promise<AuthResponse>;
    register: (userData: unknown) => Promise<ApiResponse>;
    logout: () => Promise<void>;
    isAuthenticated: () => boolean;
    getCurrentUser: () => Promise<ApiResponse>;
    clearAuthToken: () => void;
    patch: (url: string, data: unknown) => Promise<ApiResponse>;
  }
  export const apiClient: ApiClient;
}

declare module '@/lib/*' {
  const content: unknown;
  export default content;
}
