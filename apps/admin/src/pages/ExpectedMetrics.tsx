import { useState, useEffect } from 'react';
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
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { expectedMetricsService, calculateInvoiceRangeData } from '@/services';
import ComparisonCards from '@/components/utils/ComparisonCards';
import ValueWithUnit from '@/components/utils/ValueWithUnit';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import EmptyCalculation from '@/components/utils/EmptyCalculation';
import type {
  ExpectedMetrics,
  CreateExpectedMetricsData,
  UpdateExpectedMetricsData
} from '@/types';

type FormDataState = {
  start_date: string | undefined;
  end_date: string | undefined;
  registered_weight: string;
  registered_cost: string;
  registered_revenue: string;
  registered_profit: string;
  invoice_weight: string;
  invoice_cost: string;
  others_costs: string;
  notes: string;
};

type RangeData = {
  start_date: string;
  end_date: string;
  total_weight: number;
  total_cost: number;
  total_profit: number;
  total_revenue: number;
  orders_count: number;
  deliveries_count: number;
  products_bought_count: number;
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
    start_date: undefined,
    end_date: undefined,
    registered_weight: '',
    registered_cost: '',
    registered_revenue: '',
    registered_profit: '',
    invoice_weight: '',
    invoice_cost: '',
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

  // Query para calcular datos del rango de fechas (solo se ejecuta manualmente con refetch)
  const {
    data: rangeDataResponse,
    isFetching: isFetchingRangeData,
    refetch: refetchRangeData,
  } = useQuery<RangeData | null>({
    queryKey: ['expected-metrics-range-data', formData.start_date, formData.end_date],
    queryFn: () => {
      if (formData.start_date && formData.end_date) {
        return expectedMetricsService.calculateRangeData(formData.start_date, formData.end_date);
      }
      return null;
    },
    enabled: false, // deshabilitada por defecto; se ejecuta manualmente al presionar el botón
  });

  // Query para obtener datos de invoices para el mismo rango (comparación) - manual
  const {
    data: invoiceRangeDataResponse,
    isFetching: isFetchingInvoiceRange,
    refetch: refetchInvoiceRangeData,
  } = useQuery<import('@/types/models/invoice').InvoiceRangeData | null>({
    queryKey: ['invoices-range-data', formData.start_date, formData.end_date],
    queryFn: () => {
      if (formData.start_date && formData.end_date) {
        return calculateInvoiceRangeData(formData.start_date, formData.end_date);
      }
      return null;
    },
    enabled: false, // deshabilitada por defecto; se ejecuta manualmente al presionar el botón
  });

  // Keep previous results to avoid UI flashing while fetching
  const [prevRangeData, setPrevRangeData] = useState<RangeData | null>(null);
  const [prevInvoiceData, setPrevInvoiceData] = useState<import('@/types/models/invoice').InvoiceRangeData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Efecto para actualizar el formulario con los datos calculados
  useEffect(() => {
    // `apiClient.get` devuelve directamente el objeto (no envuelto en { data })
    if (rangeDataResponse && !editingMetric) {
      const data = rangeDataResponse;
      setFormData(prev => ({
        ...prev,
        registered_weight: (data.total_weight ?? 0).toString(),
        registered_cost: (data.total_cost ?? 0).toString(),
        registered_revenue: (data.total_revenue ?? 0).toString(),
        registered_profit: (data.total_profit ?? 0).toString(),
      }));
    }
  }, [rangeDataResponse, editingMetric]);

  // llenado de datos de invoices (costos/pesos reales) cuando llegan
  useEffect(() => {
    if (invoiceRangeDataResponse && !editingMetric) {
      const data = invoiceRangeDataResponse;
      setFormData(prev => ({
        ...prev,
        invoice_weight: (data.total_tag_weight ?? 0).toString(),
        invoice_cost: (data.total_tag_costs ?? 0).toString(),
      }));
    }
  }, [invoiceRangeDataResponse, editingMetric]);

  // Efecto ligero para mantener re-render cuando lleguen datos de invoices
  useEffect(() => {
    // no-op: trigger render cuando cambian los datos de invoices
  }, [invoiceRangeDataResponse, editingMetric]);

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
      start_date: undefined,
      end_date: undefined,
      registered_weight: '',
      registered_cost: '',
      registered_revenue: '',
      registered_profit: '',
      invoice_cost: '',
      invoice_weight: '',
      others_costs: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form fields (basic validations)
    if (!validateFormData()) return;

    const data: CreateExpectedMetricsData = {
      ...formData,
      registered_weight: formData.registered_weight ? parseFloat(formData.registered_weight) : undefined,
      registered_cost: formData.registered_cost ? parseFloat(formData.registered_cost) : undefined,
      registered_revenue: formData.registered_revenue ? parseFloat(formData.registered_revenue) : undefined,
      registered_profit: formData.registered_profit ? parseFloat(formData.registered_profit) : undefined,
      invoice_cost: formData.invoice_cost ? parseFloat(formData.invoice_cost) : undefined,
      invoice_weight: formData.invoice_weight ? parseFloat(formData.invoice_weight) : undefined,
      others_costs: formData.others_costs ? parseFloat(formData.others_costs) : undefined,
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
      registered_weight: metric.registered_weight?.toString() ?? '',
      registered_cost: metric.registered_cost?.toString() ?? '',
      registered_revenue: metric.registered_revenue?.toString() ?? '',
      registered_profit: metric.registered_profit?.toString() ?? '',
      invoice_cost: metric.invoice_cost?.toString() ?? '',
      invoice_weight: metric.invoice_weight?.toString() ?? '',
      others_costs: metric.others_costs != null ? String(metric.others_costs) : '',
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

  // Small validation helper
  const validateFormData = () => {
    const revenue = parseFloat(formData.registered_revenue) || 0;
    const profit = parseFloat(formData.registered_profit) || 0;

    if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    if (revenue < profit) {
      toast.error('Los ingresos esperados deben ser mayores o iguales a la ganancia esperada');
      return false;
    }
    return true;
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
          <h1 className="text-3xl font-bold tracking-tight">Finanazas</h1>
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
                        start_date: date ? formatDateYYYYMMDD(date) : undefined,
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
                        end_date: date ? formatDateYYYYMMDD(date) : undefined,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!formData.start_date || !formData.end_date) return;
                      setIsCalculating(true);
                      try {
                        const [rangeRes, invoiceRes] = await Promise.all([refetchRangeData(), refetchInvoiceRangeData()]);
                        // store previous results to avoid UI flashing
                        if (rangeRes?.data) {
                          setPrevRangeData(rangeRes.data);
                          // populate form fields with calculated registered values when not editing
                          if (!editingMetric) {
                            const data = rangeRes.data;
                            setFormData(prev => ({
                              ...prev,
                              registered_weight: (data.total_weight ?? 0).toString(),
                              registered_cost: (data.total_cost ?? 0).toString(),
                              registered_revenue: (data.total_revenue ?? 0).toString(),
                              registered_profit: (data.total_profit ?? 0).toString(),
                            }));
                          }
                        }
                        if (invoiceRes?.data) {
                          setPrevInvoiceData(invoiceRes.data);
                          if (!editingMetric) {
                            const data = invoiceRes.data as import('@/types/models/invoice').InvoiceRangeData;
                            setFormData(prev => ({
                              ...prev,
                              invoice_weight: (data.total_tag_weight ?? 0).toString(),
                              invoice_cost: (data.total_tag_costs ?? 0).toString(),
                            }));
                          }
                        }
                      } catch (error) {
                        console.error(error);
                      } finally {
                        setIsCalculating(false);
                      }
                    }}
                    disabled={!formData.start_date || !formData.end_date || isFetchingRangeData || isFetchingInvoiceRange}
                    className="w-full"
                  >
                    {(isFetchingRangeData || isFetchingInvoiceRange || isCalculating) ? (
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



              {/* Comparación visual mejorada */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Comparación resumida</h4>
                {(!formData.start_date || !formData.end_date) ? (
                  <EmptyCalculation />
                ) : (isFetchingInvoiceRange || isFetchingRangeData || isCalculating) ? (
                  <LoadingSpinner text='Calculando ...' />
                ) : (
                  <ComparisonCards
                    expected={(rangeDataResponse ?? prevRangeData) ?? undefined}
                    invoices={(invoiceRangeDataResponse ?? prevInvoiceData) ?? undefined}
                    loading={isFetchingInvoiceRange || isFetchingRangeData || isCalculating}
                  />
                )}
              </div>


              <Separator />


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
              <CardTitle className="text-sm font-medium">Ganancia Esperada Total</CardTitle>
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
              <CardTitle className="text-sm font-medium">Costo Real Total</CardTitle>
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
            <div className="rounded-md border overflow-hidden">
              <Table className=''>
                <TableHeader className='bg-gray-100'>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Dif. Peso</TableHead>
                    <TableHead className="text-right">Dif. Costo</TableHead>
                    <TableHead className="text-right">Ganacia Registrada</TableHead>
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
