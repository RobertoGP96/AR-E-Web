import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ProfitReport {
  month: string;
  revenue: number;
  projectedProfit: number;
}

// Datos mock para demostración
const mockProfitReports: ProfitReport[] = [
  { month: 'Enero', revenue: 15000, projectedProfit: 3750 },
  { month: 'Febrero', revenue: 18000, projectedProfit: 4500 },
  { month: 'Marzo', revenue: 22000, projectedProfit: 5500 },
  { month: 'Abril', revenue: 25000, projectedProfit: 6250 },
  { month: 'Mayo', revenue: 28000, projectedProfit: 7000 },
  { month: 'Junio', revenue: 32000, projectedProfit: 8000 },
];

const fetchProfitReports = async (): Promise<ProfitReport[]> => {
  // Usando datos mock por ahora. Reemplazar con llamada real a la API cuando esté disponible.
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProfitReports), 500); // Simular delay de red
  });
};

export default function Reports() {
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });

  if (isLoading) return <div>Cargando reportes...</div>;
  if (error) return <div>Error al cargar reportes: {error.message}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes de Ganancias Posibles</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ganancias Proyectadas por Mes</CardTitle>
          <CardDescription>
            Visualización de las ganancias posibles basadas en datos históricos y proyecciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: 'Ingresos',
                color: 'hsl(var(--chart-1))',
              },
              projectedProfit: {
                label: 'Ganancia Proyectada',
                color: 'hsl(var(--chart-2))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
                <Bar dataKey="projectedProfit" fill="var(--color-projectedProfit)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Reportes Detallados</CardTitle>
          <CardDescription>
            Datos tabulares de ingresos y ganancias proyectadas por mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Ganancia Proyectada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.map((report, index) => (
                <TableRow key={index}>
                  <TableCell>{report.month}</TableCell>
                  <TableCell>${report.revenue.toLocaleString()}</TableCell>
                  <TableCell>${report.projectedProfit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
