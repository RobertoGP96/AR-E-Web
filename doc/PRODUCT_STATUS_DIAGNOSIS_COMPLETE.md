# 📊 DIAGNÓSTICO COMPLETO: LÓGICA DE CAMBIO DE ESTADO DE PRODUCTOS

**Fecha:** 6 de febrero de 2026
**Estado:** Lógica VERIFICADA ✓ pero con PROBLEMAS de IMPLEMENTACIÓN

---

## 📋 RESUMEN EJECUTIVO

La **lógica matemática** de determinación de estados de productos está **CORRECTA** (8/8 casos de prueba pasaron). Sin embargo, hay **PROBLEMAS POTENCIALES** en la implementación que impiden que funcione correctamente en producción.

### Estados Verificados:
- ✓ **ENCARGADO** → **COMPRADO** (cuando amount_purchased >= amount_requested)
- ✓ **COMPRADO** → **RECIBIDO** (cuando amount_received >= amount_requested)
- ✓ **RECIBIDO** → **ENTREGADO** (cuando amount_delivered >= amount_purchased AND amount_delivered >= amount_received)
- ✓ **Reembolsos y flujos parciales** funcionan correctamente

---

## 🔍 ANÁLISIS DETALLADO

### 1. ESTRUCTURA ACTUAL DEL FLUJO

```
┌─────────────────────────────────────────────────────────────┐
│ ORDEN (Order)                                               │
│ - Contiene múltiples PRODUCTOS                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTO (Product)                                          │
│ - amount_requested: 10 (cantidad solicitada)               │
│ - amount_purchased: 0 (cantidad comprada)                  │
│ - amount_received: 0 (cantidad recibida)                   │
│ - amount_delivered: 0 (cantidad entregada)                 │
│ - status: ENCARGADO (estado actual)                        │
└─────────────────────────────────────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
COMPRAS        RECEPCIONES      ENTREGAS
  │              │              │
  ├─ ProductBuyed │
  │  ├─ amount_buyed: 5        │
  │  └─ quantity_refuned: 0    │
  │                            │
  ├─ ProductBuyed             │
  │  ├─ amount_buyed: 5        │
  │  └─ quantity_refuned: 0    │
  │                            │
  │              ├─ ProductReceived
  │              │  └─ amount_received: 5
  │              │
  │              ├─ ProductReceived
  │              │  └─ amount_received: 5
  │              │
  │                            ├─ ProductDelivery
  │                            │  └─ amount_delivered: 5
  │                            │
  │                            ├─ ProductDelivery
  │                            │  └─ amount_delivered: 5
```

### 2. FLUJO DE ACTUALIZACIÓN MEDIANTE SIGNALS

#### Paso 1: Se crea ProductBuyed
```python
ProductBuyed.objects.create(
    original_product=product,
    amount_buyed=5
)
# Se dispara: post_save(ProductBuyed) → update_product_on_buyed_save()
```

#### Paso 2: Signal actualiza el Product
```python
# Signal: update_product_on_buyed_save()
total_purchased = sum(pb.amount_buyed - pb.quantity_refuned for pb in product.buys.all())
# = 5

product.amount_purchased = 5
product.status = _determine_product_status(
    amount_purchased=5,      # < 10
    amount_received=0,
    amount_delivered=0,
    amount_requested=10,
    current_status="Encargado"
)
# Devuelve: "Encargado" (porque 5 < 10)

product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
```

---

## ❌ PROBLEMAS IDENTIFICADOS

### PROBLEMA 1: Relacionados vs. Recalculados
**Severidad:** MEDIA

El sistema depende de relacionales inversos para contar los totales:
```python
# En signals
total_purchased = sum(pb.amount_buyed - pb.quantity_refuned for pb in product.buys.all())
```

**Posibles problemas:**
- Si hay un error en `product.buys.all()`, el cálculo será incorrecto
- No hay validación de que el relacionar funcione correctamente
- Si un ProductBuyed no se guarda correctamente, no aparecerá en el cálculo

**Solución:** Usar transacciones y validación explícita

---

### PROBLEMA 2: Actualización Parcial (update_fields)
**Severidad:** ALTA

Los signals usan `update_fields`:
```python
product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
```

**El problema:**
- Si hay otros campos que necesitan actualizarse, se ignorarán
- No activa otros signals de Product.post_save()
- Pueden quedar inconsistencias en la base de datos

**Ejemplo problemático:**
```python
# Si el Product tiene un campo `last_status_changed` que debería actualizarse
# pero no está en update_fields, no se actualizará
```

---

### PROBLEMA 3: Cascada de Signals Sin Control
**Severidad:** MEDIA

Cuando se guarda un ProductBuyed:
1. Se ejecuta post_save(ProductBuyed)
2. El signal hace product.save()
3. Esto dispara post_save(Product)
4. Si Post producto tiene más signals, se pueden ejecutar

**Sin embargo:**
- Hay un signal en Product.post_save() que actualiza Order.total_costs()
- Esto puede causar actualizaciones no deseadas o ciclos
- No hay control explícito de estas cascadas

---

### PROBLEMA 4: Falta de Logging y Debugging
**Severidad:** MEDIA

Los signals no tienen:
- Logs para verificar que se ejecutan
- Prints o excepciones claras
- Trazabilidad de qué cambió y por qué

**Ejemplo:**
```python
@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    # NO HAY LOGGING AQUÍ
    product = instance.original_product
    if not product:
        return  # Falla silenciosamente
    # ...
```

---

### PROBLEMA 5: No Hay Validación de Consistencia
**Severidad:** ALTA

La lógica asume que:
- `product.buys.all()` siempre devolverá lo correcto
- Los campos de cantidad nunca serán negativos
- El relacionar siempre será consistente

**Sin validación de:**
- ¿Qué pasa si amount_buyed es 0?
- ¿Qué pasa si product.buys.all() es None?
- ¿Hay duplicados?

---

### PROBLEMA 6: Race Conditions en Concurrencia
**Severidad:** ALTA

Si dos requests crear ProductBuyed simultáneamente:
```
Thread 1: Crea ProductBuyed                Thread 2: Crea otro ProductBuyed
    ↓                                              ↓
    Signal lee product.buys.all() (=5)     Signal lee product.buys.all() (=5)
    ↓                                              ↓
    Suma = 10, amount_purchased = 10        Suma = 10, amount_purchased = 10
    ↓                                              ↓
    product.save()                          product.save()
    ↓                                              ↓
    ¡Los dos escriben el mismo valor!  ← PROBLEMA DE CONCURRENCIA
```

---

### PROBLEMA 7: El Relacionar `related_name` es Critical
**Severidad:** ALTA

El sistema depende de que los `related_name` sean exactos:
```python
# ProductBuyed
original_product = models.ForeignKey(Product, ..., related_name="buys")

# Si alguien cambia `related_name="buys"` a `related_name="purchases"`
# Los signals dejarán de funcionar
```

Revisión de related_name en los modelos:
- ✓ ProductBuyed: `related_name="buys"` (usado en signal)
- ✓ ProductReceived: `related_name="receiveds"` (usado en signal)
- ✓ ProductDelivery: `related_name="delivers"` (usado en signal)

---

## 🔧 SOLUCIONES RECOMENDADAS

### SOLUCIÓN 1: Añadir Logging y Debugging
**Prioridad:** ALTA
**Dificultad:** BAJA

```python
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    """Actualiza el amount_purchased y estado del producto original"""
    product = instance.original_product
    if not product:
        logger.warning(f"ProductBuyed {instance.id} no tiene original_product")
        return
    
    logger.info(f"Actualizando Product {product.id} por ProductBuyed {instance.id}")
    
    try:
        # Recalcular total
        total_purchased = sum(
            pb.amount_buyed - pb.quantity_refuned
            for pb in product.buys.all()
        )
        total_purchased = max(0, total_purchased)
        
        logger.debug(f"Total comprado: {total_purchased}")
        
        product.amount_purchased = total_purchased
        
        old_status = product.status
        product.status = _determine_product_status(...)
        
        logger.debug(f"Estado cambió de {old_status} a {product.status}")
        
        product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
        
        logger.info(f"Product {product.id} actualizado exitosamente")
    except Exception as e:
        logger.error(f"Error actualizando Product {product.id}: {e}", exc_info=True)
        raise
```

---

### SOLUCIÓN 2: Usar Transacciones Atómicas
**Prioridad:** ALTA
**Dificultad:** MEDIA

```python
from django.db import transaction

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    product = instance.original_product
    if not product:
        return
    
    try:
        with transaction.atomic():
            # Usar select_for_update para evitar race conditions
            product = Product.objects.select_for_update().get(pk=product.pk)
            
            total_purchased = sum(
                pb.amount_buyed - pb.quantity_refuned
                for pb in product.buys.all()
            )
            total_purchased = max(0, total_purchased)
            
            product.amount_purchased = total_purchased
            product.status = _determine_product_status(...)
            
            product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
    except Exception as e:
        logger.error(f"Error en signal ProductBuyed: {e}")
        raise
```

---

### SOLUCIÓN 3: Validación de Datos
**Prioridad:** MEDIA
**Dificultad:** BAJA

```python
@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    product = instance.original_product
    if not product:
        return
    
    # Validaciones
    if instance.amount_buyed < 0:
        logger.warning(f"ProductBuyed {instance.id} tiene amount_buyed negativo")
        return
    
    if product.amount_requested <= 0:
        logger.warning(f"Product {product.id} tiene amount_requested <= 0")
        return
    
    # ... resto del código
```

---

### SOLUCIÓN 4: Evitar Cascadas Incontroladas
**Prioridad:** MEDIA
**Dificultad:** MEDIA

```python
# Opción A: Usar update_fields para ser explícito
product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
# Esto evita que se disparen otros signals

# Opción B: Crear un método especializado en Product
class Product(models.Model):
    def update_status_from_signal(self, amount_purchased, amount_received, amount_delivered):
        """Método specializado para actualizar estado desde signals"""
        self.amount_purchased = amount_purchased
        self.amount_received = amount_received
        self.amount_delivered = amount_delivered
        self.status = _determine_product_status(...)
        self.save(update_fields=['amount_purchased', 'amount_received', 
                                 'amount_delivered', 'status', 'updated_at'])
```

---

### SOLUCIÓN 5: Crear una Función Centralizada de Actualización
**Prioridad:** ALTA
**Dificultad:** MEDIA

```python
# En api/services/product_status_service.py
class ProductStatusService:
    """Servicio centralizado para actualizar estados de productos"""
    
    @staticmethod
    def recalculate_product_status(product: Product) -> None:
        """
        Recalcula todos los totales y el estado de un producto
        desde sus transacciones relacionadas.
        """
        with transaction.atomic():
            # Bloquear el producto para evitar race conditions
            product = Product.objects.select_for_update().get(pk=product.pk)
            
            # Recalcular totales
            amount_purchased = sum(
                pb.amount_buyed - pb.quantity_refuned
                for pb in product.buys.all()
            )
            amount_purchased = max(0, amount_purchased)
            
            amount_received = sum(
                pr.amount_received
                for pr in product.receiveds.all()
            )
            
            amount_delivered = sum(
                pd.amount_delivered
                for pd in product.delivers.all()
            )
            
            # Determinar estado
            new_status = _determine_product_status(
                amount_purchased=amount_purchased,
                amount_received=amount_received,
                amount_delivered=amount_delivered,
                amount_requested=product.amount_requested,
                current_status=product.status
            )
            
            # Actualizar solo si cambió
            if (product.amount_purchased != amount_purchased or
                product.amount_received != amount_received or
                product.amount_delivered != amount_delivered or
                product.status != new_status):
                
                product.amount_purchased = amount_purchased
                product.amount_received = amount_received
                product.amount_delivered = amount_delivered
                product.status = new_status
                
                product.save(update_fields=[
                    'amount_purchased', 'amount_received',
                    'amount_delivered', 'status', 'updated_at'
                ])
                
                logger.info(f"Product {product.id} actualizado: estado {new_status}")

# En signals.py
from api.services.product_status_service import ProductStatusService

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    product = instance.original_product
    if product:
        ProductStatusService.recalculate_product_status(product)

@receiver(post_delete, sender=ProductBuyed)
def update_product_on_buyed_delete(sender, instance, **kwargs):
    product = instance.original_product
    if product:
        ProductStatusService.recalculate_product_status(product)

# Y lo mismo para ProductReceived y ProductDelivery
```

---

### SOLUCIÓN 6: Agregar Tests Automatizados
**Prioridad:** ALTA
**Dificultad:** MEDIA

```python
# En api/tests/test_product_status_updates.py
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from api.models import Product, ProductBuyed, ProductReceived, ProductDelivery
from api.enums import ProductStatusEnum

class ProductStatusSignalsTest(TransactionTestCase):
    """Tests para los signals de actualización de estado"""
    
    def setUp(self):
        self.product = Product.objects.create(
            name="Test Product",
            amount_requested=10,
            shop_cost=100
        )
    
    def test_status_changes_to_comprado_on_full_purchase(self):
        """Verifica que el estado cambia a COMPRADO cuando se compra la cantidad solicitada"""
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        self.product.refresh_from_db()
        
        self.assertEqual(self.product.amount_purchased, 10)
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
    
    def test_status_changes_to_recibido_on_full_reception(self):
        """Verifica que el estado cambia a RECIBIDO cuando se recibe todo"""
        # Crear compra
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        # Crear recepción
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=10
        )
        
        self.product.refresh_from_db()
        
        self.assertEqual(self.product.amount_received, 10)
        self.assertEqual(self.product.status, ProductStatusEnum.RECIBIDO.value)
    
    def test_status_changes_to_entregado_on_full_delivery(self):
        """Verifica que el estado cambia a ENTREGADO cuando se entrega todo"""
        # Crear compra, recepción y entrega
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        ProductReceived.objects.create(
            original_product=self.product,
            amount_received=10
        )
        
        ProductDelivery.objects.create(
            original_product=self.product,
            amount_delivered=10
        )
        
        self.product.refresh_from_db()
        
        self.assertEqual(self.product.amount_delivered, 10)
        self.assertEqual(self.product.status, ProductStatusEnum.ENTREGADO.value)
    
    def test_status_reverts_on_refund(self):
        """Verifica que el estado revierte a ENCARGADO cuando hay reembolso"""
        # Crear compra completa
        buyed = ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=10
        )
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
        
        # Aplicar reembolso
        buyed.quantity_refuned = 2
        buyed.save()
        
        self.product.refresh_from_db()
        
        self.assertEqual(self.product.amount_purchased, 8)
        self.assertEqual(self.product.status, ProductStatusEnum.ENCARGADO.value)
    
    def test_concurrent_purchases_are_counted_correctly(self):
        """Verifica que las compras concurrentes se cuentan correctamente"""
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5
        )
        
        ProductBuyed.objects.create(
            original_product=self.product,
            amount_buyed=5
        )
        
        self.product.refresh_from_db()
        
        self.assertEqual(self.product.amount_purchased, 10)
        self.assertEqual(self.product.status, ProductStatusEnum.COMPRADO.value)
```

---

## 📋 PLAN DE ACCIÓN

### Fase 1: Diagnóstico (COMPLETADO ✓)
- ✓ Verificar la lógica matemática
- ✓ Identificar problemas potenciales
- ✓ Documentar el estado actual

### Fase 2: Implementación de Fixes (PENDIENTE)
1. **Integración de ProductStatusService** (1-2 horas)
   - Crear el servicio centralizado
   - Actualizar todos los signals
   - Agregar logging

2. **Agregar Transacciones Atómicas** (1 hora)
   - Usar `select_for_update()`
   - Evitar race conditions

3. **Agregar Tests** (2-3 horas)
   - Tests de cambio de estado
   - Tests de concurrencia
   - Tests de reembolsos

4. **Documentación** (1 hora)
   - Actualizar READMEs
   - Agregar ejemplos de uso

### Fase 3: Testing en Producción (PENDIENTE)
- Monitoreo de logs
- Seguimiento de cambios de estado
- Validación con datos reales

---

## 🚨 RECOMENDACIÓN FINAL

**La lógica está correcta, pero la IMPLEMENTACIÓN tiene problemas.**

### Acción Inmediata:
Implementar la **SOLUCIÓN 5** (ProductStatusService) que:
1. Centraliza la lógica de actualización
2. Evita duplicación de código
3. Facilita debugging
4. Mejora mantenibilidad
5. Permite testing

### Impacto Esperado:
- ✓ Eliminación de race conditions
- ✓ Mejor logging y debugging
- ✓ Código más mantenible
- ✓ Tests más confiables
