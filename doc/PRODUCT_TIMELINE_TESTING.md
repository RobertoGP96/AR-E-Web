# 🧪 Testing - Product Timeline

## 📋 Guía de Pruebas del Sistema de Timeline

### Requisitos Previos
- ✅ Backend ejecutándose en `http://localhost:8000`
- ✅ Frontend ejecutándose en `http://localhost:5173`
- ✅ Usuario autenticado en el panel admin
- ✅ Al menos un producto con eventos (buys, receiveds, delivers)

## 🔍 Testing Manual

### 1. Verificar Endpoint Backend

#### 1.1 Con cURL
```bash
# Reemplazar {token} y {product-id}
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api_data/product/{product-id}/timeline/
```

#### 1.2 Con Postman
1. Abirir Postman
2. Nueva request GET
3. URL: `http://localhost:8000/api_data/product/{product-id}/timeline/`
4. Headers: `Authorization: Bearer {token}`
5. Enviar
6. Verificar que retorna estructura esperada

#### 1.3 Respuesta Esperada
```json
{
  "id": "uuid-del-producto",
  "name": "Nombre del Producto",
  "status": "ENTREGADO",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-02T15:30:00Z",
  "amount_requested": 5,
  "amount_purchased": 5,
  "amount_received": 5,
  "amount_delivered": 5,
  "buys": [
    {
      "id": 1,
      "buy_date": "2025-12-01T10:30:00Z",
      "amount_buyed": 5,
      "created_at": "2025-12-01T10:30:00Z"
    }
  ],
  "receiveds": [
    {
      "id": 1,
      "amount_received": 5,
      "created_at": "2025-12-01T18:00:00Z"
    }
  ],
  "delivers": [
    {
      "id": 1,
      "amount_delivered": 5,
      "created_at": "2025-12-02T09:00:00Z"
    }
  ]
}
```

### 2. Testing Frontend

#### 2.1 Abrir Página del Producto
1. Navegar al panel admin
2. Ir a Productos
3. Clickear en un producto
4. Verificar que la timeline aparece al final

#### 2.2 Verificar Estados de Carga
```javascript
// En DevTools Console
// Esperar a que cargue la página
setTimeout(() => {
  console.log('Timeline cargada');
}, 2000);
```

#### 2.3 Inspeccionar Datos en DevTools
1. Abrir DevTools (F12)
2. Ir a Network
3. Filtrar por `timeline`
4. Hacer refresh de la página
5. Ver request a `/api_data/product/*/timeline/`
6. Verificar Response

#### 2.4 Verificar Componente React
```javascript
// En React DevTools Console
// Buscar el componente ProductTimeline
// Verificar props y state
```

### 3. Estados Visuales

#### 3.1 Verificar Timeline Completo (4 eventos)
- [ ] Evento "Registro Creado" visible
- [ ] Evento "Comprado" visible
- [ ] Evento "Recibido" visible
- [ ] Evento "Entregado" visible
- [ ] Línea de gradiente azul-amarillo-verde visible
- [ ] Fechas en formato español (es-AR)
- [ ] Íconos correctos para cada evento

#### 3.2 Verificar Estado de Carga
1. Abrir DevTools Network
2. Throttle a "Slow 3G"
3. Refrescar página
4. Verificar spinner de carga
5. Verificar que desaparece cuando carga

#### 3.3 Verificar Estado de Error
1. Desconectar la red (DevTools Network)
2. Ir a página de producto
3. Verificar mensaje de error
4. Verificar icono de error

#### 3.4 Verificar Leyenda de Estados
1. Scroll a la parte inferior de la timeline
2. Verificar leyenda visible
3. Verificar colores de estados:
   - Comprado: Azul
   - Recibido: Amarillo
   - Entregado: Verde
   - Pendiente: Gris

### 4. Responsividad

#### 4.1 Desktop (1440px+)
1. Abrir página en monitor 1440px+
2. Verificar layout completo
3. Verificar textos visibles

#### 4.2 Tablet (768px)
1. F12 → Device Toolbar
2. Seleccionar iPad
3. Verificar timeline adaptada
4. Verificar textos legibles

#### 4.3 Mobile (375px)
1. F12 → Device Toolbar
2. Seleccionar iPhone
3. Verificar timeline en mobile
4. Verificar scroll horizontal no necesario
5. Verificar textos legibles

### 5. Testing de Seguridad

#### 5.1 Autenticación Requerida
```bash
# Sin token debe retornar 401
curl http://localhost:8000/api_data/product/{id}/timeline/
# Respuesta esperada: HTTP 401 Unauthorized
```

#### 5.2 Autorización (Roles)
1. **Admin**: Puede ver todos los productos
2. **Agent**: Solo ve productos de sus órdenes
3. **Client**: Solo ve productos de sus órdenes
4. **Logistical**: Ver según configuración

### 6. Testing de Performance

#### 6.1 Tiempo de Carga
1. DevTools → Network
2. Refrescar página
3. Observar tiempo de:
   - Producto principal
   - Timeline (debe ser similar o más rápido)

#### 6.2 Tamaño de Request
1. DevTools → Network
2. Filtrar por `timeline`
3. Verificar que tamaño es menor a 5KB

#### 6.3 Cache
1. Primera carga del timeline
2. Navegar a otra página
3. Volver al producto
4. Timeline debe cargar desde cache (ms)

## ✅ Checklist de Testing

### Backend
- [ ] Endpoint retorna 200 OK
- [ ] Estructura JSON correcta
- [ ] Fechas en ISO 8601 format
- [ ] Relaciones (buys, receiveds, delivers) presentes
- [ ] Cantidades correctas
- [ ] Requiere autenticación
- [ ] Respeta permisos por rol

### Frontend
- [ ] Timeline visible en página de producto
- [ ] Estados de carga correctos
- [ ] Manejo de errores correcto
- [ ] Eventos mostrados en orden cronológico
- [ ] Fechas formateadas en español
- [ ] Íconos correctos
- [ ] Colores correctos
- [ ] Leyenda visible
- [ ] Responsive en todos los tamaños

### Visual
- [ ] Línea de gradiente visible
- [ ] Puntos circulares con iconos
- [ ] Tarjetas con información
- [ ] Checkmark en eventos completados
- [ ] Sin errores de layout
- [ ] Tema oscuro/claro funciona

### Performance
- [ ] Carga en < 2 segundos
- [ ] No hay layout shifts
- [ ] Cache funciona
- [ ] Request size < 5KB

## 🐛 Debugging

### El timeline no aparece
```bash
# Verificar endpoint
curl -v http://localhost:8000/api_data/product/{id}/timeline/

# Ver logs del servidor
tail -f backend/logs/django.log
```

### Las fechas no están formateadas
```javascript
// En DevTools console
new Date('2025-12-01T10:00:00Z').toLocaleDateString('es-AR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
```

### El hook no obtiene datos
```javascript
// En React DevTools
// Verificar que useProductTimeline retorna datos
console.log('Timeline data:', timeline);
```

### Los eventos no están en orden
```javascript
// Verificar que los eventos están ordenados por fecha
timeline.buys.sort((a, b) => new Date(a.buy_date) - new Date(b.buy_date));
```

## 📊 Casos de Prueba Específicos

### Caso 1: Producto sin eventos
**Esperado:** "No hay eventos registrados para este producto"
```json
{
  "buys": [],
  "receiveds": [],
  "delivers": []
}
```

### Caso 2: Producto con solo compra
**Esperado:** 2 eventos (Creado, Comprado)
```json
{
  "buys": [{...}],
  "receiveds": [],
  "delivers": []
}
```

### Caso 3: Producto con compra y recepción
**Esperado:** 3 eventos (Creado, Comprado, Recibido)
```json
{
  "buys": [{...}],
  "receiveds": [{...}],
  "delivers": []
}
```

### Caso 4: Producto completamente procesado
**Esperado:** 4 eventos (Creado, Comprado, Recibido, Entregado)
```json
{
  "buys": [{...}],
  "receiveds": [{...}],
  "delivers": [{...}]
}
```

### Caso 5: Producto con múltiples compras
**Esperado:** Mostrar cantidad total en evento "Comprado"
```json
{
  "buys": [
    {"amount_buyed": 3, ...},
    {"amount_buyed": 2, ...}
  ]
  // Total: 5
}
```

## 🚀 Testing en Producción

### Pre-Deployment Checklist
- [ ] All tests pass locally
- [ ] No console errors
- [ ] Network requests OK
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Accessibility verified
- [ ] Documentation updated

### Post-Deployment Verification
1. Verificar que endpoint es accesible
2. Probar con usuarios reales
3. Monitorear logs de errores
4. Verificar performance metrics
5. Validar datos con sample

## 📝 Reportar Issues

Si encuentra problemas:

1. **Recopilar información:**
   - URL de la página
   - Navegador y versión
   - Screenshot o video
   - Console errors (DevTools)
   - Network requests

2. **Reportar en:**
   - GitHub Issues
   - Slack
   - Email: support@example.com

3. **Formato de reporte:**
   ```markdown
   ## Problema: [Título]
   
   ### Descripción
   [Descripción del problema]
   
   ### Pasos para reproducir
   1. [Paso 1]
   2. [Paso 2]
   
   ### Comportamiento esperado
   [Lo que debería suceder]
   
   ### Comportamiento actual
   [Lo que sucede realmente]
   
   ### Información técnica
   - Navegador: [Navegador y versión]
   - SO: [Sistema operativo]
   - Screenshot: [Adjuntar]
   ```

---

**✅ Testing Guide Completa - Ready to Test**
