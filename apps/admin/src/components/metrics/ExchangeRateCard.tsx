import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";

/**
 * Componente para mostrar la tasa de cambio actual
 */
export const ExchangeRateCard = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || metrics?.exchange_rate === undefined) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const exchangeRate = metrics.exchange_rate || 0;

  return (
    <Card className={cn(
      "border-2 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
      "bg-gradient-to-br from-blue-50 to-cyan-100/50 border-blue-200"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Tasa de Cambio Actual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              USD a Moneda Local
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">
                {exchangeRate > 0 ? exchangeRate.toFixed(2) : "N/A"}
              </p>
              {exchangeRate > 0 && (
                <span className="text-sm text-muted-foreground">
                  por $1.00 USD
                </span>
              )}
            </div>
            {exchangeRate > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Tasa actualizada</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl shadow-lg",
            "bg-gradient-to-br from-blue-500 to-cyan-600"
          )}>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        {exchangeRate === 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              ⚠️ La tasa de cambio no está configurada. Configúrala en Configuración del Sistema.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
