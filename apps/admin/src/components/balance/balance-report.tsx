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
import { getPurchasesAnalysis } from '@/services/purchases/get-purchases';
import type { OrderAnalysisResponse } from '@/types/models/order';
import type { DeliveryAnalysisResponse } from '@/types/models/delivery';
import type { ExpenseAnalysisResponse } from '@/types/models/expenses';
import type { PurchaseAnalysisResponse } from '@/services/purchases/get-purchases';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { DatePicker } from '@/components/utils/DatePicker';
// Using native radio inputs here for mutually-exclusive mode selection (preset vs custom)
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

import { formatUSD } from '@/lib/format-usd';
import { calculateInvoiceRangeData } from '@/services/invoices/calculate-range-data';
import type { InvoiceRangeData } from '@/types/models/invoice';
import { ArrowDown, TrendingUp, ShoppingCart } from 'lucide-react';

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

  const { data: purchasesAnalysis, isLoading: isLoadingPurchases, error: purchasesError } = useQuery<PurchaseAnalysisResponse | null, Error>({
    queryKey: ['purchasesReportsAnalysis', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      const resp = await getPurchasesAnalysis({ start_date: startIso, end_date: endIso });
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

  if (isLoading || isLoadingInvoices || isLoadingExpensesAnalysis || isLoadingDeliveryAnalysis || isLoadingOrders || isLoadingPurchases) return <LoadingSpinner text="Cargando Reportes..." />;
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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-foreground">Reportes Financieros</h2>
          <p className="text-sm text-muted-foreground">Análisis detallado de ingresos, gastos y entregas en tu rango seleccionado</p>
        </div>

        {/* Date Range Controls - Improved Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card
              className={cn(
                'cursor-pointer transition-all duration-300 border-2 hover:border-primary/50',
                !useCustomRange
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-gray-200 bg-white hover:shadow-sm'
              )}
              onClick={() => handleUseCustomRangeChange(false)}
              aria-pressed={!useCustomRange}
              role="button"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    aria-label="Usar rango estándar"
                    checked={!useCustomRange}
                    onCheckedChange={() => handleUseCustomRangeChange(false)}
                    className="h-5 w-5"
                  />
                  <Label className={cn('select-none cursor-pointer text-base font-semibold', !useCustomRange && 'text-primary')}>Rango Estándar</Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="ml-8 space-y-2">
                  <Label htmlFor="preset-range-select" className="text-xs font-medium text-muted-foreground">Seleccionar período</Label>
                  <Select value={preset} onValueChange={(v) => handlePresetChange(v as '1m' | '3m' | '6m' | '12m' | 'custom')} >
                    <SelectTrigger id="preset-range-select" className="w-full rounded-md" disabled={useCustomRange}>
                      <SelectValue placeholder="Selecciona un rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">Último 1 mes</SelectItem>
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
                'lg:col-span-2 cursor-pointer transition-all duration-300 border-2 hover:border-primary/50',
                useCustomRange
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-gray-200 bg-white hover:shadow-sm'
              )}
              onClick={() => handleUseCustomRangeChange(true)}
              aria-pressed={useCustomRange}
              role="button"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    aria-label="Usar rango personalizado"
                    checked={useCustomRange}
                    onCheckedChange={() => handleUseCustomRangeChange(true)}
                    className="h-5 w-5"
                  />
                  <Label className={cn('select-none cursor-pointer text-base font-semibold', useCustomRange && 'text-primary')}>Rango Personalizado</Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-end'>
                  <div className="flex-1 w-full sm:w-auto">
                    <DatePicker label="Fecha Inicio" selected={startDate} onDateChange={setStartDate} disabled={!useCustomRange} />
                  </div>
                  <div className="hidden sm:flex text-muted-foreground">→</div>
                  <div className="flex-1 w-full sm:w-auto">
                    <DatePicker label="Fecha Fin" selected={endDate} onDateChange={setEndDate} disabled={!useCustomRange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-5">

          {/* Pedidos */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pedidos</CardTitle>
                  <CardDescription className="text-xs mt-1">Análisis de órdenes en el rango seleccionado</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {ordersError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">Error cargando pedidos: {ordersError.message}</div>
              ) : !ordersAnalysis ? (
                <div className="text-center py-8 text-muted-foreground">No hay datos de pedidos para el rango seleccionado</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard label="Pedidos" value={ordersAnalysis?.count || 0} />
                    <MetricCard label="Ingresos" value={formatUSD(ordersAnalysis?.total_revenue || 0)} />
                    <MetricCard label="Costo Total" value={formatUSD(ordersAnalysis?.total_cost || 0)} />
                    <MetricCard label="Costo Promedio" value={formatUSD(ordersAnalysis?.average_revenue || 0)} />
                    <MetricCard 
                      label="Balance" 
                      value={formatUSD((ordersAnalysis?.total_revenue || 0) - (ordersAnalysis?.total_cost || 0))} 
                      highlight 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Delivery */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Entregas</CardTitle>
                  <CardDescription className="text-xs mt-1">Estado y rentabilidad de entregas</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {deliveryAnalysisError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">Error cargando entregas: {deliveryAnalysisError.message}</div>
              ) : !deliveryAnalysis ? (
                <div className="text-center py-8 text-muted-foreground">No hay datos de entregas para el rango seleccionado</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard label="Entregas" value={deliveryAnalysis?.count || 0} />
                    <MetricCard 
                      label="Peso Total" 
                      value={`${((deliveryAnalysis?.total_weight ?? 0) || 0).toLocaleString()} lb`} 
                    />
                    <MetricCard label="Ingresos" value={formatUSD(deliveryAnalysis?.total_delivery_revenue || 0)} />
                    <MetricCard label="Gastos" value={formatUSD((deliveryAnalysis?.total_delivery_expenses || 0) + (deliveryAnalysis?.total_manager_profit || 0))} />
                    <MetricCard label="Ganancia" value={formatUSD(deliveryAnalysis?.total_system_profit || 0)} highlight />
                  </div>


                  {deliveryAnalysis?.deliveries_by_category && Object.keys(deliveryAnalysis.deliveries_by_category).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Desglose por Categoría</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Categoría</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Peso</TableHead>
                              <TableHead className="text-right">Ingresos</TableHead>
                              <TableHead className="text-right">Gastos</TableHead>
                              <TableHead className="text-right">Ganancia</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(deliveryAnalysis.deliveries_by_category).map(([category, values]) => (
                              <TableRow key={category} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium"><Badge variant="outline">{category}</Badge></TableCell>
                                <TableCell className="text-right">{values.count || 0}</TableCell>
                                <TableCell className="text-right text-sm">{values.total_weight.toFixed(2)} lb</TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">{formatUSD(values.total_delivery_revenue || 0)}</TableCell>
                                <TableCell className="text-right text-red-600 font-semibold">{formatUSD(values.total_delivery_expenses || 0)}</TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">{formatUSD(values.total_system_profit || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compras */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Compras</CardTitle>
                  <CardDescription className="text-xs mt-1">Análisis de compras realizadas y reembolsos</CardDescription>
                </div>
                <ShoppingCart className="h-5 w-5 text-purple-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {purchasesError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">Error cargando compras: {purchasesError.message}</div>
              ) : !purchasesAnalysis ? (
                <div className="text-center py-8 text-muted-foreground">No hay datos de compras para el rango seleccionado</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard label="Compras" value={purchasesAnalysis?.count || 0} />
                    <MetricCard label="Monto Total" value={formatUSD(purchasesAnalysis?.total_purchase_amount || 0)} />
                    <MetricCard label="Reembolsos" value={formatUSD(purchasesAnalysis?.total_refunded || 0)} />
                    <MetricCard label="Gastos Op." value={formatUSD(purchasesAnalysis?.total_operational_expenses || 0)} />
                    <MetricCard 
                      label="Costo Neto" 
                      value={formatUSD(purchasesAnalysis?.total_real_cost_paid || 0)} 
                      highlight 
                    />
                  </div>

                  {/* Desglose por Tienda */}
                  {purchasesAnalysis?.purchases_by_shop && Object.keys(purchasesAnalysis.purchases_by_shop).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Desglose por Tienda</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Tienda</TableHead>
                              <TableHead className="text-right">Compras</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead className="text-right">Reembolsos</TableHead>
                              <TableHead className="text-right">Costo Neto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(purchasesAnalysis.purchases_by_shop).map(([shop, stats]) => (
                              <TableRow key={shop} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium"><Badge variant="outline">{shop}</Badge></TableCell>
                                <TableCell className="text-right">{stats.count || 0}</TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">{formatUSD(stats.total_purchase_amount || 0)}</TableCell>
                                <TableCell className="text-right text-orange-600 font-semibold">{formatUSD(stats.total_refunded || 0)}</TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">{formatUSD(stats.total_real_cost_paid || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Desglose por Cuenta de Compra */}
                  {purchasesAnalysis?.purchases_by_account && Object.keys(purchasesAnalysis.purchases_by_account).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Desglose por Cuenta de Compra</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Cuenta</TableHead>
                              <TableHead className="text-right">Compras</TableHead>
                              <TableHead className="text-right">Monto Total</TableHead>
                              <TableHead className="text-right">Reembolsos</TableHead>
                              <TableHead className="text-right">Costo Neto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(purchasesAnalysis.purchases_by_account).map(([account, stats]) => (
                              <TableRow key={account} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium"><Badge variant="secondary">{account}</Badge></TableCell>
                                <TableCell className="text-right">{stats.count || 0}</TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">{formatUSD(stats.total_purchase_amount || 0)}</TableCell>
                                <TableCell className="text-right text-orange-600 font-semibold">{formatUSD(stats.total_refunded || 0)}</TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">{formatUSD(stats.total_real_cost_paid || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Estado de Pago */}
                  {purchasesAnalysis?.purchases_by_status && Object.keys(purchasesAnalysis.purchases_by_status).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Estado de Pago</h4>
                      <div className="space-y-2">
                        {Object.entries(purchasesAnalysis.purchases_by_status).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{status}</Badge>
                            </div>
                            <span className="font-semibold text-sm">{count} compra{count !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tendencia Mensual */}
                  {purchasesAnalysis?.monthly_trend && purchasesAnalysis.monthly_trend.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Tendencia Mensual</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Mes</TableHead>
                              <TableHead className="text-right">Compras</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead className="text-right">Reembolsos</TableHead>
                              <TableHead className="text-right">Costo Neto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {purchasesAnalysis.monthly_trend.map((trend) => (
                              <TableRow key={trend.month} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium text-sm">{trend.month}</TableCell>
                                <TableCell className="text-right">{trend.count || 0}</TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">{formatUSD(trend.total_purchase_amount || 0)}</TableCell>
                                <TableCell className="text-right text-orange-600 font-semibold">{formatUSD(trend.total_refunded || 0)}</TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">{formatUSD(trend.net_cost || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Reembolsos */}
                  <div className="border-t pt-4 bg-gradient-to-r from-purple-50/50 to-transparent p-3 rounded-md">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-xs font-medium text-muted-foreground">Con Reembolsos</div>
                        <div className="text-lg font-bold text-purple-600">{purchasesAnalysis?.refunded_purchases_count || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-muted-foreground">Sin Reembolsos</div>
                        <div className="text-lg font-bold text-green-600">{purchasesAnalysis?.non_refunded_purchases_count || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-muted-foreground">% Reembolso</div>
                        <div className="text-lg font-bold text-orange-600">{(purchasesAnalysis?.refund_rate_percentage || 0).toFixed(1)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-muted-foreground">Productos Comprados</div>
                        <div className="text-lg font-bold text-blue-600">{purchasesAnalysis?.total_products_bought || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costos */}
          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-orange-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Costos - Facturas</CardTitle>
                  <CardDescription className="text-xs mt-1">Resumen agregado de tags y costos de envío</CardDescription>
                </div>
                <ArrowDown className="h-5 w-5 text-orange-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {invoicesRangeData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard label="Facturas" value={invoicesRangeData.invoices_count} />
                    <MetricCard label="Peso Total" value={`${invoicesRangeData.total_tag_weight.toLocaleString()} lb`} />
                    <MetricCard label="Costo Tags" value={formatUSD(invoicesRangeData.total_tag_subtotal)} />
                    <MetricCard label="Costo Fijos" value={formatUSD(invoicesRangeData.total_fixed_cost)} />
                    <MetricCard label="Total" value={formatUSD(invoicesRangeData.total_invoices_amount)} highlight />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay datos de facturas para el rango seleccionado</div>
              )}
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-r from-red-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Gastos Operativos</CardTitle>
                  <CardDescription className="text-xs mt-1">Desglose y tendencia de gastos</CardDescription>
                </div>
                <ArrowDown className="h-5 w-5 text-red-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {expenseError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">Error cargando gastos: {expenseError.message}</div>
              ) : !expensesAnalysis ? (
                <div className="text-center py-8 text-muted-foreground">No hay datos de gastos para el rango seleccionado</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <MetricCard label="Total Transacciones" value={expensesAnalysis.count || 0} />
                    <MetricCard label="Gasto Promedio" value={formatUSD(expensesAnalysis.average_expense || 0)} />
                    <MetricCard label="Total Gastos" value={formatUSD(expensesAnalysis.total_expenses || 0)} highlight />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Gastos por Categoría</h4>
                    <div className="space-y-2">
                      {Object.entries(expensesAnalysis.expenses_by_category || {})
                        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                        .map(([category, value]) => (
                          <div key={category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{category}</Badge>
                            </div>
                            <span className="font-semibold text-sm text-red-600">{formatUSD(value || 0)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {(expensesAnalysis.monthly_trend || []).length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Tendencia Mensual</h4>
                      <div className="space-y-2">
                        {(expensesAnalysis.monthly_trend || []).map((m) => (
                          <div key={m.month || Math.random()} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <span className="text-sm font-medium text-muted-foreground">{m.month}</span>
                            <span className="font-semibold text-sm">{formatUSD(m.total || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

/**
 * Componente auxiliar para mostrar métricas de manera consistente
 */
function MetricCard(
  { label, value, highlight }: 
  { label: string; value: string | number; highlight?: boolean }
) {
  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all',
      highlight 
        ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-sm' 
        : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50'
    )}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className={cn(
        'font-bold',
        highlight ? 'text-lg text-primary' : 'text-base text-foreground'
      )}>
        {value}
      </div>
    </div>
  );
}
