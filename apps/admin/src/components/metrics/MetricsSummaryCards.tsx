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
      bgGradient: "bg-white",
      borderColor: "border-gray-200",
      hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
      iconBg: "bg-orange-500",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Total Productos",
      value: metrics.products.total,
      icon: Package,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-gray-200",
      hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
      iconBg: "bg-orange-500",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Órdenes del Mes",
      value: metrics.orders.this_month,
      icon: ShoppingCart,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-gray-200",
      hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
      iconBg: "bg-orange-500",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      title: "Ingresos del Mes",
      value: `$${metrics.revenue.this_month.toLocaleString()}`,
      icon: DollarSign,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-gray-200",
      hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
      iconBg: "bg-orange-500",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    },
    // Financial Metrics
    ...(metrics.financial ? [{
      title: "Ganancia Total",
      value: `$${metrics.financial.total_profit.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-emerald-200",
      hoverColor: "hover:border-emerald-400 hover:shadow-emerald-50",
      iconBg: "bg-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }] : []),
    ...(metrics.financial ? [{
      title: "Margen de Ganancia",
      value: `${metrics.financial.profit_margin.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-cyan-200",
      hoverColor: "hover:border-cyan-400 hover:shadow-cyan-50",
      iconBg: "bg-cyan-500",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    }] : []),
    // Client Balances
    ...(metrics.client_balances ? [{
      title: "Deudas Pendientes",
      value: `$${metrics.client_balances.total_debt.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-rose-200",
      hoverColor: "hover:border-rose-400 hover:shadow-rose-50",
      iconBg: "bg-rose-500",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      subtitle: `${metrics.client_balances.with_debt} clientes`,
    }] : []),
    ...(metrics.client_balances ? [{
      title: "Saldos a Favor",
      value: `$${metrics.client_balances.total_surplus.toLocaleString()}`,
      icon: Wallet,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-violet-200",
      hoverColor: "hover:border-violet-400 hover:shadow-violet-50",
      iconBg: "bg-violet-500",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      subtitle: `${metrics.client_balances.with_surplus} clientes`,
    }] : []),
    // Delivery Metrics
    ...(metrics.deliveries ? [{
      title: "Peso Total Entregado",
      value: `${(metrics.deliveries.total_weight || 0).toFixed(1)} lbs`,
      icon: Truck,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-yellow-200",
      hoverColor: "hover:border-yellow-400 hover:shadow-yellow-50",
      iconBg: "bg-yellow-500",
      badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
    }] : []),
    ...(metrics.financial ? [{
      title: "Entregas Sin Pagar",
      value: `$${metrics.financial.unpaid_deliveries_amount.toLocaleString()}`,
      icon: CreditCard,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-amber-200",
      hoverColor: "hover:border-amber-400 hover:shadow-amber-50",
      iconBg: "bg-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      subtitle: `${metrics.financial.unpaid_deliveries_count} entregas`,
    }] : []),
    // Purchases Metrics
    ...(metrics.purchases && 'total_refunded' in metrics.purchases ? [{
      title: "Reembolsos Totales",
      value: `$${(metrics.purchases.total_refunded || 0).toLocaleString()}`,
      icon: Receipt,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-rose-200",
      hoverColor: "hover:border-rose-400 hover:shadow-rose-50",
      iconBg: "bg-rose-500",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    }] : []),
    // Agents Metrics
    ...(metrics.agents ? [{
      title: "Comisiones de Agentes",
      value: `$${metrics.agents.total_agent_profit.toLocaleString()}`,
      icon: UserCheck,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400 hover:shadow-blue-50",
      iconBg: "bg-blue-500",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      subtitle: `${metrics.agents.total_agents} agentes`,
    }] : []),
    // Expenses
    ...(metrics.expenses ? [{
      title: "Gastos del Mes",
      value: `$${metrics.expenses.this_month.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-gray-600",
      bgGradient: "bg-white",
      borderColor: "border-slate-200",
      hoverColor: "hover:border-slate-400 hover:shadow-slate-50",
      iconBg: "bg-slate-500",
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
                "py-0 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-2 group cursor-pointer",
                card.bgGradient,
                card.borderColor,
                card.hoverColor,
              )}
            >
              {/* Decorative corner accent - Minimalist */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-16 h-16 opacity-5 transform translate-x-4 -translate-y-4 rounded-full transition-all duration-300 group-hover:scale-125",
                  card.iconBg,
                )}
              />

              <CardContent className="py-4 px-5 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">
                      {card.title}
                    </p>
                    <p className="text-2xl font-extrabold tracking-tight text-gray-900 truncate">
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-[10px] font-medium text-gray-500 mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "p-2 rounded-lg shadow-sm transform group-hover:scale-105 transition-all duration-300 flex-shrink-0",
                      card.iconBg,
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
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
                  "py-0 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-2 group cursor-pointer",
                  card.bgGradient,
                  card.borderColor,
                  card.hoverColor,
                )}
              >
                {/* Decorative corner accent - Minimalist */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-16 h-16 opacity-5 transform translate-x-4 -translate-y-4 rounded-full transition-all duration-300 group-hover:scale-125",
                    card.iconBg,
                  )}
                />

                <CardContent className="py-4 px-5 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">
                        {card.title}
                      </p>
                      <p className="text-2xl font-extrabold tracking-tight text-gray-900 truncate">
                        {card.value}
                      </p>
                      {card.subtitle && (
                        <p className="text-[10px] font-medium text-gray-500 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "p-2 rounded-lg shadow-sm transform group-hover:scale-105 transition-all duration-300 flex-shrink-0",
                        card.iconBg,
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
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
