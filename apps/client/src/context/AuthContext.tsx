/**
 * AuthContext - Contexto de autenticación para la aplicación
 * 
 * Proporciona estado global de autenticación, manejo de login/logout,
 * persistencia de sesión y verificación de permisos.
 */

import { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib';
import { 
  getStoredValue, 
  setStoredValue, 
  clearAuthStorage,
  validateAuthData,
  migrateAuthData,
  STORAGE_KEYS 
} from '@/utils/storage';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  ApiResponse 
} from '../types/api';
import type { CustomUser } from '@/types/user';

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
  // Migrar datos antiguos o corruptos
  migrateAuthData();
  
  // Validar integridad de los datos
  const validation = validateAuthData();
  
  if (!validation.isValid) {
    // Si los datos no son válidos, empezar con estado limpio
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
  
  const storedUser = getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null);
  const storedPermissions = getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []);
  const storedLastActivity = getStoredValue<string | null>(STORAGE_KEYS.LAST_ACTIVITY, null);
  
  // Solo considerar autenticado si hay token Y usuario almacenado Y la validación pasó
  const hasToken = validation.hasToken;
  const isAuthenticated = hasToken && !!storedUser && validation.hasConsistentData;
  
  return {
    user: storedUser,
    isAuthenticated,
    isLoading: hasToken && !isAuthenticated, // Solo mostrar loading si hay token pero datos inconsistentes
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
      
      // Persistir datos en localStorage de manera robusta
      const userStored = setStoredValue(STORAGE_KEYS.USER, action.payload.user);
      const permissionsStored = setStoredValue(STORAGE_KEYS.PERMISSIONS, action.payload.permissions);
      const activityStored = setStoredValue(STORAGE_KEYS.LAST_ACTIVITY, newState.lastActivity.toISOString());
      
      // Si falló el almacenamiento, mostrar advertencia pero continuar
      if (!userStored || !permissionsStored || !activityStored) {
        if (import.meta.env.DEV) {
          console.warn('Some auth data could not be persisted to localStorage');
        }
      }
      
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
      
      // Persistir usuario actualizado de manera robusta
      const stored = setStoredValue(STORAGE_KEYS.USER, action.payload);
      if (!stored && import.meta.env.DEV) {
        console.warn('Updated user data could not be persisted to localStorage');
      }
      
      return newState;
    }

    case 'UPDATE_ACTIVITY': {
      const newState = {
        ...state,
        lastActivity: new Date(),
      };
      
      // Persistir última actividad de manera robusta
      const stored = setStoredValue(STORAGE_KEYS.LAST_ACTIVITY, newState.lastActivity.toISOString());
      if (!stored && import.meta.env.DEV) {
        console.warn('Activity data could not be persisted to localStorage');
      }
      
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
      if (state.isLoading) {
        dispatch({ type: 'AUTH_ERROR', payload: 'No valid authentication data found' });
      }
      return;
    }

    // Si no hay autenticación del cliente API, limpiar datos locales
    if (!apiClient.isAuthenticated()) {
      hasCheckedAuth.current = true;
      clearAuthStorage();
      if (state.isLoading) {
        dispatch({ type: 'AUTH_ERROR', payload: 'No authentication token found' });
      }
      return;
    }

    // Si ya tenemos datos del usuario válidos y estamos autenticados, no hacer nueva llamada
    if (state.user && state.isAuthenticated && !state.isLoading && validation.hasConsistentData) {
      hasCheckedAuth.current = true;
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (state.isLoading && !isCheckingAuth.current) {
      return;
    }

    try {
      isCheckingAuth.current = true;
      dispatch({ type: 'AUTH_START' });

      // Obtener información del usuario actual (apiClient devuelve el payload directamente)
      const user = await apiClient.getCurrentUser<CustomUser>();

      // Verificar que el usuario obtenido sea válido
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
  }, [state.user, state.isAuthenticated, state.isLoading]);

  /**
   * Función de login
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authResponse = await apiClient.login(credentials);

      // Persistir tokens explícitamente usando STORAGE_KEYS utilities
      try {
        // El backend puede devolver access/refresh o access_token/refresh_token
  const authRecord = (authResponse as unknown) as Record<string, unknown>;
  const accessToken = (authRecord.access as string) || (authRecord.access_token as string);
  const refreshToken = (authRecord.refresh as string) || (authRecord.refresh_token as string);

        if (accessToken) {
          setStoredValue(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          // Asegurar que apiClient también tenga el token en memoria
          apiClient.setAuthToken(String(accessToken));
        }

        if (refreshToken) {
          setStoredValue(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
      } catch (err) {
        // Si falla persistencia no impedir login, solo warn en dev
        if (import.meta.env.DEV) console.warn('Could not persist auth tokens', err);
      }

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
      // Después del registro exitoso, podrías hacer login automático o requerir verificación
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
    } catch {
      // Error during logout
    } finally {
      // Resetear referencias de verificación
      hasCheckedAuth.current = false;
      isCheckingAuth.current = false;
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  /**
   * Refrescar información de autenticación
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!apiClient.isAuthenticated()) {
      dispatch({ type: 'AUTH_LOGOUT' });
      hasCheckedAuth.current = false;
      return;
    }

    try {
      const user = await apiClient.getCurrentUser<CustomUser>();

      // Verificar que el usuario obtenido sea válido
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
    } catch {
      // Error refreshing auth
      await logout();
    }
  }, [logout]);

  /**
   * Actualizar información del usuario
   */
  const updateUser = useCallback(async (userData: Partial<CustomUser>): Promise<void> => {
    if (!state.user) return;

    // Usar el método específico para actualizar perfil del usuario actual
    const updatedUser = await apiClient.updateCurrentUser<CustomUser>(userData);
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
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
    // Solo verificar si no se ha hecho antes
    if (!hasCheckedAuth.current) {
      checkExistingAuth();
    }
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
        // Auto-logout due to inactivity
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
