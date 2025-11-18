"""Order models"""

from django.utils import timezone
from django.db import models
from api.enums import OrderStatusEnum, PaymentStatusEnum


class Order(models.Model):
    """Orders in shops"""

    client = models.ForeignKey(
        'api.CustomUser', on_delete=models.CASCADE, related_name="orders"
    )
    sales_manager = models.ForeignKey(
        'api.CustomUser', on_delete=models.CASCADE, related_name="managed_orders",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in OrderStatusEnum],
        default=OrderStatusEnum.ENCARGADO.value
    )
    pay_status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in PaymentStatusEnum],
        default=PaymentStatusEnum.NO_PAGADO.value
    )
    observations = models.TextField(blank=True, null=True)

    # Campos de pago
    received_value_of_client = models.FloatField(
        default=0,
        help_text="Cantidad total recibida del cliente por este pedido"
    )

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Pedido #{self.pk} - {self.client.full_name}"

    def update_status_based_on_delivery(self):
        """
        Actualiza el estado de la orden a COMPLETADO solo cuando todos los productos
        hayan sido completamente entregados (amount_delivered == amount_purchased para todos)
        """
        if self.status == OrderStatusEnum.CANCELADO.value:
            return  # No cambiar órdenes canceladas

        if self.is_fully_delivered:
            # Todos los productos están entregados, marcar como completado
            if self.status != OrderStatusEnum.COMPLETADO.value:
                self.status = OrderStatusEnum.COMPLETADO.value
                self.save(update_fields=['status', 'updated_at'])

    def total_cost(self):
        """Total cost of order"""
        return sum(product.total_cost for product in self.products.all())

    @property
    def balance(self):
        """
        Balance del pedido = cantidad recibida - costo total
        Un balance positivo indica que el cliente pagó de más
        Un balance negativo indica que falta por cobrar
        """
        return float(self.received_value_of_client - self.total_cost())

    @property
    def total_products_requested(self):
        """Total de productos solicitados en la orden"""
        return sum(product.amount_requested for product in self.products.all())

    @property
    def total_products_purchased(self):
        """Total de productos comprados en la orden"""
        return sum(product.amount_purchased for product in self.products.all())

    @property
    def total_products_delivered(self):
        """Total de productos entregados en la orden"""
        return sum(product.amount_delivered for product in self.products.all())

    @property
    def has_pending_delivery(self):
        """Verifica si la orden tiene productos pendientes de entregar"""
        for product in self.products.all():
            if product.pending_delivery > 0:
                return True
        return False

    @property
    def is_fully_delivered(self):
        """Verifica si todos los productos de la orden han sido completamente entregados"""
        # Solo si hay productos comprados y todos están entregados
        if self.total_products_purchased == 0:
            return False
        return not self.has_pending_delivery

    @property
    def available_for_delivery(self):
        """
        Verifica si la orden está disponible para crear un delivery.
        Una orden está disponible si:
        - NO está cancelada
        - NO está completada (todos los productos entregados)
        - Tiene productos comprados pendientes de entregar
        """
        if self.status == OrderStatusEnum.CANCELADO.value:
            return False

        # Si ya está marcada como completado, no está disponible
        if self.status == OrderStatusEnum.COMPLETADO.value:
            return False

        # Debe tener productos pendientes de entregar
        return self.has_pending_delivery

    class Meta:
        ordering = ['-created_at']