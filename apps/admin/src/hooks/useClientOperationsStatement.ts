import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClientOperationsStatement } from '@/services/reports/reports';
import type { ClientOperationsStatement } from '@/services/reports/reports';

export interface UseClientOperationsStatementOptions {
  clientId?: number;
  enabled?: boolean;
}

export interface UseClientOperationsStatementReturn {
  data: ClientOperationsStatement | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
  invalidate: () => void;
}

/**
 * Hook para obtener el estado de cuenta de operaciones de un cliente
 */
export const useClientOperationsStatement = ({
  clientId,
  enabled = true
}: UseClientOperationsStatementOptions = {}): UseClientOperationsStatementReturn => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-operations-statement', clientId],
    queryFn: () => {
      if (!clientId) {
        throw new Error('El ID del cliente es requerido');
      }
      return fetchClientOperationsStatement(clientId);
    },
    enabled: enabled && !!clientId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['client-operations-statement', clientId] });
  };

  return {
    data: data || null,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
    invalidate
  };
};

export default useClientOperationsStatement;
