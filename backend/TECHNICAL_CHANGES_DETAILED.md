# 🔧 Cambios Técnicos Detallados - Refactorización de Signals

## Comparación: Antes vs Después

### 1. ProductBuyed.save()

#### ❌ ANTES (40 líneas)
```python
def save(self, *args, **kwargs):
    """
    Al guardar un ProductBuyed, actualiza el amount_purchased y el estado del producto original.
    También maneja la lógica de reembolso actualizando las cantidades y estados correspondientes.
    """
    is_new = self.pk is None
    
    # Si es una actualización, obtener el estado anterior
    old_instance = None
    if not is_new:
        old_instance = ProductBuyed.objects.get(pk=self.pk)
    
    super().save(*args, **kwargs)

    if self.original_product:
        # Si se está realizando un reembolso
        if not is_new and old_instance and self.is_refunded != old_instance.is_refunded and self.is_refunded:
            # Restar la cantidad reembolsada del total comprado
            self.original_product.amount_purchased = max(0, self.original_product.amount_purchased - self.quantity_refuned)
            
            # Si la cantidad comprada es menor a la solicitada, volver a estado ENCARGADO
            if self.original_product.amount_purchased < self.original_product.amount_requested:
                self.original_product.status = ProductStatusEnum.ENCARGADO.value
            
            # Guardar los cambios
            self.original_product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
            return
            
        # Recalcular el total comprado del producto
        total_purchased = sum(
            pb.amount_buyed
            for pb in self.original_product.buys.all()
        )
        self.original_product.amount_purchased = total_purchased

        # Actualizar estado según la cantidad comprada
        if total_purchased >= self.original_product.amount_requested:
            if self.original_product.status == ProductStatusEnum.ENCARGADO.value:
                self.original_product.status = ProductStatusEnum.COMPRADO.value
        else:
            self.original_product.status = ProductStatusEnum.ENCARGADO.value
            
        self.original_product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
```

#### ✅ DESPUÉS (3 líneas)
```python
def save(self, *args, **kwargs):
    """
    Guarda el ProductBuyed. La lógica de actualización del product original
    (amount_purchased y estado) se maneja automáticamente a través de signals
    (pre_save para detectar cambios y post_save para actualizar el producto).
    """
    super().save(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 40 → 3 (-92%)
- **Complejidad:** Alta → Baja
- **Responsabilidad:** Datos + Lógica → Solo Datos
- **Donde está la lógica ahora:** `api/signals.py` (signals de ProductBuyed)

---

### 2. ProductBuyed.delete()

#### ❌ ANTES (20 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Al eliminar un ProductBuyed, descuenta la cantidad comprada del producto original
    y actualiza el estado a ENCARGADO si la cantidad encargada y comprada son diferentes
    """
    product = self.original_product
    
    # Guardar la cantidad comprada que se va a eliminar
    amount_to_remove = self.amount_buyed

    # Llamar al delete original
    super().delete(*args, **kwargs)

    if product:
        # Restar la cantidad comprada del total
        product.amount_purchased -= amount_to_remove
        
        # Asegurarse de que no tengamos valores negativos
        if product.amount_purchased < 0:
            product.amount_purchased = 0
        
        # Si la cantidad comprada es menor que la solicitada, cambiar el estado a ENCARGADO
        if product.amount_purchased < product.amount_requested:
            product.status = ProductStatusEnum.ENCARGADO.value
        
        # Guardar los cambios
        product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
```

#### ✅ DESPUÉS (3 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Elimina el ProductBuyed. La lógica de actualización del producto original
    (descuento del amount_purchased y ajuste de estado) se maneja automáticamente
    a través de signals (post_delete).
    """
    super().delete(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 20 → 3 (-85%)
- **Lógica movida a:** `update_product_on_buyed_delete` signal

---

### 3. ProductReceived.save()

#### ❌ ANTES (20 líneas)
```python
def save(self, *args, **kwargs):
    """
    Al guardar un ProductReceived, actualiza el amount_received y el estado del producto original
    """
    super().save(*args, **kwargs)

    # Actualizar el amount_received del producto original
    if self.original_product:
        total_received = sum(
            pr.amount_received
            for pr in self.original_product.receiveds.all()
        )
        self.original_product.amount_received = total_received

        # Si la cantidad recibida es igual (o mayor) a la ENCARGADA (amount_requested), cambiar estado a RECIBIDO
        if total_received >= self.original_product.amount_requested and self.original_product.amount_requested > 0:
            # Solo cambiar a RECIBIDO si está en COMPRADO o ENCARGADO
            if self.original_product.status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
                self.original_product.status = ProductStatusEnum.RECIBIDO.value

        self.original_product.save(update_fields=['amount_received', 'status', 'updated_at'])
```

#### ✅ DESPUÉS (3 líneas)
```python
def save(self, *args, **kwargs):
    """
    Guarda el ProductReceived. La lógica de actualización del producto original
    (amount_received y estado) se maneja automáticamente a través de signals (post_save).
    """
    super().save(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 20 → 3 (-85%)
- **Lógica movida a:** `update_product_on_received_save` signal

---

### 4. ProductReceived.delete()

#### ❌ ANTES (25 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Al eliminar un ProductReceived, recalcula el amount_received y el estado del producto original
    """
    product = self.original_product

    super().delete(*args, **kwargs)

    # Recalcular el total recibido del producto
    if product:
        total_received = sum(
            pr.amount_received
            for pr in product.receiveds.all()
        )
        product.amount_received = total_received

        # Si después de eliminar ya no está completamente recibido (comparado con amount_requested)
        if total_received < product.amount_requested:
            if product.status == ProductStatusEnum.RECIBIDO.value:
                # Volver a COMPRADO si tiene productos comprados, si no a ENCARGADO
                if product.amount_purchased > 0:
                    product.status = ProductStatusEnum.COMPRADO.value
                else:
                    product.status = ProductStatusEnum.ENCARGADO.value

        product.save(update_fields=['amount_received', 'status', 'updated_at'])
```

#### ✅ DESPUÉS (3 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Elimina el ProductReceived. La lógica de actualización del producto original
    (recálculo del amount_received y ajuste de estado) se maneja automáticamente
    a través de signals (post_delete).
    """
    super().delete(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 25 → 3 (-88%)
- **Lógica movida a:** `update_product_on_received_delete` signal

---

### 5. ProductDelivery.save()

#### ❌ ANTES (25 líneas)
```python
def save(self, *args, **kwargs):
    """
    Al guardar un ProductDelivery, actualiza el amount_delivered y estado del producto original
    """
    super().save(*args, **kwargs)

    # Actualizar el amount_delivered del producto original
    if self.original_product:
        total_delivered = sum(
            pd.amount_delivered
            for pd in self.original_product.delivers.all()
        )
        self.original_product.amount_delivered = total_delivered

        # Si la cantidad entregada es igual a la RECIBIDA Y COMPRADA, cambiar estado a ENTREGADO
        if (total_delivered == self.original_product.amount_received and 
            total_delivered == self.original_product.amount_purchased and
            self.original_product.amount_purchased > 0):
            # Solo cambiar a ENTREGADO si está en RECIBIDO o COMPRADO
            if self.original_product.status in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.COMPRADO.value]:
                self.original_product.status = ProductStatusEnum.ENTREGADO.value

        self.original_product.save(update_fields=['amount_delivered', 'status', 'updated_at'])

    # Verificar si la orden debe cambiar a COMPLETADO
    if self.original_product.order:
        self.original_product.order.update_status_based_on_delivery()
```

#### ✅ DESPUÉS (3 líneas)
```python
def save(self, *args, **kwargs):
    """
    Guarda el ProductDelivery. La lógica de actualización del producto original
    (amount_delivered, estado) y la orden se maneja automáticamente a través
    de signals (post_save).
    """
    super().save(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 25 → 3 (-88%)
- **Lógica movida a:** `update_product_on_delivery_save` signal

---

### 6. ProductDelivery.delete()

#### ❌ ANTES (35 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Al eliminar un ProductDelivery, actualiza el amount_delivered y estado del producto original
    """
    product = self.original_product
    order = product.order if product else None

    super().delete(*args, **kwargs)

    # Actualizar el amount_delivered del producto
    if product:
        total_delivered = sum(
            pd.amount_delivered
            for pd in product.delivers.all()
        )
        product.amount_delivered = total_delivered

        # Si después de eliminar ya no está completamente entregado
        if total_delivered < product.amount_received:
            if product.status == ProductStatusEnum.ENTREGADO.value:
                # Volver a RECIBIDO si la cantidad entregada es menor a la recibida
                product.status = ProductStatusEnum.RECIBIDO.value
                product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
            else:
                product.save(update_fields=['amount_delivered', 'updated_at'])
        else:
            product.save(update_fields=['amount_delivered', 'updated_at'])

        # La orden podría volver a estar disponible para delivery
        if order:
            # Si ya no está completamente entregada, cambiar de COMPLETADO a PROCESANDO
            if not order.is_fully_delivered and order.status == OrderStatusEnum.COMPLETADO.value:
                order.status = OrderStatusEnum.PROCESANDO.value
                order.save(update_fields=['status', 'updated_at'])
```

#### ✅ DESPUÉS (3 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Elimina el ProductDelivery. La lógica de actualización del producto original
    (amount_delivered, estado) y la orden se maneja automáticamente a través
    de signals (post_delete).
    """
    super().delete(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 35 → 3 (-91%)
- **Lógica movida a:** `update_product_on_delivery_delete` signal

---

### 7. DeliverReceip.delete()

#### ❌ ANTES (30 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Al eliminar un DeliverReceip, descuenta las cantidades entregadas de los productos originales
    y actualiza sus estados antes de eliminar el recibo y sus productos entregados.
    """
    from api.enums import ProductStatusEnum
    
    # Obtener todos los productos entregados antes de eliminar
    delivered_products = list(self.delivered_products.all())
    
    # Para cada producto entregado, descontar la cantidad del producto original
    for delivered_product in delivered_products:
        product = delivered_product.original_product
        if product:
            # Descontar la cantidad entregada
            product.amount_delivered = max(0, product.amount_delivered - delivered_product.amount_delivered)
            
            # Actualizar el estado basado en las cantidades
            # Si ya no está completamente entregado, volver a RECIBIDO (si tiene productos recibidos)
            if product.amount_delivered < product.amount_received:
                if product.status == ProductStatusEnum.ENTREGADO.value:
                    # Si tiene productos recibidos, volver a RECIBIDO
                    if product.amount_received > 0:
                        product.status = ProductStatusEnum.RECIBIDO.value
                    # Si no tiene productos recibidos pero sí comprados, volver a COMPRADO
                    elif product.amount_purchased > 0:
                        product.status = ProductStatusEnum.COMPRADO.value
            
            # Guardar los cambios en el producto
            product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
    
    # Ahora eliminar el recibo (esto eliminará en cascada los ProductDelivery)
    super().delete(*args, **kwargs)
```

#### ✅ DESPUÉS (3 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Elimina el DeliverReceip. La lógica de descuento de cantidades entregadas
    se maneja automáticamente a través de signals cuando se eliminan los
    ProductDelivery asociados (en cascada por las relaciones FK).
    """
    super().delete(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 30 → 3 (-90%)
- **Cómo funciona:** Django elimina en cascada los ProductDelivery (FK), cada eliminación dispara su post_delete signal

---

### 8. Package.delete()

#### ❌ ANTES (25 líneas, incompleto mostrado)
```python
def delete(self, *args, **kwargs):
    """
    Al eliminar un Package, descuenta las cantidades recibidas de los productos originales
    y actualiza sus estados antes de eliminar el paquete y sus productos recibidos.
    """
    from api.enums import ProductStatusEnum
    
    # Obtener todos los productos recibidos en este paquete antes de eliminar
    received_products = list(self.package_products.all())
    
    # Para cada producto recibido, descontar la cantidad del producto original
    for received_product in received_products:
        product = received_product.original_product
        if product:
            # Descontar la cantidad recibida
            product.amount_received = max(0, product.amount_received - received_product.amount_received)
            
            # Actualizar el estado basado en las cantidades
            if product.amount_received < product.amount_purchased:
                if product.status == ProductStatusEnum.RECIBIDO.value:
                    if product.amount_purchased >= product.amount_requested:
                        product.status = ProductStatusEnum.COMPRADO.value
                    else:
                        product.status = ProductStatusEnum.ENCARGADO.value
            # ... más código
```

#### ✅ DESPUÉS (3 líneas)
```python
def delete(self, *args, **kwargs):
    """
    Elimina el Package. La lógica de descuento de cantidades recibidas
    se maneja automáticamente a través de signals cuando se eliminan los
    ProductReceived asociados (en cascada por las relaciones FK).
    """
    super().delete(*args, **kwargs)
```

#### 📊 Cambio
- **Líneas:** 25+ → 3 (-88%+)
- **Cómo funciona:** Django elimina en cascada los ProductReceived (FK), cada eliminación dispara su post_delete signal

---

## 📊 Resumen de Cambios

### Totales

| Archivo | Método | Antes | Después | Reducción |
|---------|--------|-------|---------|-----------|
| products.py | ProductBuyed.save() | 40 | 3 | -92% |
| products.py | ProductBuyed.delete() | 20 | 3 | -85% |
| products.py | ProductReceived.save() | 20 | 3 | -85% |
| products.py | ProductReceived.delete() | 25 | 3 | -88% |
| products.py | ProductDelivery.save() | 25 | 3 | -88% |
| products.py | ProductDelivery.delete() | 35 | 3 | -91% |
| products.py | update_product_delivered_amount() | 10 | ❌ | -100% |
| deliveries.py | DeliverReceip.delete() | 30 | 3 | -90% |
| deliveries.py | Package.delete() | 25 | 3 | -88% |
| **TOTAL** | | **220** | **25** | **-89%** |

---

## 🆕 Signals Nuevos Implementados

### En api/signals.py

#### Pre_save Signals
```python
@receiver(pre_save, sender=ProductBuyed)
def store_old_refund_state(sender, instance, **kwargs)
```

#### Post_save Signals
```python
@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs)

@receiver(post_save, sender=ProductReceived)
def update_product_on_received_save(sender, instance, created, **kwargs)

@receiver(post_save, sender=ProductDelivery)
def update_product_on_delivery_save(sender, instance, created, **kwargs)
```

#### Post_delete Signals
```python
@receiver(post_delete, sender=ProductBuyed)
def update_product_on_buyed_delete(sender, instance, **kwargs)

@receiver(post_delete, sender=ProductReceived)
def update_product_on_received_delete(sender, instance, **kwargs)

@receiver(post_delete, sender=ProductDelivery)
def update_product_on_delivery_delete(sender, instance, **kwargs)
```

---

## 🔍 Dónde Está la Lógica Ahora

| Proceso | Antes | Después |
|---------|-------|---------|
| Compra de producto | ProductBuyed.save() | Signal: update_product_on_buyed_save |
| Eliminación de compra | ProductBuyed.delete() | Signal: update_product_on_buyed_delete |
| Reembolso | ProductBuyed.save() | Signal: pre_save + post_save |
| Recepción de producto | ProductReceived.save() | Signal: update_product_on_received_save |
| Eliminación de recepción | ProductReceived.delete() | Signal: update_product_on_received_delete |
| Entrega de producto | ProductDelivery.save() | Signal: update_product_on_delivery_save |
| Eliminación de entrega | ProductDelivery.delete() | Signal: update_product_on_delivery_delete |
| Actualización de orden | ProductDelivery.save() | Signal: update_product_on_delivery_save |
| Eliminación en cascada (Package) | Package.delete() | Signal: post_delete para cada ProductReceived |
| Eliminación en cascada (Delivery) | DeliverReceip.delete() | Signal: post_delete para cada ProductDelivery |

---

**Cambios técnicos completados - 5 de febrero de 2026**
