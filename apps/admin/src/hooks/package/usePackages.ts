import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPackages } from '../../services/packages/get-packages';
import type { BaseFilters } from '../../types/api';

/**
 * Hook para obtener la lista de paquetes
 */
export function usePackages(filters?: BaseFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['packages', filters],
    queryFn: () => getPackages(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidatePackages = () => {
    queryClient.invalidateQueries({ queryKey: ['packages'] });
  };

  return {
    packages: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidatePackages,
  };
}
