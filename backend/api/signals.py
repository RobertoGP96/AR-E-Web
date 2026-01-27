from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from api.models import Product, Order

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
