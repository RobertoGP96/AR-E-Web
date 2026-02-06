import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, ShoppingBag, Truck, PackageCheck, AlertCircle, UserCheck2, HardHatIcon, User2Icon, Boxes, CheckCircleIcon, Calendar } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

interface MetricData {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

/**
 * Componente compacto mejorado para mostrar métricas clave en páginas específicas
 */
export const CompactMetricsSummary = ({ type }: { type: 'users' | 'products' | 'orders' | 'revenue' | 'purchases' | 'packages' | 'deliveries' }) => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2 py-0">
            <CardContent className="py-0">
              <div className=" h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getMetricsForType = (): MetricData[] => {
    // Validaciones de seguridad para evitar errores de undefined
    if (!metrics) return [];
    
    switch (type) {
      case 'users':
        if (!metrics.users) return [];
        return [
          { 
            label: 'Total Usuarios', 
            value: metrics.users.total, 
            icon: Users, 
            color: 'text-gray-900',
            change: '+12%',
            changeType: 'increase' as const
          },
          { 
            label: 'Activos', 
            value: metrics.users.active, 
            icon: UserCheck2, 
            color: 'text-gray-900',
            change: '+8%',
            changeType: 'increase' as const
          },
          { 
            label: 'Clientes', 
            value: metrics.users.clients, 
            icon: User2Icon, 
            color: 'text-gray-900',
            change: '+5%',
            changeType: 'increase' as const
          },
          { 
            label: 'Agentes', 
            value: metrics.users.agents, 
            icon: HardHatIcon, 
            color: 'text-gray-900',
            change: '+3%',
            changeType: 'increase' as const
          }
        ];
      case 'products':
        if (!metrics.products) return [];
        return [
          { 
            label: 'Total Productos', 
            value: metrics.products.total, 
            icon: Boxes, 
            color: 'text-gray-900',
            change: '+7%',
            changeType: 'increase' as const
          },
          { 
            label: 'Encargados', 
            value: metrics.products.ordered, 
            icon: ShoppingCart, 
            color: 'text-gray-900'
          },
          { 
            label: 'Comprados', 
            value: metrics.products.purchased, 
            icon: ShoppingBag, 
            color: 'text-gray-900',
            change: '+5%',
            changeType: 'increase' as const
          },
          { 
            label: 'Recibidos', 
            value: metrics.products.received, 
            icon: PackageCheck, 
            color: 'text-gray-900'
          },
          { 
            label: 'Entregados', 
            value: metrics.products.delivered, 
            icon: Truck, 
            color: 'text-gray-900',
            change: '+10%',
            changeType: 'increase' as const
          }
        ];
      case 'orders':
        if (!metrics.orders) return [];
        return [
          { 
            label: 'Total Órdenes', 
            value: metrics.orders.total, 
            icon: ShoppingCart, 
            color: 'text-gray-900',
            change: '+15%',
            changeType: 'increase' as const
          },
          { 
            label: 'Pendientes', 
            value: metrics.orders.pending, 
            icon: ShoppingCart, 
            color: 'text-gray-900'
          },
          { 
            label: 'Completadas', 
            value: metrics.orders.completed, 
            icon: CheckCircleIcon, 
            color: 'text-gray-900',
            change: '+20%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: metrics.orders.today, 
            icon: Calendar, 
            color: 'text-gray-900'
          }
        ];
      case 'revenue':
        if (!metrics.revenue) return [];
        return [
          { 
            label: 'Total Ingresos', 
            value: `$${metrics.revenue.total.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-gray-900',
            change: '+25%',
            changeType: 'increase' as const
          },
          { 
            label: 'Este Mes', 
            value: `$${metrics.revenue.this_month.toLocaleString()}`, 
            icon: Calendar, 
            color: 'text-gray-900',
            change: '+18%',
            changeType: 'increase' as const
          },
          { 
            label: 'Esta Semana', 
            value: `$${metrics.revenue.this_week.toLocaleString()}`, 
            icon: Calendar, 
            color: 'text-gray-900',
            change: '+12%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: `$${metrics.revenue.today.toLocaleString()}`, 
            icon: Calendar, 
            color: 'text-gray-900'
          }
        ];
      case 'purchases':
        if (!metrics.purchases) return [];
        return [
          { 
            label: 'Total Compras', 
            value: metrics.purchases.total, 
            icon: ShoppingBag, 
            color: 'text-gray-900',
            change: '+10%',
            changeType: 'increase' as const
          },
          { 
            label: 'Este Mes', 
            value: metrics.purchases.this_month, 
            icon: ShoppingBag, 
            color: 'text-gray-900',
            change: '+8%',
            changeType: 'increase' as const
          },
          { 
            label: 'Esta Semana', 
            value: metrics.purchases.this_week, 
            icon: ShoppingBag, 
            color: 'text-gray-900',
            change: '+6%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: metrics.purchases.today, 
            icon: ShoppingBag, 
            color: 'text-gray-900'
          }
        ];
      case 'packages':
        if (!metrics.packages) return [];
        // Estados de paquetes según PackageStatus: "Enviado" | "Recibido" | "Procesado"
        // Nota: El backend actualmente envía: sent, in_transit, delivered
        // Mapeo: sent -> Enviado, in_transit -> Recibido, delivered -> Procesado
        return [
          { 
            label: 'Total Paquetes', 
            value: metrics.packages.total, 
            icon: Package, 
            color: 'text-gray-900',
            change: '+5%',
            changeType: 'increase' as const
          },
          { 
            label: 'Enviados', 
            value: metrics.packages.sent, 
            icon: Package, 
            color: 'text-gray-900'
          },
          { 
            label: 'Recibidos', 
            value: metrics.packages.in_transit, 
            icon: PackageCheck, 
            color: 'text-gray-900'
          },
          { 
            label: 'Procesados', 
            value: metrics.packages.delivered, 
            icon: PackageCheck, 
            color: 'text-gray-900',
            change: '+15%',
            changeType: 'increase' as const
          }
        ];
      case 'deliveries':
        if (!metrics.deliveries) return [];
        // Estados de entregas según DeliveryStatus: "Pendiente" | "En transito" | "Entregado" | "Fallida"
        return [
          { 
            label: 'Total Entregas', 
            value: metrics.deliveries.total, 
            icon: Truck, 
            color: 'text-gray-900',
            change: '+20%',
            changeType: 'increase' as const
          },
          { 
            label: 'Pendientes', 
            value: metrics.deliveries.pending, 
            icon: Truck, 
            color: 'text-gray-900'
          },
          { 
            label: 'En Tránsito', 
            value: metrics.deliveries.in_transit, 
            icon: Truck, 
            color: 'text-gray-900'
          },
          { 
            label: 'Entregadas', 
            value: metrics.deliveries.delivered, 
            icon: PackageCheck, 
            color: 'text-gray-900',
            change: '+15%',
            changeType: 'increase' as const
          },
        ];
      default:
        return [];
    }
  };

  const metricsData = getMetricsForType();

  // Determinar el número de columnas según el tipo y cantidad de métricas
  const getGridCols = () => {
    const count = metricsData.length;
    if (count === 5) {
      // Para productos que tiene 5 métricas, usar layout especial
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
    }
    // Para los demás casos (4 métricas)
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  };

  // Si no hay datos disponibles para este tipo específico, mostrar mensaje informativo
  if (!metrics || metricsData.length === 0) {
    const metricTypeLabels = {
      users: 'usuarios',
      products: 'productos',
      orders: 'órdenes',
      revenue: 'ingresos',
      purchases: 'compras',
      packages: 'paquetes',
      deliveries: 'entregas'
    };

    return (
      <Card className="border-2 border-amber-200 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Métricas de {metricTypeLabels[type]} no disponibles
              </p>
              <p className="text-xs text-amber-700 mt-1">
                El backend aún no proporciona estas métricas. Configura el endpoint del dashboard para incluir datos de {metricTypeLabels[type]}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", getGridCols())}>
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.label} 
            className={cn(
              " py-0 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-orange-200 border group cursor-pointer bg-white "
            )}
          >
            <CardContent className="py-0 p-4 md:p-6 relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-slate-800 uppercase tracking-wide mb-2">
                    {metric.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 ">
                    {metric.value}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-orange-50  transition-all duration-300 flex-shrink-0">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};