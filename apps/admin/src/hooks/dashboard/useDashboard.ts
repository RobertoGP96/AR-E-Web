import { useQuery } from '@tanstack/react-query';
import {
  getDashboardMetrics,
  getUsersStats,
  getOrdersStats,
  getSalesStats,
  getTopProducts,
  getTopAgents,
} from '../../services/analytics/dashboard';

export function useDashboard(period: 'day' | 'week' | 'month' | 'year' = 'month', topLimit: number = 10) {
  // Métricas generales
  const metrics = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
    staleTime: 2 * 60 * 1000,
  });

  // Estadísticas de usuarios
  const usersStats = useQuery({
    queryKey: ['dashboard-users', period],
    queryFn: () => getUsersStats(period),
    staleTime: 2 * 60 * 1000,
  });

  // Estadísticas de órdenes
  const ordersStats = useQuery({
    queryKey: ['dashboard-orders', period],
    queryFn: () => getOrdersStats(period),
    staleTime: 2 * 60 * 1000,
  });

  // Estadísticas de ventas
  const salesStats = useQuery({
    queryKey: ['dashboard-sales', period],
    queryFn: () => getSalesStats(period),
    staleTime: 2 * 60 * 1000,
  });

  // Productos más vendidos
  const topProducts = useQuery({
    queryKey: ['dashboard-top-products', topLimit],
    queryFn: () => getTopProducts(topLimit),
    staleTime: 2 * 60 * 1000,
  });

  // Agentes más productivos
  const topAgents = useQuery({
    queryKey: ['dashboard-top-agents', topLimit],
    queryFn: () => getTopAgents(topLimit),
    staleTime: 2 * 60 * 1000,
  });

  return {
    metrics,
    usersStats,
    ordersStats,
    salesStats,
    topProducts,
    topAgents,
  };
}
