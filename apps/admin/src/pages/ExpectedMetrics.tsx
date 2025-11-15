import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Calculator,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/utils/DatePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { expectedMetricsService } from '@/services';
import type {
  ExpectedMetrics,
  CreateExpectedMetricsData,
  UpdateExpectedMetricsData
} from '@/types';

type FormDataState = {
  start_date: string;
  end_date: string;
  range_delivery_weight: string;
  range_delivery_cost: string;
  range_revenue: string;
  range_profit: string;
  delivery_real_weight: string;
  delivery_real_cost: string;
  others_costs: string;
  notes: string;
};

const formatDateYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const ExpectedMetricsPage = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ExpectedMetrics | null>(null);
  const [formData, setFormData] = useState<FormDataState>({
    start_date: '',
    end_date: '',
    range_delivery_weight: '',
    range_delivery_cost: '',
    range_revenue: '',
    range_profit: '',
    delivery_real_weight: '',
    delivery_real_cost: '',
    others_costs: '',
    notes: '',
  });

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

  // Query para calcular datos del rango de fechas
  const { data: rangeDataResponse, isLoading: isLoadingRangeData } = useQuery({
    queryKey: ['expected-metrics-range-data', formData.start_date, formData.end_date],
    queryFn: () => {
      if (formData.start_date && formData.end_date) {
        return expectedMetricsService.calculateRangeData(formData.start_date, formData.end_date);
      }
      return null;
    },
    enabled: !!(formData.start_date && formData.end_date && !editingMetric), // Solo cuando hay fechas y no estamos editando
  });

  // Efecto para actualizar el formulario con los datos calculados
  useEffect(() => {
    if (rangeDataResponse?.data && !editingMetric) {
      const data = rangeDataResponse.data;
      setFormData(prev => ({
        ...prev,
        range_delivery_weight: data.total_weight.toString(),
        range_delivery_cost: data.total_cost.toString(),
        range_revenue: data.total_revenue.toString(),
        range_profit: data.total_profit.toString(),
        delivery_real_weight: data.total_weight.toString(),
        delivery_real_cost: data.total_cost.toString(),
      }));
    }
  }, [rangeDataResponse, editingMetric]);

  // Mutation para crear métrica
  const createMutation = useMutation({
    mutationFn: (data: CreateExpectedMetricsData) => expectedMetricsService.createMetric(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['expected-metrics-summary'] });
      toast.success('Métrica creada correctamente');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudo crear la métrica';
      toast.error(message);
    },
  });

  // Mutation para actualizar métrica
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateExpectedMetricsData }) =>
      expectedMetricsService.updateMetric(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['expected-metrics-summary'] });
      toast.success('Métrica actualizada correctamente');
      setEditingMetric(null);
      resetForm();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar la métrica';
      toast.error(message);
    },
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

  const resetForm = () => {
    setFormData({
      start_date: '',
      end_date: '',
      range_delivery_weight: '',
      range_delivery_cost: '',
      range_revenue: '',
      range_profit: '',
      delivery_real_cost: '',
      delivery_real_weight: '',
      others_costs: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateExpectedMetricsData = {
      ...formData,
      range_delivery_weight: parseFloat(formData.range_delivery_weight) || 0,
      range_delivery_cost: parseFloat(formData.range_delivery_cost) || 0,
      range_revenue: parseFloat(formData.range_revenue) || 0,
      range_profit: parseFloat(formData.range_profit) || 0,
      delivery_real_cost: parseFloat(formData.delivery_real_cost) || 0,
      others_costs: parseFloat(formData.others_costs) || 0,
    };

    if (editingMetric) {
      updateMutation.mutate({ id: editingMetric.id as number, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (metric: ExpectedMetrics) => {
    setEditingMetric(metric);
    setFormData({
      start_date: metric.start_date,
      end_date: metric.end_date,
      range_delivery_weight: metric.range_delivery_weight.toString(),
      range_delivery_cost: metric.range_delivery_cost.toString(),
      range_revenue: metric.range_revenue.toString(),
      range_profit: metric.range_profit.toString(),
      delivery_real_cost: metric.delivery_real_cost.toString(),
      delivery_real_weight: metric.delivery_real_weight.toString(),
      others_costs: metric.others_costs.toString(),
      notes: metric.notes || '',
    });
    setIsCreateDialogOpen(true);
  };

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

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // Cálculos automáticos basados en los valores del formulario
  const realWeight = parseFloat(formData.delivery_real_weight) || 0;
  const expectedWeight = parseFloat(formData.range_delivery_weight) || 0;
  const expectedRevenue = parseFloat(formData.range_revenue) || 0;
  const realCost = parseFloat(formData.delivery_real_cost) || 0;
  const expectedCost = parseFloat(formData.range_delivery_cost) || 0;
  const others = parseFloat(formData.others_costs) || 0;
  const expectedProfit = parseFloat(formData.range_profit) || 0;

  const costDifference = realCost - expectedCost;
  const weightDifference = realWeight - expectedWeight;
  const projectedRevenue = expectedWeight > 0 ? expectedRevenue * (realWeight / expectedWeight) : expectedRevenue;
  const projectedProfit = projectedRevenue - realCost - others;
  const projectedProfitDifference = projectedProfit - expectedProfit;
  const weightVariancePercentage = expectedWeight > 0 ? (weightDifference / expectedWeight) * 100 : 0;
  const projectedProfitVariancePercentage = expectedProfit > 0 ? (projectedProfitDifference / expectedProfit) * 100 : 0;

  const calculatedValues = {
    cost_difference: costDifference,
    weight_difference: weightDifference,
    projected_profit: projectedProfit,
    projected_profit_difference: projectedProfitDifference,
    weight_variance_percentage: weightVariancePercentage,
    projected_profit_variance_percentage: projectedProfitVariancePercentage,
  };

  const metrics = metricsResponse?.results || [];
  const summary = summaryResponse?.data || null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas Esperadas</h1>
          <p className="text-muted-foreground">
            Compara costos y ganancias esperadas vs reales
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingMetric(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Métrica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMetric ? 'Editar Métrica' : 'Nueva Métrica'}
              </DialogTitle>
              <DialogDescription>
                Ingresa los datos esperados para el periodo seleccionado
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DatePicker
                    id="start_date"
                    label="Fecha de Inicio"
                    required
                    value={formData.start_date ? new Date(formData.start_date) : undefined}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        start_date: date ? formatDateYYYYMMDD(date) : '',
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <DatePicker
                    id="end_date"
                    label="Fecha de Fin"
                    required
                    value={formData.end_date ? new Date(formData.end_date) : undefined}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        end_date: date ? formatDateYYYYMMDD(date) : '',
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Invalidar la query para forzar recálculo
                      queryClient.invalidateQueries({
                        queryKey: ['expected-metrics-range-data', formData.start_date, formData.end_date]
                      });
                    }}
                    disabled={!formData.start_date || !formData.end_date || isLoadingRangeData}
                    className="w-full"
                  >
                    {isLoadingRangeData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calcular Datos
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator />
                <div className="px-2 text-center flex flex-row nowrap text-sm min-w-32">Datos Registrados</div>
                <Separator />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="range_delivery_weight">Peso (Lb)</Label>
                  <div className="relative">
                    <Input
                      id="range_delivery_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder='0.00'
                      value={formData.range_delivery_weight}
                      onChange={(e) => setFormData({ ...formData, range_delivery_weight: e.target.value })}
                      required
                      disabled={isLoadingRangeData}
                    />
                    {isLoadingRangeData && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="range_delivery_cost">Costo($)</Label>
                  <Input
                    id="range_delivery_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder='0.00'
                    value={formData.range_delivery_cost}
                    onChange={(e) => setFormData({ ...formData, range_delivery_cost: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="range_revenue">Ingresos Generados ($)</Label>
                  <Input
                    id="range_revenue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder='0.00'
                    value={formData.range_revenue}
                    onChange={(e) => setFormData({ ...formData, range_revenue: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="range_profit">Ganancia Generada ($)</Label>
                  <Input
                    id="range_profit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder='0.00'
                    value={formData.range_profit}
                    onChange={(e) => setFormData({ ...formData, range_profit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator />
                <div className="px-2 text-center flex flex-row nowrap text-sm min-w-24">
                    Datos Reales
                </div>
                <Separator />
              </div>
              <div className="grid grid-cols gap-4">

                <div className='grid grid-cols-2 gap-4'>
                  <div className="space-y-2">
                    <Label htmlFor="range_delivery_weight">Peso Real (Lb)</Label>
                    <Input
                      id="range_delivery_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder='0.00'
                      value={formData.delivery_real_weight}
                      onChange={(e) => setFormData({ ...formData, delivery_real_weight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_real_cost">Costo Real de Entrega ($)</Label>
                    <Input
                      id="delivery_real_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder='0.00'
                      value={formData.delivery_real_cost}
                      onChange={(e) => setFormData({ ...formData, delivery_real_cost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="others_costs">Otros Costos ($)</Label>
                    <Input
                      id="others_costs"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder='0.00'
                      value={formData.others_costs}
                      onChange={(e) => setFormData({ ...formData, others_costs: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sección de cálculos automáticos */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Vista Previa de Cálculos</h4>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Diferencia de Costo</Label>
                    <div className={`text-sm font-medium ${calculatedValues.cost_difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(calculatedValues.cost_difference)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Diferencia de Peso</Label>
                    <div className={`text-sm font-medium ${calculatedValues.weight_difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(calculatedValues.weight_difference).toFixed(2)} Lb
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ganancia Proyectada</Label>
                    <div className={`text-sm font-medium ${calculatedValues.projected_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculatedValues.projected_profit)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dif. Ganancia Proyectada</Label>
                    <div className={`text-sm font-medium ${calculatedValues.projected_profit_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculatedValues.projected_profit_difference)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Varianza de Peso (%)</Label>
                    <div className={`text-sm font-medium ${calculatedValues.weight_variance_percentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercentage(calculatedValues.weight_variance_percentage)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Var. Ganancia Proy. (%)</Label>
                    <div className={`text-sm font-medium ${calculatedValues.projected_profit_variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(calculatedValues.projected_profit_variance_percentage)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega notas adicionales sobre este periodo..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingMetric(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingMetric ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso de Entrega Esperado Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.total_range_delivery_weight || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Esperada Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.total_range_profit || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Real Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((summary?.total_delivery_real_cost || 0) + (summary?.total_others_costs || 0))}
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
                {formatCurrency(summary?.total_range_profit - ((summary?.total_delivery_real_cost || 0) + (summary?.total_others_costs || 0)) || 0)}
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
          <CardTitle>Historial de Métricas</CardTitle>
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
              <h3 className="text-lg font-semibold">No hay métricas registradas</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Comienza creando tu primera métrica
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Peso Entrega Esperado</TableHead>
                    <TableHead className="text-right">Peso Real</TableHead>
                    <TableHead className="text-right">Var. Peso</TableHead>
                    <TableHead className="text-right">Ingresos Esperados</TableHead>
                    <TableHead className="text-right">Ganancia Esperada</TableHead>
                    <TableHead className="text-right">Costo Real</TableHead>
                    <TableHead className="text-right">Otros Costos</TableHead>
                    <TableHead className="text-right">Var. Costo</TableHead>
                    <TableHead className="text-right">Ganancia Proyectada</TableHead>
                    <TableHead className="text-right">Var. Ganancia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => {
                    const costVariance = parseFloat(metric.delivery_real_cost) - parseFloat(metric.range_delivery_cost);
                    const weightVariance = parseFloat(metric.delivery_real_weight) - parseFloat(metric.range_delivery_weight);
                    const weightVariancePercentage = parseFloat(metric.range_delivery_weight) > 0 ? (weightVariance / parseFloat(metric.range_delivery_weight)) * 100 : 0;
                    const projectedRevenue = parseFloat(metric.range_revenue) * (parseFloat(metric.delivery_real_weight) / parseFloat(metric.range_delivery_weight));
                    const projectedProfit = projectedRevenue - parseFloat(metric.delivery_real_cost) - parseFloat(metric.others_costs);
                    const projectedProfitVariance = parseFloat(metric.range_profit) > 0 ? ((projectedProfit - parseFloat(metric.range_profit)) / parseFloat(metric.range_profit)) * 100 : 0;

                    return (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {new Date(metric.start_date).toLocaleDateString('es-ES')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                a {new Date(metric.end_date).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(metric.range_delivery_weight)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(metric.delivery_real_weight)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={weightVariance > 0 ? 'destructive' : 'default'}
                            className="gap-1"
                          >
                            {weightVariance > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(weightVariancePercentage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(metric.range_revenue)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(metric.range_profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(metric.delivery_real_cost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(metric.others_costs)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={costVariance > 0 ? 'destructive' : 'default'}
                            className="gap-1"
                          >
                            {costVariance > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatCurrency(costVariance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(projectedProfit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={projectedProfitVariance < 0 ? 'destructive' : 'default'}
                            className="gap-1"
                          >
                            {projectedProfitVariance > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(projectedProfitVariance)}
                          </Badge>
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
                              onClick={() => handleEdit(metric)}
                            >
                              <Edit className="h-4 w-4" />
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
