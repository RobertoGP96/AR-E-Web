import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

/**
 * Componente compacto para mostrar métricas clave en páginas específicas
 */
export const CompactMetricsSummary = ({ type }: { type: 'users' | 'products' | 'orders' | 'revenue' }) => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-3">
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  const getMetricsForType = () => {
    switch (type) {
      case 'users':
        return [
          { label: 'Total', value: metrics.users.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Activos', value: metrics.users.active, icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Verificados', value: metrics.users.verified, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Agentes', value: metrics.users.agents, icon: Users, color: 'text-orange-600 bg-orange-50' }
        ];
      case 'products':
        return [
          { label: 'Total', value: metrics.products.total, icon: Package, color: 'text-blue-600 bg-blue-50' },
          { label: 'En Stock', value: metrics.products.in_stock, icon: Package, color: 'text-green-600 bg-green-50' },
          { label: 'Sin Stock', value: metrics.products.out_of_stock, icon: Package, color: 'text-red-600 bg-red-50' },
          { label: 'Pendientes', value: metrics.products.pending_delivery, icon: Package, color: 'text-orange-600 bg-orange-50' }
        ];
      case 'orders':
        return [
          { label: 'Total', value: metrics.orders.total, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pendientes', value: metrics.orders.pending, icon: ShoppingCart, color: 'text-orange-600 bg-orange-50' },
          { label: 'Completadas', value: metrics.orders.completed, icon: ShoppingCart, color: 'text-green-600 bg-green-50' },
          { label: 'Hoy', value: metrics.orders.today, icon: ShoppingCart, color: 'text-purple-600 bg-purple-50' }
        ];
      case 'revenue':
        return [
          { label: 'Total', value: `$${metrics.revenue.total.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Este Mes', value: `$${metrics.revenue.this_month.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
          { label: 'Esta Semana', value: `$${metrics.revenue.this_week.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
          { label: 'Hoy', value: `$${metrics.revenue.today.toLocaleString()}`, icon: DollarSign, color: 'text-orange-600 bg-orange-50' }
        ];
      default:
        return [];
    }
  };

  const metricsData = getMetricsForType();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{metric.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
                <div className={cn("p-1.5 rounded-md ml-2", metric.color)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};