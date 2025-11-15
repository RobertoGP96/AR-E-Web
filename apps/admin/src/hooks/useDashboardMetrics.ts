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
      if (!response.success || !response.data) {
        throw new Error(response.message || 'No se pudieron obtener las métricas del dashboard');
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

  const userMetrics = metrics?.users;
  const hasMetrics = !!userMetrics && Object.keys(userMetrics).length > 0;
  const metricsKeys = userMetrics ? Object.keys(userMetrics) : [];

  return {
    type: 'users',
    userMetrics,
    hasMetrics,
    metricsKeys,
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

/**
 * Hook para obtener métricas específicas de compras
 */
export const usePurchaseMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    purchaseMetrics: metrics?.purchases,
    ...query,
  };
};

/**
 * Hook para obtener métricas específicas de paquetes
 */
export const usePackageMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    packageMetrics: metrics?.packages,
    ...query,
  };
};

/**
 * Hook para obtener métricas específicas de entregas
 */
export const useDeliveryMetrics = () => {
  const { data: metrics, ...query } = useDashboardMetrics();

  return {
    deliveryMetrics: metrics?.deliveries,
    ...query,
  };
};