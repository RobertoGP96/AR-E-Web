import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import useAuth from "@/hooks/auth/useAuth";

import type { UserRole } from "@/types/models/user";
import { hasRouteAccess } from "@/routes/role-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles permitidos para esta ruta. Si no se especifica, cualquier usuario autenticado puede acceder. */
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const hasLoggedOutClient = useRef(false);

  // Si el usuario tiene rol "client", cerrar sesión para romper el loop.
  // Sin esto: Login detecta isAuthenticated=true → navega a "/" →
  // ProtectedRoute ve role "client" → Navigate a "/login" → LOOP INFINITO.
  useEffect(() => {
    if (isAuthenticated && user && user.role === "client" && !hasLoggedOutClient.current) {
      hasLoggedOutClient.current = true;
      logout();
    }
  }, [isAuthenticated, user, logout]);

  // Mientras carga la sesión o se está cerrando sesión de un client, no redirigir
  if (isLoading) return null;

  // Sin sesión → al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user.role as UserRole;

  // Los clientes no tienen acceso — logout ya fue disparado en el useEffect
  if (role === "client") {
    return null;
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar acceso a la ruta actual según el rol
  if (!hasRouteAccess(role, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;