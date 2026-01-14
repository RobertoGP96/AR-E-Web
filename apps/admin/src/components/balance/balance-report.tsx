import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/utils/LoadingSpinner";
import { DatePicker } from "@/components/utils/DatePicker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { balanceService } from "@/services/balance";
import type { CreateBalanceData } from "@/types/models/balance";
import { formatUSD } from "@/lib/format-usd";
import {
  ShoppingCart,
  Truck,
  ShoppingBag,
  BaggageClaim,
  ReceiptText,
  ArrowBigRight,
  Save,
  CheckCircle2,
} from "lucide-react";
import useBalanceData from "@/hooks/useBalanceData";
import type { OrderAnalysis } from "@/types/services/order";
import type { DeliveryAnalysisResponse } from "@/types/models/delivery";
import type { PurchaseAnalysisResponse } from "@/services/purchases";
import type { ExpenseAnalysisResponse } from "@/services/api";
import type { InvoiceRangeData } from "@/types/models/invoice";

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

  const [preset, setPreset] = React.useState<
    "1m" | "3m" | "6m" | "12m" | "custom"
  >("6m");
  const [useCustomRange, setUseCustomRange] = React.useState<boolean>(false);
  const previousPresetRef = React.useRef<
    "1m" | "3m" | "6m" | "12m" | "custom" | null
  >(null);

  // Handler to toggle between custom range and standard presets
  const handleUseCustomRangeChange = (value: boolean) => {
    const bool = !!value;
    setUseCustomRange(bool);
    if (bool) {
      // Save previous non-custom preset so we can restore when disabling custom range
      if (preset !== "custom") previousPresetRef.current = preset;
      setPreset("custom");
    } else {
      // Restore previous preset or default to 6m
      setPreset(
        previousPresetRef.current && previousPresetRef.current !== "custom"
          ? previousPresetRef.current
          : "6m"
      );
      previousPresetRef.current = null;
    }
  };

  // Preset change handler (keeps custom/standard mode synchronized)
  const handlePresetChange = (v: "1m" | "3m" | "6m" | "12m" | "custom") => {
    if (v === "custom") {
      // Save current preset so it can be restored if the user disables custom range
      if (preset && preset !== "custom") previousPresetRef.current = preset;
      setPreset("custom");
      if (!useCustomRange) setUseCustomRange(true);
      return;
    }
    // non custom preset selected: ensure custom range disabled
    if (useCustomRange) setUseCustomRange(false);
    setPreset(v);
  };

  // Use the custom hook to fetch all data
  const {
    // Data
    reports,
    invoicesRangeData,
    expensesAnalysis,
    deliveryAnalysis,
    ordersAnalysis,
    purchasesAnalysis,
    summary,

    // Loading states
    isLoading,
    isLoadingInvoices,
    isLoadingExpensesAnalysis,
    isLoadingDeliveryAnalysis,
    isLoadingOrders,
    isLoadingPurchases,

    // Errors
    error,
    expenseError,
    deliveryAnalysisError,
    ordersError,
    purchasesError,
  } = useBalanceData({ startDate, endDate });

  // Apply preset shortcuts
  React.useEffect(() => {
    if (useCustomRange) return; // when using custom range, ignore preset auto-updates
    if (preset === "custom") return;

    const now = new Date();
    let months = 6;
    if (preset === "3m") months = 3;
    if (preset === "12m") months = 12;

    const s = new Date();
    s.setMonth(now.getMonth() - (months - 1));
    s.setDate(1);

    const e = new Date();
    e.setMonth(now.getMonth());
    e.setDate(new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate());

    setStartDate(s);
    setEndDate(e);
  }, [preset, useCustomRange]);

  React.useEffect(() => {
    if (!summary) return;
    const { averageProfit, monthCount, revenue, expenses, profit } = summary;
    const margin =
      revenue > 0 ? (averageProfit / revenue) * 100 : 0;
    summary.profit = margin;
  }, [summary]);

  if (
    isLoading ||
    isLoadingInvoices ||
    isLoadingExpensesAnalysis ||
    isLoadingDeliveryAnalysis ||
    isLoadingOrders ||
    isLoadingPurchases
  )
    return <LoadingSpinner text="Cargando Reportes..." />;
  if (error)
    return (
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
          <h2 className="text-3xl font-bold text-foreground">
            Reportes Financieros
          </h2>
          <p className="text-sm text-muted-foreground">
            Análisis detallado de ingresos, gastos y entregas en tu rango
            seleccionado
          </p>
        </div>

        {/* Date Range Controls - Improved Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all duration-300 border-2 hover:border-primary/50",
              !useCustomRange
                ? "border-primary shadow-md"
                : "border-gray-200 bg-white hover:shadow-sm"
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
                <Label
                  className={cn(
                    "select-none cursor-pointer text-base font-semibold",
                    !useCustomRange && "text-primary"
                  )}
                >
                  Rango Estándar
                </Label>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="ml-8 space-y-2">
                <Label
                  htmlFor="preset-range-select"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Seleccionar período
                </Label>
                <Select
                  value={preset}
                  onValueChange={(v) =>
                    handlePresetChange(
                      v as "1m" | "3m" | "6m" | "12m" | "custom"
                    )
                  }
                >
                  <SelectTrigger
                    id="preset-range-select"
                    className="w-full rounded-md"
                    disabled={useCustomRange}
                  >
                    <SelectValue placeholder="Selecciona un rango" />
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
              "lg:col-span-2 cursor-pointer transition-all duration-300 border-2 hover:border-primary/50",
              useCustomRange
                ? "border-primary  shadow-md"
                : "border-gray-200 bg-white hover:shadow-sm"
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
                <Label
                  className={cn(
                    "select-none cursor-pointer text-base font-semibold",
                    useCustomRange && "text-primary"
                  )}
                >
                  Rango Personalizado
                </Label>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      label="Fecha Inicio"
                      selected={startDate}
                      onDateChange={setStartDate}
                      disabled={!useCustomRange}
                    />
                  </div>
                  <div className="hidden sm:flex h-10 items-center">
                    <ArrowBigRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      label="Fecha Fin"
                      selected={endDate}
                      onDateChange={setEndDate}
                      disabled={!useCustomRange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-5">
        {/* Órdenes */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-4 items-center">
                <ShoppingCart className="h-6 w-6 text-blue-500 mb-1" />
                <div>
                  <CardTitle className="text-lg">Órdenes - Resumen</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Análisis de órdenes en el rango seleccionado
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {ordersError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                Error cargando órdenes: {ordersError.message}
              </div>
            ) : !ordersAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de órdenes para el rango seleccionado
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard
                    label="órdenes"
                    value={ordersAnalysis.orders.length || 0}
                  />
                  <MetricCard
                    label="Ingresos Totales"
                    value={formatUSD(ordersAnalysis.total_revenue || 0)}
                    highlight
                  />
                  <MetricCard
                    label="Ingesos Pendientes"
                    value={formatUSD(ordersAnalysis.unpaid_revenue || 0)}
                  />
                  <MetricCard
                    label="Ingresos Pagados"
                    value={formatUSD(ordersAnalysis.paid_revenue || 0)}
                  />
                  <MetricCard
                    label="Indice de Pago"
                    value={
                      ordersAnalysis.average_paid + " %"
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compras */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-4 items-center">
                <ShoppingBag className="h-6 w-6 text-purple-500" />
                <div>
                  <CardTitle className="text-lg">Compras - Resumen</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Análisis de compras realizadas y reembolsos
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {purchasesError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                Error cargando compras: {purchasesError.message}
              </div>
            ) : !purchasesAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de compras para el rango seleccionado
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard
                    label="Compras"
                    value={purchasesAnalysis?.count || 0}
                  />
                  <MetricCard
                    label="Monto Total"
                    value={formatUSD(
                      purchasesAnalysis?.total_purchase_amount || 0
                    )}
                  />
                  <MetricCard
                    label="Reembolsos"
                    value={formatUSD(purchasesAnalysis?.total_refunded || 0)}
                  />
                  <MetricCard
                    label="Gastos Op."
                    value={formatUSD(
                      purchasesAnalysis?.total_operational_expenses || 0
                    )}
                  />
                  <MetricCard
                    label="Costo Neto"
                    value={formatUSD(
                      purchasesAnalysis?.total_real_cost_paid || 0
                    )}
                    highlight
                  />
                </div>

                {/* Desglose por Tienda */}
                {purchasesAnalysis?.purchases_by_shop &&
                  Object.keys(purchasesAnalysis.purchases_by_shop).length >
                    0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Desglose por Tienda
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Tienda</TableHead>
                              <TableHead className="text-right">
                                Compras
                              </TableHead>
                              <TableHead className="text-right">
                                Monto
                              </TableHead>
                              <TableHead className="text-right">
                                Reembolsos
                              </TableHead>
                              <TableHead className="text-right">
                                Costo Neto
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(
                              purchasesAnalysis.purchases_by_shop
                            ).map(([shop, stats]) => (
                              <TableRow
                                key={shop}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <TableCell className="font-medium">
                                  <Badge variant="outline">{shop}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {stats.count || 0}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">
                                  {formatUSD(stats.total_purchase_amount || 0)}
                                </TableCell>
                                <TableCell className="text-right text-orange-600 font-semibold">
                                  {formatUSD(stats.total_refunded || 0)}
                                </TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">
                                  {formatUSD(stats.total_real_cost_paid || 0)}
                                </TableCell>
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

        {/* Delivery */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-4 items-center">
                <Truck className="h-6 w-6 text-green-500 mb-1" />
                <div>
                  <CardTitle className="text-lg">Entregas - Resumen</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Estado y rentabilidad de entregas
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {deliveryAnalysisError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                Error cargando entregas: {deliveryAnalysisError.message}
              </div>
            ) : !deliveryAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de entregas para el rango seleccionado
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard
                    label="Entregas - Peso"
                    value={
                      (deliveryAnalysis?.count || 0) +
                      `-  ${(
                        (deliveryAnalysis?.total_weight ?? 0) ||
                        0
                      ).toLocaleString()} lb`
                    }
                  />

                  <MetricCard
                    label="Ingresos"
                    value={formatUSD(
                      deliveryAnalysis?.total_delivery_revenue || 0
                    )}
                  />
                  <MetricCard
                    label="Gastos"
                    value={formatUSD(
                      deliveryAnalysis?.total_delivery_expenses || 0
                    )}
                  />
                  <MetricCard
                    label="Agentes"
                    value={formatUSD(
                      deliveryAnalysis?.total_manager_profit || 0
                    )}
                  />
                  <MetricCard
                    label="Ganancia"
                    value={formatUSD(
                      deliveryAnalysis?.total_system_profit || 0
                    )}
                    highlight
                  />
                </div>

                {deliveryAnalysis?.deliveries_by_category &&
                  Object.keys(deliveryAnalysis.deliveries_by_category).length >
                    0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Desglose por Categoría
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Categoría</TableHead>
                              <TableHead className="text-right">
                                Cantidad
                              </TableHead>
                              <TableHead className="text-right">Peso</TableHead>
                              <TableHead className="text-right">
                                Ingresos
                              </TableHead>
                              <TableHead className="text-right">
                                Gastos
                              </TableHead>
                              <TableHead className="text-right">
                                Agentes
                              </TableHead>
                              <TableHead className="text-right">
                                Ganancia
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(
                              deliveryAnalysis.deliveries_by_category
                            ).map(([category, values]) => (
                              <TableRow
                                key={category}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <TableCell className="font-medium">
                                  <Badge variant="outline">{category}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {values.count || 0}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {values.total_weight.toFixed(2)} lb
                                </TableCell>
                                <TableCell className="text-right text-blue-600 font-semibold">
                                  {formatUSD(
                                    values.total_delivery_revenue || 0
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-semibold">
                                  {formatUSD(
                                    values.total_delivery_expenses || 0
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-semibold">
                                  {formatUSD(values.total_manager_profit || 0)}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-semibold">
                                  {formatUSD(values.total_system_profit || 0)}
                                </TableCell>
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
        {/* Costos */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-4 items-center">
                <BaggageClaim className="h-6 w-6 text-orange-500" />
                <div>
                  <CardTitle className="text-lg">
                    Costos de envío - Resumen
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Resumen agregado de tags y costos de envío
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {invoicesRangeData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard
                    label="Facturas"
                    value={invoicesRangeData.invoices_count}
                  />
                  <MetricCard
                    label="Peso Total"
                    value={`${invoicesRangeData.total_tag_weight.toLocaleString()} lb`}
                  />
                  <MetricCard
                    label="Costo Pesajes"
                    value={formatUSD(invoicesRangeData.total_tag_subtotal)}
                  />
                  <MetricCard
                    label="Costo Fijos"
                    value={formatUSD(invoicesRangeData.total_fixed_cost)}
                  />
                  <MetricCard
                    label="Total"
                    value={formatUSD(invoicesRangeData.total_invoices_amount)}
                    highlight
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de facturas para el rango seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 ">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-4 items-center">
                <ReceiptText className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-lg">Gastos - Resumen</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Desglose y tendencia de gastos
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {expenseError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                Error cargando gastos: {expenseError.message}
              </div>
            ) : !expensesAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de gastos para el rango seleccionado
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricCard
                    label="Total"
                    value={expensesAnalysis.count || 0}
                  />
                  <MetricCard
                    label="Gasto Promedio"
                    value={formatUSD(expensesAnalysis.average_expense || 0)}
                  />
                  <MetricCard
                    label="Total Gastos"
                    value={formatUSD(expensesAnalysis.total_expenses || 0)}
                    highlight
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Gastos por Categoría
                  </h4>
                  <div className="space-y-0.5">
                    {Object.entries(expensesAnalysis.expenses_by_category || {})
                      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                      .map(([category, value]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-0.5 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          </div>
                          <span className="font-semibold text-sm text-red-600">
                            {formatUSD(value || 0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen Ejecutivo - Ganancia Final Integrada */}
        <ExecutiveSummary
          ordersAnalysis={ordersAnalysis}
          deliveryAnalysis={deliveryAnalysis}
          purchasesAnalysis={purchasesAnalysis}
          expensesAnalysis={expensesAnalysis}
          invoicesRangeData={invoicesRangeData}
          isLoading={
            isLoadingOrders ||
            isLoadingDeliveryAnalysis ||
            isLoadingPurchases ||
            isLoadingExpensesAnalysis ||
            isLoadingInvoices
          }
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}

/**
 * Componente de Resumen Ejecutivo
 * Integra todos los datos para mostrar la ganancia final
 */
function ExecutiveSummary({
  ordersAnalysis,
  deliveryAnalysis,
  purchasesAnalysis,
  expensesAnalysis,
  invoicesRangeData,
  isLoading,
  startDate,
  endDate,
}: {
  ordersAnalysis: OrderAnalysis | null | undefined;
  deliveryAnalysis: DeliveryAnalysisResponse | null | undefined;
  purchasesAnalysis: PurchaseAnalysisResponse | null | undefined;
  expensesAnalysis: ExpenseAnalysisResponse | null | undefined;
  invoicesRangeData: InvoiceRangeData | null | undefined;
  isLoading: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSuccessAnimation, setShowSuccessAnimation] = React.useState(false);

  // Calcular totales integrados
  const summary = React.useMemo(() => {
    if (isLoading || !ordersAnalysis) {
      return null;
    }

    // Ingresos totales (de órdenes + entregas)
    const totalOrderRevenue = ordersAnalysis?.total_revenue || 0;
    const totalDeliveryRevenue = deliveryAnalysis?.total_delivery_revenue || 0;
    const totalIncome = totalOrderRevenue + totalDeliveryRevenue;

    // Costos totales
    const orderCosts = ordersAnalysis?.total_cost || 0;
    const purchaseCosts = purchasesAnalysis?.total_real_cost_paid || 0;
    const invoiceCosts = invoicesRangeData?.total_invoices_amount || 0;
    const operationalExpenses =
      purchasesAnalysis?.total_operational_expenses || 0;
    const totalExpenses = expensesAnalysis?.total_expenses || 0;
    const deliveryExpenses = deliveryAnalysis?.total_delivery_expenses || 0;

    // Costo total integrado
    const totalCosts = purchaseCosts + invoiceCosts + totalExpenses;

    // Ganancia neta final
    const netProfit = totalIncome - totalCosts;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Desglose de ganancias
    const orderProfit =
      (ordersAnalysis?.total_revenue || 0) - (ordersAnalysis?.total_cost || 0);
    const deliveryProfit = deliveryAnalysis?.total_system_profit || 0;
    const purchaseProfit =
      (purchasesAnalysis?.total_purchase_amount || 0) -
      (purchasesAnalysis?.total_real_cost_paid || 0);

    return {
      totalIncome,
      totalOrderRevenue,
      totalDeliveryRevenue,
      totalCosts,
      orderCosts,
      purchaseCosts,
      invoiceCosts,
      operationalExpenses,
      totalExpenses,
      deliveryExpenses,
      netProfit,
      profitMargin,
      orderProfit,
      deliveryProfit,
      purchaseProfit,
    };
  }, [
    ordersAnalysis,
    deliveryAnalysis,
    purchasesAnalysis,
    expensesAnalysis,
    invoicesRangeData,
    isLoading,
  ]);

  // Mutation para guardar el balance
  const saveBalanceMutation = useMutation({
    mutationFn: (data: CreateBalanceData) => balanceService.createMetric(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["balance-summary"] });

      // Mostrar animación de confirmación
      setShowSuccessAnimation(true);

      // Mostrar toast de éxito
      toast.success("Balance guardado", {
        description: "El balance ha sido guardado exitosamente",
      });

      // Redirigir después de mostrar la animación (1.5 segundos)
      setTimeout(() => {
        navigate("/balance", { replace: true });
      }, 1500);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el balance";
      toast.error("Error al guardar balance", {
        description: message,
      });
    },
  });

  const handleSaveBalance = () => {
    if (!startDate || !endDate) {
      toast.error("Fechas requeridas", {
        description: "Por favor selecciona un rango de fechas válido",
      });
      return;
    }

    if (!summary) {
      toast.error("Datos no disponibles", {
        description: "No hay datos para guardar en el rango seleccionado",
      });
      return;
    }

    // Formatear fechas a YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Mapear los datos calculados a la estructura CreateBalanceData
    const balanceData: CreateBalanceData = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      system_weight: deliveryAnalysis?.total_weight || 0,
      registered_weight: invoicesRangeData?.total_tag_weight || 0, // Peso total registrado de las facturas
      revenues: summary.totalIncome,
      buys_costs: summary.purchaseCosts,
      costs: summary.invoiceCosts,
      expenses: summary.totalExpenses,
      notes: `Balance generado automáticamente para el período ${formatDate(
        startDate
      )} - ${formatDate(endDate)}`,
    };

    saveBalanceMutation.mutate(balanceData);
  };

  if (isLoading || !summary) {
    return null;
  }

  const isPositive = summary.netProfit >= 0;

  return (
    <>
      {/* Animación de confirmación */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
              <CheckCircle2 className="relative h-20 w-20 text-green-500 animate-in zoom-in-95 duration-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                ¡Balance Guardado!
              </h3>
              <p className="text-sm text-gray-600">
                Redirigiendo a la vista de balances...
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="border-2 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold ">
                Resumen Financiero
              </CardTitle>
              <CardDescription className="text-sm mt-2">
                Análisis completo de ingresos, costos y ganancias netas del
                período
              </CardDescription>
            </div>
            <Button
              onClick={handleSaveBalance}
              disabled={isLoading || !summary || saveBalanceMutation.isPending}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {saveBalanceMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Balance
                </div>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sección de Ingresos Totales */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Ingresos Totales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                label="Órdenes"
                value={formatUSD(summary.totalOrderRevenue)}
              />
              <MetricCard
                label="Entregas"
                value={formatUSD(summary.totalDeliveryRevenue)}
              />
            </div>
            <div className="mt-4 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">
                  Ingreso Total:
                </span>
                <span className="text-xl font-bold text-gray-700">
                  {formatUSD(summary.totalIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Costos Desglosados */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Costos - Gastos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="Compras"
                value={formatUSD(summary.purchaseCosts)}
              />
              <MetricCard
                label="Facturas"
                value={formatUSD(summary.invoiceCosts)}
              />
              <MetricCard
                label="Gastos"
                value={formatUSD(summary.totalExpenses)}
              />
            </div>
            <div className="mt-4 p-3 rounded-lg  border border-red-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-900">
                  Pasivo Total:
                </span>
                <span className="text-xl font-bold ">
                  {formatUSD(summary.totalCosts)}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Ganancias Netas por Categoría */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Ganancias
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  summary.orderProfit >= 0
                    ? "border-blue-300 bg-blue-50"
                    : "border-orange-300 bg-orange-50"
                )}
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Ganancia Órdenes
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    summary.orderProfit >= 0
                      ? "text-blue-600"
                      : "text-orange-600"
                  )}
                >
                  {formatUSD(summary.orderProfit)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (summary.orderProfit / summary.totalOrderRevenue) *
                    100
                  ).toFixed(1)}
                  % margen
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  summary.deliveryProfit >= 0
                    ? "border-purple-300 bg-purple-50"
                    : "border-orange-300 bg-orange-50"
                )}
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Ganancia Entregas
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    summary.deliveryProfit >= 0
                      ? "text-purple-600"
                      : "text-orange-600"
                  )}
                >
                  {formatUSD(summary.deliveryProfit)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (summary.deliveryProfit / summary.totalDeliveryRevenue) *
                    100
                  ).toFixed(1)}
                  % margen
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  summary.purchaseProfit >= 0
                    ? "border-amber-300 bg-amber-50"
                    : "border-orange-300 bg-orange-50"
                )}
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Ganancia Compras
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    summary.purchaseProfit >= 0
                      ? "text-amber-600"
                      : "text-orange-600"
                  )}
                >
                  {formatUSD(summary.purchaseProfit)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (summary.purchaseProfit /
                      (purchasesAnalysis?.total_purchase_amount || 1)) *
                    100
                  ).toFixed(1)}
                  % margen
                </div>
              </div>

              <div
                className={cn(
                  "text-4xl font-bold border rounded-lg p-4",
                  isPositive
                    ? "bg-green-100 border-green-400 text-green-700"
                    : "bg-red-100 border-red-400 text-red-700"
                )}
              >
                <div className="text-sm font-medium  mb-2">Ganancia Neta</div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatUSD(summary.netProfit)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(
                    (summary.netProfit / (ordersAnalysis?.total_revenue || 1)) *
                    100
                  ).toFixed(2)}
                  % margen
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Componente auxiliar para mostrar métricas de manera consistente
 */
function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        highlight
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-sm"
          : "bg-muted/30 border-muted-foreground/20 hover:bg-muted/50"
      )}
    >
      <div className="text-xs font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className={cn(
          "font-bold",
          highlight ? "text-lg text-primary" : "text-base text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}
