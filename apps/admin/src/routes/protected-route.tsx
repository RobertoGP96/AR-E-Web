import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/auth/useAuth";
import { hasRouteAccess } from "./role-config";
import type { UserRole } from "@/types/models/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles permitidos para esta ruta. Si no se especifica, cualquier usuario autenticado puede acceder. */
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mientras carga la sesión, no redirigir
  if (isLoading) return null;

  // Sin sesión → al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user.role as UserRole;

  // Los clientes no tienen acceso al sistema admin
  if (role === "client") {
    return <Navigate to="/login" replace />;
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