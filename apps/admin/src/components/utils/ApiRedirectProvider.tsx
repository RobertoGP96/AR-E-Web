/**
 * ApiRedirectProvider - Configura la redirección del API Client
 * 
 * Este componente debe envolver las rutas y configurar el callback
 * de redirección del API Client para usar React Router
 */

import { type ReactNode } from 'react';
import { useApiRedirect } from '@/hooks/useApiRedirect';
import { useAuth } from '@/hooks/auth/useAuth';

interface ApiRedirectProviderProps {
  children: ReactNode;
}

/**
 * Proveedor que configura la redirección del API Client
 * Debe estar dentro del Router para tener acceso a useNavigate
 */
export function ApiRedirectProvider({ children }: ApiRedirectProviderProps) {
  const { handleAuthStateChange } = useAuth();
  
  useApiRedirect(handleAuthStateChange);
  
  return <>{children}</>;
}

export default ApiRedirectProvider;
