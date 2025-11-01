import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
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
  change?: string;
  changeType?: 'increase' | 'decrease';
}

/**
 * Componente compacto mejorado para mostrar métricas clave en páginas específicas
 */
export const CompactMetricsSummary = ({ type }: { type: 'users' | 'products' | 'orders' | 'revenue' }) => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2">
            <CardContent className="p-4">
              <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getMetricsForType = (): MetricData[] => {
    switch (type) {
      case 'users':
        return [
          { 
            label: 'Total Usuarios', 
            value: metrics.users.total, 
            icon: Users, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
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
            change: '+3%',
            changeType: 'increase' as const
          }
        ];
      case 'products':
        return [
          { 
            label: 'Total Productos', 
            value: metrics.products.total, 
            icon: Package, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
            change: '+7%',
            changeType: 'increase' as const
          },
          { 
            label: 'En Stock', 
            value: metrics.products.in_stock, 
            icon: Package, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50'
          },
          { 
            label: 'Sin Stock', 
            value: metrics.products.out_of_stock, 
            icon: Package, 
            color: 'text-rose-600',
            iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
            borderColor: 'border-rose-100',
            hoverColor: 'hover:border-rose-200 hover:shadow-rose-100/50',
            change: '-2%',
            changeType: 'decrease' as const
          },
          { 
            label: 'Pendientes', 
            value: metrics.products.pending_delivery, 
            icon: Package, 
            color: 'text-amber-600',
            iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
            borderColor: 'border-amber-100',
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50'
          }
        ];
      case 'orders':
        return [
          { 
            label: 'Total Órdenes', 
            value: metrics.orders.total, 
            icon: ShoppingCart, 
            color: 'text-blue-600',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            borderColor: 'border-blue-100',
            hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
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
            hoverColor: 'hover:border-amber-200 hover:shadow-amber-100/50'
          },
          { 
            label: 'Completadas', 
            value: metrics.orders.completed, 
            icon: ShoppingCart, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
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
            hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50'
          }
        ];
      case 'revenue':
        return [
          { 
            label: 'Total Ingresos', 
            value: `$${metrics.revenue.total.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-emerald-600',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-100',
            hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
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
            hoverColor: 'hover:border-orange-200 hover:shadow-orange-100/50'
          }
        ];
      default:
        return [];
    }
  };

  const metricsData = getMetricsForType();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.label} 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 group",
              metric.borderColor,
              metric.hoverColor
            )}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 truncate">
                    {metric.label}
                  </p>
                  <p className="text-xl font-bold text-foreground truncate">
                    {metric.value}
                  </p>
                  {metric.change && (
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-xs font-semibold mt-1.5 flex items-center gap-0.5 w-fit px-1.5 py-0",
                        metric.changeType === 'increase' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {metric.change}
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "p-2 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0",
                  metric.iconBg
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};