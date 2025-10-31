import { Package, PackageCheck, PackageX, Truck } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useProductMetrics } from '@/hooks/useDashboardMetrics';

/**
 * Componente para mostrar métricas de productos
 */
export const ProductMetricsCards = () => {
  const { productMetrics, isLoading } = useProductMetrics();

  if (!productMetrics && !isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total de Productos"
        value={productMetrics?.total?.toLocaleString() || '0'}
        icon={Package}
        loading={isLoading}
      />
      <MetricCard
        title="En Stock"
        value={productMetrics?.in_stock?.toLocaleString() || '0'}
        icon={PackageCheck}
        loading={isLoading}
      />
      <MetricCard
        title="Sin Stock"
        value={productMetrics?.out_of_stock?.toLocaleString() || '0'}
        icon={PackageX}
        loading={isLoading}
      />
      <MetricCard
        title="Pendientes de Entrega"
        value={productMetrics?.pending_delivery?.toLocaleString() || '0'}
        icon={Truck}
        loading={isLoading}
      />
    </div>
  );
};