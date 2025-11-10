# Actualización del Cálculo de Ingresos

## Fecha
10 de noviembre de 2025

## Descripción del Cambio

Se ha actualizado el cálculo de ingresos para reflejar correctamente los ingresos totales del sistema, incluyendo tanto los costos de productos como los costos de entregas.

## Cambios Realizados

### 1. Cálculo de Ingresos Mensuales (Reportes de Ganancias)

**Antes:**
```python
# Solo se contaban los ingresos de productos
revenue = Order.objects.filter(
    pay_status=PaymentStatusEnum.PAGADO.value,
    created_at__date__gte=month_start,
    created_at__date__lte=month_end
).aggregate(total=Sum('products__total_cost'))['total'] or 0
```

**Ahora:**
```python
# Se suman los ingresos de productos + cobro al cliente por entregas
# Ingresos de productos
revenue_products = Order.objects.filter(
    pay_status=PaymentStatusEnum.PAGADO.value,
    created_at__date__gte=month_start,
    created_at__date__lte=month_end
).aggregate(total=Sum('products__total_cost'))['total'] or 0

# Obtener entregas del mes
deliveries_in_month = DeliverReceip.objects.filter(
    deliver_date__gte=month_start,
    deliver_date__lte=month_end
)

# Ingresos de entregas (cobro al cliente)
revenue_deliveries = sum(float(d.client_charge) for d in deliveries_in_month)

# Total de ingresos = productos + entregas
revenue = revenue_products + revenue_deliveries
```

### 2. Cálculo de Ingresos en Métricas Generales

Se actualizó también el endpoint de métricas para incluir los ingresos de entregas en todos los períodos:
- Total
- Hoy
- Esta semana
- Este mes
- Último mes

**Fórmula:**
```
Ingresos Totales = Suma(total_cost de productos en pedidos pagados) + Suma(client_charge de todas las entregas)
```

## Componentes del Ingreso

### 1. Ingresos de Productos
- **Fuente**: Pedidos con `pay_status = 'Pagado'`
- **Cálculo**: Suma del `total_cost` de todos los productos en los pedidos
- **Campo**: `Order.products.total_cost`

### 2. Ingresos de Entregas
- **Fuente**: Registros de entrega (`DeliverReceip`)
- **Cálculo**: Suma del `client_charge` de todas las entregas
- **Campo**: `DeliverReceip.client_charge` (propiedad calculada)
- **Fórmula del client_charge**: 
  ```python
  peso × client_shipping_charge (de la categoría)
  ```

## Impacto en el Frontend

El componente `Reports.tsx` ya está preparado para mostrar estos valores correctamente:

```tsx
<Card>
  <CardTitle>Ingresos Totales</CardTitle>
  <CardContent>
    ${(reports.summary?.total_revenue || 0).toLocaleString()}
  </CardContent>
</Card>
```

## Verificación

Para verificar que el cálculo es correcto, puedes ejecutar:

```python
# En el shell de Django
from api.models import Order, DeliverReceip
from api.enums import PaymentStatusEnum

# Ingresos de productos
revenue_products = sum(
    p.total_cost 
    for order in Order.objects.filter(pay_status=PaymentStatusEnum.PAGADO.value)
    for p in order.products.all()
)

# Ingresos de entregas
revenue_deliveries = sum(d.client_charge for d in DeliverReceip.objects.all())

# Total
total_revenue = revenue_products + revenue_deliveries
print(f"Ingresos Totales: ${total_revenue:,.2f}")
```

## Archivos Modificados

1. **backend/api/views.py**
   - Función: `profit_reports` (líneas ~1915-1930)
   - Función: `metrics` (líneas ~1766-1795)

## Notas Adicionales

- Los ingresos de entregas se calculan usando el `client_charge`, que es el monto que el cliente paga por el envío
- El sistema mantiene la diferencia entre:
  - **Ingreso**: Lo que el cliente paga (`client_charge`)
  - **Gasto**: Lo que cuesta al sistema (`delivery_expenses`)
  - **Ganancia del Agente**: Lo que gana el agente (`agent_profit_calculated`)
  - **Ganancia del Sistema**: `client_charge - agent_profit_calculated - delivery_expenses`

## Testing

Recomendaciones para probar los cambios:

1. Verificar que los ingresos totales aumentaron correctamente
2. Comparar los reportes mensuales antes y después del cambio
3. Verificar que la suma de ingresos de productos + entregas coincide con el total
4. Revisar que las métricas del dashboard reflejan los nuevos valores

## Próximos Pasos

- [ ] Verificar que todos los cálculos son correctos con datos reales
- [ ] Actualizar cualquier documentación adicional que haga referencia a los cálculos de ingresos
- [ ] Considerar agregar un desglose más detallado en el frontend que muestre:
  - Ingresos por productos
  - Ingresos por entregas
  - Total de ingresos
