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
  Receipt,
} from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  borderColor: string;
  hoverColor: string;
}

interface MetricGroup {
  label: string;
  accent: string; // border-l color for group header
  cards: MetricCard[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Card className="border-2 border-gray-100">
    <CardContent className="p-5">
      <div className="space-y-3">
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-7 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

const MetricCardItem = ({ card }: { card: MetricCard }) => {
  const Icon = card.icon;
  return (
    <Card
      className={cn(
        "py-0 relative overflow-hidden transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5 border-2 group cursor-pointer bg-white",
        card.borderColor,
        card.hoverColor,
      )}
    >
      {/* Decorative background circle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-20 h-20 opacity-[0.06] rounded-full",
          "transform translate-x-5 -translate-y-5 transition-transform duration-300 group-hover:scale-110",
          card.iconBg,
        )}
      />

      <CardContent className="py-4 px-5 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate">
              {card.title}
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 truncate">
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-[10px] font-medium text-gray-400 mt-1.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                {card.subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-lg shadow-sm flex-shrink-0",
              "transform group-hover:scale-105 transition-all duration-300",
              card.iconBg,
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const GroupSection = ({ group }: { group: MetricGroup }) => (
  <div className="space-y-3">
    {/* Section header */}
    <div className={cn("flex items-center gap-2 border-l-4 pl-3", group.accent)}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
        {group.label}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {group.cards.map((card) => (
        <MetricCardItem key={card.title} card={card} />
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const MetricsSummaryCards = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Build metric groups ──────────────────────────────────────────────────

  const groups: MetricGroup[] = [
    {
      label: "Resumen General",
      accent: "border-orange-400",
      cards: [
        {
          title: "Total Usuarios",
          value: metrics.users.total,
          icon: Users,
          iconBg: "bg-orange-500",
          borderColor: "border-gray-200",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
        },
        {
          title: "Total Productos",
          value: metrics.products.total,
          icon: Package,
          iconBg: "bg-orange-500",
          borderColor: "border-gray-200",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
        },
        {
          title: "Órdenes del Mes",
          value: metrics.orders.this_month,
          icon: ShoppingCart,
          iconBg: "bg-orange-500",
          borderColor: "border-gray-200",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
        },
        {
          title: "Ingresos del Mes",
          value: `$${metrics.revenue.this_month.toLocaleString()}`,
          icon: DollarSign,
          iconBg: "bg-orange-500",
          borderColor: "border-gray-200",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50",
        },
      ],
    },
  ];

  // Financial group
  const financialCards: MetricCard[] = [];

  if (metrics.financial) {
    financialCards.push(
      {
        title: "Ganancia Total",
        value: `$${metrics.financial.total_profit.toLocaleString()}`,
        icon: TrendingUp,
        iconBg: "bg-emerald-500",
        borderColor: "border-emerald-200",
        hoverColor: "hover:border-emerald-400 hover:shadow-emerald-50",
      },
      {
        title: "Margen de Ganancia",
        value: `${metrics.financial.profit_margin.toFixed(1)}%`,
        icon: TrendingUp,
        iconBg: "bg-cyan-500",
        borderColor: "border-cyan-200",
        hoverColor: "hover:border-cyan-400 hover:shadow-cyan-50",
      },
      {
        title: "Entregas Sin Pagar",
        value: `$${metrics.financial.unpaid_deliveries_amount.toLocaleString()}`,
        subtitle: `${metrics.financial.unpaid_deliveries_count} entregas`,
        icon: CreditCard,
        iconBg: "bg-amber-500",
        borderColor: "border-amber-200",
        hoverColor: "hover:border-amber-400 hover:shadow-amber-50",
      },
    );
  }

  if (metrics.expenses) {
    financialCards.push({
      title: "Gastos del Mes",
      value: `$${metrics.expenses.this_month.toLocaleString()}`,
      icon: TrendingDown,
      iconBg: "bg-slate-500",
      borderColor: "border-slate-200",
      hoverColor: "hover:border-slate-400 hover:shadow-slate-50",
    });
  }

  if (financialCards.length > 0) {
    groups.push({ label: "Finanzas", accent: "border-emerald-400", cards: financialCards });
  }

  // Clients & deliveries group
  const clientCards: MetricCard[] = [];

  if (metrics.client_balances) {
    clientCards.push(
      {
        title: "Deudas Pendientes",
        value: `$${metrics.client_balances.total_debt.toLocaleString()}`,
        subtitle: `${metrics.client_balances.with_debt} clientes`,
        icon: AlertCircle,
        iconBg: "bg-rose-500",
        borderColor: "border-rose-200",
        hoverColor: "hover:border-rose-400 hover:shadow-rose-50",
      },
      {
        title: "Saldos a Favor",
        value: `$${metrics.client_balances.total_surplus.toLocaleString()}`,
        subtitle: `${metrics.client_balances.with_surplus} clientes`,
        icon: Wallet,
        iconBg: "bg-violet-500",
        borderColor: "border-violet-200",
        hoverColor: "hover:border-violet-400 hover:shadow-violet-50",
      },
    );
  }

  if (metrics.deliveries) {
    clientCards.push({
      title: "Peso Total Entregado",
      value: `${(metrics.deliveries.total_weight || 0).toFixed(1)} lbs`,
      icon: Truck,
      iconBg: "bg-yellow-500",
      borderColor: "border-yellow-200",
      hoverColor: "hover:border-yellow-400 hover:shadow-yellow-50",
    });
  }

  if (metrics.agents) {
    clientCards.push({
      title: "Comisiones de Agentes",
      value: `$${metrics.agents.total_agent_profit.toLocaleString()}`,
      subtitle: `${metrics.agents.total_agents} agentes`,
      icon: UserCheck,
      iconBg: "bg-blue-500",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400 hover:shadow-blue-50",
    });
  }

  if (metrics.purchases && "total_refunded" in metrics.purchases) {
    clientCards.push({
      title: "Reembolsos Totales",
      value: `$${(metrics.purchases.total_refunded || 0).toLocaleString()}`,
      icon: Receipt,
      iconBg: "bg-rose-500",
      borderColor: "border-rose-200",
      hoverColor: "hover:border-rose-400 hover:shadow-rose-50",
    });
  }

  if (clientCards.length > 0) {
    groups.push({
      label: "Clientes & Operaciones",
      accent: "border-blue-400",
      cards: clientCards,
    });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <GroupSection key={group.label} group={group} />
      ))}
    </div>
  );
};