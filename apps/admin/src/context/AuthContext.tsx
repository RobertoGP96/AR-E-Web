/**
 * AuthContext - Contexto de autenticación para la aplicación
 * 
 * Proporciona estado global de autenticación, manejo de login/logout,
 * persistencia de sesión y verificación de permisos.
 */

import { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  getStoredValue, 
  setStoredValue, 
  clearAuthStorage,
  validateAuthData,
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
  handleAuthStateChange: (isAuthenticated: boolean) => void;
}

// Función para obtener el estado inicial con datos persistidos
const getInitialState = (): AuthState => {
  // Validar datos antes de inicializar
  const validation = validateAuthData();
  
  const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
  const storedPermissions = getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []);
  const storedLastActivity = getStoredValue<string | null>(STORAGE_KEYS.LAST_ACTIVITY, null);
  
  // Si no hay datos válidos, limpiar y retornar estado vacío
  if (!validation.isValid) {
    if (import.meta.env.DEV && validation.issues.length > 0) {
      console.warn('Auth data validation issues:', validation.issues);
    }
    clearAuthStorage();
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: [],
      lastActivity: null,
    };
  }
  
  // Solo considerar autenticado si hay token Y usuario almacenado Y la validación pasó
  const hasToken = validation.hasToken;
  const isAuthenticated = hasToken && !!storedUser && validation.hasConsistentData;
  
  return {
    user: storedUser,
    isAuthenticated,
    isLoading: false, // No mostrar loading inicialmente - se activará en checkExistingAuth si es necesario
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
  const hasCheckedAuth = useRef(false);
  const isCheckingAuth = useRef(false);

  /**
   * Verifica si existe un token válido al cargar la aplicación
   */
  const checkExistingAuth = useCallback(async () => {
    // Evitar múltiples verificaciones simultáneas
    if (isCheckingAuth.current || hasCheckedAuth.current) {
      return;
    }

    // Verificar validación de datos antes de proceder
    const validation = validateAuthData();
    
    // Si no hay datos válidos, limpiar y salir
    if (!validation.isValid || !validation.hasToken) {
      hasCheckedAuth.current = true;
      if (validation.hasUser && !validation.hasToken) {
        // Limpiar datos inconsistentes
        clearAuthStorage();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      return;
    }

    // Si no hay autenticación del cliente API, limpiar datos locales
    if (!apiClient.isAuthenticated()) {
      clearAuthStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
      hasCheckedAuth.current = true;
      return;
    }

    isCheckingAuth.current = true;

    // Si hay token pero no hay usuario guardado, intentar obtenerlo
    const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
    if (!storedUser) {
      try {
        dispatch({ type: 'AUTH_START' });
        
        // Obtener información del usuario actual
        const user = await apiClient.getCurrentUser();
        
        if (!user || !user.id) {
          throw new Error('Invalid user data received from server');
        }
        
        // Por ahora, permissions vacío hasta implementar sistema de permisos
        const permissions: string[] = [];
        
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user, 
            permissions 
          } 
        });

        hasCheckedAuth.current = true;
      } catch (error) {
        // Error verifying existing auth
        apiClient.clearAuthToken();
        clearAuthStorage();
        
        const errorMessage = error instanceof Error ? error.message : 'Invalid authentication token';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        hasCheckedAuth.current = true;
      } finally {
        isCheckingAuth.current = false;
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

    // Marcar como verificado inmediatamente para evitar bloqueos
    hasCheckedAuth.current = true;
    isCheckingAuth.current = false;

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
      // Si falla la verificación en segundo plano, no hacer logout inmediatamente
      // Dejar que el interceptor maneje los errores 401 en las siguientes peticiones
      if (import.meta.env.DEV) {
        console.warn('Error al verificar autenticación en segundo plano:', error);
      }
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

  /**
   * Maneja cambios de estado de autenticación desde el apiClient
   */
  const handleAuthStateChange = useCallback((isAuthenticated: boolean) => {
    if (!isAuthenticated && state.isAuthenticated) {
      // Si el apiClient dice que no está autenticado pero el estado dice que sí,
      // forzar logout solo si no estamos ya en proceso de verificación
      if (!isCheckingAuth.current) {
        hasCheckedAuth.current = false; // Permitir re-verificación
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } else if (isAuthenticated && !state.isAuthenticated && !isCheckingAuth.current) {
      // Si el apiClient dice que está autenticado pero el estado dice que no,
      // intentar verificar (esto es menos común)
      hasCheckedAuth.current = false; // Permitir re-verificación
      checkExistingAuth();
    }
  }, [state.isAuthenticated, checkExistingAuth]);

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
    handleAuthStateChange,
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
