import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
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
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Usar un pequeño delay antes de redirigir para evitar parpadeos
  // si la autenticación se está verificando
  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100); // 100ms de delay mínimo

      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [isLoading, requireAuth, isAuthenticated]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verificando acceso..." />;
  }

  // Verificar autenticación con delay para evitar parpadeos
  if (requireAuth && !isAuthenticated) {
    if (shouldRedirect) {
      // Guardar la ubicación actual para redirigir después del login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // Mostrar loading brevemente antes de redirigir
    return <LoadingSpinner fullScreen text="Verificando acceso..." />;
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
