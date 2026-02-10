import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Clock, CreditCard, Users, Package, AlertCircle } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Componente para mostrar alertas y métricas de atención
 */
export const AlertsMetrics = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics?.alerts) {
    return (
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const alerts = metrics.alerts;

  const alertItems = [
    {
      title: "Órdenes Pendientes > 30 días",
      value: alerts.orders_pending_30_days,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      severity: alerts.orders_pending_30_days > 0 ? "warning" : "success",
    },
    {
      title: "Entregas Sin Pagar > 60 días",
      value: alerts.deliveries_unpaid_60_days.count,
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      severity: alerts.deliveries_unpaid_60_days.count > 0 ? "error" : "success",
      subtitle: `$${alerts.deliveries_unpaid_60_days.total_amount.toLocaleString()}`,
    },
    {
      title: "Clientes con Deuda Alta",
      value: alerts.clients_with_high_debt.count,
      icon: Users,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      severity: alerts.clients_with_high_debt.count > 0 ? "error" : "success",
      subtitle: `$${alerts.clients_with_high_debt.total_debt.toLocaleString()}`,
    },
    {
      title: "Productos con Stock Bajo",
      value: alerts.products_low_stock,
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      severity: alerts.products_low_stock > 0 ? "warning" : "success",
    },
  ];

  const hasAlerts = alerts.total_alerts > 0;

  return (
    <Card className={cn(
      "border-2 shadow-sm hover:shadow-lg transition-shadow duration-300",
      hasAlerts ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                hasAlerts ? "text-red-500" : "text-green-500"
              )} />
              Alertas del Sistema
            </CardTitle>
            <CardDescription>
              Situaciones que requieren atención inmediata
            </CardDescription>
          </div>
          <Badge
            variant={hasAlerts ? "destructive" : "default"}
            className="text-lg px-3 py-1"
          >
            {alerts.total_alerts} {alerts.total_alerts === 1 ? "alerta" : "alertas"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertItems.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.title}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md",
                  alert.bgColor,
                  alert.borderColor
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={cn("h-5 w-5", alert.color)} />
                  <Badge
                    variant={alert.severity === "error" ? "destructive" : alert.severity === "warning" ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {alert.severity === "error" ? "Crítico" : alert.severity === "warning" ? "Advertencia" : "OK"}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {alert.title}
                </p>
                <p className={cn("text-2xl font-bold", alert.color)}>
                  {alert.value}
                </p>
                {alert.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.subtitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Lista de clientes con deuda alta */}
        {alerts.clients_with_high_debt.clients.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes con Deuda Alta (Top 10)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.clients_with_high_debt.clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-600 ml-2">
                    ${client.debt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasAlerts && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  ¡Excelente! No hay alertas pendientes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los sistemas funcionan correctamente
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
