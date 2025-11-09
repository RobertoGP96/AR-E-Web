import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, ShoppingBag, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

interface MetricData {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  iconBg: string;
  borderColor: string;
  hoverColor: string;
  bgGradient: string;
  badgeColor: string;
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
          <Card key={i} className="border-2">
            <CardContent className="p-4 ">
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
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+12%',
            changeType: 'increase' as const
          },
          { 
            label: 'Activos', 
            value: metrics.users.active, 
            icon: Users, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            change: '+8%',
            changeType: 'increase' as const
          },
          { 
            label: 'Verificados', 
            value: metrics.users.verified, 
            icon: Users, 
            color: 'text-purple-600',
            iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            borderColor: 'border-purple-100',
            hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50',
            bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
            change: '+5%',
            changeType: 'increase' as const
          },
          { 
            label: 'Agentes', 
            value: metrics.users.agents, 
            icon: Users, 
            color: 'text-orange-600',
            iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
            borderColor: 'border-orange-100',
            hoverColor: 'hover:border-orange-200 hover:shadow-orange-100/50',
            bgGradient: 'bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/50',
            badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
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
            icon: Package, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+7%',
            changeType: 'increase' as const
          },
          { 
            label: 'Encargados', 
            value: metrics.products.in_stock, 
            icon: Package, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
          },
          { 
            label: 'Comprados', 
            value: metrics.products.out_of_stock, 
            icon: Package, 
            color: 'text-rose-600',
            iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
            borderColor: 'border-rose-100',
            hoverColor: 'hover:border-rose-200 hover:shadow-rose-100/50',
            bgGradient: 'bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100/50',
            badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
            change: '-2%',
            changeType: 'decrease' as const
          },
          { 
            label: 'Entregados', 
            value: metrics.products.pending_delivery, 
            icon: Package, 
            color: 'text-amber-600',
            iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
            borderColor: 'border-amber-100',
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50',
            bgGradient: 'bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
          }
        ];
      case 'orders':
        if (!metrics.orders) return [];
        return [
          { 
            label: 'Total Órdenes', 
            value: metrics.orders.total, 
            icon: ShoppingCart, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+15%',
            changeType: 'increase' as const
          },
          { 
            label: 'Pendientes', 
            value: metrics.orders.pending, 
            icon: ShoppingCart, 
            color: 'text-amber-600',
            iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
            borderColor: 'border-amber-100',
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50',
            bgGradient: 'bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
          },
          { 
            label: 'Completadas', 
            value: metrics.orders.completed, 
            icon: ShoppingCart, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            change: '+20%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: metrics.orders.today, 
            icon: ShoppingCart, 
            color: 'text-purple-600',
            iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            borderColor: 'border-purple-100',
            hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50',
            bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
          }
        ];
      case 'revenue':
        if (!metrics.revenue) return [];
        return [
          { 
            label: 'Total Ingresos', 
            value: `$${metrics.revenue.total.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            change: '+25%',
            changeType: 'increase' as const
          },
          { 
            label: 'Este Mes', 
            value: `$${metrics.revenue.this_month.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+18%',
            changeType: 'increase' as const
          },
          { 
            label: 'Esta Semana', 
            value: `$${metrics.revenue.this_week.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-purple-600',
            iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            borderColor: 'border-purple-100',
            hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50',
            bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
            change: '+12%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: `$${metrics.revenue.today.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-orange-600',
            iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
            borderColor: 'border-orange-100',
            hoverColor: 'hover:border-orange-200 hover:shadow-orange-100/50',
            bgGradient: 'bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/50',
            badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
          }
        ];
      case 'purchases':
        if (!metrics.purchases) return [];
        return [
          { 
            label: 'Total Compras', 
            value: metrics.purchases.total, 
            icon: ShoppingBag, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+10%',
            changeType: 'increase' as const
          },
          { 
            label: 'Este Mes', 
            value: metrics.purchases.this_month, 
            icon: ShoppingBag, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            change: '+8%',
            changeType: 'increase' as const
          },
          { 
            label: 'Esta Semana', 
            value: metrics.purchases.this_week, 
            icon: ShoppingBag, 
            color: 'text-purple-600',
            iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            borderColor: 'border-purple-100',
            hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50',
            bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
            change: '+6%',
            changeType: 'increase' as const
          },
          { 
            label: 'Hoy', 
            value: metrics.purchases.today, 
            icon: ShoppingBag, 
            color: 'text-orange-600',
            iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
            borderColor: 'border-orange-100',
            hoverColor: 'hover:border-orange-200 hover:shadow-orange-100/50',
            bgGradient: 'bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/50',
            badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
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
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+5%',
            changeType: 'increase' as const
          },
          { 
            label: 'Enviados', 
            value: metrics.packages.sent, 
            icon: Package, 
            color: 'text-sky-600',
            iconBg: 'bg-gradient-to-br from-sky-500 to-sky-600',
            borderColor: 'border-sky-100',
            hoverColor: 'hover:border-sky-200 hover:shadow-sky-100/50',
            bgGradient: 'bg-gradient-to-br from-sky-50 via-sky-50/80 to-sky-100/50',
            badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
          },
          { 
            label: 'Recibidos', 
            value: metrics.packages.in_transit, 
            icon: PackageCheck, 
            color: 'text-amber-600',
            iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
            borderColor: 'border-amber-100',
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50',
            bgGradient: 'bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
          },
          { 
            label: 'Procesados', 
            value: metrics.packages.delivered, 
            icon: PackageCheck, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            change: '+20%',
            changeType: 'increase' as const
          },
          { 
            label: 'Pendientes', 
            value: metrics.deliveries.pending, 
            icon: Truck, 
            color: 'text-amber-600',
            iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
            borderColor: 'border-amber-100',
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50',
            bgGradient: 'bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
          },
          { 
            label: 'En Tránsito', 
            value: metrics.deliveries.in_transit, 
            icon: Truck, 
            color: 'text-indigo-600',
            iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
            borderColor: 'border-indigo-100',
            hoverColor: 'hover:border-indigo-200 hover:shadow-indigo-100/50',
            bgGradient: 'bg-gradient-to-br from-indigo-50 via-indigo-50/80 to-indigo-100/50',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
          },
          { 
            label: 'Entregadas', 
            value: metrics.deliveries.delivered, 
            icon: PackageCheck, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
            bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            change: '+15%',
            changeType: 'increase' as const
          },
        ];
      default:
        return [];
    }
  };

  const metricsData = getMetricsForType();

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.label} 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer",
              metric.bgGradient,
              metric.borderColor,
              metric.hoverColor
            )}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Decorative corner accent */}
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150",
              metric.iconBg
            )} />
            
            <CardContent className="p-3 md:p-4 relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">
                    {metric.label}
                  </p>
                  <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                    {metric.value}
                  </p>
                </div>
                <div className={cn(
                  "p-2 md:p-2.5 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0",
                  metric.iconBg
                )}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
              
              {metric.change && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-semibold border flex items-center gap-1 shadow-sm",
                      metric.badgeColor
                    )}
                  >
                    {metric.changeType === 'increase' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metric.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">vs mes anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};