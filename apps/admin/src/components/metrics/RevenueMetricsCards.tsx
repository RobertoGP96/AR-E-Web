import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useRevenueMetrics } from '@/hooks/useDashboardMetrics';

/**
 * Componente para mostrar métricas de ingresos
 */
export const RevenueMetricsCards = () => {
  const { revenueMetrics, isLoading } = useRevenueMetrics();

  if (!revenueMetrics && !isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Ingresos Totales"
        value={`$${revenueMetrics?.total?.toLocaleString() || '0'}`}
        icon={DollarSign}
        loading={isLoading}
      />
      <MetricCard
        title="Ingresos Hoy"
        value={`$${revenueMetrics?.today?.toLocaleString() || '0'}`}
        icon={TrendingUp}
        loading={isLoading}
      />
      <MetricCard
        title="Ingresos Esta Semana"
        value={`$${revenueMetrics?.this_week?.toLocaleString() || '0'}`}
        icon={Calendar}
        loading={isLoading}
      />
      <MetricCard
        title="Ingresos Este Mes"
        value={`$${revenueMetrics?.this_month?.toLocaleString() || '0'}`}
        icon={BarChart3}
        loading={isLoading}
      />
    </div>
  );
};