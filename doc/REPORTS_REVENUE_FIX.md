# Corrección de Cálculo de Ingresos en Reportes

## Fecha: 11 de noviembre de 2025

## Problema Identificado

Los reportes de ganancias no mostraban los datos correctos porque el cálculo de ingresos estaba usando criterios incorrectos de filtrado.

### Error Original

El código estaba filtrando órdenes por `created_at` (fecha de creación) en lugar de considerar cuándo fueron realmente pagadas:

```python
# ❌ INCORRECTO
revenue_products = Order.objects.filter(
    pay_status=PaymentStatusEnum.PAGADO.value,
    created_at__date__gte=month_start,
    created_at__date__lte=month_end
).aggregate(total=Sum('products__total_cost'))['total'] or 0
```

**Problemas con este enfoque:**

1. ✗ Contabilizaba productos en el mes en que se **creó** la orden, no cuando se **pagó**
2. ✗ Si una orden antigua se marcaba como pagada este mes, sus productos no se contabilizaban
3. ✗ Inconsistencia: filtraba por fecha de orden pero sumaba productos
4. ✗ No reflejaba los ingresos reales del mes

## Solución Implementada

### Cambio 1: Cálculo de Ingresos de Productos

Ahora se filtran productos cuyas órdenes fueron **actualizadas a estado PAGADO** en el período:

```python
# ✅ CORRECTO
products_in_paid_orders = Product.objects.filter(
    order__pay_status=PaymentStatusEnum.PAGADO.value,
    order__updated_at__date__gte=month_start,
    order__updated_at__date__lte=month_end
)

revenue_products = sum(float(p.total_cost) for p in products_in_paid_orders)
```

**Ventajas:**

1. ✓ Usa `updated_at` de la orden para capturar cuando se marcó como pagada
2. ✓ Refleja los ingresos reales del período
3. ✓ Consistencia: filtra y suma productos del mismo conjunto

### Cambio 2: Cálculo de Gastos de Productos

Los gastos ahora usan la misma lista de productos para mantener consistencia:

```python
# ✅ CORRECTO - Usa la misma lista de productos
product_expenses = sum(
    float(p.system_expenses) for p in products_in_paid_orders
)
```

## Fórmula Correcta de Ingresos

### Ingresos Totales

```
Ingresos Totales = Ingresos de Productos + Ingresos de Entregas
```

Donde:

**Ingresos de Productos:**
- Suma de `total_cost` de todos los productos en órdenes que fueron marcadas como PAGADO en el período
- `total_cost` = precio que se cobra al cliente por el producto

**Ingresos de Entregas:**
- Suma de `client_charge` de todas las entregas realizadas en el período
- `client_charge` = peso × tarifa de cobro al cliente por libra

### Gastos Totales

```
Gastos Totales = Gastos de Productos + Gastos Operativos + Gastos de Entrega
```

Donde:

**Gastos de Productos:**
- Suma de `system_expenses` de productos en órdenes pagadas
- `system_expenses` = precio + envío + 7% del precio + impuestos adicionales

**Gastos Operativos:**
- Suma de `operational_expenses` de compras realizadas en el período

**Gastos de Entrega:**
- Suma de `delivery_expenses` de entregas en el período
- `delivery_expenses` = peso × costo por libra del sistema

### Ganancia del Sistema

```
Ganancia del Sistema = Ingresos Totales - Gastos Totales - Ganancias de Agentes
```

## Impacto

### Antes de la Corrección
- Los ingresos mostraban datos incorrectos
- No se reflejaba correctamente cuándo se recibían los pagos
- Descuadre entre ingresos reportados y realidad financiera

### Después de la Corrección
- ✅ Los ingresos reflejan correctamente los pagos recibidos en cada período
- ✅ Consistencia entre productos, gastos e ingresos
- ✅ Datos financieros precisos para toma de decisiones

## Archivos Modificados

1. **backend/api/views.py** - `ProfitReportsView.get()` (líneas ~1920-1950)
   - Cambio en el filtro de productos para ingresos
   - Cambio en el filtro de productos para gastos

## Testing Recomendado

Para verificar la corrección:

1. Crear una orden nueva y marcarla como pagada hoy
2. Verificar que aparezca en los reportes del mes actual
3. Comparar los totales con la suma manual de:
   - Productos en órdenes pagadas este mes
   - Entregas realizadas este mes

## Consideraciones Futuras

Si en el futuro se necesita un reporte basado en fecha de creación de orden, se debe:

1. Crear un endpoint separado para ese propósito
2. Documentar claramente la diferencia entre:
   - **Reportes de Ingresos**: basados en `updated_at` (cuando se pagó)
   - **Reportes de Ventas**: basados en `created_at` (cuando se creó la orden)

## Referencias

- Modelo `Order`: `backend/api/models.py` línea 129
- Modelo `Product`: `backend/api/models.py` línea 381
- Modelo `DeliverReceip`: `backend/api/models.py` línea 543
- Vista de reportes: `backend/api/views.py` línea 1887
