import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api';
import type { DashboardMetrics } from '@/types/api';

/**
 * Hook personalizado para obtener métricas del dashboard
 */
export const useDashboardMetrics = () => {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await dashboardService.getDashboardStats();
      if (!response.data) {
        throw new Error('No se pudieron obtener las métricas del dashboard');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener métricas específicas de usuarios
 */
export const useUserMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    userMetrics: metrics?.users,
    ...query,
  };
};

/**
 * Hook para obtener métricas específicas de productos
 */
export const useProductMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    productMetrics: metrics?.products,
    ...query,
  };
};

/**
 * Hook para obtener métricas específicas de órdenes
 */
export const useOrderMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    orderMetrics: metrics?.orders,
    ...query,
  };
};

/**
 * Hook para obtener métricas específicas de ingresos
 */
export const useRevenueMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    revenueMetrics: metrics?.revenue,
    ...query,
  };
};