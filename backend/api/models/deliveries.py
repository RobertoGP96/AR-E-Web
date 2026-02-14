"""Delivery related models"""

from django.utils import timezone
from django.db import models
from api.enums import DeliveryStatusEnum, PackageStatusEnum, PaymentStatusEnum


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
    payment_status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in PaymentStatusEnum],
        default=PaymentStatusEnum.NO_PAGADO.value,
        help_text='Estado de pago de la entrega'
    )
    payment_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Fecha en que se realizó el pago'
    )
    payment_amount = models.FloatField(
        default=0,
        help_text='Monto recibido del pago'
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

    def add_payment_amount(self, amount: float, payment_date=None) -> None:
        """
        Añade una cantidad a `payment_amount` y actualiza `payment_status` en base
        al costo total de la entrega (weight_cost). Guarda la instancia con los campos necesarios.
        
        Args:
            amount: Cantidad a añadir al pago
            payment_date: Fecha del pago (opcional). Si no se proporciona, se usa la fecha actual.
        """
        if amount is None:
            return

        try:
            amount_float = float(amount)
        except (TypeError, ValueError):
            return

        if amount_float <= 0:
            return

        self.payment_amount = round(self.payment_amount + amount_float, 2)

        # Calcular el costo total de la entrega
        total_cost = self.weight_cost

        # Redondear ambos valores para evitar problemas de precisión en punto flotante
        payment_rounded = round(self.payment_amount, 2)
        total_rounded = round(total_cost, 2)

        # Actualizar el payment_status
        if payment_rounded >= total_rounded and total_rounded > 0:
            self.payment_status = 'Pagado'
        elif payment_rounded > 0:
            self.payment_status = 'Parcial'
        else:
            self.payment_status = 'No pagado'
        
        # Actualizar la fecha de pago si se proporciona
        if payment_date:
            self.payment_date = payment_date
        elif not self.payment_date:
            # Si no hay fecha previa y no se proporciona, usar la fecha actual
            self.payment_date = timezone.now()

        # Guardar cambios mínimamente
        self.save(update_fields=['payment_amount', 'payment_status', 'payment_date', 'updated_at'])

    def delete(self, *args, **kwargs):
        """
        Elimina el DeliverReceip. La lógica de descuento de cantidades entregadas
        se maneja automáticamente a través de signals cuando se eliminan los
        ProductDelivery asociados.
        """
        super().delete(*args, **kwargs)

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

    def delete(self, *args, **kwargs):
        """
        Elimina el Package. La lógica de descuento de cantidades recibidas
        se maneja automáticamente a través de signals cuando se eliminan los
        ProductReceived asociados.
        """
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Paquete"
        verbose_name_plural = "Paquetes"