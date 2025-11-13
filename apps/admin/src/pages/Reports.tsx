import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, AreaChart, Area } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Users, Trophy } from 'lucide-react';
import axios from 'axios';
import { formatUSD } from '@/lib/format-usd';
import * as React from 'react';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

interface MonthlyReport {
  month: string;
  month_short: string;
  revenue: number;
  total_expenses: number;
  product_expenses: number;
  purchase_operational_expenses: number;
  paid_purchase_expenses: number;
  delivery_expenses: number;
  agent_profits: number;
  system_delivery_profit: number;
  system_profit: number;
  projected_profit: number;
  // Campos legacy para compatibilidad hacia atrás
  costs?: number;
  product_costs?: number;
  delivery_costs?: number;
}

interface AgentReport {
  agent_id: number;
  agent_name: string;
  agent_phone: string;
  total_profit: number;
  current_month_profit: number;
  clients_count: number;
  orders_count: number;
  orders_completed: number;
}

interface ProfitReportsData {
  monthly_reports: MonthlyReport[];
  agent_reports: AgentReport[];
  summary: {
    total_revenue: number;
    total_expenses: number;
    total_product_expenses: number;
    total_purchase_operational_expenses: number;
    total_paid_purchase_expenses: number;
    total_delivery_expenses: number;
    total_agent_profits: number;
    total_system_delivery_profit: number;
    total_system_profit: number;
    profit_margin: number;
    // Campos legacy para compatibilidad hacia atrás
    total_costs?: number;
    total_product_costs?: number;
    total_delivery_costs?: number;
  };
}

const fetchProfitReports = async (): Promise<ProfitReportsData> => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api_data/reports/profits/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

export default function Reports() {
  const [timeRange, setTimeRange] = React.useState("12m");

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });

  // Filtrar los datos según el rango de tiempo seleccionado
  const filteredData = React.useMemo(() => {
    const data = reports?.monthly_reports || [];
    if (timeRange === "3m") {
      return data.slice(-3);
    } else if (timeRange === "6m") {
      return data.slice(-6);
    }
    return data; // 12m - todos los meses
  }, [reports?.monthly_reports, timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner text='Cargando Reportes...' size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reportes de Ganancias</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error al cargar reportes: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reports || !reports.summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reportes de Ganancias</h1>
      </div>

      {/* Resumen de Ganancias */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50 border-blue-100 hover:border-blue-200 hover:shadow-blue-100/50">
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150 bg-gradient-to-br from-blue-500 to-blue-600" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ingresos Totales
            </CardTitle>
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">{formatUSD(reports.summary?.total_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-2">Productos + Entregas (12 meses)</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50 border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100/50">
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150 bg-gradient-to-br from-emerald-500 to-emerald-600" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ganancia del Sistema
            </CardTitle>
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600 tracking-tight">
              {formatUSD(reports.summary?.total_system_profit || 0)}
            </div>

            <div className='flex flex-row justify-between items-center'>
              <p className="text-xs text-muted-foreground mt-2">
                Margen: {(reports.summary?.profit_margin || 0).toFixed(1)}%
              </p>
              <div className="text-2xl md:text-xl font-bold text-emerald-600/50 tracking-tight">
                {formatUSD(reports.summary?.total_system_profit / 3 || 0)}x3
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50 border-purple-100 hover:border-purple-200 hover:shadow-purple-100/50">
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150 bg-gradient-to-br from-purple-500 to-purple-600" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ganancias de Agentes
            </CardTitle>
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 tracking-tight">
              {formatUSD(reports.summary.total_agent_profits)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{reports.agent_reports?.length || 0} agentes activos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100/50 border-rose-100 hover:border-rose-200 hover:shadow-rose-100/50">
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150 bg-gradient-to-br from-rose-500 to-rose-600" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Gastos Totales
            </CardTitle>
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl md:text-3xl font-bold text-rose-600 tracking-tight">
              {formatUSD(reports.summary.total_expenses || reports.summary.total_costs || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compras Pagadas: {formatUSD(reports.summary.total_paid_purchase_expenses || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 group cursor-pointer bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/50 border-orange-100 hover:border-orange-200 hover:shadow-orange-100/50">
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform translate-x-8 -translate-y-8 rounded-full blur-2xl transition-all duration-300 group-hover:scale-150 bg-gradient-to-br from-orange-500 to-orange-600" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Gastos de Entrega
            </CardTitle>
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl md:text-3xl font-bold text-orange-600 tracking-tight">
              {formatUSD(reports.summary.total_delivery_expenses || reports.summary.total_delivery_costs || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Peso × costo por libra del sistema</p>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Reportes Mensuales</TabsTrigger>
          <TabsTrigger value="agents">Ganancias por Agente</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          {/* Gráfica Interactiva Unificada */}
          <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Vista General de Reportes Financieros
                </CardTitle>
                <CardDescription>
                  Evolución completa de ingresos, costos y ganancias
                </CardDescription>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger
                  className="w-[160px] rounded-lg"
                  aria-label="Seleccionar período"
                >
                  <SelectValue placeholder="Últimos 12 meses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="12m" className="rounded-lg">
                    Últimos 12 meses
                  </SelectItem>
                  <SelectItem value="6m" className="rounded-lg">
                    Últimos 6 meses
                  </SelectItem>
                  <SelectItem value="3m" className="rounded-lg">
                    Últimos 3 meses
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Ingresos',
                    color: 'hsl(33 100% 50%)',
                  },
                  system_profit: {
                    label: 'Ganancia Sistema',
                    color: 'hsl(25 95% 53%)',
                  },
                  agent_profits: {
                    label: 'Ganancia Agentes',
                    color: 'hsl(39 100% 57%)',
                  },
                  product_expenses: {
                    label: 'Gastos Productos',
                    color: 'hsl(16 90% 48%)',
                  },
                  delivery_expenses: {
                    label: 'Gastos Entrega',
                    color: 'hsl(27 87% 67%)',
                  },
                }}
                className="aspect-auto h-[400px] w-full"
              >
                <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(33 100% 50%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(33 100% 50%)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillSystemProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillAgentProfits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(39 100% 57%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(39 100% 57%)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillProductExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(16 90% 48%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(16 90% 48%)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillDeliveryExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(27 87% 67%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(27 87% 67%)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month_short"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => formatUSD(value)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `Mes: ${value}`}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillRevenue)"
                    stroke="hsl(33 100% 50%)"
                    strokeWidth={2}
                    name="Ingresos"
                  />
                  <Area
                    dataKey="system_profit"
                    type="monotone"
                    fill="url(#fillSystemProfit)"
                    stroke="hsl(25 95% 53%)"
                    strokeWidth={2}
                    name="Ganancia Sistema"
                  />
                  <Area
                    dataKey="agent_profits"
                    type="monotone"
                    fill="url(#fillAgentProfits)"
                    stroke="hsl(39 100% 57%)"
                    strokeWidth={2}
                    name="Ganancia Agentes"
                  />
                  <Area
                    dataKey="product_expenses"
                    type="monotone"
                    fill="url(#fillProductExpenses)"
                    stroke="hsl(16 90% 48%)"
                    strokeWidth={2}
                    name="Gastos Productos"
                  />
                  <Area
                    dataKey="delivery_expenses"
                    type="monotone"
                    fill="url(#fillDeliveryExpenses)"
                    stroke="hsl(27 87% 67%)"
                    strokeWidth={2}
                    name="Gastos Entrega"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Reportes Detallados</CardTitle>
              <CardDescription>
                Datos tabulares de ingresos, costos y ganancias por mes
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Compras Pagadas</TableHead>
                    <TableHead className="text-right">Gastos Operativos</TableHead>
                    <TableHead className="text-right">Gastos Entrega</TableHead>
                    <TableHead className="text-right">Total Gastos</TableHead>
                    <TableHead className="text-right">Ganancia Agentes</TableHead>
                    <TableHead className="text-right">Ganancia Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filteredData || []).map((report, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{report.month}</TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: 'hsl(33 100% 50%)' }}>
                        ${(report.revenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: 'hsl(16 90% 48%)' }}>
                        ${(report.paid_purchase_expenses || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: 'hsl(39 100% 57%)' }}>
                        ${(report.purchase_operational_expenses || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: 'hsl(27 87% 67%)' }}>
                        ${(report.delivery_expenses || report.delivery_costs || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold" style={{ color: 'hsl(16 90% 48%)' }}>
                        ${(report.total_expenses || report.costs || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: 'hsl(280 65% 60%)' }}>
                        ${(report.agent_profits || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold" style={{ color: 'hsl(25 95% 53%)' }}>
                        ${(report.system_profit || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Agentes por Ganancias</CardTitle>
              <CardDescription>
                Desempeño y ganancias de cada agente
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">Órdenes</TableHead>
                    <TableHead className="text-right">Completadas</TableHead>
                    <TableHead className="text-right">Ganancia Mes</TableHead>
                    <TableHead className="text-right">Ganancia Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reports.agent_reports || []).map((agent, index) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell className="font-medium">
                        {index === 0 && <Trophy className="h-4 w-4" />}
                        {index > 0 && <span className="ml-2">{index + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{agent.agent_name}</TableCell>
                      <TableCell>{agent.agent_phone}</TableCell>
                      <TableCell className="text-right">{agent.clients_count || 0}</TableCell>
                      <TableCell className="text-right">{agent.orders_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={(agent.orders_completed || 0) > 0 ? 'default' : 'secondary'}>
                          {agent.orders_completed || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${(agent.current_month_profit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${(agent.total_profit || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(reports.agent_reports || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No hay agentes con ganancias registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Ganancias por Agente
              </CardTitle>
              <CardDescription>
                Comparación visual de ganancias totales entre agentes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{
                  total_profit: {
                    label: 'Ganancia Total',
                    color: 'hsl(25 95% 53%)',
                  },
                  label: {
                    color: 'hsl(var(--background))',
                  },
                }}
                className="w-full"
                style={{ height: `${(reports.agent_reports || []).length * 52 + 20}px` }}
              >
                <BarChart
                  data={reports.agent_reports || []}
                  layout="vertical"
                  margin={{ top: 10, right: 50, left: 10, bottom: 10 }}
                  barSize={32}
                  barCategoryGap="20%"
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="agent_name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis
                    dataKey="total_profit"
                    type="number"
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="total_profit"
                    fill="var(--color-total_profit)"
                    name="Ganancia Total"
                    radius={4}
                  >
                    <LabelList
                      dataKey="agent_name"
                      position="insideLeft"
                      offset={8}
                      className="fill-black"
                      fontSize={12}
                    />
                    <LabelList
                      dataKey="total_profit"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
