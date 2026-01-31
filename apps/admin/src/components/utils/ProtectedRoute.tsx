import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import LoadingSpinner from "./LoadingSpinner";
import type { UserRole } from "@/types/models/user";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

/**
 * Componente que protege rutas basado en autenticación, roles y permisos.
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  fallback = (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h3>
      <p className="text-gray-600">
        No tienes los permisos necesarios para ver esta sección.
      </p>
    </div>
  ),
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [isLoading, requireAuth, isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verificando acceso..." />;
  }

  if (requireAuth && !isAuthenticated) {
    if (shouldRedirect) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <LoadingSpinner fullScreen text="Redirigiendo..." />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
