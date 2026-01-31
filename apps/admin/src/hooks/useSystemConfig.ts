import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export interface SystemConfig {
  id: number;
  change_rate: number;
  cost_per_pound: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSystemConfigData {
  change_rate: number;
  cost_per_pound: number;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

/**
 * Hook para manejar la configuración global del sistema
 * Obtiene y actualiza variables como tasa de cambio y costo por libra
 */
export const useSystemConfig = () => {
  const queryClient = useQueryClient();

  // Obtener configuración actual
  const {
    data: config,
    isLoading,
    isError,
    error,
  } = useQuery<SystemConfig>({
    queryKey: ['systemConfig'],
    queryFn: async () => {
      try {
        // El endpoint devuelve un array paginado, tomamos el primer elemento
        const response = await apiClient.get<PaginatedResponse<SystemConfig> | SystemConfig>('/api_data/common_information/');
        const results = 'results' in response ? response.results : response;
        
        // Si es un array, verificar si tiene elementos
        if (Array.isArray(results)) {
          if (results.length > 0) {
            return results[0];
          }
          // Si está vacío, crear uno por defecto mediante POST
          const newConfig = await apiClient.post<SystemConfig>('/api_data/common_information/', {
            change_rate: 20.0,
            cost_per_pound: 5.0
          });
          return newConfig;
        }
        
        return results as SystemConfig;
      } catch (error) {
        console.error('Error al obtener configuración:', error);
        // En caso de error, intentar crear una configuración por defecto
        try {
          const newConfig = await apiClient.post<SystemConfig>('/api_data/common_information/', {
            change_rate: 20.0,
            cost_per_pound: 5.0
          });
          return newConfig;
        } catch (createError) {
          console.error('Error al crear configuración por defecto:', createError);
          throw error; // Lanzar el error original
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    retry: 1, // Reintentar una vez si falla
  });

  // Actualizar configuración
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSystemConfigData) => {
      if (!config?.id) {
        throw new Error('No se encontró la configuración del sistema');
      }
      
      // apiClient.patch ya retorna los datos directamente
      const response = await apiClient.patch<SystemConfig>(
        `/api_data/common_information/${config.id}/`,
        data
      );
      
      // Asegurarnos de que tenemos todos los campos necesarios
      return response as SystemConfig;
    },
    onSuccess: (data) => {
      // Actualizar la caché con los nuevos datos
      queryClient.setQueryData(['systemConfig'], data);
      
      // Invalidar la query para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
      
      toast.success('Configuración actualizada', {
        description: 'Las variables del sistema se han actualizado correctamente.',
      });
    },
    onError: (error: Error) => {
      console.error('Error al actualizar configuración:', error);
      
      const errorMessage = 
        error.message ||
        'Error al actualizar la configuración';
      
      toast.error('Error al actualizar', {
        description: errorMessage,
      });
    },
  });

  return {
    config,
    isLoading,
    isError,
    error,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

