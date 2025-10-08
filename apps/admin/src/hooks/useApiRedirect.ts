/**
 * Hook para configurar la redirección y notificaciones del API Client
 * 
 * Este hook configura los callbacks del API Client para que use 
 * React Router y el sistema de notificaciones de la aplicación
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setRedirectToLoginCallback, setShowNotificationCallback } from '@/lib/api-client';

/**
 * Hook que configura la redirección al login y las notificaciones
 * Debe ser usado en el componente raíz de la aplicación
 */
export function useApiRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Configurar callback de redirección
    setRedirectToLoginCallback(() => {
      navigate('/login', { replace: true });
    });

    // Configurar callback de notificaciones
    setShowNotificationCallback((message, type) => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'info':
          toast.info(message);
          break;
      }
    });

    // Cleanup: restaurar al comportamiento por defecto
    return () => {
      setRedirectToLoginCallback(null as unknown as () => void);
      setShowNotificationCallback(null as unknown as (message: string, type: 'success' | 'error' | 'info' | 'warning') => void);
    };
  }, [navigate]);
}

export default useApiRedirect;
