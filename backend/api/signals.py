from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from api.models import (
    Product, Order, ProductBuyed, ProductReceived, ProductDelivery
)
from api.enums import ProductStatusEnum


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

@receiver(pre_save, sender=ProductBuyed)
def store_old_refund_state(sender, instance, **kwargs):
    """
    Guarda el estado anterior de refund para detectar cambios en post_save.
    Este signal captura si el ProductBuyed cambió su estado de refund.
    """
    if instance.pk:
        try:
            old_instance = ProductBuyed.objects.get(pk=instance.pk)
            instance._old_is_refunded = old_instance.is_refunded
            instance._old_quantity_refunded = old_instance.quantity_refuned
        except ProductBuyed.DoesNotExist:
            instance._old_is_refunded = False
            instance._old_quantity_refunded = 0
    else:
        instance._old_is_refunded = False
        instance._old_quantity_refunded = 0


@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se guarda/actualiza un ProductBuyed.
    """
    product = instance.original_product
    if not product:
        return
    
    # Si se está realizando un reembolso (cambio de estado de refund)
    is_refund_activated = (
        hasattr(instance, '_old_is_refunded') and 
        not instance._old_is_refunded and 
        instance.is_refunded
    )
    
    if is_refund_activated:
        # Restar la cantidad reembolsada del total comprado
        product.amount_purchased = max(0, product.amount_purchased - instance.quantity_refuned)
        
        # Si la cantidad comprada es menor a la solicitada, volver a estado ENCARGADO
        if product.amount_purchased < product.amount_requested:
            product.status = ProductStatusEnum.ENCARGADO.value
        
        product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
        return
    
    # Recalcular el total comprado del producto
    total_purchased = sum(
        pb.amount_buyed
        for pb in product.buys.all()
    )
    product.amount_purchased = total_purchased
    
    # Actualizar estado según la cantidad comprada
    if total_purchased >= product.amount_requested and product.amount_requested > 0:
        if product.status == ProductStatusEnum.ENCARGADO.value:
            product.status = ProductStatusEnum.COMPRADO.value
    else:
        product.status = ProductStatusEnum.ENCARGADO.value
    
    product.save(update_fields=['amount_purchased', 'status', 'updated_at'])


@receiver(post_delete, sender=ProductBuyed)
def update_product_on_buyed_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se elimina un ProductBuyed.
    """
    product = instance.original_product
    if not product:
        return
    
    # Restar la cantidad comprada del total
    product.amount_purchased = max(0, product.amount_purchased - instance.amount_buyed)
    
    # Si la cantidad comprada es menor que la solicitada, cambiar el estado a ENCARGADO
    if product.amount_purchased < product.amount_requested:
        product.status = ProductStatusEnum.ENCARGADO.value
    
    # Guardar los cambios
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
    
    # Recalcular el total recibido del producto
    total_received = sum(
        pr.amount_received
        for pr in product.receiveds.all()
    )
    product.amount_received = total_received
    
    # Si la cantidad recibida es igual (o mayor) a la ENCARGADA (amount_requested), cambiar estado a RECIBIDO
    if total_received >= product.amount_requested and product.amount_requested > 0:
        # Solo cambiar a RECIBIDO si está en COMPRADO o ENCARGADO
        if product.status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
            product.status = ProductStatusEnum.RECIBIDO.value
    
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
    
    # Si después de eliminar ya no está completamente recibido
    if total_received < product.amount_requested:
        if product.status == ProductStatusEnum.RECIBIDO.value:
            # Volver a COMPRADO si tiene productos comprados, si no a ENCARGADO
            if product.amount_purchased > 0:
                product.status = ProductStatusEnum.COMPRADO.value
            else:
                product.status = ProductStatusEnum.ENCARGADO.value
    
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
    
    # Recalcular el total entregado del producto
    total_delivered = sum(
        pd.amount_delivered
        for pd in product.delivers.all()
    )
    product.amount_delivered = total_delivered
    
    # Si la cantidad entregada es igual a la RECIBIDA Y COMPRADA, cambiar estado a ENTREGADO
    if (total_delivered == product.amount_received and 
        total_delivered == product.amount_purchased and
        product.amount_purchased > 0):
        # Solo cambiar a ENTREGADO si está en RECIBIDO o COMPRADO
        if product.status in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.COMPRADO.value]:
            product.status = ProductStatusEnum.ENTREGADO.value
    
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
    
    # Si después de eliminar ya no está completamente entregado
    if total_delivered < product.amount_received:
        if product.status == ProductStatusEnum.ENTREGADO.value:
            # Volver a RECIBIDO si la cantidad entregada es menor a la recibida
            product.status = ProductStatusEnum.RECIBIDO.value
    
    product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
    
    # Si hay orden asociada, verificar si debe cambiar de estado
    if order:
        # Si ya no está completamente entregada, cambiar de COMPLETADO a PROCESANDO
        if not order.is_fully_delivered and order.status == ProductStatusEnum.COMPLETADO.value:
            order.status = ProductStatusEnum.PROCESANDO.value
            order.save(update_fields=['status', 'updated_at'])
