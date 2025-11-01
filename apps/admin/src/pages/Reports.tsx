import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reports.summary.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia del Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${reports.summary.total_system_profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {reports.summary.profit_margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias de Agentes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${reports.summary.total_agent_profits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{reports.agent_reports.length} agentes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${reports.summary.total_costs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Productos comprados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Reportes Mensuales</TabsTrigger>
          <TabsTrigger value="agents">Ganancias por Agente</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ganancias Mensuales</CardTitle>
              <CardDescription>
                Evolución de ingresos, costos y ganancias en los últimos 12 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reports.monthly_reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_short" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--color-revenue)" 
                      strokeWidth={2}
                      name="Ingresos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="system_profit" 
                      stroke="var(--color-system_profit)" 
                      strokeWidth={2}
                      name="Ganancia Sistema"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agent_profits" 
                      stroke="var(--color-agent_profits)" 
                      strokeWidth={2}
                      name="Ganancia Agentes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparación Mensual de Ganancias</CardTitle>
              <CardDescription>
                Ganancias del sistema vs ganancias de agentes por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports.monthly_reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_short" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="system_profit" fill="var(--color-system_profit)" name="Ganancia Sistema" />
                    <Bar dataKey="agent_profits" fill="var(--color-agent_profits)" name="Ganancia Agentes" />
                  </BarChart>
                </ResponsiveContainer>
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
            <CardContent>
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
            <CardContent>
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

          <Card>
            <CardHeader>
              <CardTitle>Ganancias por Agente</CardTitle>
              <CardDescription>
                Comparación visual de ganancias totales entre agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  total_profit: {
                    label: 'Ganancia Total',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports.agent_reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total_profit" fill="var(--color-total_profit)" name="Ganancia Total" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
