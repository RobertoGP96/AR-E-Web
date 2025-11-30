import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchProfitReports } from '@/services/reports/reports';
import type { ProfitReportsData, MonthlyReport } from '@/services/reports/reports';
import { getExpenseReportsAnalysis } from '@/services/expenses/expenses';
import { getDeliveryReportsAnalysis } from '@/services/delivery/get-deliveries';
import { getOrderReportsAnalysis } from '@/services/orders/get-order-reports';
import type { OrderAnalysisResponse } from '@/types/models/order';
import type { DeliveryAnalysisResponse } from '@/types/models/delivery';
import type { ExpenseAnalysisResponse } from '@/types/models/expenses';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { DatePicker } from '@/components/utils/DatePicker';
// Using native radio inputs here for mutually-exclusive mode selection (preset vs custom)
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

import { formatUSD } from '@/lib/format-usd';
import { calculateInvoiceRangeData } from '@/services/invoices/calculate-range-data';
import type { InvoiceRangeData } from '@/types/models/invoice';

// Componente BalanceReport: reutilizable en pages y widgets
export default function BalanceReport() {
  const [startDate, setStartDate] = React.useState<Date | undefined>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5); // default 6 months ago
    d.setDate(1);
    return d;
  });
  const [endDate, setEndDate] = React.useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // last day of current month
    return d;
  });

  const [preset, setPreset] = React.useState<'1m' | '3m' | '6m' | '12m' | 'custom'>('6m');
  const [useCustomRange, setUseCustomRange] = React.useState<boolean>(false);
  const previousPresetRef = React.useRef<'1m' | '3m' | '6m' | '12m' | 'custom' | null>(null);

  // Handler to toggle between custom range and standard presets
  const handleUseCustomRangeChange = (value: boolean) => {
    const bool = !!value;
    setUseCustomRange(bool);
    if (bool) {
      // Save previous non-custom preset so we can restore when disabling custom range
      if (preset !== 'custom') previousPresetRef.current = preset;
      setPreset('custom');
    } else {
      // Restore previous preset or default to 6m
      setPreset(previousPresetRef.current && previousPresetRef.current !== 'custom' ? previousPresetRef.current : '6m');
      previousPresetRef.current = null;
    }
  };

  // Preset change handler (keeps custom/standard mode synchronized)
  const handlePresetChange = (v: '1m' | '3m' | '6m' | '12m' | 'custom') => {
    if (v === 'custom') {
      // Save current preset so it can be restored if the user disables custom range
      if (preset && preset !== 'custom') previousPresetRef.current = preset;
      setPreset('custom');
      if (!useCustomRange) setUseCustomRange(true);
      return;
    }
    // non custom preset selected: ensure custom range disabled
    if (useCustomRange) setUseCustomRange(false);
    setPreset(v);
  };

  const { data: reports, isLoading, error } = useQuery<ProfitReportsData, Error>({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });

  // Expenses analysis query: declared after computing startIso/endIso below

  // Query para datos agregados de facturas en el rango seleccionado
  const startIso = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : undefined;
  const endIso = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` : undefined;

  const { data: invoicesRangeData, isLoading: isLoadingInvoices } = useQuery<InvoiceRangeData | null, Error>({
    queryKey: ['invoices-range-data', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      return await calculateInvoiceRangeData(startIso, endIso);
    },
    enabled: !!startIso && !!endIso,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: expensesAnalysis,
    isLoading: isLoadingExpensesAnalysis,
    error: expenseError,
  } = useQuery<ExpenseAnalysisResponse | null, Error>({
    queryKey: ['expenseReportsAnalysis', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      const resp = await getExpenseReportsAnalysis({ start_date: startIso, end_date: endIso });
      // service returns { data: ExpenseAnalysisResponse }
      return resp?.data ?? null;
    },
    enabled: !!startIso && !!endIso,
    staleTime: 1000 * 60 * 5,
  });

  // Delivery metrics from dashboard

  const { data: deliveryAnalysis, isLoading: isLoadingDeliveryAnalysis, error: deliveryAnalysisError } = useQuery<DeliveryAnalysisResponse | null, Error>({
    queryKey: ['deliveryReportsAnalysis', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      const resp = await getDeliveryReportsAnalysis({ start_date: startIso, end_date: endIso });
      return resp?.data ?? null;
    },
    enabled: !!startIso && !!endIso,
    staleTime: 1000 * 60 * 5,
  });

  const { data: ordersAnalysis, isLoading: isLoadingOrders, error: ordersError } = useQuery<OrderAnalysisResponse | null, Error>({
    queryKey: ['orderReportsAnalysis', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      const resp = await getOrderReportsAnalysis({ start_date: startIso, end_date: endIso });
      return resp?.data ?? null;
    },
    enabled: !!startIso && !!endIso,
    staleTime: 1000 * 60 * 5,
  });



  // Apply preset shortcuts
  React.useEffect(() => {
    if (useCustomRange) return; // when using custom range, ignore preset auto-updates
    if (preset === 'custom') return;
    const now = new Date();
    let months = 6;
    if (preset === '3m') months = 3;
    if (preset === '12m') months = 12;
    const s = new Date();
    s.setMonth(now.getMonth() - (months - 1));
    s.setDate(1);
    const e = new Date()
    e.setMonth(now.getMonth());
    e.setDate(new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate());
    setStartDate(s);
    setEndDate(e);
  }, [preset, useCustomRange]);

  // Filter monthly reports by selected date range
  const filteredMonthly = React.useMemo(() => {
    if (!reports || !reports.monthly_reports) return [] as MonthlyReport[];
    const months: MonthlyReport[] = reports.monthly_reports || [];
    if (!startDate || !endDate) return months;

    // Convert each month like '2023-11' to Date (first day of month)
    const startKey = new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime();
    const endKey = new Date(endDate.getFullYear(), endDate.getMonth(), 1).getTime();
    return months.filter(m => {
      try {
        const parts = String(m.month).split('-');
        if (parts.length < 2) return false;
        const mo = Number(parts[1]) - 1;
        const yr = Number(parts[0]);
        const d = new Date(yr, mo, 1).getTime();
        return d >= startKey && d <= endKey;
      } catch {
        return false;
      }
    });
  }, [reports, startDate, endDate]);

  const summary = React.useMemo(() => {
    if (!reports) return null;
    const monthly = filteredMonthly;
    return {
      total_revenue: monthly.reduce((acc, r) => acc + (r.revenue || 0), 0),
      total_expenses: monthly.reduce((acc, r) => acc + (r.total_expenses || 0), 0),
      total_agent_profits: monthly.reduce((acc, r) => acc + (r.agent_profits || 0), 0),
      total_system_profit: monthly.reduce((acc, r) => acc + (r.system_profit || 0), 0),
      total_delivery_expenses: monthly.reduce((acc, r) => acc + (r.delivery_expenses || 0), 0),
      total_product_expenses: monthly.reduce((acc, r) => acc + (r.product_expenses || 0), 0),
      profit_margin: 0,
    }
  }, [reports, filteredMonthly]);


  React.useEffect(() => {
    if (!summary) return;
    const { total_system_profit, total_revenue } = summary;
    const margin = total_revenue > 0 ? (total_system_profit / total_revenue * 100) : 0;
    summary.profit_margin = margin;
  }, [summary]);

  if (isLoading || isLoadingInvoices || isLoadingExpensesAnalysis || isLoadingDeliveryAnalysis || isLoadingOrders) return <LoadingSpinner text="Cargando Reportes..." />;
  if (error) return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes de Balance</CardTitle>
        <CardDescription>Error: {error.message}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (!reports) return null;

  return (
    <div className="space-y-6">
      {/* Top header + controls: improved responsive layout */}

      <div className="grid grid-cols-1 gap-3 items-center">
        <div>
          <div>
            <h2 className="text-2xl font-bold">Reportes Financieros</h2>
            <p className="text-sm text-muted-foreground mt-1">Resumen por mes y factura — seleccione un rango</p>
          </div>
          <div className="grid grid-cols-3 items-center justify-center gap-3 py-6">
            <Card
              className={cn(
                'h-full ring cursor-pointer transition-shadow duration-200 gap-0',
                !useCustomRange
                  ? 'ring-primary shadow-md'
                  : 'ring-gray-100/50 hover:shadow-sm'
              )}
              onClick={() => handleUseCustomRangeChange(false)}
              aria-pressed={!useCustomRange}
              role="button"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="Usar rango estándar"
                    checked={!useCustomRange}
                    onCheckedChange={() => handleUseCustomRangeChange(false)}
                    className="h-4 w-4"
                  />
                  <Label className={cn('select-none', !useCustomRange && 'font-semibold text-primary')}>Estandar</Label>
                </div>
              </CardHeader>
              <CardContent className="p-3 px-4">
                <div className="flex flex-col ml-8">
                  <Label htmlFor="preset-range-select" className="mb-2 text-xs font-medium">Rango Estandar</Label>
                  <Select value={preset} onValueChange={(v) => handlePresetChange(v as '1m' | '3m' | '6m' | '12m' | 'custom')} >
                    <SelectTrigger id="preset-range-select" className="min-w-[140px] rounded-lg" disabled={useCustomRange}>
                      <SelectValue placeholder="Rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">Último mes</SelectItem>
                      <SelectItem value="3m">Últimos 3 meses</SelectItem>
                      <SelectItem value="6m">Últimos 6 meses</SelectItem>
                      <SelectItem value="12m">Últimos 12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'col-span-2 ring h-full cursor-pointer transition-shadow duration-200 gap-0',
                useCustomRange
                  ? 'ring-primary shadow-md'
                  : 'ring-gray-100/50 hover:shadow-sm'
              )}
              onClick={() => handleUseCustomRangeChange(true)}
              aria-pressed={useCustomRange}
              role="button"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="Usar rango personalizado"
                    checked={useCustomRange}
                    onCheckedChange={() => handleUseCustomRangeChange(true)}
                    className="h-4 w-4"
                  />
                  <Label className={cn('select-none', useCustomRange && 'font-semibold text-primary')}>Personalizado</Label>
                </div>

              </CardHeader>
              <CardContent className="p-3 sm:p-4 h-full">
                <div className='flex flex-row justify-between px-10 items-center gap-4'>
                  <div className="w-[250px]">
                    <DatePicker label="Desde" selected={startDate} onDateChange={setStartDate} disabled={!useCustomRange} />
                  </div>
                  <div className="w-[250px]">
                    <DatePicker label="Hasta" selected={endDate} onDateChange={setEndDate} disabled={!useCustomRange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 ">

          {/* Pedidos */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pedidos - Resumen</CardTitle>
              <CardDescription>Totales y estado de las órdenes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              {ordersError ? (
                <div className="text-red-600">Error cargando pedidos (análisis): {ordersError.message}</div>
              ) : !ordersAnalysis ? (
                <div className="text-muted-foreground">No hay datos de pedidos para el rango seleccionado</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Pedidos</div>
                      <div className="text-base sm:text-lg font-bold">{ordersAnalysis?.count || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ingresos</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(ordersAnalysis?.total_revenue || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Costo Total</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(ordersAnalysis?.total_cost || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gasto Promedio</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(ordersAnalysis?.average_revenue || 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Balance Total</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD((ordersAnalysis?.total_revenue || 0) - (ordersAnalysis?.total_cost || 0))}</div>
                    </div>
                  </div>
                </div>
                
                
              )}

              {deliveryAnalysis?.deliveries_by_category && Object.keys(deliveryAnalysis.deliveries_by_category).length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">Entregas por Categoría</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Peso</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">Gastos</TableHead>
                          <TableHead className="text-right">Ganancia Gerente</TableHead>
                          <TableHead className="text-right">Ganancia Sistema</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(deliveryAnalysis.deliveries_by_category).map(([category, values]) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">{category}</TableCell>
                            <TableCell className="text-right">{values.count || 0}</TableCell>
                            <TableCell className="text-right">{values.total_weight?.toLocaleString?.() ?? values.total_weight ?? '-'}</TableCell>
                            <TableCell className="text-right">{formatUSD(values.total_delivery_revenue || 0)}</TableCell>
                            <TableCell className="text-right">{formatUSD(values.total_delivery_expenses || 0)}</TableCell>
                            <TableCell className="text-right">{formatUSD(values.total_manager_profit || 0)}</TableCell>
                            <TableCell className="text-right">{formatUSD(values.total_system_profit || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}


            </CardContent>
          </Card>
          {/* Delivery */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Entregas - Resumen</CardTitle>
              <CardDescription>Totales y estado de entregas</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              {deliveryAnalysisError ? (
                <div className="text-red-600">Error cargando entregas (análisis): {deliveryAnalysisError.message}</div>
              ) : deliveryAnalysisError ? (
                <div className="text-red-600">Error cargando entregas: {deliveryAnalysisError}</div>
              ) : !deliveryAnalysis && !deliveryAnalysis ? (
                <div className="text-muted-foreground">No hay datos de entregas para el rango seleccionado</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Entregas</div>
                      <div className="text-base sm:text-lg font-bold">{deliveryAnalysis?.count || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Peso Total</div>
                      <div className="text-base sm:text-lg font-bold">
                        {(() => {
                          const totalWeight = (deliveryAnalysis?.total_weight ?? deliveryAnalysis?.total_weight);
                          return (totalWeight !== undefined && totalWeight !== null)
                            ? `${totalWeight.toLocaleString()} lb`
                            : '-';
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ingresos</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(deliveryAnalysis?.total_delivery_revenue) || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gastos</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(deliveryAnalysis?.total_delivery_expenses) + " +" + formatUSD(deliveryAnalysis?.total_manager_profit) || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ganancia</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(deliveryAnalysis?.total_system_profit) || 0}</div>
                    </div>


                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costos */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Costos - Resumen</CardTitle>
              <CardDescription>Resumen agregado de tags y costos de facturas</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              {invoicesRangeData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Facturas</div>
                    <div className="text-base sm:text-lg font-bold">{invoicesRangeData.invoices_count}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Peso total</div>
                    <div className="text-base sm:text-lg font-bold">{invoicesRangeData.total_tag_weight.toLocaleString()} lb</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Costo tags (subtotal)</div>
                    <div className="text-base sm:text-lg font-bold">{formatUSD(invoicesRangeData.total_tag_subtotal)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Costo fijos (subtotal)</div>
                    <div className="text-base sm:text-lg font-bold">{formatUSD(invoicesRangeData.total_fixed_cost)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground  font-medium">Total </div>
                    <div className="text-base sm:text-lg font-bold">{formatUSD(invoicesRangeData.total_invoices_amount)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No hay datos de facturas para el rango seleccionado</div>
              )}
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Gastos - Resumen</CardTitle>
              <CardDescription>Totales y desglose por categoría en el rango seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              {expenseError ? (
                <div className="text-red-600">Error cargando los gastos: {expenseError.message}</div>
              ) : !expensesAnalysis ? (
                <div className="text-muted-foreground">No hay datos de gastos para el rango seleccionado</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Gastos</div>
                      <div className="text-base sm:text-lg font-bold">{expensesAnalysis.count || 0}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Gasto Promedio</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(expensesAnalysis.average_expense || 0)}</div>
                    </div><div>
                      <div className="text-sm text-muted-foreground">Total Gastos</div>
                      <div className="text-base sm:text-lg font-bold">{formatUSD(expensesAnalysis.total_expenses || 0)}</div>
                    </div>

                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Gastos por Categoría</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(expensesAnalysis.expenses_by_category || {})
                          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                          .map(([category, value]) => (
                            <TableRow key={category}>
                              <TableCell className="font-medium"><Badge variant={'secondary'}>{category}</Badge></TableCell>
                              <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(value || 0)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Tendencia Mensual</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(expensesAnalysis.monthly_trend || []).map((m) => (
                          <TableRow key={m.month || Math.random()}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(m.total || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
