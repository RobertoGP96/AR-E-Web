import logging
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from api.models import (
    Product, Order, ProductBuyed, ProductReceived, ProductDelivery, DeliverReceip, CustomUser
)
from api.enums import ProductStatusEnum, OrderStatusEnum

logger = logging.getLogger(__name__)


# ============================================================================
# HELPER: Recalcular balance del cliente
# ============================================================================

def _update_client_balance(client):
    """
    Recalcula y guarda el campo `balance` del cliente.
    Solo aplica a usuarios con rol 'client'.
    """
    if client and hasattr(client, 'recalculate_balance') and client.role == 'client':
        try:
            client.recalculate_balance()
        except Exception as e:
            logger.error(
                f"Error recalculando balance del cliente {client.id}: {e}",
                exc_info=True
            )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _determine_product_status(amount_purchased, amount_received, amount_delivered, 
                             amount_requested, current_status):
    """
    Determina el estado de un producto basado en las cantidades de compra, recepción y entrega.
    
    Flujo de estados CON DEPENDENCIAS OBLIGATORIAS:
    ────────────────────────────────────────────────
    ENCARGADO
        └─ (amount_purchased >= amount_requested) ─→ COMPRADO
                                                        └─ (amount_received >= amount_requested) ─→ RECIBIDO
                                                                                                     └─ (amount_delivered >= amount_received AND amount_delivered >= amount_purchased) ─→ ENTREGADO
    
    REQUISITOS:
    ───────────
    1. RECIBIDO SOLO SI:
       - amount_purchased >= amount_requested (completamente comprado)
       - amount_received >= amount_requested (completamente recibido)
    
    2. ENTREGADO SOLO SI:
       - amount_received >= amount_requested (completamente recibido)
       - amount_delivered >= amount_received (entregado lo recibido)
       - amount_delivered >= amount_purchased (entregado lo comprado)
    
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
    
    # ============================================================================
    # ENTREGADO: SOLO SI se cumplan TODAS las condiciones:
    # 1. Se compró completamente (amount_purchased >= amount_requested)
    # 2. Se recibió completamente (amount_received >= amount_requested)
    # 3. Se entregó lo recibido (amount_delivered >= amount_received)
    # 4. Se entregó lo comprado (amount_delivered >= amount_purchased)
    # ============================================================================
    if (amount_purchased >= amount_requested and 
        amount_received >= amount_requested and 
        amount_delivered >= amount_received and 
        amount_delivered >= amount_purchased and 
        amount_delivered > 0):
        return ProductStatusEnum.ENTREGADO.value
    
    # ============================================================================
    # RECIBIDO: SOLO SI se cumplan TODAS las condiciones:
    # 1. Se compró completamente (amount_purchased >= amount_requested)
    # 2. Se recibió completamente (amount_received >= amount_requested)
    # 3. Aún NO se ha entregado todo (amount_delivered < amount_received)
    # ============================================================================
    if (amount_purchased >= amount_requested and 
        amount_received >= amount_requested and 
        amount_delivered < amount_received and
        amount_received > 0):
        return ProductStatusEnum.RECIBIDO.value
    
    # ============================================================================
    # COMPRADO: SOLO SI se cumplan TODAS las condiciones:
    # 1. Se compró completamente (amount_purchased >= amount_requested)
    # 2. Aún NO se ha recibido todo (amount_received < amount_requested)
    # ============================================================================
    if (amount_purchased >= amount_requested and 
        amount_received < amount_requested and
        amount_purchased > 0):
        return ProductStatusEnum.COMPRADO.value
    
    # ============================================================================
    # ENCARGADO: Estado inicial o cuando FALTA comprar
    # Aplica cuando:
    # - No se ha comprado nada (amount_purchased = 0)
    # - Se compró parcialmente (0 < amount_purchased < amount_requested)
    # ============================================================================
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

@receiver(post_save, sender=ProductBuyed)
def update_product_on_buyed_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se guarda/crea un ProductBuyed.
    Maneja tanto nuevas compras como reembolsos.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    if not product:
        logger.warning(f"ProductBuyed {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if product.order:
            product.order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductBuyed.post_save: {e}", exc_info=True)
        raise


@receiver(post_delete, sender=ProductBuyed)
def update_product_on_buyed_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_purchased y estado del producto original cuando se elimina un ProductBuyed.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    if not product:
        logger.warning(f"ProductBuyed eliminado {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if product.order:
            product.order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductBuyed.post_delete: {e}", exc_info=True)
        raise


# ============================================================================
# PRODUCT RECEIVED SIGNALS
# ============================================================================

@receiver(post_save, sender=ProductReceived)
def update_product_on_received_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_received y estado del producto original cuando se guarda/crea un ProductReceived.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    if not product:
        logger.warning(f"ProductReceived {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if product.order:
            product.order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductReceived.post_save: {e}", exc_info=True)
        raise


@receiver(post_delete, sender=ProductReceived)
def update_product_on_received_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_received y estado del producto original cuando se elimina un ProductReceived.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    if not product:
        logger.warning(f"ProductReceived eliminado {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if product.order:
            product.order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductReceived.post_delete: {e}", exc_info=True)
        raise


# ============================================================================
# PRODUCT DELIVERY SIGNALS
# ============================================================================

@receiver(post_save, sender=ProductDelivery)
def update_product_on_delivery_save(sender, instance, created, **kwargs):
    """
    Actualiza el amount_delivered y estado del producto original cuando se guarda/crea un ProductDelivery.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    if not product:
        logger.warning(f"ProductDelivery {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if product.order:
            product.order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductDelivery.post_save: {e}", exc_info=True)
        raise


@receiver(post_delete, sender=ProductDelivery)
def update_product_on_delivery_delete(sender, instance, **kwargs):
    """
    Actualiza el amount_delivered y estado del producto original cuando se elimina un ProductDelivery.
    También actualiza el estado de la orden basándose en el estado de los productos.
    """
    from api.services.product_status_service import ProductStatusService
    
    product = instance.original_product
    order = product.order if product else None
    
    if not product:
        logger.warning(f"ProductDelivery eliminado {instance.id} sin original_product")
        return
    
    try:
        ProductStatusService.recalculate_product_status(product)
        
        # Actualizar estado de la orden basándose en los productos
        if order:
            order.update_status_based_on_products()
    except Exception as e:
        logger.error(f"Error actualizando estado del producto en ProductDelivery.post_delete: {e}", exc_info=True)
        raise


# ============================================================================
# ORDER BALANCE SIGNALS
# ============================================================================

@receiver(post_save, sender=Order)
def update_client_balance_on_order_save(sender, instance, **kwargs):
    """
    Actualiza el saldo (balance) del cliente cuando se guarda un pedido.
    Esto cubre tanto la creación como la actualización de pagos en órdenes.
    """
    _update_client_balance(instance.client)


@receiver(post_delete, sender=Order)
def update_client_balance_on_order_delete(sender, instance, **kwargs):
    """
    Actualiza el saldo (balance) del cliente cuando se elimina un pedido.
    """
    _update_client_balance(instance.client)


# ============================================================================
# DELIVERY BALANCE SIGNALS
# ============================================================================

@receiver(post_save, sender=DeliverReceip)
def update_client_balance_on_delivery_save(sender, instance, **kwargs):
    """
    Actualiza el saldo (balance) del cliente cuando se guarda una entrega.
    Cubre tanto la creación como la actualización de pagos en entregas.
    """
    _update_client_balance(instance.client)


@receiver(post_delete, sender=DeliverReceip)
def update_client_balance_on_delivery_delete(sender, instance, **kwargs):
    """
    Actualiza el saldo (balance) del cliente cuando se elimina una entrega.
    """
    _update_client_balance(instance.client)
