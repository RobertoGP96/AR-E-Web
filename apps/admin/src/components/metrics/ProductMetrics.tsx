import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";

/**
 * Componente para mostrar métricas de productos
 */
export const ProductMetrics = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics?.product_metrics) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Métricas de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const productMetrics = metrics.product_metrics;

  const metricCards = [
    {
      title: "Pendientes de Compra",
      value: productMetrics.pending_purchase,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "En Tránsito",
      value: productMetrics.in_transit,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Tasa de Entrega",
      value: `${productMetrics.delivery_rate}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      subtitle: `${productMetrics.total_delivered} de ${productMetrics.total_ordered}`,
    },
    {
      title: "Reembolsos",
      value: `$${productMetrics.total_refunded_amount.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      subtitle: `${productMetrics.refund_percentage.toFixed(1)}% de productos`,
    },
  ];

  return (
    <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Métricas de Productos
        </CardTitle>
        <CardDescription>
          Estado y rendimiento de productos en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md",
                  card.bgColor,
                  card.borderColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {card.title}
                </p>
                <p className={cn("text-2xl font-bold", card.color)}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Top productos reembolsados */}
        {productMetrics.top_refunded_products.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Top Productos Reembolsados
            </h4>
            <div className="space-y-2">
              {productMetrics.top_refunded_products.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.refund_count} reembolso{product.refund_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600 ml-2">
                    ${product.total_refund_amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
