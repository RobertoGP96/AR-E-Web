import type { ReactNode } from 'react';
import { useAuth } from '../hooks/auth/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requiredPermission,
  requiredRole,
  fallback = <div>Access denied</div>
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verificando acceso..." />;
  }

  // Verificar autenticación
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Verificar permisos específicos
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
