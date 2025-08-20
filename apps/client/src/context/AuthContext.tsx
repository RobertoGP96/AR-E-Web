/**
 * AuthContext - Contexto de autenticación para la aplicación
 * 
 * Proporciona estado global de autenticación, manejo de login/logout,
 * persistencia de sesión y verificación de permisos.
 */

import { createContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
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

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true inicialmente para verificar token existente
  error: null,
  permissions: [],
  lastActivity: null,
};

// Reducer para manejar el estado de autenticación
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: new Date(),
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date(),
      };

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
    if (!apiClient.isAuthenticated()) {
      dispatch({ type: 'AUTH_ERROR', payload: 'No authentication token found' });
      return;
    }

    try {
      dispatch({ type: 'AUTH_START' });
      
      // Obtener información del usuario actual
      const response = await apiClient.getCurrentUser();
      const user = response.data as CustomUser;
      
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
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
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
      
      const response = await apiClient.register(userData);
      
      // Después del registro exitoso, podrías hacer login automático
      // o requerir verificación de email según tu lógica de negocio
      
      return response;
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
      const response = await apiClient.getCurrentUser();
      const user = response.data as CustomUser;
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
      const response = await apiClient.patch(`/users/${state.user.id}/`, userData);
      const updatedUser = response.data as CustomUser;
      
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
        console.log('Auto-logout due to inactivity');
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
