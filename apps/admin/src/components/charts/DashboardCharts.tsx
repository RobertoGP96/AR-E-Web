import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useUserMetrics, useProductMetrics, useOrderMetrics, useRevenueMetrics } from '@/hooks/useDashboardMetrics';

// Colores para los gráficos
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
  success: '#22c55e',
  warning: '#eab308',
  info: '#06b6d4'
};

/**
 * Gráfico de donut para métricas de usuarios
 */
export const UserMetricsBarChart = () => {
  const { userMetrics, isLoading } = useUserMetrics();

  const data = React.useMemo(() => [
    { name: "Total", value: userMetrics?.total || 0, color: COLORS.primary },
    { name: "Activos", value: userMetrics?.active || 0, color: COLORS.success },
    { name: "Verificados", value: userMetrics?.verified || 0, color: COLORS.secondary },
    { name: "Agentes", value: userMetrics?.agents || 0, color: COLORS.accent },
  ], [userMetrics])

  const totalUsers = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  if (isLoading || !userMetrics) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Métricas de Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[250px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Métricas de Usuarios</CardTitle>
        <CardDescription>Distribución de usuarios por estado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
                          {totalUsers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Usuarios
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Tooltip
              formatter={(value) => [value.toLocaleString(), 'Usuarios']}
              labelStyle={{ color: '#000' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          <TrendingUp className="h-4 w-4" />
          Total de usuarios registrados
        </div>
        <div className="text-muted-foreground leading-none">
          Métricas actualizadas en tiempo real
        </div>
      </CardFooter>
    </Card>
  )
};

/**
 * Gráfico circular para distribución de productos
 */
export const ProductMetricsPieChart = () => {
  const { productMetrics, isLoading } = useProductMetrics();

  if (isLoading || !productMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'En Stock', value: productMetrics.in_stock, color: COLORS.success },
    { name: 'Sin Stock', value: productMetrics.out_of_stock, color: COLORS.danger },
    { name: 'Pendientes', value: productMetrics.pending_delivery, color: COLORS.warning }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value.toLocaleString(), 'Cantidad']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Gráfico de líneas para tendencias de ingresos
 */
export const RevenueMetricsLineChart = () => {
  const { revenueMetrics, isLoading } = useRevenueMetrics();

  if (isLoading || !revenueMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Mes Pasado', value: revenueMetrics.last_month },
    { name: 'Este Mes', value: revenueMetrics.this_month },
    { name: 'Esta Semana', value: revenueMetrics.this_week },
    { name: 'Hoy', value: revenueMetrics.today }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value: number) => `$${value.toLocaleString()}`} />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
              labelStyle={{ color: '#000' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Gráfico de donut para estados de órdenes
 */
export const OrderStatusComparisonChart = () => {
  const { orderMetrics, isLoading, error } = useOrderMetrics();

  const data = React.useMemo(() => [
    { name: "Completadas", value: orderMetrics?.completed || 0, color: COLORS.success },
    { name: "Pendientes", value: orderMetrics?.pending || 0, color: COLORS.warning },
    { name: "Total", value: orderMetrics?.total || 0, color: COLORS.primary },
  ], [orderMetrics])

  const totalOrders = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  if (isLoading || !orderMetrics) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Estados de Órdenes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square max-h-[250px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Estados de Órdenes</CardTitle>
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
  const hasValidData = data.some(item => item.value > 0);

  if (!hasValidData) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Estados de Órdenes</CardTitle>
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
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Estados de Órdenes</CardTitle>
        <CardDescription>Distribución de órdenes por estado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
                          className="fill-muted-foreground"
                        >
                          Órdenes
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Tooltip
              formatter={(value) => [value.toLocaleString(), 'Órdenes']}
              labelStyle={{ color: '#000' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          <TrendingUp className="h-4 w-4" />
          Órdenes procesadas este mes
        </div>
        <div className="text-muted-foreground leading-none">
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
      {/* Primera fila: Usuarios y Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserMetricsBarChart />
        <ProductMetricsPieChart />
      </div>

      {/* Segunda fila: Ingresos y Estados de Órdenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueMetricsLineChart />
        <OrderStatusComparisonChart />
      </div>
    </div>
  );
};