import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Calculator,
  TrendingUp,
  Calendar,
  DollarSign,
  Scale,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { expectedMetricsService} from '@/services';
import ValueWithUnit from '@/components/utils/ValueWithUnit';
import { Link } from 'react-router-dom';





const ExpectedMetricsPage = () => {
  const queryClient = useQueryClient();
  
  // Query para obtener todas las métricas
  const { data: metricsResponse, isLoading } = useQuery({
    queryKey: ['expected-metrics'],
    queryFn: () => expectedMetricsService.getMetrics(),
  });

  // Query para obtener el resumen
  const { data: summaryResponse } = useQuery({
    queryKey: ['expected-metrics-summary'],
    queryFn: () => expectedMetricsService.getSummary(),
  });

  

  // Mutation para eliminar métrica
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expectedMetricsService.deleteMetric(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['expected-metrics-summary'] });
      toast.success('Métrica eliminada correctamente');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la métrica';
      toast.error(message);
    },
  });

  // Mutation para calcular valores reales
  const calculateActualsMutation = useMutation({
    mutationFn: (id: number) => expectedMetricsService.calculateActuals(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['expected-metrics-summary'] });
      toast.success('Valores reales calculados correctamente');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudieron calcular los valores reales';
      toast.error(message);
    },
  });



  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta métrica?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  // the form validation is triggered on submit


  const metrics = metricsResponse?.results || [];
  // `getSummary` devuelve directamente el objeto summary (no envuelto en { data })
  const summary = summaryResponse || null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balances</h1>
          <p className="text-muted-foreground">
            Compara costos y ganancias esperadas
          </p>
        </div>



        <Button>
          <Link className='flex items-center' to="/balance/new-balance">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Balance
          </Link>
        </Button>

      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso Procesado Total</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <ValueWithUnit value={summary?.total_registered_weight || 0} unit="Lb" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Generados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.total_registered_profit || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((summary?.total_invoice_cost || 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Varianza: {formatCurrency(summary?.total_cost_variance || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Real Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.total_registered_profit - ((summary?.total_invoice_cost || 0)))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Varianza: {formatCurrency(summary?.total_profit_variance || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Balances</CardTitle>
          <CardDescription>
            Visualiza y compara las métricas esperadas vs reales por periodo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay Balances Registrados</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Comienza creando tu primer balance
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table className=''>
                <TableHeader className='bg-gray-100'>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Dif. Peso</TableHead>
                    <TableHead className="text-right">Dif. Costo</TableHead>
                    <TableHead className="text-right">Gastos generados</TableHead>
                    <TableHead className="text-right">Ganancia Real</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => {
                    return (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className='flex flex-row gap-1'>
                              <div className="font-medium text-sm">
                                {new Date(metric.start_date).toLocaleDateString('es-ES')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                a {new Date(metric.end_date).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <ValueWithUnit value={Number(metric.registered_weight) - Number(metric.invoice_weight)} unit="Lb" />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(metric.registered_cost) - Number(metric.invoice_cost))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(metric.registered_revenue)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(metric.registered_profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => calculateActualsMutation.mutate(metric.id as number)}
                              disabled={calculateActualsMutation.isPending}
                              title="Calcular valores reales"
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(metric.id as number)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpectedMetricsPage;
