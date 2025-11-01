import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

/**
 * Tarjetas de resumen con métricas clave - Diseño mejorado
 */
export const MetricsSummaryCards = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2">
            <CardContent className="p-6">
              <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Usuarios',
      value: metrics.users.total,
      icon: Users,
      color: 'text-blue-600',
      bgGradient: 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50',
      borderColor: 'border-blue-100',
      hoverColor: 'hover:border-blue-200 hover:shadow-blue-100/50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'increase' as const,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Total Productos',
      value: metrics.products.total,
      icon: Package,
      color: 'text-emerald-600',
      bgGradient: 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50',
      borderColor: 'border-emerald-100',
      hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      change: '+5%',
      changeType: 'increase' as const,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Órdenes del Mes',
      value: metrics.orders.this_month,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgGradient: 'bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/50',
      borderColor: 'border-orange-100',
      hoverColor: 'hover:border-orange-200 hover:shadow-orange-100/50',
      iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+8%',
      changeType: 'increase' as const,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      title: 'Ingresos del Mes',
      value: `$${metrics.revenue.this_month.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgGradient: 'bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50',
      borderColor: 'border-purple-100',
      hoverColor: 'hover:border-purple-200 hover:shadow-purple-100/50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'increase' as const,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title} 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 group",
              card.bgGradient,
              card.borderColor,
              card.hoverColor
            )}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300",
                  card.iconBg
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-semibold border flex items-center gap-1 shadow-sm",
                    card.badgeColor
                  )}
                >
                  {card.changeType === 'increase' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.change}
                </Badge>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};