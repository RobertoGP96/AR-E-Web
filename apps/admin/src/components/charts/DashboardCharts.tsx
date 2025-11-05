import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Label,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useUserMetrics, useProductMetrics, useOrderMetrics, useRevenueMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

// Configuración de colores para los gráficos
const COLORS = {
  primary: 'hsl(221, 83%, 53%)',
  secondary: 'hsl(142, 76%, 36%)',
  accent: 'hsl(25, 95%, 53%)',
  danger: 'hsl(0, 84%, 60%)',
  muted: 'hsl(215, 16%, 47%)',
  success: 'hsl(142, 71%, 45%)',
  warning: 'hsl(48, 96%, 53%)',
  info: 'hsl(199, 89%, 48%)',
  purple: 'hsl(271, 91%, 65%)',
  emerald: 'hsl(160, 84%, 39%)',
  blue: 'hsl(217, 91%, 60%)',
  orange: 'hsl(24, 94%, 50%)'
};

/**
 * Gráfico de donut mejorado para métricas de usuarios
 */
export const UserMetricsBarChart = () => {
  const { userMetrics, isLoading } = useUserMetrics();

  const chartData = React.useMemo(() => [
    { category: "total", usuarios: userMetrics?.total || 0, fill: COLORS.blue },
    { category: "activos", usuarios: userMetrics?.active || 0, fill: COLORS.success },
    { category: "verificados", usuarios: userMetrics?.verified || 0, fill: COLORS.emerald },
    { category: "agentes", usuarios: userMetrics?.agents || 0, fill: COLORS.orange },
  ], [userMetrics])

  const chartConfig = {
    usuarios: {
      label: "Usuarios",
    },
    total: {
      label: "Total",
      color: COLORS.blue,
    },
    activos: {
      label: "Activos",
      color: COLORS.success,
    },
    verificados: {
      label: "Verificados",
      color: COLORS.emerald,
    },
    agentes: {
      label: "Agentes",
      color: COLORS.orange,
    },
  } satisfies ChartConfig

  const totalUsers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.usuarios, 0)
  }, [chartData])

  if (isLoading || !userMetrics) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Métricas de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[280px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Métricas de Usuarios
        </CardTitle>
        <CardDescription>Distribución de usuarios por estado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="usuarios"
              nameKey="category"
              innerRadius={70}
              outerRadius={110}
              strokeWidth={5}
              paddingAngle={2}
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalUsers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-sm"
                        >
                          Usuarios
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 leading-none font-medium text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          Total de usuarios registrados
        </div>
        <div className="text-muted-foreground leading-none text-center">
          Métricas actualizadas en tiempo real
        </div>
      </CardFooter>
    </Card>
  )
};

/**
 * Gráfico de dona para distribución de productos por categoría
 */
export const ProductMetricsPieChart = () => {
  const { productMetrics, isLoading } = useProductMetrics();

  const chartData = React.useMemo(() => {
    if (!productMetrics?.by_category) return [];
    
    // Usar los colores del array en orden
    const categoryColors = [
      COLORS.blue,
      COLORS.success,
      COLORS.orange,
      COLORS.purple,
      COLORS.emerald,
      COLORS.danger,
      COLORS.warning,
      COLORS.info,
      COLORS.primary,
      COLORS.secondary,
    ];
    
    return productMetrics.by_category.map((item, index) => ({
      category: item.category,
      productos: item.count,
      fill: categoryColors[index % categoryColors.length]
    }));
  }, [productMetrics]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      productos: {
        label: "Productos",
      },
    };
    
    chartData.forEach((item) => {
      config[item.category] = {
        label: item.category,
        color: item.fill,
      };
    });
    
    return config;
  }, [chartData]);

  const totalProducts = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.productos, 0);
  }, [chartData]);

  if (isLoading || !productMetrics) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Distribución de Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[280px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            Distribución de Productos
          </CardTitle>
          <CardDescription>Productos agrupados por categoría</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-sm">No hay productos registrados</p>
              <p className="text-xs mt-1">Los productos aparecerán aquí cuando se registren</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          Distribución de Productos
        </CardTitle>
        <CardDescription>Productos agrupados por categoría</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="productos"
              nameKey="category"
              innerRadius={70}
              outerRadius={110}
              strokeWidth={5}
              paddingAngle={2}
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalProducts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-sm"
                        >
                          Productos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 leading-none font-medium text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          {chartData.length} categorías activas
        </div>
        <div className="text-muted-foreground leading-none text-center">
          Total de {totalProducts.toLocaleString()} productos registrados
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Gráfico de líneas mejorado para tendencias de ingresos
 */
export const RevenueMetricsLineChart = () => {
  const { revenueMetrics, isLoading } = useRevenueMetrics();

  const chartData = React.useMemo(() => [
    { period: "mesPasado", ingresos: revenueMetrics?.last_month || 0 },
    { period: "esteMes", ingresos: revenueMetrics?.this_month || 0 },
    { period: "estaSemana", ingresos: revenueMetrics?.this_week || 0 },
    { period: "hoy", ingresos: revenueMetrics?.today || 0 }
  ], [revenueMetrics]);

  const chartConfig = {
    ingresos: {
      label: "Ingresos",
      color: COLORS.purple,
    },
  } satisfies ChartConfig

  if (isLoading || !revenueMetrics) {
    return (
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Tendencia de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = chartData.reduce((acc, curr) => acc + curr.ingresos, 0);
  const avgRevenue = totalRevenue / chartData.length;
  const trend = revenueMetrics.this_month > revenueMetrics.last_month;

  return (
    <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Tendencia de Ingresos
        </CardTitle>
        <CardDescription>Comparativa de ingresos por período</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const labels: Record<string, string> = {
                  mesPasado: 'Mes Pasado',
                  esteMes: 'Este Mes',
                  estaSemana: 'Esta Semana',
                  hoy: 'Hoy'
                };
                return labels[value] || value;
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
              />} 
            />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke={COLORS.purple}
              strokeWidth={3}
              dot={{
                fill: COLORS.purple,
                strokeWidth: 2,
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className={cn(
          "flex gap-2 font-medium leading-none",
          trend ? "text-emerald-600" : "text-rose-600"
        )}>
          {trend ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {trend ? "Crecimiento positivo" : "Tendencia a la baja"}
        </div>
        <div className="text-muted-foreground">
          Promedio: ${avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Gráfico de donut mejorado para estados de órdenes
 */
export const OrderStatusComparisonChart = () => {
  const { orderMetrics, isLoading, error } = useOrderMetrics();

  const chartData = React.useMemo(() => [
    { status: "completadas", ordenes: orderMetrics?.completed || 0, fill: COLORS.success },
    { status: "pendientes", ordenes: orderMetrics?.pending || 0, fill: COLORS.warning },
    { status: "total", ordenes: orderMetrics?.total || 0, fill: COLORS.blue },
  ], [orderMetrics])

  const chartConfig = {
    ordenes: {
      label: "Órdenes",
    },
    completadas: {
      label: "Completadas",
      color: COLORS.success,
    },
    pendientes: {
      label: "Pendientes",
      color: COLORS.warning,
    },
    total: {
      label: "Total",
      color: COLORS.blue,
    },
  } satisfies ChartConfig

  const totalOrders = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.ordenes, 0)
  }, [chartData])

  if (isLoading || !orderMetrics) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Estados de Órdenes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[280px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Estados de Órdenes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-sm">Error al cargar las métricas</p>
              <p className="text-xs mt-1">Inténtalo de nuevo más tarde</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have valid data to display
  const hasValidData = chartData.some(item => item.ordenes > 0);

  if (!hasValidData) {
    return (
      <Card className="flex flex-col border-2 shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Estados de Órdenes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-sm">No hay datos disponibles</p>
              <p className="text-xs mt-1">Las órdenes aparecerán aquí cuando estén disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Estados de Órdenes
        </CardTitle>
        <CardDescription>Distribución de órdenes por estado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
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
              innerRadius={70}
              outerRadius={110}
              strokeWidth={5}
              paddingAngle={2}
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalOrders.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-sm"
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
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 leading-none font-medium text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          Órdenes procesadas este mes
        </div>
        <div className="text-muted-foreground leading-none text-center">
          Métricas actualizadas en tiempo real
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Dashboard completo con múltiples gráficos
 */
export const DashboardCharts = () => {
  return (
    <div className="space-y-6">
      {/* Primera fila: Ingresos a todo lo ancho */}
      <div className="w-full">
        <RevenueMetricsLineChart />
      </div>

      {/* Segunda fila: Usuarios, Productos y Estados de Órdenes en columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <UserMetricsBarChart />
        <ProductMetricsPieChart />
        <OrderStatusComparisonChart />
      </div>
    </div>
  );
};