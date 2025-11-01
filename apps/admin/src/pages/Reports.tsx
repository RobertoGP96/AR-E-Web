import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import axios from 'axios';

interface MonthlyReport {
  month: string;
  month_short: string;
  revenue: number;
  costs: number;
  agent_profits: number;
  system_profit: number;
  projected_profit: number;
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
    total_costs: number;
    total_agent_profits: number;
    total_system_profit: number;
    profit_margin: number;
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
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reportes de Ganancias</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  if (!reports) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reportes de Ganancias</h1>
      </div>

      {/* Resumen de Ganancias */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ingresos Totales
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">${reports.summary.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Últimos 12 meses</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ganancia del Sistema
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">
              ${reports.summary.total_system_profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Margen: {reports.summary.profit_margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ganancias de Agentes
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 tracking-tight">
              ${reports.summary.total_agent_profits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{reports.agent_reports.length} agentes activos</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100 hover:border-rose-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Costos Totales
            </CardTitle>
            <div className="p-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg shadow-sm">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 tracking-tight">
              ${reports.summary.total_costs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Productos comprados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Reportes Mensuales</TabsTrigger>
          <TabsTrigger value="agents">Ganancias por Agente</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Ganancias Mensuales
              </CardTitle>
              <CardDescription>
                Evolución de ingresos, costos y ganancias en los últimos 12 meses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{
                  revenue: {
                    label: 'Ingresos',
                    color: 'hsl(var(--chart-1))',
                  },
                  system_profit: {
                    label: 'Ganancia Sistema',
                    color: 'hsl(var(--chart-2))',
                  },
                  agent_profits: {
                    label: 'Ganancia Agentes',
                    color: 'hsl(var(--chart-3))',
                  },
                }}
                className="h-[400px] w-full"
              >
                <LineChart data={reports.monthly_reports} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month_short" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={3}
                    name="Ingresos"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="system_profit" 
                    stroke="var(--color-system_profit)" 
                    strokeWidth={3}
                    name="Ganancia Sistema"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="agent_profits" 
                    stroke="var(--color-agent_profits)" 
                    strokeWidth={3}
                    name="Ganancia Agentes"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Comparación Mensual de Ganancias
              </CardTitle>
              <CardDescription>
                Ganancias del sistema vs ganancias de agentes por mes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer
                config={{
                  system_profit: {
                    label: 'Ganancia Sistema',
                    color: 'hsl(var(--chart-1))',
                  },
                  agent_profits: {
                    label: 'Ganancia Agentes',
                    color: 'hsl(var(--chart-2))',
                  },
                }}
                className="h-[350px] w-full"
              >
                <BarChart data={reports.monthly_reports} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month_short" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Bar 
                    dataKey="system_profit" 
                    fill="var(--color-system_profit)" 
                    name="Ganancia Sistema" 
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="agent_profits" 
                    fill="var(--color-agent_profits)" 
                    name="Ganancia Agentes"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
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
                    <TableHead className="text-right">Costos</TableHead>
                    <TableHead className="text-right">Ganancia Agentes</TableHead>
                    <TableHead className="text-right">Ganancia Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.monthly_reports.map((report, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{report.month}</TableCell>
                      <TableCell className="text-right">${report.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">
                        ${report.costs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${report.agent_profits.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        ${report.system_profit.toLocaleString()}
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
                  {reports.agent_reports.map((agent, index) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell className="font-medium">
                        {index === 0 && <Badge className="bg-yellow-500">🥇</Badge>}
                        {index === 1 && <Badge className="bg-gray-400">🥈</Badge>}
                        {index === 2 && <Badge className="bg-orange-600">🥉</Badge>}
                        {index > 2 && <span className="ml-2">{index + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{agent.agent_name}</TableCell>
                      <TableCell>{agent.agent_phone}</TableCell>
                      <TableCell className="text-right">{agent.clients_count}</TableCell>
                      <TableCell className="text-right">{agent.orders_count}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={agent.orders_completed > 0 ? 'default' : 'secondary'}>
                          {agent.orders_completed}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${agent.current_month_profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${agent.total_profit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.agent_reports.length === 0 && (
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
                <Users className="h-5 w-5 text-purple-500" />
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
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[400px] w-full"
              >
                <BarChart 
                  data={reports.agent_reports}
                  margin={{ top: 10, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="agent_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="total_profit" 
                    fill="var(--color-total_profit)" 
                    name="Ganancia Total"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
