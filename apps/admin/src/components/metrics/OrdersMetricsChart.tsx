import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { ShoppingCart, TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const COLORS = {
  total: 'hsl(217, 91%, 60%)',
  completed: 'hsl(142, 71%, 45%)',
  pending: 'hsl(48, 96%, 53%)',
  today: 'hsl(271, 91%, 65%)',
  revenue: 'hsl(142, 76%, 36%)',
};

/**
 * Componente de resumen de métricas de órdenes con gráfico de distribución
 */
export const OrdersMetricsChart = () => {
  const { data: metrics, isLoading } = useDashboardMetrics();

  const chartData = React.useMemo(() => [
    { 
      status: "completadas", 
      ordenes: metrics?.orders.completed || 0, 
      fill: COLORS.completed 
    },
    { 
      status: "pendientes", 
      ordenes: metrics?.orders.pending || 0, 
      fill: COLORS.pending 
    },
  ], [metrics]);

  const chartConfig = {
    ordenes: {
      label: "Órdenes",
    },
    completadas: {
      label: "Completadas",
      color: COLORS.completed,
    },
    pendientes: {
      label: "Pendientes",
      color: COLORS.pending,
    },
  } satisfies ChartConfig;

  const totalOrders = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.ordenes, 0)
  }, [chartData]);

  if (isLoading || !metrics) {
    return (
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            Resumen de Órdenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico skeleton */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full animate-pulse" />
            </div>
            {/* Métricas skeleton */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasOrders = totalOrders > 0;

  // Calcular porcentaje de completadas
  const completionRate = totalOrders > 0 
    ? ((metrics.orders.completed / totalOrders) * 100).toFixed(1) 
    : '0';

  return (
    <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Resumen de Órdenes
            </CardTitle>
            <CardDescription className="mt-1">
              Distribución de estados y métricas clave
            </CardDescription>
          </div>
          <Badge 
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {completionRate}% completadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de distribución */}
          <div className="lg:col-span-1 flex items-center justify-center">
            {hasOrders ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-square max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="ordenes"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={5}
                    paddingAngle={4}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalOrders.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground text-xs"
                              >
                                Órdenes
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                <Package className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Sin órdenes</p>
              </div>
            )}
          </div>

          {/* Métricas en grid */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Total Órdenes */}
            <div className={cn(
              "relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md group",
              "border-blue-100 hover:border-blue-200 hover:shadow-blue-100/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Órdenes
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {metrics.orders.total}
                  </p>
                  <Badge 
                    variant="secondary"
                    className="text-xs font-semibold mt-2 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-0.5 w-fit"
                  >
                    <TrendingUp className="w-3 h-3" />
                    +15%
                  </Badge>
                </div>
                <div className="p-2 rounded-lg shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 transform group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Completadas */}
            <div className={cn(
              "relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md group",
              "border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completadas
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {metrics.orders.completed}
                  </p>
                  <Badge 
                    variant="secondary"
                    className="text-xs font-semibold mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-0.5 w-fit"
                  >
                    <TrendingUp className="w-3 h-3" />
                    +20%
                  </Badge>
                </div>
                <div className="p-2 rounded-lg shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Pendientes */}
            <div className={cn(
              "relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md group",
              "border-amber-100 hover:border-amber-200 hover:shadow-amber-100/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pendientes
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {metrics.orders.pending}
                  </p>
                </div>
                <div className="p-2 rounded-lg shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Ingresos del Mes */}
            <div className={cn(
              "relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md group",
              "border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ingresos Mes
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${metrics.revenue.this_month.toLocaleString()}
                  </p>
                  <Badge 
                    variant="secondary"
                    className="text-xs font-semibold mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-0.5 w-fit"
                  >
                    <TrendingUp className="w-3 h-3" />
                    +18%
                  </Badge>
                </div>
                <div className="p-2 rounded-lg shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 transform group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
