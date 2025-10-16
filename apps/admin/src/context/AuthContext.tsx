/**
 * AuthContext - Contexto de autenticación para la aplicación
 * 
 * Proporciona estado global de autenticación, manejo de login/logout,
 * persistencia de sesión y verificación de permisos.
 */

import { createContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  getStoredValue, 
  setStoredValue, 
  clearAuthStorage,
  STORAGE_KEYS 
} from '@/utils/storage';
import type { CustomUser } from '@/types/models';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  ApiResponse 
} from '../types/api';

// Tipos para el estado de autenticación
interface AuthState {
  user: CustomUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  lastActivity: Date | null;
}

// Tipos para las acciones del reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: CustomUser; permissions: string[] } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: CustomUser }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'CLEAR_ERROR' };

// Tipos para el contexto
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<CustomUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  clearError: () => void;
}

// Función para obtener el estado inicial con datos persistidos
const getInitialState = (): AuthState => {
  const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
  const storedPermissions = getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []);
  const storedLastActivity = getStoredValue<string | null>(STORAGE_KEYS.LAST_ACTIVITY, null);
  
  // Solo considerar autenticado si hay token Y usuario almacenado
  const hasToken = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isAuthenticated = hasToken && !!storedUser;
  
  return {
    user: storedUser,
    isAuthenticated,
    isLoading: hasToken && !!storedUser, // Solo mostrar loading si hay token y usuario para verificar
    error: null,
    permissions: storedPermissions,
    lastActivity: storedLastActivity ? new Date(storedLastActivity) : null,
  };
};

// Estado inicial
const initialState: AuthState = getInitialState();

// Reducer para manejar el estado de autenticación
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS': {
      const newState = {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: new Date(),
      };
      
      // Persistir datos en localStorage
      setStoredValue(STORAGE_KEYS.USER, action.payload.user);
      setStoredValue(STORAGE_KEYS.PERMISSIONS, action.payload.permissions);
      setStoredValue(STORAGE_KEYS.LAST_ACTIVITY, newState.lastActivity.toISOString());
      
      return newState;
    }

    case 'AUTH_ERROR': {
      const newState = {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };
      
      // Limpiar datos persistidos en caso de error de autenticación
      clearAuthStorage();
      
      return newState;
    }

    case 'AUTH_LOGOUT': {
      const newState = {
        ...initialState,
        isLoading: false,
      };
      
      // Limpiar todos los datos persistidos
      clearAuthStorage();
      
      return newState;
    }

    case 'UPDATE_USER': {
      const newState = {
        ...state,
        user: action.payload,
      };
      
      // Persistir usuario actualizado
      setStoredValue(STORAGE_KEYS.USER, action.payload);
      
      return newState;
    }

    case 'UPDATE_ACTIVITY': {
      const newState = {
        ...state,
        lastActivity: new Date(),
      };
      
      // Persistir última actividad
      setStoredValue(STORAGE_KEYS.LAST_ACTIVITY, newState.lastActivity.toISOString());
      
      return newState;
    }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props del proveedor
interface AuthProviderProps {
  children: ReactNode;
}

// Componente proveedor del contexto
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Verifica si existe un token válido al cargar la aplicación
   */
  const checkExistingAuth = useCallback(async () => {
    // Si no hay token, no hay nada que verificar
    if (!apiClient.isAuthenticated()) {
      // Si hay datos de usuario guardados pero no hay token, limpiar todo
      const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
      if (storedUser) {
        console.warn('Usuario guardado sin token válido, limpiando almacenamiento');
        clearAuthStorage();
      }
      // No despachar error cuando simplemente no hay token - es una condición normal
      // Solo asegurarse de que el estado esté limpio
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }

    // Si hay token pero no hay usuario guardado, intentar obtenerlo
    const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
    if (!storedUser) {
      try {
        dispatch({ type: 'AUTH_START' });
        
        // Obtener información del usuario actual
        // apiClient.getCurrentUser() devuelve directamente CustomUser, no un objeto con data
        const user = await apiClient.getCurrentUser();
        
        // Por ahora, permissions vacío hasta implementar sistema de permisos
        const permissions: string[] = [];
        
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user, 
            permissions 
          } 
        });
      } catch (error) {
        console.error('Error verifying existing auth:', error);
        apiClient.clearAuthToken();
        dispatch({ type: 'AUTH_ERROR', payload: 'Invalid authentication token' });
      }
      return;
    }

    // Si hay token Y usuario guardado, usar el usuario guardado y verificar en segundo plano
    const storedPermissions = getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []);
    dispatch({ 
      type: 'AUTH_SUCCESS', 
      payload: { 
        user: storedUser, 
        permissions: storedPermissions 
      } 
    });

    // Verificar token en segundo plano sin bloquear la UI
    try {
      const user = await apiClient.getCurrentUser();
      const permissions: string[] = [];
      
      // Actualizar con datos frescos del servidor
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user, 
          permissions 
        } 
      });
    } catch (error) {
      // Si falla la verificación, mantener los datos guardados pero loggear el error
      console.warn('Error al verificar autenticación en segundo plano:', error);
      // No hacer logout aquí, dejar que el interceptor maneje errores 401
    }
  }, []);

  /**
   * Función de login
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authResponse = await apiClient.login(credentials);
      // Por ahora, permissions vacío hasta implementar sistema de permisos
      const permissions: string[] = [];
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user: authResponse.user, 
          permissions 
        } 
      });
      
      return authResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Inicio de Sesion Fallido';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Función de registro
   */
  const register = useCallback(async (userData: RegisterData): Promise<ApiResponse> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // apiClient.register devuelve los datos directamente
      const response = await apiClient.register(userData);
      
      // Después del registro exitoso, podrías hacer login automático
      // o requerir verificación de email según tu lógica de negocio
      
      return response as unknown as ApiResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Función de logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  /**
   * Refrescar información de autenticación
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!apiClient.isAuthenticated()) {
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }

    try {
      // apiClient.getCurrentUser() devuelve directamente CustomUser, no un objeto con data
      const user = await apiClient.getCurrentUser();
      // Por ahora, permissions vacío hasta implementar sistema de permisos
      const permissions: string[] = [];
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user, 
          permissions 
        } 
      });
    } catch (error) {
      console.error('Error refreshing auth:', error);
      await logout();
    }
  }, [logout]);

  /**
   * Actualizar información del usuario
   */
  const updateUser = useCallback(async (userData: Partial<CustomUser>): Promise<void> => {
    if (!state.user) return;

    try {
      // apiClient.patch devuelve directamente CustomUser, no un objeto con data
      const updatedUser = await apiClient.patch<CustomUser>(`/users/${state.user.id}/`, userData);
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [state.user]);

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = useCallback((role: string): boolean => {
    if (!state.user) return false;
    
        return state.user.role===role;
  }, [state.user]);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Actualizar actividad del usuario
   */
  const updateActivity = useCallback(() => {
    if (state.isAuthenticated) {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    }
  }, [state.isAuthenticated]);

  // Verificar autenticación existente al montar el componente
  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  // Configurar listener para actividad del usuario
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();

    // Añadir listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [state.isAuthenticated, updateActivity]);

  // Auto-logout por inactividad (opcional)
  useEffect(() => {
    if (!state.isAuthenticated || !state.lastActivity) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    
    const checkInactivity = () => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - state.lastActivity!.getTime();
      
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Verificar cada minuto
    
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.lastActivity, logout]);

  // Valor del contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    hasPermission,
    hasRole,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export del contexto para casos avanzados
export { AuthContext };

// Export por defecto del proveedor
export default AuthProvider;
