/**
 * Hook para obtener un paquete individual
 */

import { useQuery } from '@tanstack/react-query';
import { getPackage } from '@/services/packages/get-package';

export function usePackage(id: number) {
  const { data: packageData, isLoading, error } = useQuery({
    queryKey: ['package', id],
    queryFn: () => getPackage(id),
    enabled: !!id && id > 0,
  });

  return {
    package: packageData,
    isLoading,
    error,
  };
}
