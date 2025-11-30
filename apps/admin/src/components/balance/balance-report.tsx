import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchProfitReports } from '@/services/reports/reports';
import type { ProfitReportsData, MonthlyReport } from '@/services/reports/reports';
import { getExpenseReportsAnalysis } from '@/services/expenses/expenses';
import { getDeliveryReportsAnalysis } from '@/services/delivery/get-deliveries';
import type { DeliveryAnalysisResponse } from '@/types/models/delivery';
import type { ExpenseAnalysisResponse } from '@/types/models/expenses';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { useDeliveryMetrics } from '@/hooks/useDashboardMetrics';
import { DatePicker } from '@/components/utils/DatePicker';
// Using native radio inputs here for mutually-exclusive mode selection (preset vs custom)
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, FileText, Truck, Users, Tag } from 'lucide-react';

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

  const { data: reports, isLoading, error, refetch: refetchReports } = useQuery<ProfitReportsData, Error>({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });

  // Expenses analysis query: declared after computing startIso/endIso below

  // Query para datos agregados de facturas en el rango seleccionado
  const startIso = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : undefined;
  const endIso = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` : undefined;

  const { data: invoicesRangeData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery<InvoiceRangeData | null, Error>({
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
    refetch: refetchExpensesAnalysis,
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
  const { deliveryMetrics, isLoading: isLoadingDeliveryMetrics, error: deliveryError } = useDeliveryMetrics();

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

  // KPI comparisons: last vs previous month
  const kpiComparison = React.useMemo(() => {
    if (!filteredMonthly || filteredMonthly.length < 2) return null;
    const last = filteredMonthly[filteredMonthly.length - 1];
    const prev = filteredMonthly[filteredMonthly.length - 2];
    const revenueChange = prev && prev.revenue ? ((last.revenue || 0) - (prev.revenue || 0)) / (prev.revenue || 1) * 100 : 0;
    const profitChange = prev && prev.system_profit ? ((last.system_profit || 0) - (prev.system_profit || 0)) / (prev.system_profit || 1) * 100 : 0;
    return {
      revenueChange,
      profitChange,
      lastMonth: last.month_short,
      prevMonth: prev.month_short,
    };
  }, [filteredMonthly]);

  React.useEffect(() => {
    if (!summary) return;
    const { total_system_profit, total_revenue } = summary;
    const margin = total_revenue > 0 ? (total_system_profit / total_revenue * 100) : 0;
    summary.profit_margin = margin;
  }, [summary]);

  if (isLoading || isLoadingInvoices || isLoadingExpensesAnalysis || isLoadingDeliveryMetrics || isLoadingDeliveryAnalysis) return <LoadingSpinner text="Cargando Reportes..." />;
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
        {/* Summary cards */}
        <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 col-span-3">
          {/* Resumen card: KPI + preset selector */}

          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className='h-4 w-4' />Ingresos</CardTitle>
              <CardDescription>Ingresos del rango seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-bold">{formatUSD(summary?.total_revenue || 0)}</div>
            </CardContent>
          </Card>


          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><FileText className='h-4 w-4' />Facturas</CardTitle>
              <CardDescription>Total y detalles de facturas</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-bold">{invoicesRangeData ? formatUSD(invoicesRangeData.total_invoices_amount) : '-'}</div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Users className='h-4 w-4' />Ganancias Agentes</CardTitle>
              <CardDescription>Sumatoria de ganancias a agentes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-bold">{formatUSD(summary?.total_agent_profits || 0)}</div>
            </CardContent>
          </Card>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Tag className='h-4 w-4' />Gastos Productos</CardTitle>
              <CardDescription>Costos de los productos</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-bold">{formatUSD(summary?.total_product_expenses || 0)}</div>
            </CardContent>
          </Card>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Truck className='h-4 w-4' />Gastos Entrega</CardTitle>
              <CardDescription>Costos relacionados a la entrega</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 h-full flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-bold">{formatUSD(summary?.total_delivery_expenses || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart: full width under header and summary */}
        <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300 lg:col-span-3 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Comparativa</CardTitle>
              <CardDescription>Ingresos, costos y ganancias por mes</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 h-full">
            <ChartContainer
              config={{
                revenue: { label: 'Ingresos', color: 'hsl(33 100% 50%)' },
                system_profit: { label: 'Ganancia Sistema', color: 'hsl(25 95% 53%)' },
                agent_profits: { label: 'Ganancia Agentes', color: 'hsl(39 100% 57%)' },
                product_expenses: { label: 'Gastos Productos', color: 'hsl(16 90% 48%)' },
                delivery_expenses: { label: 'Gastos Entrega', color: 'hsl(27 87% 67%)' },
              }}
              className="aspect-auto h-[420px] w-full"
            >
              <AreaChart data={filteredMonthly} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(33 100% 50%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(33 100% 50%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillSystemProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month_short" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatUSD(value)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(v) => `Mes: ${v}`} indicator="dot" />} />
                <Area dataKey="revenue" type="monotone" fill="url(#fillRevenue)" stroke="hsl(33 100% 50%)" strokeWidth={2} name="Ingresos" />
                <Area dataKey="system_profit" type="monotone" fill="url(#fillSystemProfit)" stroke="hsl(25 95% 53%)" strokeWidth={2} name="Ganancia Sistema" />
                <Area dataKey="agent_profits" type="monotone" stroke="hsl(39 100% 57%)" strokeWidth={2} name="Ganancia Agentes" />
                <Area dataKey="product_expenses" type="monotone" stroke="hsl(16 90% 48%)" strokeWidth={2} name="Gastos Productos" />
                <Area dataKey="delivery_expenses" type="monotone" stroke="hsl(27 87% 67%)" strokeWidth={2} name="Gastos Entrega" />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bottom section: Invoices summary + Monthly detail side-by-side */}
        <div className="grid grid-cols-1 gap-4 ">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Entregas - Resumen</CardTitle>
              <CardDescription>Totales y estado de entregas</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              {deliveryAnalysisError ? (
                <div className="text-red-600">Error cargando entregas (análisis): {deliveryAnalysisError.message}</div>
              ) : deliveryError ? (
                <div className="text-red-600">Error cargando entregas: {deliveryError.message}</div>
              ) : !deliveryMetrics && !deliveryAnalysis ? (
                <div className="text-muted-foreground">No hay datos de entregas para el rango seleccionado</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Entregas</div>
                      <div className="text-base sm:text-lg font-bold">{deliveryMetrics.total || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Hoy</div>
                      <div className="text-base sm:text-lg font-bold">{deliveryMetrics.today || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Esta Semana</div>
                      <div className="text-base sm:text-lg font-bold">{deliveryMetrics.this_week || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Peso Total</div>
                        <div className="text-base sm:text-lg font-bold">{deliveryAnalysis?.total_weight ?? deliveryMetrics.total_weight ? `${deliveryAnalysis?.total_weight ?? deliveryMetrics.total_weight} lb` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Este Mes</div>
                      <div className="text-base sm:text-lg font-bold">{deliveryMetrics.this_month || 0}</div>
                    </div>
                  </div>

                      <TableHeader>
                        <TableRow>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(deliveryAnalysis?.deliveries_by_status ? Object.entries(deliveryAnalysis.deliveries_by_status) : Object.entries(deliveryMetrics || {})).map(([status, value]) => (
                          <TableRow key={status}>
                            <TableCell className="font-medium">{status}</TableCell>
                            <TableCell className="text-right text-sm sm:text-base font-semibold">{value || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Tendencia Mensual</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Peso (lb)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(deliveryAnalysis?.monthly_trend || []).map((m) => (
                          <TableRow key={m.month || Math.random()}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(m.total || 0)}</TableCell>
                            <TableCell className="text-right text-sm sm:text-base font-semibold">{m.total_weight?.toLocaleString ? m.total_weight.toLocaleString() : (m.total_weight || 0)} lb</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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




          <Card className="h-full">
            <CardHeader>
              <CardTitle>Detalle por Mes</CardTitle>
              <CardDescription>Desglose de ingresos y gastos por mes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 overflow-x-auto h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Ingresos</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Compras Pagadas</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Gastos Operativos</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Gastos Entrega</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Total Gastos</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Ganancia Agentes</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Ganancia Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonthly.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.month_short}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(r.revenue || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(r.paid_purchase_expenses || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(r.purchase_operational_expenses || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(r.delivery_expenses || r.delivery_costs || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-bold">{formatUSD(r.total_expenses || r.costs || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold">{formatUSD(r.agent_profits || 0)}</TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-bold">{formatUSD(r.system_profit || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
