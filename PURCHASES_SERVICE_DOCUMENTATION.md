# Servicio de Análisis de Compras (Purchases Service)

## 📋 Descripción General

Se ha creado un nuevo servicio dedicado al análisis de compras (`ShoppingReceip`) que permite obtener métricas agregadas y desglosadas de las compras realizadas en el sistema.

## 🏗️ Estructura del Servicio

### Backend (Django)

#### Archivo: `backend/api/services/purchases_service.py`

Contiene tres funciones principales:

1. **`analyze_purchases(start_date, end_date)`** - Análisis completo de compras
   - Retorna totales, desglose por tienda, por cuenta de compra, estado de pago
   - Incluye tendencia mensual
   - Calcula métricas de reembolsos

2. **`get_purchases_summary(start_date, end_date)`** - Resumen rápido
   - Retorna solo las métricas clave principales
   - Más ligero para dashboards

3. **`analyze_product_buys(start_date, end_date)`** - Análisis de productos comprados
   - Analiza productos individuales (ProductBuyed)
   - Incluye métricas de reembolsos por producto
   - Identifica productos más reembolsados

#### Vistas API

Se agregaron 3 nuevos endpoints en `backend/api/views/reports_views.py`:

- **GET** `/api_data/reports/purchases/` - Análisis completo
- **GET** `/api_data/reports/purchases/summary/` - Resumen rápido  
- **GET** `/api_data/reports/purchases/products/` - Análisis de productos

### Frontend (React/TypeScript)

#### Archivo: `apps/admin/src/services/purchases/get-purchases.ts`

Exporta tres funciones async para consumir los endpoints:

```typescript
// Análisis detallado
await getPurchasesAnalysis({ 
  start_date: '2025-01-01', 
  end_date: '2025-12-31' 
})

// Resumen rápido
await getPurchasesSummary({ 
  start_date: '2025-01-01', 
  end_date: '2025-12-31' 
})

// Análisis de productos
await getProductBuysAnalysis({ 
  start_date: '2025-01-01', 
  end_date: '2025-12-31' 
})
```

#### Tipos TypeScript

Archivo: `apps/admin/src/types/models/purchase-analysis.ts`

Define todas las interfaces de respuesta:
- `PurchaseAnalysisData` - Estructura completa del análisis
- `PurchasesSummaryData` - Resumen con métricas clave
- `ProductBuysAnalysisData` - Análisis de productos
- Interfaces auxiliares para desglose por tienda, cuenta, etc.

## 📊 Ejemplo de Uso en BalanceReport

```tsx
import { getPurchasesAnalysis } from '@/services/purchases';
import { useQuery } from '@tanstack/react-query';

export function BalanceReport() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Convertir a formato ISO
  const startIso = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endIso = endDate ? endDate.toISOString().split('T')[0] : undefined;

  // Query para análisis de compras
  const { data: purchasesAnalysis, isLoading } = useQuery({
    queryKey: ['purchasesAnalysis', startIso, endIso],
    queryFn: async () => {
      if (!startIso || !endIso) return null;
      const resp = await getPurchasesAnalysis({ 
        start_date: startIso, 
        end_date: endIso 
      });
      return resp?.data ?? null;
    },
    enabled: !!startIso && !!endIso,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div>
      {/* Mostrar métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Compras</CardTitle>
        </CardHeader>
        <CardContent>
          {purchasesAnalysis && (
            <div className="grid grid-cols-5 gap-3">
              <MetricCard 
                label="Total Compras" 
                value={purchasesAnalysis.count} 
              />
              <MetricCard 
                label="Monto Total" 
                value={formatUSD(purchasesAnalysis.total_purchase_amount)} 
              />
              <MetricCard 
                label="Reembolsos" 
                value={formatUSD(purchasesAnalysis.total_refunded)} 
              />
              <MetricCard 
                label="Costo Neto" 
                value={formatUSD(purchasesAnalysis.total_real_cost_paid)} 
                highlight 
              />
              <MetricCard 
                label="Gastos Op." 
                value={formatUSD(purchasesAnalysis.total_operational_expenses)} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla desglose por tienda */}
      {purchasesAnalysis?.purchases_by_shop && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tienda</TableHead>
              <TableHead>Compras</TableHead>
              <TableHead>Monto Total</TableHead>
              <TableHead>Reembolsos</TableHead>
              <TableHead>Costo Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(purchasesAnalysis.purchases_by_shop).map(
              ([shop, stats]) => (
                <TableRow key={shop}>
                  <TableCell>{shop}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>{formatUSD(stats.total_purchase_amount)}</TableCell>
                  <TableCell>{formatUSD(stats.total_refunded)}</TableCell>
                  <TableCell>{formatUSD(stats.total_real_cost_paid)}</TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}

      {/* Tabla tendencia mensual */}
      {purchasesAnalysis?.monthly_trend && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead>Compras</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Reembolsos</TableHead>
              <TableHead>Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchasesAnalysis.monthly_trend.map((trend) => (
              <TableRow key={trend.month}>
                <TableCell>{trend.month}</TableCell>
                <TableCell>{trend.count}</TableCell>
                <TableCell>{formatUSD(trend.total_purchase_amount)}</TableCell>
                <TableCell>{formatUSD(trend.total_refunded)}</TableCell>
                <TableCell>{formatUSD(trend.net_cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

## 🔑 Métricas Principales

### Desde `analyze_purchases()`:
- **count** - Número total de compras
- **total_purchase_amount** - Monto total pagado en compras
- **total_refunded** - Monto total reembolsado
- **total_real_cost_paid** - Costo neto (compras - reembolsos)
- **total_operational_expenses** - Gastos operativos
- **total_products_bought** - Cantidad de productos comprados
- **average_purchase_amount** - Promedio por compra
- **average_refund_amount** - Promedio de reembolsos
- **refunded_purchases_count** - Número de compras con reembolsos
- **refund_rate_percentage** - Porcentaje de reembolso

### Desglose por tienda (`purchases_by_shop`):
Cada tienda incluye: count, total_purchase_amount, total_refunded, total_real_cost_paid, total_operational_expenses, total_products

### Desglose por cuenta (`purchases_by_account`):
Cada cuenta de compra incluye: count, total_purchase_amount, total_refunded, total_real_cost_paid

### Tendencia mensual (`monthly_trend`):
Para cada mes: month, count, total_purchase_amount, total_refunded, net_cost

## 🔐 Permisos

Todos los endpoints requieren:
- Autenticación (token JWT)
- Permisos de Admin o Accountant

## 📝 Rutas API Disponibles

```
GET /arye_system/api_data/reports/purchases/
  - Análisis completo de compras
  - Parámetros: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)

GET /arye_system/api_data/reports/purchases/summary/
  - Resumen rápido
  - Parámetros: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)

GET /arye_system/api_data/reports/purchases/products/
  - Análisis de productos comprados
  - Parámetros: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
```

## 🎯 Casos de Uso

1. **Dashboard Principal** - Mostrar tarjetas de resumen de compras
2. **Balance Report** - Incluir sección de compras con tendencia mensual
3. **Reportes Financieros** - Desglose por tienda y cuenta de compra
4. **Análisis de Reembolsos** - Identificar productos más reembolsados
5. **Métricas Operativas** - Gastos operativos y eficiencia de compras

## 🚀 Próximos Pasos

1. Integrar en el componente `BalanceReport`
2. Crear visualizaciones (gráficos) para tendencias
3. Agregar filtros adicionales (por tienda, cuenta, estatus)
4. Implementar exportación de reportes
5. Crear alertas para reembolsos inusuales
