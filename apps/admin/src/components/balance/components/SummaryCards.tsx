import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/lib/format-usd';
import { ShoppingCart, Truck, ShoppingBag, BaggageClaim, ReceiptText } from 'lucide-react';

interface SummaryCardsProps {
  ordersAnalysis?: {
    total_sales?: number;
    total_orders?: number;
  } | null;
  deliveryAnalysis?: {
    total_deliveries?: number;
  } | null;
  purchasesAnalysis?: {
    total_purchases?: number;
  } | null;
  expensesAnalysis?: {
    total_expenses?: number;
  } | null;
  invoicesRangeData?: {
    total_invoiced?: number;
  } | null;
  isLoading?: boolean;
}

export function SummaryCards({
  ordersAnalysis,
  deliveryAnalysis,
  purchasesAnalysis,
  expensesAnalysis,
  invoicesRangeData,
  isLoading = false,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatUSD(ordersAnalysis?.total_sales || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {ordersAnalysis?.total_orders || 0} pedidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregas</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {deliveryAnalysis?.total_deliveries || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Entregas realizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compras</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatUSD(purchasesAnalysis?.total_purchases || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            En compras totales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos</CardTitle>
          <BaggageClaim className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatUSD(expensesAnalysis?.total_expenses || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Gastos operativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facturación</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatUSD(invoicesRangeData?.total_invoiced || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total facturado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
