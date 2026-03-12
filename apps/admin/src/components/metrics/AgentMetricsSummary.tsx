import { Card, CardContent } from "@/components/ui/card";
import {
  Users, UserCheck, ShoppingCart, Clock, CheckCircle, CalendarDays,
  Truck, Package, DollarSign, TrendingUp, CreditCard, AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAgentDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AgentMetricCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  borderColor: string;
  hoverColor: string;
}

interface AgentMetricGroup {
  label: string;
  accent: string;
  cards: AgentMetricCard[];
}

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

const MetricCardItem = ({ card }: { card: AgentMetricCard }) => (
  <Card
    className={cn(
      "border-2 transition-all duration-300 cursor-default group",
      card.borderColor,
      card.hoverColor
    )}
  >
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {card.title}
          </p>
          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          {card.subtitle && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
              {card.subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
            card.iconBg
          )}
        >
          <card.icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AgentMetricsSummary() {
  const { data, isLoading, isError, refetch } = useAgentDashboardMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((group) => (
          <div key={group} className="space-y-3">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">No se pudieron cargar las métricas</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (value: number) => value.toLocaleString('es-ES');

  const groups: AgentMetricGroup[] = [
    {
      label: "Mis Clientes",
      accent: "border-l-blue-400",
      cards: [
        {
          title: "Total Clientes",
          value: formatNumber(data.clients.total),
          icon: Users,
          iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
          borderColor: "border-blue-100",
          hoverColor: "hover:border-blue-300 hover:shadow-blue-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Clientes Activos",
          value: formatNumber(data.clients.active),
          subtitle: `${data.clients.total > 0 ? Math.round((data.clients.active / data.clients.total) * 100) : 0}% del total`,
          icon: UserCheck,
          iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
          borderColor: "border-blue-100",
          hoverColor: "hover:border-blue-300 hover:shadow-blue-50 hover:-translate-y-0.5 hover:shadow-md",
        },
      ],
    },
    {
      label: "Mis Órdenes",
      accent: "border-l-orange-400",
      cards: [
        {
          title: "Total Órdenes",
          value: formatNumber(data.orders.total),
          icon: ShoppingCart,
          iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Pendientes",
          value: formatNumber(data.orders.pending),
          icon: Clock,
          iconBg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Completadas",
          value: formatNumber(data.orders.completed),
          icon: CheckCircle,
          iconBg: "bg-gradient-to-br from-green-400 to-green-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Este Mes",
          value: formatNumber(data.orders.this_month),
          icon: CalendarDays,
          iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Ingresos Totales",
          value: formatCurrency(data.orders.revenue_total),
          icon: DollarSign,
          iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Ingresos Este Mes",
          value: formatCurrency(data.orders.revenue_this_month),
          icon: TrendingUp,
          iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          borderColor: "border-orange-100",
          hoverColor: "hover:border-orange-300 hover:shadow-orange-50 hover:-translate-y-0.5 hover:shadow-md",
        },
      ],
    },
    {
      label: "Mis Entregas",
      accent: "border-l-emerald-400",
      cards: [
        {
          title: "Total Entregas",
          value: formatNumber(data.deliveries.total),
          icon: Truck,
          iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          borderColor: "border-emerald-100",
          hoverColor: "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Pendientes",
          value: formatNumber(data.deliveries.pending),
          icon: Clock,
          iconBg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
          borderColor: "border-emerald-100",
          hoverColor: "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Entregadas",
          value: formatNumber(data.deliveries.delivered),
          icon: Package,
          iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          borderColor: "border-emerald-100",
          hoverColor: "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Este Mes",
          value: formatNumber(data.deliveries.this_month),
          icon: CalendarDays,
          iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
          borderColor: "border-emerald-100",
          hoverColor: "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Pagadas",
          value: formatNumber(data.deliveries.paid),
          icon: CreditCard,
          iconBg: "bg-gradient-to-br from-green-400 to-green-600",
          borderColor: "border-emerald-100",
          hoverColor: "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Sin Pagar",
          value: formatNumber(data.deliveries.unpaid),
          subtitle: data.deliveries.unpaid > 0 ? "Requiere atención" : undefined,
          icon: AlertCircle,
          iconBg: data.deliveries.unpaid > 0
            ? "bg-gradient-to-br from-red-400 to-red-600"
            : "bg-gradient-to-br from-gray-400 to-gray-600",
          borderColor: data.deliveries.unpaid > 0 ? "border-red-100" : "border-emerald-100",
          hoverColor: data.deliveries.unpaid > 0
            ? "hover:border-red-300 hover:shadow-red-50 hover:-translate-y-0.5 hover:shadow-md"
            : "hover:border-emerald-300 hover:shadow-emerald-50 hover:-translate-y-0.5 hover:shadow-md",
        },
      ],
    },
    {
      label: "Mi Comisión",
      accent: "border-l-purple-400",
      cards: [
        {
          title: "Ganancia Total",
          value: formatCurrency(data.profit.total),
          icon: DollarSign,
          iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
          borderColor: "border-purple-100",
          hoverColor: "hover:border-purple-300 hover:shadow-purple-50 hover:-translate-y-0.5 hover:shadow-md",
        },
        {
          title: "Ganancia Este Mes",
          value: formatCurrency(data.profit.this_month),
          icon: TrendingUp,
          iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
          borderColor: "border-purple-100",
          hoverColor: "hover:border-purple-300 hover:shadow-purple-50 hover:-translate-y-0.5 hover:shadow-md",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-3">
          <h3
            className={cn(
              "text-sm font-bold uppercase tracking-wider text-gray-500 border-l-4 pl-3",
              group.accent
            )}
          >
            {group.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.cards.map((card) => (
              <MetricCardItem key={card.title} card={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
