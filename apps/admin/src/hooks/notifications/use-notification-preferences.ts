/**
 * Hook para gestionar preferencias de notificaciones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '../../services/notifications';
import type { NotificationPreference, UpdateNotificationPreferenceData, NotificationType } from '../../types/models';

interface UseNotificationPreferencesReturn {
  // Datos
  preferences?: NotificationPreference;

  // Estados
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Mutación para actualizar
  updatePreferences: {
    mutate: (data: UpdateNotificationPreferenceData) => void;
    isPending: boolean;
  };

  // Utilidades
  isNotificationEnabled: (type: NotificationType) => boolean;
  refetch: () => void;
}

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const queryClient = useQueryClient();

  // Query para obtener preferencias
  const {
    data: preferences,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutación para actualizar preferencias
  const updateMutation = useMutation({
    mutationFn: (data: UpdateNotificationPreferenceData) => updateNotificationPreferences(data),
    onSuccess: (updatedPreferences: NotificationPreference) => {
      // Actualizar cache
      queryClient.setQueryData(['notification-preferences'], updatedPreferences);

      toast.success('Preferencias de notificación actualizadas');
    },
    onError: (error: unknown) => {
      const message = (error as Error)?.message || 'Ocurrió un error inesperado';
      toast.error('Error al actualizar preferencias', {
        description: message,
      });
    },
  });

  // Función para verificar si un tipo de notificación está habilitado
  const isNotificationEnabled = (type: NotificationType): boolean => {
    if (!preferences) return false;
    return (preferences as NotificationPreference).enabled_notification_types.includes(type);
  };

  return {
    // Datos
    preferences,

    // Estados
    isLoading,
    isError,
    error: error as Error | null,

    // Mutación
    updatePreferences: {
      mutate: updateMutation.mutate,
      isPending: updateMutation.isPending,
    },

    // Utilidades
    isNotificationEnabled,
    refetch,
  };
};