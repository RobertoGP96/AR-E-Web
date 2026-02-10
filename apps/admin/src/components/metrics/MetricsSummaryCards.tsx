import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Wallet,
  CreditCard,
  Truck,
  UserCheck,
  Receipt
} from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";

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

  // Prepare summary cards with all metrics
  const summaryCards = [
    {
      title: "Total Usuarios",
      value: metrics.users.total,
      icon: Users,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-gray-50 to-orange-100/50",
      borderColor: "border-orange-100",
      hoverColor: "hover:border-orange-200 hover:shadow-orange-100/50",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Total Productos",
      value: metrics.products.total,
      icon: Package,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-gray-50 to-orange-100/50",
      borderColor: "border-orange-100",
      hoverColor: "hover:border-orange-200 hover:shadow-orange-100/50",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Órdenes del Mes",
      value: metrics.orders.this_month,
      icon: ShoppingCart,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-gray-50 to-orange-100/50",
      borderColor: "border-orange-100",
      hoverColor: "hover:border-orange-200 hover:shadow-orange-100/50",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Ingresos del Mes",
      value: `$${metrics.revenue.this_month.toLocaleString()}`,
      icon: DollarSign,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-gray-50 to-orange-100/50",
      borderColor: "border-orange-100",
      hoverColor: "hover:border-orange-200 hover:shadow-orange-100/50",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    // Financial Metrics
    ...(metrics.financial ? [{
      title: "Ganancia Total",
      value: `$${metrics.financial.total_profit.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-100/50",
      borderColor: "border-emerald-200",
      hoverColor: "hover:border-emerald-300 hover:shadow-emerald-100/50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }] : []),
    ...(metrics.financial ? [{
      title: "Margen de Ganancia",
      value: `${metrics.financial.profit_margin.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-100/50",
      borderColor: "border-cyan-200",
      hoverColor: "hover:border-cyan-300 hover:shadow-cyan-100/50",
      iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    }] : []),
    // Client Balances
    ...(metrics.client_balances ? [{
      title: "Deudas Pendientes",
      value: `$${metrics.client_balances.total_debt.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-red-50 to-rose-100/50",
      borderColor: "border-rose-200",
      hoverColor: "hover:border-rose-300 hover:shadow-rose-100/50",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      subtitle: `${metrics.client_balances.with_debt} clientes`,
    }] : []),
    ...(metrics.client_balances ? [{
      title: "Saldos a Favor",
      value: `$${metrics.client_balances.total_surplus.toLocaleString()}`,
      icon: Wallet,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-purple-50 to-violet-100/50",
      borderColor: "border-violet-200",
      hoverColor: "hover:border-violet-300 hover:shadow-violet-100/50",
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      subtitle: `${metrics.client_balances.with_surplus} clientes`,
    }] : []),
    // Delivery Metrics
    ...(metrics.deliveries ? [{
      title: "Peso Total Entregado",
      value: `${(metrics.deliveries.total_weight || 0).toFixed(1)} lbs`,
      icon: Truck,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-amber-50 to-yellow-100/50",
      borderColor: "border-yellow-200",
      hoverColor: "hover:border-yellow-300 hover:shadow-yellow-100/50",
      iconBg: "bg-gradient-to-br from-yellow-500 to-amber-600",
      badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
    }] : []),
    ...(metrics.financial ? [{
      title: "Entregas Sin Pagar",
      value: `$${metrics.financial.unpaid_deliveries_amount.toLocaleString()}`,
      icon: CreditCard,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-100/50",
      borderColor: "border-amber-200",
      hoverColor: "hover:border-amber-300 hover:shadow-amber-100/50",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      subtitle: `${metrics.financial.unpaid_deliveries_count} entregas`,
    }] : []),
    // Purchases Metrics
    ...(metrics.purchases && 'total_refunded' in metrics.purchases ? [{
      title: "Reembolsos Totales",
      value: `$${(metrics.purchases.total_refunded || 0).toLocaleString()}`,
      icon: Receipt,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-pink-50 to-rose-100/50",
      borderColor: "border-rose-200",
      hoverColor: "hover:border-rose-300 hover:shadow-rose-100/50",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    }] : []),
    // Agents Metrics
    ...(metrics.agents ? [{
      title: "Comisiones de Agentes",
      value: `$${metrics.agents.total_agent_profit.toLocaleString()}`,
      icon: UserCheck,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-indigo-50 to-blue-100/50",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-300 hover:shadow-blue-100/50",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      subtitle: `${metrics.agents.total_agents} agentes`,
    }] : []),
    // Expenses
    ...(metrics.expenses ? [{
      title: "Gastos del Mes",
      value: `$${metrics.expenses.this_month.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-gray-600",
      bgGradient: "bg-gradient-to-br from-gray-50 to-slate-100/50",
      borderColor: "border-slate-200",
      hoverColor: "hover:border-slate-300 hover:shadow-slate-100/50",
      iconBg: "bg-gradient-to-br from-slate-500 to-gray-600",
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Primera fila: Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {summaryCards.slice(0, 4).map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={cn(
                "py-0 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer",
                card.bgGradient,
                card.borderColor,
                card.hoverColor,
              )}
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Decorative corner accent */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150",
                  card.iconBg,
                )}
              />

              <CardContent className="py-0 md:p-4 relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">
                      {card.title}
                    </p>
                    <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "p-2 md:p-2.5 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0",
                      card.iconBg,
                    )}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Segunda fila: Métricas financieras y adicionales */}
      {summaryCards.length > 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {summaryCards.slice(4).map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className={cn(
                  "py-0 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer",
                  card.bgGradient,
                  card.borderColor,
                  card.hoverColor,
                )}
              >
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Decorative corner accent */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150",
                    card.iconBg,
                  )}
                />

                <CardContent className="py-0 md:p-4 relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">
                        {card.title}
                      </p>
                      <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                        {card.value}
                      </p>
                      {card.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "p-2 md:p-2.5 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0",
                        card.iconBg,
                      )}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
