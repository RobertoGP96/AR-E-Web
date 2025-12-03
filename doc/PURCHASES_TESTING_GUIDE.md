# 🧪 Guía de Testing - Servicio de Compras

## ✅ Testing en el Backend

### 1. Verificar que el servicio se importa correctamente

```python
# Desde shell de Django
python manage.py shell

from api.services.purchases_service import analyze_purchases, get_purchases_summary
from datetime import datetime
from django.utils import timezone

# Probar la función
start_date = datetime(2025, 1, 1)
start_date = timezone.make_aware(start_date)
end_date = datetime(2025, 12, 31)
end_date = timezone.make_aware(end_date)

result = analyze_purchases(start_date=start_date, end_date=end_date)
print(result)
```

### 2. Probar los endpoints con curl

#### Obtener análisis completo de compras:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/arye_system/api_data/reports/purchases/?start_date=2025-01-01&end_date=2025-12-31"
```

#### Obtener resumen rápido:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/arye_system/api_data/reports/purchases/summary/?start_date=2025-01-01&end_date=2025-12-31"
```

#### Obtener análisis de productos comprados:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/arye_system/api_data/reports/purchases/products/?start_date=2025-01-01&end_date=2025-12-31"
```

### 3. Verificar en Swagger/OpenAPI

1. Ir a: `http://localhost:8000/api/docs/`
2. Buscar `/api_data/reports/purchases/`
3. Hacer clic en "Try it out"
4. Agregar parámetros `start_date` y `end_date`
5. Ejecutar y ver respuesta

### 4. Validar estructura de datos

La respuesta debe incluir:
```json
{
  "success": true,
  "data": {
    "count": 10,
    "total_purchase_amount": 1500.00,
    "total_refunded": 150.00,
    "total_real_cost_paid": 1350.00,
    "total_operational_expenses": 50.00,
    "total_products_bought": 45,
    "average_purchase_amount": 150.00,
    "refund_rate_percentage": 10.0,
    "purchases_by_status": {
      "PAGADO": 5,
      "NO_PAGADO": 5
    },
    "purchases_by_shop": {
      "Tienda A": {...},
      "Tienda B": {...}
    },
    "purchases_by_account": {
      "Cuenta 1": {...},
      "Cuenta 2": {...}
    },
    "monthly_trend": [...]
  }
}
```

---

## ✅ Testing en el Frontend

### 1. Verificar que el componente carga sin errores

```bash
cd apps/admin
pnpm dev
```

### 2. Navegar al BalanceReport

1. Ir a la página del Balance Report
2. Verificar en la consola del navegador que no hay errores
3. Seleccionar un rango de fechas
4. Esperar a que cargue la sección "Compras"

### 3. Pruebas visuales

- [ ] La sección "Compras" aparece con el ícono correcto
- [ ] Las 5 métricas principales se muestran con valores
- [ ] El "Costo Neto" está destacado (más oscuro/color primario)
- [ ] Los valores están formateados en USD
- [ ] Las tablas se renderizan correctamente
- [ ] En móvil, el grid de métricas es de 2 columnas
- [ ] En desktop, el grid de métricas es de 5 columnas
- [ ] Las tablas tienen scroll horizontal en móvil

### 4. Pruebas de datos

#### Métricas principales
```javascript
// Abrir DevTools > Console
// Verificar que los valores sean consistentes
const metrics = {
  total_purchase_amount,
  total_refunded,
  total_operational_expenses
};
// total_real_cost_paid debe ser ≈ total_purchase_amount - total_refunded
```

#### Desglose por tienda
- Verificar que la suma de montos por tienda ≈ monto total
- Verificar que hay al menos 1 tienda

#### Desglose por cuenta
- Verificar que cada cuenta tiene datos
- Verificar que montos son coherentes

#### Tendencia mensual
- Verificar que los meses están en orden cronológico
- Verificar que net_cost = total_purchase_amount - total_refunded

#### Resumen de reembolsos
- `Con Reembolsos + Sin Reembolsos = Total Compras`
- `% Reembolso = (Con Reembolsos / Total Compras) * 100`

### 5. Pruebas de manejo de errores

#### Caso: Rango sin datos
1. Seleccionar rango de fechas muy antiguo (2020-01-01 a 2020-12-31)
2. Verificar que muestra "No hay datos de compras para el rango seleccionado"

#### Caso: Error en la API
1. En DevTools, simular error de red (Network > Offline)
2. Recargar componente
3. Verificar que muestra "Error cargando compras: ..."

#### Caso: Carga lenta
1. En DevTools Network > Slow 3G
2. Verificar que muestra spinner de carga
3. Verificar que no hay múltiples requests

### 6. Pruebas de responsividad

#### Desktop (1920x1080)
```
Métricas: 5 columnas en una fila
Tablas: Todas visibles sin scroll horizontal
```

#### Tablet (768x1024)
```
Métricas: 5 columnas (puede necesitar scroll)
Tablas: Requieren scroll horizontal
```

#### Móvil (375x667)
```
Métricas: 2 columnas en dos filas
Tablas: Scroll horizontal requerido
Cards: Stack vertical completo
```

### 7. Pruebas de interacción

- [ ] Cambiar rango de fechas → compras se actualizan
- [ ] Cambiar a preset "1m" → datos correctos
- [ ] Cambiar a preset "3m" → datos correctos
- [ ] Cambiar a preset "6m" → datos correctos
- [ ] Cambiar a preset "12m" → datos correctos
- [ ] Cambiar a rango personalizado → datos correctos
- [ ] Los badges en tiendas/cuentas son clickeables (sin error)

---

## 🔍 Debugging

### Console Log disponible:
```javascript
// En get-purchases.ts
console.error('Error fetching purchases analysis:', error);
```

### Network Tab (DevTools)
- Buscar requests a `/api_data/reports/purchases/`
- Verificar:
  - Status 200 (OK)
  - Response time < 2s
  - Payload tamaño razonable

### React DevTools
- Inspeccionar componente `BalanceReport`
- Verificar props de `purchasesAnalysis`
- Verificar estado de `isLoadingPurchases`, `purchasesError`

---

## 📋 Checklist de Validación

### Backend
- [ ] `purchases_service.py` existe y se importa correctamente
- [ ] Las 3 vistas están definidas en `reports_views.py`
- [ ] Las 3 rutas están en `api_urls.py`
- [ ] Endpoints responden con status 200
- [ ] Datos retornados tienen estructura correcta
- [ ] Manejo de errores funciona (401 sin token, 403 sin permisos)

### Frontend
- [ ] Importes de servicios sin errores
- [ ] Tipos TypeScript válidos
- [ ] Query de React carga datos correctamente
- [ ] Componente renderiza sin errores de console
- [ ] Sección "Compras" visible en BalanceReport
- [ ] Todos los datos muestran con formato correcto
- [ ] Tablas renderizan todas las filas
- [ ] Manejo de casos vacíos/error funciona

### Visual
- [ ] Colores consistentes (púrpura)
- [ ] Ícono ShoppingCart visible
- [ ] Espaciado correcto
- [ ] Texto legible
- [ ] Responsividad en todos los breakpoints
- [ ] Animaciones suaves (hover effects)

### Rendimiento
- [ ] Carga completa < 3s
- [ ] Sin requests duplicados
- [ ] Sin memory leaks en console
- [ ] Cache funciona (staleTime: 5 min)

---

## 📝 Ejemplo de Salida Esperada

```
SECCIÓN COMPRAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Métricas Principales:
┌────────┬──────────────┬──────────────┬────────────┬──────────────┐
│Compras │ Monto Total  │ Reembolsos   │ Gastos Op. │ Costo Neto   │
├────────┼──────────────┼──────────────┼────────────┼──────────────┤
│   12   │  $1,500.00   │   $150.00    │  $50.00    │  $1,300.00 ✓ │
└────────┴──────────────┴──────────────┴────────────┴──────────────┘

Desglose por Tienda:
┌─────────────┬─────────┬──────────────┬──────────────┬────────────┐
│   Tienda    │ Compras │  Monto Total │ Reembolsos   │Costo Neto  │
├─────────────┼─────────┼──────────────┼──────────────┼────────────┤
│ Tienda A    │    6    │   $800.00    │   $80.00     │ $720.00    │
│ Tienda B    │    6    │   $700.00    │   $70.00     │ $630.00    │
└─────────────┴─────────┴──────────────┴──────────────┴────────────┘

Resumen de Reembolsos:
┌──────────────────┬──────────────────┬──────────────┬─────────────┐
│ Con Reembolsos   │ Sin Reembolsos   │ % Reembolso  │   Productos │
├──────────────────┼──────────────────┼──────────────┼─────────────┤
│        8         │        4         │    66.7%     │      45     │
└──────────────────┴──────────────────┴──────────────┴─────────────┘
```

---

## 🚀 Próximas Validaciones

1. **Test end-to-end**: Con datos reales de producción
2. **Performance**: Con 1000+ registros de compras
3. **Edge cases**: 
   - Compras sin reembolsos
   - Compras sin tienda asignada
   - Compras sin cuenta asignada
   - Fechas inversa (end < start)
4. **Concurrent requests**: Múltiples usuarios consultando al mismo tiempo

---

**✅ Sigue esta guía para validar que todo funcione correctamente**
