import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
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
      "border-2 py-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-full md:w-48 overflow-hidden",
      "bg-white border-orange-200"
    )}>
      <CardHeader className="bg-orange-400">
        <CardTitle className="mb-0 pb-0 flex items-center justify-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
          <DollarSign className="h-4 w-4" />
          Tasa Cambio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 text-center bg-white">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-extrabold text-orange-400">
              {exchangeRate > 0 ? exchangeRate.toFixed(2) : "N/A"}
            </p>
            {exchangeRate > 0 && (
              <span className="text-xs font-bold text-orange-400/70">
                CUP
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Actualizado hoy</p>
        </div>
        {exchangeRate === 0 && (
          <div className="mt-2 p-1 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800">
            ⚠️ No configurada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
