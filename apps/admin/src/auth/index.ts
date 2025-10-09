/**
 * Exportaciones principales del módulo de autenticación
 */

// Hook principal de autenticación
export { useAuth, type UseAuthReturn } from '../hooks/auth/useAuth';

// Provider de autenticación
export { AuthProvider } from '../context/AuthContext';

// Tipos principales
export type { CustomUser } from '../types/models/user';
