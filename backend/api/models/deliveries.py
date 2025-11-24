"""Delivery related models"""

from django.utils import timezone
from django.db import models
from api.enums import DeliveryStatusEnum, PackageStatusEnum


class DeliverReceip(models.Model):
    """Receipt given periodically to user every time they get products"""

    client = models.ForeignKey(
        'api.CustomUser', on_delete=models.CASCADE, related_name="deliveries",
        limit_choices_to={'role': 'client'},
        help_text='Cliente al que pertenece el delivery'
    )
    category = models.ForeignKey(
        'api.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
        help_text='Categoría principal de los productos en este delivery'
    )
    weight = models.FloatField()
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in DeliveryStatusEnum],
        default=DeliveryStatusEnum.PENDIENTE.value
    )
    deliver_date = models.DateTimeField(default=timezone.now)
    deliver_picture = models.TextField(blank=True, null=True, help_text='image URLs')
    weight_cost = models.FloatField(default=0)
    manager_profit = models.FloatField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        client_info = f"Cliente: {self.client.full_name}"
        category_info = f" - {self.category.name}" if self.category else ""
        return f"Entrega - {client_info}{category_info} - {self.deliver_date.strftime('%Y-%m-%d')}"

    @property
    def delivery_expenses(self):
        """
        Gastos de la entrega = peso × costo por libra (del sistema).
        Este es el costo operativo del envío.
        """
        if self.category and self.category.shipping_cost_per_pound:
            return float(self.weight * self.category.shipping_cost_per_pound)
        return float(self.weight_cost)

    @property
    def system_delivery_profit(self):
        """
        Ganancia del sistema en esta entrega = cobro al cliente - ganancia del agente - gastos.
        Representa la ganancia neta del sistema en el servicio de entrega.
        """
        return float(self.weight_cost - self.manager_profit - self.delivery_expenses)

    class Meta:
        ordering = ['-deliver_date']
        verbose_name = "Recibo de Entrega"
        verbose_name_plural = "Recibos de Entrega"


class Package(models.Model):
    """Packages sent with products"""

    agency_name = models.CharField(max_length=100)
    number_of_tracking = models.CharField(max_length=100, unique=True)
    status_of_processing = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in PackageStatusEnum],
        default=PackageStatusEnum.ENVIADO.value
    )
    arrival_date = models.DateField(default=timezone.now, help_text="Fecha de llegada del paquete")
    package_picture = models.TextField(blank=True, null=True, help_text=' image URL')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.agency_name} - {self.number_of_tracking}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Paquete"
        verbose_name_plural = "Paquetes"