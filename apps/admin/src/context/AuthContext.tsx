/**
 * AuthContext - Contexto de autenticación para la aplicación
 *
 * Proporciona estado global de autenticación, manejo de login/logout,
 * persistencia de sesión y verificación de permisos.
 */

import {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import {
  getStoredValue,
  clearAuthStorage,
  validateAuthData,
  STORAGE_KEYS,
} from "@/utils/storage";
import {
  type CustomUser,
  type UserRole,
  userRoleUtils,
} from "@/types/models/user";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
} from "../types/api";

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
  | { type: "AUTH_START" }
  | {
      type: "AUTH_SUCCESS";
      payload: { user: CustomUser; permissions: string[] };
    }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: CustomUser }
  | { type: "UPDATE_ACTIVITY" }
  | { type: "CLEAR_ERROR" };

// Tipos para el contexto
interface AuthContextType extends AuthState {
  login: (
    credentials: LoginCredentials & { rememberMe?: boolean },
  ) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<CustomUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  clearError: () => void;
  handleAuthStateChange: (isAuthenticated: boolean) => void;
}

// Función para obtener el estado inicial con datos persistidos
const getInitialState = (): AuthState => {
  const validation = validateAuthData();

  // Buscar en ambos storages
  const storedUser =
    getStoredValue<CustomUser | null>(STORAGE_KEYS.USER, null) ||
    JSON.parse(sessionStorage.getItem(STORAGE_KEYS.USER) || "null");

  const storedPermissions =
    getStoredValue<string[]>(STORAGE_KEYS.PERMISSIONS, []) ||
    JSON.parse(sessionStorage.getItem(STORAGE_KEYS.PERMISSIONS) || "[]");

  const storedLastActivity =
    getStoredValue<string | null>(STORAGE_KEYS.LAST_ACTIVITY, null) ||
    sessionStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);

  if (!validation.isValid) {
    if (import.meta.env.DEV && validation.issues.length > 0) {
      console.warn("Auth data validation issues:", validation.issues);
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

  const hasToken =
    validation.hasToken || !!sessionStorage.getItem("access_token");
  const isAuthenticated =
    hasToken &&
    !!storedUser &&
    (validation.hasConsistentData || !!sessionStorage.getItem("access_token"));

  return {
    user: storedUser,
    isAuthenticated,
    isLoading: false,
    error: null,
    permissions: storedPermissions,
    lastActivity: storedLastActivity ? new Date(storedLastActivity) : null,
  };
};

const initialState: AuthState = getInitialState();

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS": {
      const newState = {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: new Date(),
      };

      const isPersistent = !!localStorage.getItem("access_token");
      const storage = isPersistent ? localStorage : sessionStorage;

      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
      storage.setItem(
        STORAGE_KEYS.PERMISSIONS,
        JSON.stringify(action.payload.permissions),
      );
      storage.setItem(
        STORAGE_KEYS.LAST_ACTIVITY,
        newState.lastActivity.toISOString(),
      );

      return newState;
    }

    case "AUTH_ERROR": {
      clearAuthStorage();
      sessionStorage.clear();
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };
    }

    case "AUTH_LOGOUT": {
      clearAuthStorage();
      sessionStorage.clear();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        lastActivity: null,
      };
    }

    case "UPDATE_USER": {
      const isPersistent = !!localStorage.getItem("access_token");
      const storage = isPersistent ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    }

    case "UPDATE_ACTIVITY": {
      const lastActivity = new Date();
      const isPersistent = !!localStorage.getItem("access_token");
      const storage = isPersistent ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, lastActivity.toISOString());
      return { ...state, lastActivity };
    }

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const hasCheckedAuth = useRef(false);
  const isCheckingAuth = useRef(false);

  const checkExistingAuth = useCallback(async () => {
    if (isCheckingAuth.current || hasCheckedAuth.current) return;

    if (!apiClient.isAuthenticated()) {
      hasCheckedAuth.current = true;
      return;
    }

    isCheckingAuth.current = true;

    try {
      const user = await apiClient.getCurrentUser();
      const permissions: string[] = []; // TODO: Implement permissions from server if available

      dispatch({ type: "AUTH_SUCCESS", payload: { user, permissions } });
    } catch (error) {
      if (import.meta.env.DEV) console.warn("Auth check failed:", error);
      // No forzar logout aquí, dejar que el api-client lo maneje si es 401
    } finally {
      hasCheckedAuth.current = true;
      isCheckingAuth.current = false;
    }
  }, []);

  const login = useCallback(
    async (
      credentials: LoginCredentials & { rememberMe?: boolean },
    ): Promise<AuthResponse> => {
      try {
        dispatch({ type: "AUTH_START" });
        const authResponse = await apiClient.login(credentials);
        const permissions: string[] = [];

        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: authResponse.user, permissions },
        });

        return authResponse;
      } catch (error) {
        const errorMessage = apiClient.getErrorMessage(error as Error);
        dispatch({ type: "AUTH_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [],
  );

  const register = useCallback(
    async (userData: RegisterData): Promise<ApiResponse> => {
      try {
        dispatch({ type: "AUTH_START" });
        const response = await apiClient.register(userData);
        return response as ApiResponse;
      } catch (error) {
        const errorMessage = apiClient.getErrorMessage(error as Error);
        dispatch({ type: "AUTH_ERROR", payload: errorMessage });
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "AUTH_LOGOUT" });
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!apiClient.isAuthenticated()) {
      dispatch({ type: "AUTH_LOGOUT" });
      return;
    }
    try {
      const user = await apiClient.getCurrentUser();
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user, permissions: state.permissions },
      });
    } catch {
      await logout();
    }
  }, [logout, state.permissions]);

  const updateUser = useCallback(
    async (userData: Partial<CustomUser>): Promise<void> => {
      if (!state.user) return;
      try {
        const updatedUser = await apiClient.patch<CustomUser>(
          `/users/${state.user.id}/`,
          userData,
        );
        dispatch({ type: "UPDATE_USER", payload: updatedUser });
      } catch (error) {
        console.error("Update user error:", error);
        throw error;
      }
    },
    [state.user],
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions],
  );

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!state.user) return false;
      return userRoleUtils.hasRole(state.user, role);
    },
    [state.user],
  );

  const handleAuthStateChange = useCallback(
    (isAuthenticated: boolean) => {
      if (!isAuthenticated && state.isAuthenticated) {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    },
    [state.isAuthenticated],
  );

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" && !e.newValue && state.isAuthenticated) {
        dispatch({ type: "AUTH_LOGOUT" });
      }
      if (e.key === "access_token" && e.newValue && !state.isAuthenticated) {
        window.location.reload(); // Recargar para obtener el nuevo estado
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [state.isAuthenticated]);

  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  // Inactividad
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    const handleActivity = () => dispatch({ type: "UPDATE_ACTIVITY" });

    events.forEach((event) =>
      document.addEventListener(event, handleActivity, true),
    );

    const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora
    const interval = setInterval(() => {
      if (state.lastActivity) {
        const now = Date.now();
        if (now - state.lastActivity.getTime() > INACTIVITY_TIMEOUT) {
          logout();
        }
      }
    }, 60000);

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity, true),
      );
      clearInterval(interval);
    };
  }, [state.isAuthenticated, state.lastActivity, logout]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    hasPermission,
    hasRole,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
    handleAuthStateChange,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
export default AuthProvider;
