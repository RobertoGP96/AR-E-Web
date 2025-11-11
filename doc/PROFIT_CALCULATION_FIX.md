# Corrección del Cálculo de Ganancias del Sistema

## 📋 Resumen

Se corrigió el cálculo de ganancias del sistema para reflejar correctamente las **tres fuentes de ganancia**:

1. **Ganancia de Productos**: Diferencia entre lo cobrado al cliente y los gastos reales del sistema
2. **Ganancia de Compras**: Diferencia entre el valor de los productos y lo que realmente se pagó por ellos
3. **Ganancia de Entregas**: Diferencia entre lo cobrado al cliente por envío, la ganancia del agente y los gastos de entrega

---

## 🔍 Problema Identificado

### Cálculo Anterior (INCORRECTO)
```python
system_profit = revenue - total_expenses - agent_profits
```

Donde:
- `total_expenses = product_expenses + purchase_operational_expenses + delivery_expenses`

**❌ Problema**: Se estaba **restando** `purchase_operational_expenses` como si fuera un gasto, cuando en realidad es una **ganancia** (la diferencia entre lo que se cobra y lo que se paga).

---

## ✅ Solución Implementada

### Cálculo Correcto (NUEVO)
```python
system_profit = product_profit + purchase_operational_profit + system_delivery_profit
```

Donde:

#### 1. Ganancia de Productos (`product_profit`)
```python
product_profit = sum(p.system_profit for p in products_in_completed_orders)
```
- `system_profit` = `total_cost` - `system_expenses`
- `system_expenses` = precio + envío + 7% precio + impuestos

#### 2. Ganancia de Compras (`purchase_operational_profit`)
```python
purchase_operational_profit = total_cost_of_shopping - total_cost_of_purchase
```
- `total_cost_of_shopping`: Lo que se cobra al cliente por los productos
- `total_cost_of_purchase`: Lo que realmente se pagó en la compra
- **Diferencia = GANANCIA** (no gasto)

#### 3. Ganancia de Entregas (`system_delivery_profit`)
```python
system_delivery_profit = client_charge - agent_profit - delivery_expenses
```
- `client_charge`: peso × tarifa al cliente por libra
- `agent_profit`: peso × ganancia del agente por libra
- `delivery_expenses`: peso × costo del sistema por libra

---

## 📊 Ejemplo Numérico

### Caso de Uso: Orden Completada en Noviembre 2025

**Productos:**
- Cliente cobra: $1,200
- Gastos del sistema: $900
- **Ganancia de productos**: $300

**Compras:**
- Valor de productos comprados: $1,000
- Lo que se pagó realmente: $850
- **Ganancia de compras**: $150

**Entregas:**
- Cobro al cliente: 10 lbs × $15/lb = $150
- Ganancia del agente: 10 lbs × $3/lb = $30
- Gastos del sistema: 10 lbs × $8/lb = $80
- **Ganancia de entregas**: $150 - $30 - $80 = $40

**Ganancia Total del Sistema**: $300 + $150 + $40 = **$490**

---

## 🔧 Cambios en el Código

### Archivo: `backend/api/views.py`

#### Líneas ~1945-1995 (Función `ProfitReportsView.get`)

**Cambios principales:**

1. **Agregado cálculo de ganancia de productos**:
```python
product_profit = sum(
    float(p.system_profit) for p in products_in_completed_orders
)
```

2. **Corregido cálculo de ganancia de compras**:
```python
purchase_profit = sum(float(p.total_cost_of_purchase) for p in purchases_in_month)
purchase_products_cost = sum(float(p.total_cost_of_shopping) for p in purchases_in_month)
purchase_operational_profit = purchase_products_cost - purchase_profit
```

3. **Corregido cálculo de gastos totales** (sin incluir purchase_operational_profit):
```python
total_expenses = product_expenses + delivery_expenses
```

4. **Corregido cálculo de ganancia del sistema**:
```python
system_profit = product_profit + purchase_operational_profit + system_delivery_profit
```

#### Líneas ~2000-2020 (monthly_reports)

**Agregados nuevos campos**:
```python
'product_profit': float(product_profit),
'purchase_operational_profit': float(purchase_operational_profit),
```

---

## 📈 Impacto en el Dashboard

### Reportes de Ganancias (Reports.tsx)
- ✅ Los ingresos ahora reflejan correctamente las órdenes completadas
- ✅ La ganancia del sistema suma las 3 fuentes de ganancia
- ✅ Los gastos solo incluyen gastos reales (no ganancias de compras)
- ✅ Compatible con campos legacy para mantener funcionalidad

### Métricas que Mejoran
1. **Ganancia del Sistema**: Ahora es más precisa y realista
2. **Margen de Ganancia**: Calculado correctamente sobre ingresos reales
3. **Reportes Mensuales**: Muestran la evolución correcta de ganancias
4. **Ranking de Agentes**: No afectado (solo ganancias por entregas)

---

## 🧪 Verificación

### Pasos para Verificar el Cálculo:

1. **Crear una orden completada** con productos
2. **Verificar en Reports** que los ingresos se muestren
3. **Comparar** con el cálculo manual:
   - Ganancia productos = total_cost - system_expenses
   - Ganancia compras = total_cost_of_shopping - total_cost_of_purchase
   - Ganancia entregas = client_charge - agent_profit - delivery_expenses
   - **Total** = suma de las tres

### Consulta SQL para Verificar:
```sql
-- Ganancia de productos (órdenes completadas del mes)
SELECT SUM(total_cost - (shop_cost + shop_delivery_cost + (shop_cost * 0.07) + added_taxes))
FROM api_product
WHERE order_id IN (
    SELECT id FROM api_order 
    WHERE status = 'Completado' 
    AND DATE(created_at) >= '2025-11-01'
);

-- Ganancia de compras (del mes)
SELECT SUM(total_cost_of_shopping) - SUM(total_cost_of_purchase)
FROM api_shoppingreceip
WHERE DATE(buy_date) >= '2025-11-01';

-- Ganancia de entregas (del mes)
SELECT SUM(client_charge - agent_profit_calculated - delivery_expenses)
FROM api_deliverreceip
WHERE DATE(deliver_date) >= '2025-11-01';
```

---

## ✅ Checklist de Implementación

- [x] Corregir cálculo de `product_profit`
- [x] Corregir cálculo de `purchase_operational_profit`
- [x] Corregir cálculo de `system_profit`
- [x] Actualizar `monthly_reports` con nuevos campos
- [x] Mantener compatibilidad con frontend existente
- [x] Documentar cambios
- [ ] Verificar con datos reales
- [ ] Actualizar frontend si es necesario

---

## 📝 Notas Importantes

1. **Compatibilidad**: Se mantienen los campos legacy (`purchase_operational_expenses`) para no romper el frontend
2. **Ingresos**: Ahora se calculan por órdenes completadas (no solo pagadas)
3. **Gastos**: Solo incluyen gastos reales del sistema
4. **Ganancias**: Se calculan correctamente sumando las 3 fuentes

---

## 🚀 Próximos Pasos

1. Reiniciar el servidor backend
2. Verificar reportes en el dashboard
3. Confirmar que los números tienen sentido
4. Considerar agregar visualización del desglose de ganancias en el frontend

---

**Fecha**: 11 de noviembre de 2025  
**Autor**: GitHub Copilot  
**Versión**: 1.0
