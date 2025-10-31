import { ShoppingCart, Clock, CheckCircle, Calendar } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useOrderMetrics } from '@/hooks/useDashboardMetrics';

/**
 * Componente para mostrar métricas de órdenes
 */
export const OrderMetricsCards = () => {
  const { orderMetrics, isLoading } = useOrderMetrics();

  if (!orderMetrics && !isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total de Órdenes"
        value={orderMetrics?.total?.toLocaleString() || '0'}
        icon={ShoppingCart}
        loading={isLoading}
      />
      <MetricCard
        title="Órdenes Pendientes"
        value={orderMetrics?.pending?.toLocaleString() || '0'}
        icon={Clock}
        loading={isLoading}
      />
      <MetricCard
        title="Órdenes Completadas"
        value={orderMetrics?.completed?.toLocaleString() || '0'}
        icon={CheckCircle}
        loading={isLoading}
      />
      <MetricCard
        title="Órdenes Hoy"
        value={orderMetrics?.today?.toLocaleString() || '0'}
        icon={Calendar}
        loading={isLoading}
      />
    </div>
  );
};