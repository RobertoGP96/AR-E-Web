/**
 * Exportaciones principales del módulo de autenticación
 */

// Contexto de autenticación
export { default as AuthProvider, AuthContext } from '../context/AuthContext';

// Hook principal de autenticación
export { useAuth, type UseAuthReturn } from '../hooks/useAuth';

// Componente de rutas protegidas
export { ProtectedRoute } from '../components/ProtectedRoute';

// Re-exportar hooks adicionales del archivo useAuth
export {
  usePermissions,
  useAuthLoading,
  useAuthError,
  useCurrentUser
} from '../hooks/useAuth';

// Tipos principales
export type { CustomUser, UserRole } from '../types/database';
export type { LoginCredentials, RegisterData, AuthResponse } from '../types/api';
