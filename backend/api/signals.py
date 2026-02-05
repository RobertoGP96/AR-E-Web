from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from api.models import (
    Product, Order, ProductBuyed, ProductReceived, ProductDelivery
)
from api.enums import ProductStatusEnum


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _determine_product_status(amount_purchased, amount_received, amount_delivered, 
                             amount_requested, current_status):
    """
    Determina el estado de un producto basado en las cantidades de compra, recepción y entrega.
    
    Flujo de estados:
    - ENCARGADO: Cuando amount_purchased < amount_requested
    - COMPRADO: Cuando amount_purchased >= amount_requested
    - RECIBIDO: Cuando amount_received >= amount_requested
    - ENTREGADO: Cuando amount_delivered >= amount_received Y amount_delivered >= amount_purchased
    
    Args:
        amount_purchased: Cantidad comprada del producto
        amount_received: Cantidad recibida del producto
        amount_delivered: Cantidad entregada del producto
        amount_requested: Cantidad solicitada originalmente
        current_status: Estado actual del producto
    
    Returns:
        str: El nuevo estado del producto
    """
    # Validación: si no hay cantidad solicitada, mantener el estado actual
    if amount_requested <= 0:
        return current_status
    
    # ENTREGADO: Se entregó toda la cantidad
    if amount_delivered >= amount_received and amount_delivered >= amount_purchased and amount_delivered > 0:
        return ProductStatusEnum.ENTREGADO.value
    
    # RECIBIDO: Se recibió toda la cantidad pero aún no se entrega todo
    if amount_received >= amount_requested and amount_received > 0:
        return ProductStatusEnum.RECIBIDO.value
    
    # COMPRADO: Se compró toda la cantidad pero aún no se recibe
    if amount_purchased >= amount_requested and amount_purchased > 0:
        return ProductStatusEnum.COMPRADO.value
    
    # ENCARGADO: Estado inicial o cuando no se ha comprado la cantidad solicitada
    return ProductStatusEnum.ENCARGADO.value


# ============================================================================
# PRODUCT SIGNALS
# ============================================================================

@receiver(post_save, sender=Product)
def update_order_total_on_product_save(sender, instance, **kwargs):
    """Actualiza el total de la orden cuando un producto se guarda"""
    if instance.order:
        instance.order.update_total_costs()


@receiver(post_delete, sender=Product)
def update_order_total_on_product_delete(sender, instance, **kwargs):
    """Actualiza el total de la orden cuando un producto se elimina"""
    if instance.order:
        instance.order.update_total_costs()


# ============================================================================
# PRODUCT BUYED SIGNALS
# ============================================================================
# ============================================================================
# PRODUCT BUYED SIGNALS
# ============================================================================

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se guarda/crea un ProductBuyed.
    Maneja tanto nuevas compras como reembolsos.
    """
    product = instance.original_product
    if not product:
        return
    
    # Recalcular el total comprado del producto (suma de todos los amount_buyed)
    total_purchased = sum(
        pb.amount_buyed - pb.quantity_refuned  # Restar devoluciones de cada compra
        for pb in product.buys.all()
    )
    # Asegurar que no sea negativo
    total_purchased = max(0, total_purchased)
    
    product.amount_purchased = total_purchased
    
    # Determinar el nuevo estado basado en las cantidades
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_purchased', 'status', 'updated_at'])


@receiver(post_delete, sender=ProductBuyed)
def update_product_on_buyed_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se elimina un ProductBuyed.
    """
    product = instance.original_product
    if not product:
        return
    
    # Recalcular el total comprado del producto
    total_purchased = sum(
        pb.amount_buyed - pb.quantity_refuned  # Restar devoluciones
        for pb in product.buys.all()
    )
    total_purchased = max(0, total_purchased)
    
    product.amount_purchased = total_purchased
    
    # Determinar el nuevo estado basado en las cantidades actuales
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_purchased', 'status', 'updated_at'])


# ============================================================================
# PRODUCT RECEIVED SIGNALS
# ============================================================================

@receiver(post_save, sender=ProductReceived)
def update_product_on_received_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_received y estado del producto original cuando se guarda/crea un ProductReceived.
    """
    product = instance.original_product
    if not product:
        return
    
    # Recalcular el total recibido del producto (suma de todos los amount_received)
    total_received = sum(
        pr.amount_received
        for pr in product.receiveds.all()
    )
    product.amount_received = total_received
    
    # Determinar el nuevo estado basado en las cantidades
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_received', 'status', 'updated_at'])


@receiver(post_delete, sender=ProductReceived)
def update_product_on_received_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_received y estado del producto original cuando se elimina un ProductReceived.
    """
    product = instance.original_product
    if not product:
        return
    
    # Recalcular el total recibido del producto
    total_received = sum(
        pr.amount_received
        for pr in product.receiveds.all()
    )
    product.amount_received = total_received
    
    # Determinar el nuevo estado basado en las cantidades actuales
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_received', 'status', 'updated_at'])


# ============================================================================
# PRODUCT DELIVERY SIGNALS
# ============================================================================

@receiver(post_save, sender=ProductDelivery)
def update_product_on_delivery_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_delivered y estado del producto original cuando se guarda/crea un ProductDelivery.
    También verifica si la orden debe cambiar a COMPLETADO.
    """
    product = instance.original_product
    if not product:
        return
    
    # Recalcular el total entregado del producto (suma de todos los amount_delivered)
    total_delivered = sum(
        pd.amount_delivered
        for pd in product.delivers.all()
    )
    product.amount_delivered = total_delivered
    
    # Determinar el nuevo estado basado en las cantidades
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
    
    # Verificar si la orden debe cambiar a COMPLETADO
    if product.order:
        product.order.update_status_based_on_delivery()


@receiver(post_delete, sender=ProductDelivery)
def update_product_on_delivery_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_delivered y estado del producto original cuando se elimina un ProductDelivery.
    También maneja la actualización de estado de la orden si es necesario.
    """
    product = instance.original_product
    order = product.order if product else None
    
    if not product:
        return
    
    # Recalcular el total entregado del producto
    total_delivered = sum(
        pd.amount_delivered
        for pd in product.delivers.all()
    )
    product.amount_delivered = total_delivered
    
    # Determinar el nuevo estado basado en las cantidades actuales
    product.status = _determine_product_status(
        amount_purchased=product.amount_purchased,
        amount_received=product.amount_received,
        amount_delivered=product.amount_delivered,
        amount_requested=product.amount_requested,
        current_status=product.status
    )
    
    product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
    
    # Si hay orden asociada, verificar si debe cambiar de estado
    if order:
        # Si ya no está completamente entregada, cambiar de COMPLETADO a PROCESANDO
        if not order.is_fully_delivered and order.status == ProductStatusEnum.COMPLETADO.value:
            order.status = ProductStatusEnum.PROCESANDO.value
            order.save(update_fields=['status', 'updated_at'])
