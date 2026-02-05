# 📚 Ejemplos de Uso - Signals de Actualización de Producto

## 🔍 Casos de Uso Reales

### Caso 1: Compra de Productos

```python
# En una vista o API
from api.models import Product, ProductBuyed

# Obtener un producto
product = Product.objects.get(id=1)
print(f"Estado inicial: {product.status}")  # ENCARGADO
print(f"Cantidad comprada: {product.amount_purchased}")  # 0

# Crear compra
buyed = ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=10,
    # ... otros campos
)

# El signal post_save automáticamente:
# 1. Recalcula product.amount_purchased (= 10)
# 2. Si total ≥ amount_requested: cambia estado a COMPRADO

product.refresh_from_db()
print(f"Estado después de compra: {product.status}")  # COMPRADO ✅
print(f"Cantidad comprada: {product.amount_purchased}")  # 10 ✅
```

---

### Caso 2: Recepción de Productos

```python
from api.models import Product, ProductBuyed, ProductReceived, Package

# El producto está en estado COMPRADO
product = Product.objects.get(id=1)
print(f"Estado: {product.status}")  # COMPRADO

# Crear paquete
package = Package.objects.create(
    agency_name="Fedex",
    number_of_tracking="TRACK123"
)

# Recibir productos
received = ProductReceived.objects.create(
    original_product=product,
    package=package,
    amount_received=10
)

# El signal post_save automáticamente:
# 1. Recalcula product.amount_received (= 10)
# 2. Si total ≥ amount_requested: cambia estado a RECIBIDO

product.refresh_from_db()
print(f"Estado después de recibir: {product.status}")  # RECIBIDO ✅
print(f"Cantidad recibida: {product.amount_received}")  # 10 ✅
```

---

### Caso 3: Entrega de Productos

```python
from api.models import Product, ProductDelivery, DeliverReceip

# El producto está en estado RECIBIDO
product = Product.objects.get(id=1)
print(f"Estado: {product.status}")  # RECIBIDO

# Crear entrega
delivery = DeliverReceip.objects.create(
    client=client,
    category=category,
    weight=10.0
)

# Registrar entrega
delivered = ProductDelivery.objects.create(
    original_product=product,
    deliver_receip=delivery,
    amount_delivered=10
)

# El signal post_save automáticamente:
# 1. Recalcula product.amount_delivered (= 10)
# 2. Si total == amount_received AND total == amount_purchased: 
#    cambia estado a ENTREGADO
# 3. Verifica si la orden debe cambiar a COMPLETADO

product.refresh_from_db()
order = product.order
print(f"Estado del producto: {product.status}")  # ENTREGADO ✅
print(f"Estado de la orden: {order.status}")  # COMPLETADO ✅
```

---

### Caso 4: Eliminación de Compra

```python
from api.models import Product, ProductBuyed

product = Product.objects.get(id=1)
print(f"Estado: {product.status}")  # COMPRADO
print(f"Cantidad comprada: {product.amount_purchased}")  # 10

# Obtener la compra
buyed = ProductBuyed.objects.get(id=1)

# Eliminar la compra
buyed.delete()

# El signal post_delete automáticamente:
# 1. Resta amount_buyed del total
# 2. Recalcula product.amount_purchased (= 0)
# 3. Si total < amount_requested: cambia estado a ENCARGADO

product.refresh_from_db()
print(f"Estado después de eliminar compra: {product.status}")  # ENCARGADO ✅
print(f"Cantidad comprada: {product.amount_purchased}")  # 0 ✅
```

---

### Caso 5: Reembolso (Refund)

```python
from api.models import Product, ProductBuyed

product = Product.objects.get(id=1)
buyed = ProductBuyed.objects.get(id=1)

print(f"Estado: {product.status}")  # COMPRADO
print(f"Cantidad comprada: {product.amount_purchased}")  # 10

# Marcar como reembolsado
buyed.is_refunded = True
buyed.quantity_refuned = 5  # Reembolsar 5 unidades
buyed.refund_date = timezone.now()
buyed.refund_amount = 500.0
buyed.save()

# El signal pre_save + post_save detectan el cambio:
# 1. pre_save captura que _old_is_refunded era False
# 2. post_save detecta que es_refunded cambió a True
# 3. Resta quantity_refuned del total
# 4. Recalcula amount_purchased (= 5)
# 5. Si total < amount_requested: cambia estado

product.refresh_from_db()
print(f"Estado después de refund: {product.status}")  # ENCARGADO ✅
print(f"Cantidad comprada: {product.amount_purchased}")  # 5 ✅
```

---

### Caso 6: Eliminación de Paquete (en cascada)

```python
from api.models import Package, ProductReceived

package = Package.objects.get(id=1)

# El paquete tiene asociados varios ProductReceived
# Cuando se elimina el paquete, Django elimina en cascada los ProductReceived

package.delete()

# Para cada ProductReceived eliminado:
# - Signal post_delete se ejecuta
# - Recalcula product.amount_received
# - Ajusta el estado del producto si es necesario

# Sin necesidad de código adicional, todo se maneja automáticamente ✅
```

---

## 🧪 Testing

### Test Básico
```python
from django.test import TransactionTestCase
from api.models import Product, ProductBuyed, Order
from api.enums import ProductStatusEnum

class TestProductBuyedSignal(TransactionTestCase):
    
    def setUp(self):
        self.order = Order.objects.create(...)
        self.product = Product.objects.create(
            order=self.order,
            amount_requested=10,
            # ... otros campos
        )
    
    def test_product_status_updates_on_buyed_save(self):
        """Verifica que el estado se actualiza cuando se crea ProductBuyed"""
        
        # El producto debe estar ENCARGADO
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
        
        # Crear compra
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        # Refrescar desde BD
        self.product.refresh_from_db()
        
        # El estado debe haber cambiado a COMPRADO
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        self.assertEqual(self.product.amount_purchased, 10)
```

---

## 🔧 Debugging

### Ver qué signal se está ejecutando

```python
# En signals.py, agregar logging:

import logging
logger = logging.getLogger(__name__)

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    logger.info(f"Signal POST_SAVE ProductBuyed: instance.id={instance.id}, created={created}")
    
    product = instance.original_product
    if product:
        logger.info(f"Updating product {product.id}")
        # ... lógica
        logger.info(f"Product status changed to {product.status}")
```

### Ejecutar en shell

```python
python manage.py shell

from api.models import Product, ProductBuyed

product = Product.objects.get(id=1)
print(f"Antes: {product.status}, qty={product.amount_purchased}")

# Crear compra (el signal se ejecutará automáticamente)
buyed = ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=5
)

product.refresh_from_db()
print(f"Después: {product.status}, qty={product.amount_purchased}")

# Si el signal funcionó, los valores deben haber cambiado
```

---

## 🚨 Problemas Comunes

### Problema 1: El signal no se ejecuta

**Causa:** El signal no está importado en `apps.py`

**Solución:**
```python
# api/apps.py
class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        import api.signals  # ← Asegurar que está aquí
```

### Problema 2: El producto no se actualiza

**Causa:** Estás creando el modelo sin guardar

**Solución:**
```python
# ❌ INCORRECTO - no dispara signal
product = ProductBuyed(original_product=p, amount_buyed=5)
# product.save() - FALTA!

# ✅ CORRECTO - dispara signal
product = ProductBuyed.objects.create(original_product=p, amount_buyed=5)
# O
product = ProductBuyed(original_product=p, amount_buyed=5)
product.save()
```

### Problema 3: Actualización no se ve inmediatamente

**Causa:** No refrescas el objeto desde BD

**Solución:**
```python
# ❌ Muestra el valor anterior
print(product.status)

# ✅ Obtiene el valor actual desde BD
product.refresh_from_db()
print(product.status)
```

---

## 📋 Checklist de Integración

- [ ] Los signals están importados en `api/apps.py::ready()`
- [ ] El archivo `api/signals.py` existe y tiene todos los signals
- [ ] `python manage.py check` no muestra errores
- [ ] Los tests pasan: `python manage.py test api.tests.test_product_status_signals`
- [ ] Se ha probado manualmente el flujo completo
- [ ] Se ha verificado que los signals funcionan en shell
- [ ] Se han revisado los logs para ver que se ejecutan
- [ ] Se ha validado con datos reales en staging

---

## 🎓 Aprendiendo Django Signals

### Orden de ejecución

```
save() llamada
    ↓
pre_save signal → Antes de guardar a BD
    ↓
Guardar a BD (INSERT/UPDATE)
    ↓
post_save signal → Después de guardar a BD
    ↓
Objeto actualizado disponible
```

### Parámetros de los signals

```python
@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    """
    - sender: El modelo que disparó el signal (ProductBuyed)
    - instance: La instancia que se está guardando
    - created: True si es un INSERT, False si es UPDATE
    - **kwargs: Otros parámetros (usando_transactions, connection, etc)
    """
```

---

## 📚 Documentación Adicional

- **Proyecto:** Shein Shop - Sistema de Gestión de Tiendas
- **Stack:** Django 5.1, DRF 3.15, PostgreSQL
- **Archivo principal:** `api/signals.py`
- **Tests:** `api/tests/test_product_status_signals.py`
- **Documentación:** `PRODUCT_STATUS_SIGNALS_REFACTORING.md`

---

**Guía de ejemplos - 5 de febrero de 2026**
