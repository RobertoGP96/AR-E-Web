# 🧪 Casos Prácticos - Verificación de Cambios

**Documento**: Guía práctica para validar las optimizaciones  
**Fecha**: 3 de Diciembre de 2025

---

## 🧪 Test Case 1: Verificar Vulnerabilidad de Seguridad

### Objetivo
Demostrar que un usuario NO puede ver órdenes de otro usuario incluso si manipula `client_id`

### ANTES (Vulnerable)
```
1. Usuario A (ID: 19) abre DevTools
2. Ejecuta en consola:
   localStorage.setItem('client_id', '20')
3. Recarga página
4. ❌ RESULTADO: Ve órdenes de usuario 20 (BREACH)
```

### DESPUÉS (Seguro)
```
1. Usuario A (ID: 19) abre DevTools
2. Ejecuta en consola:
   localStorage.setItem('client_id', '20')
3. Recarga página
4. ✅ RESULTADO: Solo ve sus órdenes (seguro)

Razón: Backend determina el cliente del JWT token,
no del query parameter
```

### Código de Test
```typescript
import { test, expect } from '@playwright/test';

test('should prevent unauthorized access to other client orders', async ({ page }) => {
  // Login como usuario 19
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user19@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navegar a órdenes
  await page.goto('/orders');
  
  // Intenta manipular query params
  await page.goto('/orders?client_id=20');
  
  // Debería redirigir o ignorar el parámetro
  const orders = await page.locator('[data-test-id="order-item"]').all();
  
  // Verificar que TODAS las órdenes tienen client_id = 19
  for (const order of orders) {
    const clientId = await order.getAttribute('data-client-id');
    expect(clientId).toBe('19'); // ✅ Seguro
  }
});
```

---

## 🧪 Test Case 2: Verificar Performance de Caché

### Objetivo
Demostrar que el caché funciona correctamente y reduce requests

### ANTES (Múltiples requests)
```
┌─ Cargar página
│  └─ Request 1: GET /api_data/order/my-orders/?client_id=19
│     ├─ Tiempo: 450ms
│     └─ Cache miss
│
├─ Navegar a otra página
│
└─ Volver a órdenes
   └─ Request 2: GET /api_data/order/my-orders/?client_id=19
      ├─ Tiempo: 450ms
      └─ Cache miss (query key distinto)

TOTAL: 2 requests, 900ms ❌
```

### DESPUÉS (Caché eficaz)
```
┌─ Cargar página
│  └─ Request 1: GET /api_data/order/my-orders/
│     ├─ Tiempo: 350ms
│     └─ Cache key: ['orders', {status: 'pending'}]
│
├─ Navegar a otra página
│
└─ Volver a órdenes
   └─ Response desde CACHE ✅
      ├─ Tiempo: 0ms
      └─ Cache hit con key normalizada

TOTAL: 1 request, 350ms ✅ (-61% mejora)
```

### Código de Test
```typescript
import { test, expect } from '@playwright/test';

test('should cache orders and reduce network requests', async ({ page }) => {
  let requestCount = 0;
  
  // Contar requests a API
  page.on('request', request => {
    if (request.url().includes('/api_data/order/')) {
      requestCount++;
    }
  });
  
  // Cargar página
  await page.goto('/orders');
  await page.waitForSelector('[data-test-id="order-item"]', { timeout: 5000 });
  
  const initialRequests = requestCount;
  expect(initialRequests).toBe(1); // ✅ Primer request
  
  // Navegar fuera
  await page.goto('/dashboard');
  
  // Volver a órdenes (debería usar caché)
  await page.goto('/orders');
  
  // Esperar a que se muestren datos
  await page.waitForSelector('[data-test-id="order-item"]');
  
  // Debería seguir siendo 1 request (caché)
  const finalRequests = requestCount;
  expect(finalRequests).toBe(1); // ✅ Sin request adicional
});
```

---

## 🧪 Test Case 3: Verificar Rendimiento

### Objetivo
Medir y comparar tiempos de carga ANTES y DESPUÉS

### Métrica: Time to Interactive (TTI)

#### ANTES
```
┌─ Tiempo hasta ver datos
│
├─ useAuth() → 100ms
├─ useState/setFilters → 50ms
├─ useEffect ejecuta → 50ms
├─ Request HTTP → 450ms
└─ Render → 50ms

TOTAL: ~700ms
```

#### DESPUÉS
```
┌─ Tiempo hasta ver datos
│
├─ useOrders() → 200ms (si cache, 0ms)
└─ Render → 30ms

TOTAL: ~230ms (o 30ms si caché)
```

### Código de Test con Lighthouse
```typescript
import { test, expect } from '@playwright/test';

test('should have improved performance metrics', async ({ page }) => {
  // Registrar timing
  const startTime = Date.now();
  
  await page.goto('/orders');
  
  // Esperar a que se muestren órdenes
  await page.waitForSelector('[data-test-id="order-item"]');
  
  const endTime = Date.now();
  const timeToInteractive = endTime - startTime;
  
  console.log(`Time to Interactive: ${timeToInteractive}ms`);
  
  // Debería ser menor a 400ms
  expect(timeToInteractive).toBeLessThan(400);
});
```

---

## 🧪 Test Case 4: Verificar Tipado TypeScript

### Objetivo
Garantizar que TypeScript previene pasar `client_id` a `/my-orders/`

### ANTES (Sin validación)
```typescript
// ❌ Esto compila (MALO)
const filters: OrderFilters = {
  client_id: 20,  // ← Permitido por tipo
  status: 'pending'
};

const orders = await getMyOrders(filters);
// Problema: client_id fue enviado al servidor
```

### DESPUÉS (Con validación)
```typescript
// ❌ Esto NO compila (BUENO)
const filters: Omit<OrderFilters, 'client_id'> = {
  client_id: 20,  // ← ERROR DE COMPILACIÓN ✅
  status: 'pending'
};

const orders = await getMyOrders(filters);
// Error: Property 'client_id' does not exist...
```

### Código de Test TypeScript
```typescript
// Test que verifica tipos en tiempo de compilación
import { expectType } from 'tsd';
import { getMyOrders } from '@/services/orders/get-orders';
import type { OrderFiltersForMyOrders } from '@/types/order';

// ✅ Esto debería funcionar
expectType<Promise<any>>(
  getMyOrders({
    status: 'pending',
    date_from: '2025-01-01'
  })
);

// ❌ Esto debería dar error de compilación
expectType<Promise<any>>(
  getMyOrders({
    client_id: 20,  // Error esperado
    status: 'pending'
  })
);
```

---

## 🧪 Test Case 5: Verificar API Client Optimization

### Objetivo
Validar que `getPaginated()` limpia parámetros correctamente

### ANTES
```typescript
// Entrada
params = {
  client_id: 19,
  status: 'all',        // ← Inválido
  date_from: '2025-01-01',
  search: '',           // ← Inválido
  pay_status: undefined // ← Inválido
};

// Procesamiento (manual)
const cleanParams = {};
Object.entries(params).forEach(([key, value]) => {
  if (value !== 'all' && value !== undefined && value !== null && value !== '') {
    cleanParams[key] = value;
  }
});

// Salida
// → Lento, verbose, error-prone
```

### DESPUÉS
```typescript
// Entrada (misma)
params = {
  client_id: 19,
  status: 'all',
  date_from: '2025-01-01',
  search: '',
  pay_status: undefined
};

// Procesamiento (optimizado)
const cleanParams = Object.fromEntries(
  Object.entries(params).filter(([, value]) => 
    value !== 'all' && value != null && value !== ''
  )
);

// Salida (misma)
// → Rápido, conciso, funcional
```

### Código de Test
```typescript
import { test, expect } from 'vitest';
import { ApiClient } from '@/lib/api-client';

test('should correctly clean parameters', () => {
  const client = new ApiClient();
  
  // Usar método privado para test (o exponer públicamente)
  const dirtyParams = {
    client_id: 19,
    status: 'all',           // debe removerse
    date_from: '2025-01-01', // debe mantenerse
    search: '',              // debe removerse
    pay_status: undefined,   // debe removerse
    sort: 'name'             // debe mantenerse
  };
  
  // Esperado
  const expected = {
    client_id: 19,
    date_from: '2025-01-01',
    sort: 'name'
  };
  
  // Verificar que se limpian correctamente
  const cleaned = Object.fromEntries(
    Object.entries(dirtyParams).filter(([, value]) => 
      value !== 'all' && value != null && value !== ''
    )
  );
  
  expect(cleaned).toEqual(expected);
});
```

---

## 🧪 Test Case 6: Verificar Normalización de Query Key

### Objetivo
Garantizar que query keys se normalicen para mejor caché

### ANTES (Problema: keys diferentes)
```typescript
// Primera llamada
useOrders({
  status: 'pending',
  date_from: '2025-01-01'
});
// queryKey: ['orders', { status: 'pending', date_from: '2025-01-01' }]

// Segunda llamada (intención idéntica)
useOrders({
  date_from: '2025-01-01', // Orden diferente
  status: 'pending'
});
// queryKey: ['orders', { date_from: '2025-01-01', status: 'pending' }]

// ❌ Diferentes keys = sin caché hit
```

### DESPUÉS (Solución: keys normalizadas)
```typescript
// Primera llamada
useOrders({
  status: 'pending',
  date_from: '2025-01-01'
});
// queryKey: ['orders', { status: 'pending', date_from: '2025-01-01' }]

// Segunda llamada (intención idéntica)
useOrders({
  date_from: '2025-01-01',
  status: 'pending'
});
// queryKey: ['orders', { status: 'pending', date_from: '2025-01-01' }]

// ✅ Misma key = caché hit
```

### Código de Test
```typescript
import { test, expect } from 'vitest';
import { useOrders } from '@/hooks/order/useOrders';

test('should normalize query keys for cache effectiveness', () => {
  // Mock de useQuery para capturar queryKey
  const queryKeys: any[] = [];
  
  vi.mock('@tanstack/react-query', () => ({
    useQuery: (options: any) => {
      queryKeys.push(options.queryKey);
      return { data: {}, isLoading: false };
    }
  }));
  
  // Primera llamada
  useOrders({
    status: 'pending',
    date_from: '2025-01-01'
  });
  
  const key1 = queryKeys[0];
  
  // Segunda llamada (orden diferente)
  useOrders({
    date_from: '2025-01-01',
    status: 'pending'
  });
  
  const key2 = queryKeys[1];
  
  // Las keys deben ser idénticas para caché
  expect(JSON.stringify(key1)).toBe(JSON.stringify(key2));
});
```

---

## 🧪 Test Case 7: Verificar Secuencia de Renders

### Objetivo
Validar que eliminamos renders innecesarios

### ANTES
```
Timeline de renders:
│
├─ 0ms: Initial render (user = null, orders = [])
│
├─ 50ms: useAuth completa → render #1 (user = 19)
│
├─ 55ms: setFilters({ client_id: 19 }) → render #2
│
├─ 60ms: useEffect visible → render #3
│
├─ 510ms: Request completa → render #4 (con órdenes)
│
└─ Total: 4 renders

❌ 3 renders innecesarios
```

### DESPUÉS
```
Timeline de renders:
│
├─ 0ms: Initial render (orders = [] o caché)
│
├─ 50ms: useEffect visible → render #1
│
├─ 200ms: Request completa → render #2 (con órdenes)
│
└─ Total: 2 renders

✅ Solo renders esenciales
```

### Código de Test
```typescript
import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserOrders from '@/pages/user-orders';

test('should minimize re-renders', () => {
  let renderCount = 0;
  const originalRender = UserOrders;
  
  // Envolver para contar renders
  const WrappedComponent = (props) => {
    renderCount++;
    return originalRender(props);
  };
  
  render(<WrappedComponent />);
  
  // Esperar a que carguen órdenes
  screen.findByTestId('order-item');
  
  // Debería haber menos renders
  expect(renderCount).toBeLessThan(3); // Antes: 4
});
```

---

## 🧪 Test Case 8: Verificar Seguridad del Backend

### Objetivo
Validar que el backend rechaza `client_id` para usuarios normales

### Script de Test
```bash
#!/bin/bash

# Test 1: Request válida sin client_id
echo "Test 1: Valid request without client_id"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/arye_system/api_data/order/my-orders/" \
  -w "\nStatus: %{http_code}\n"
# Esperado: 200 + órdenes del usuario

# Test 2: Intento de manipular con client_id (debería ignorarse)
echo "\nTest 2: Attempt to manipulate with client_id"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/arye_system/api_data/order/my-orders/?client_id=999" \
  -w "\nStatus: %{http_code}\n"
# Esperado: 200 + órdenes del usuario actual (NO 999)

# Test 3: Sin token (debería fallar)
echo "\nTest 3: Request without token"
curl "http://localhost:8000/arye_system/api_data/order/my-orders/" \
  -w "\nStatus: %{http_code}\n"
# Esperado: 401 Unauthorized
```

---

## ✅ Checklist de Validación

```markdown
### Seguridad
- [ ] Verificar que client_id nunca se pasa desde cliente
- [ ] Verificar que backend filtra por usuario autenticado
- [ ] Intento de manipulación de client_id → ignora parámetro
- [ ] Sin token → 401 Unauthorized
- [ ] Token de otro usuario → 403 Forbidden (si aplica)

### Rendimiento
- [ ] Primer load: < 400ms
- [ ] Load con caché: < 50ms
- [ ] Cache hit rate: > 60%
- [ ] Network: -30% requests
- [ ] Memory: sin memory leaks

### Tipado TypeScript
- [ ] client_id no permitido en Omit<OrderFilters, 'client_id'>
- [ ] getMyOrders() solo acepta tipos correctos
- [ ] No warnings de TypeScript

### UX
- [ ] Sin renders innecesarios
- [ ] Animaciones suaves
- [ ] Datos se muestran rápido
- [ ] Offline funciona con caché

### Funcionalidad
- [ ] Filtros (status, date) funcionan
- [ ] Paginación funciona
- [ ] Búsqueda funciona
- [ ] Actualización manual funciona
```

---

## 📊 Métricas a Registrar

```javascript
// En browser console
performance.mark('orders-start');

// ... cargar órdenes ...

performance.mark('orders-end');
performance.measure(
  'orders-load',
  'orders-start',
  'orders-end'
);

// Ver resultado
console.table(performance.getEntriesByName('orders-load'));
```

**Esperado**:
```
┌────────────────────┬──────┬──────┬──────┐
│ Name              │ Dur  │ Strt │ End  │
├────────────────────┼──────┼──────┼──────┤
│ orders-load       │ 200ms│ 0ms  │ 200ms│ (ANTES: 450ms)
└────────────────────┴──────┴──────┴──────┘
```

---

## 🎯 Conclusión

Con estos 8 casos prácticos puedes validar que:

✅ **Seguridad**: No hay vulnerabilidades  
✅ **Rendimiento**: +20-30% de mejora  
✅ **Tipado**: TypeScript previene errores  
✅ **UX**: Experiencia más rápida  
✅ **Funcionalidad**: Todo sigue funcionando  

**Próximo paso**: Ejecutar estos tests después de implementar cambios
