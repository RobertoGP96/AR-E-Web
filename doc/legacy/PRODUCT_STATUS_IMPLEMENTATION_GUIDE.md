# 🔧 GUÍA DE IMPLEMENTACIÓN: ProductStatusService

**Documento:** Solución para la lógica de cambio de estado de productos
**Fecha:** 6 de febrero de 2026
**Status:** LISTA PARA IMPLEMENTAR

---

## 📋 CAMBIOS REALIZADOS

### 1. Nuevo Servicio: `api/services/product_status_service.py`
Centraliza toda la lógica de actualización de estados.

**Métodos principales:**
- `recalculate_product_status(product)` - Recalcula estado
- `verify_product_consistency(product)` - Verifica consistencia sin cambiar
- `fix_product_consistency(product)` - Corrige inconsistencias

**Características:**
- ✓ Usa `select_for_update()` para evitar race conditions
- ✓ Transacciones atómicas
- ✓ Logging completo
- ✓ Solo guarda si hay cambios

---

### 2. Signals Refactorizados: `api/signals.py`
Ahora usan el nuevo servicio.

**Cambios:**
- `update_product_on_buyed_save()` → usa ProductStatusService
- `update_product_on_buyed_delete()` → usa ProductStatusService
- `update_product_on_received_save()` → usa ProductStatusService
- `update_product_on_received_delete()` → usa ProductStatusService
- `update_product_on_delivery_save()` → usa ProductStatusService
- `update_product_on_delivery_delete()` → usa ProductStatusService

**Beneficios:**
- ✓ Código más limpio
- ✓ Lógica centralizada
- ✓ Más fácil de debuggear
- ✓ Manejo de errores mejorado

---

### 3. Management Command: `api/management/commands/diagnose_product_status.py`
Herramienta para diagnosticar y fijar problemas.

**Uso:**
```bash
# Diagnosticar todos los productos
python manage.py diagnose_product_status

# Diagnosticar un producto específico
python manage.py diagnose_product_status --product-id <uuid>

# Fijar inconsistencias encontradas
python manage.py diagnose_product_status --fix

# Ver detalles verbosos
python manage.py diagnose_product_status --verbose
```

---

## ✅ PASOS DE IMPLEMENTACIÓN

### Paso 1: Validar que ProductStatusService Funciona
```bash
cd backend

# Verificar que el servicio se importa correctamente
python manage.py shell
>>> from api.services.product_status_service import ProductStatusService
>>> print(ProductStatusService)
<class 'api.services.product_status_service.ProductStatusService'>
```

### Paso 2: Ejecutar Diagnóstico Inicial
```bash
# Ver estado actual de los productos (sin cambios)
python manage.py diagnose_product_status --verbose

# Ejemplo de salida:
# Total de productos: 45
# Consistentes: 43
# Inconsistentes: 2
```

### Paso 3: Fijar Inconsistencias
```bash
# Fijar todos los productos inconsistentes
python manage.py diagnose_product_status --fix

# Ejemplo de salida:
# ❌ Producto abc123: "Product Name"
#    - amount_purchased inconsistente: BD=5, Calculado=10
#    - status inconsistente: BD=Encargado, Esperado=Comprado
#    ✓ Producto corregido
```

### Paso 4: Verificar que los Tests Pasen
```bash
# Ejecutar tests (cuando estén implementados)
python manage.py test api.tests.test_product_status_updates

# Ejemplo:
# test_status_changes_to_comprado_on_full_purchase ... ok
# test_status_changes_to_recibido_on_full_reception ... ok
# test_status_changes_to_entregado_on_full_delivery ... ok
# test_status_reverts_on_refund ... ok
# 
# Ran 4 tests in 0.123s
# OK
```

### Paso 5: Monitorear en Producción
```bash
# Verificar logs para asegurar que los signals se ejecutan
tail -f logs/django.log | grep "Actualizando estado del producto"

# Debería mostrar:
# INFO: Producto 123e4567-e89b-12d3-a456-426614174000 (Product Name) actualizado: amount_purchased: 5 → 10, status: Encargado → Comprado
```

---

## 🧪 CASOS DE PRUEBA

### Test 1: Cambio de ENCARGADO a COMPRADO
```python
# Crear producto
product = Product.objects.create(
    name="Test Product",
    amount_requested=10,
    shop_cost=100
)

# Crear compra
ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=10
)

# Verificar
product.refresh_from_db()
assert product.amount_purchased == 10
assert product.status == "Comprado"
```

**Esperado:** ✓ PASA

---

### Test 2: Cambio de COMPRADO a RECIBIDO
```python
# Suponiendo que ya hay una compra (ver Test 1)

# Crear recepción
ProductReceived.objects.create(
    original_product=product,
    amount_received=10
)

# Verificar
product.refresh_from_db()
assert product.amount_received == 10
assert product.status == "Recibido"
```

**Esperado:** ✓ PASA

---

### Test 3: Cambio de RECIBIDO a ENTREGADO
```python
# Suponiendo que ya hay una recepción (ver Test 2)

# Crear entrega
ProductDelivery.objects.create(
    original_product=product,
    amount_delivered=10
)

# Verificar
product.refresh_from_db()
assert product.amount_delivered == 10
assert product.status == "Entregado"
```

**Esperado:** ✓ PASA

---

### Test 4: Reembolso revierte estado
```python
# Suponiendo que hay una compra completa (ver Test 1)

# Actualizar con reembolso
buyed = ProductBuyed.objects.first()
buyed.quantity_refuned = 2
buyed.save()

# Verificar
product.refresh_from_db()
assert product.amount_purchased == 8  # 10 - 2
assert product.status == "Encargado"   # Revierte
```

**Esperado:** ✓ PASA

---

### Test 5: Múltiples transacciones parciales
```python
# Crear 2 compras parciales
ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=5
)

ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=5
)

# Verificar
product.refresh_from_db()
assert product.amount_purchased == 10
assert product.status == "Comprado"
```

**Esperado:** ✓ PASA

---

### Test 6: Verificación de consistencia
```python
# Usar el servicio para verificar
report = ProductStatusService.verify_product_consistency(product)

assert report['is_consistent'] == True
assert len(report['inconsistencies']) == 0
```

**Esperado:** ✓ PASA

---

## 📊 MONITOREO Y VALIDACIÓN

### Logs Esperados
```
INFO:api.services.product_status_service:Producto 123e... actualizado: amount_purchased: 5 → 10, status: Encargado → Comprado
INFO:api.services.product_status_service:Producto 123e... actualizado: amount_received: 5 → 10, status: Comprado → Recibido
INFO:api.services.product_status_service:Producto 123e... actualizado: amount_delivered: 10 → 10, status: Recibido → Entregado
```

### Métricas a Monitorear
1. **Tiempo de actualización:** < 100ms
2. **Errores en signals:** 0
3. **Inconsistencias después del fix:** 0
4. **Tasa de race conditions:** 0

---

## 🚨 ROLLBACK (si es necesario)

Si hay problemas, revertir a la versión anterior:

### Opción 1: Revertir los cambios en signals.py
```bash
git revert <commit-hash>
```

### Opción 2: Mantener el nuevo servicio pero no usarlo
Editar signals.py para que no usen ProductStatusService.

### Opción 3: Deshabilitar signals
```python
# En api/apps.py
def ready(self):
    # import api.signals  # ← Comentar esta línea
    pass
```

---

## 📝 NOTAS IMPORTANTES

1. **Timing de Implementación:**
   - Mejor hacerlo en mantenimiento nocturno
   - Ejecutar diagnóstico antes y después
   - Tener backups de base de datos

2. **Testing Posterior:**
   - Crear productos nuevos y verificar que cambien de estado
   - Hacer reembolsos y verificar que revierten
   - Crear entregas parciales y completas

3. **Documentación:**
   - Actualizar READMEs si es necesario
   - Documentar cambios en CHANGELOG
   - Comunicar al equipo

4. **Performance:**
   - El servicio usa `select_for_update()` que puede ser más lento
   - Monitorear uso de base de datos después de implementar
   - Optimizar queries si es necesario

---

## 📞 SOPORTE

Si hay problemas:

1. Revisar logs: `tail -f logs/django.log`
2. Ejecutar diagnóstico: `python manage.py diagnose_product_status --verbose`
3. Fijar inconsistencias: `python manage.py diagnose_product_status --fix`
4. Contactar al equipo de desarrollo

---

**✓ Implementación Lista**

Todos los archivos están en su lugar. Solo necesita:
1. Asegurar que `api/services/` existe
2. Ejecutar tests
3. Implementar en producción
4. Monitorear
