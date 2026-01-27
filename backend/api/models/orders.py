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
    
    payment_date = models.DateField(default=timezone.now, help_text="Fecha de pago")

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

    def add_received_value(self, amount: float) -> None:
        """
        Añade una cantidad a `received_value_of_client` y actualiza `pay_status` en base
        al costo total de la orden. Guarda la instancia con los campos necesarios.

        Este método centraliza la lógica de acumulación y el cálculo del estado de pago
        para mantener el comportamiento consistente en todo el backend.
        """
        if amount is None:
            return

        try:
            amount_float = float(amount)
        except (TypeError, ValueError):
            # No se puede procesar la cantidad proporcionada
            return

        if amount_float <= 0:
            # No sumar valores no positivos
            return

        self.received_value_of_client += amount_float

        # Calcular el costo total de la orden
        total_cost = self.total_cost() if callable(self.total_cost) else self.total_cost

        # Redondear ambos valores para evitar problemas de precisión en punto flotante
        received_rounded = round(self.received_value_of_client, 2)
        total_rounded = round(total_cost, 2)

        # Actualizar el pay_status
        if received_rounded >= total_rounded and total_rounded > 0:
            self.pay_status = 'Pagado'
        elif received_rounded > 0:
            self.pay_status = 'Parcial'
        else:
            self.pay_status = 'No pagado'

        # Guardar cambios mínimamente
        self.save(update_fields=['received_value_of_client', 'pay_status', 'updated_at'])

    @property
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
    def total_expenses(self):
        """
        Gastos totales de la orden.
        Suma de los gastos del sistema (system_expenses) de todos los productos,
        multiplicados por la cantidad comprada de cada producto.
        """
        total = 0.0
        for product in self.products.all():
            try:
                # Gastos del sistema por unidad × cantidad comprada
                product_expenses = float(product.system_expenses or 0.0) * int(product.amount_purchased or 0)
                total += product_expenses
            except (AttributeError, TypeError, ValueError):
                continue
        return float(total)

    @property
    def total_profit(self):
        """
        Ganancia total de la orden.
        Suma de las ganancias del sistema (system_profit) de todos los productos,
        multiplicadas por la cantidad comprada de cada producto.
        
        La ganancia se calcula como:
        (costo total cobrado al cliente - gastos del sistema) × cantidad comprada
        """
        total = 0.0
        for product in self.products.all():
            try:
                # Ganancia del sistema por unidad × cantidad comprada
                product_profit = float(product.system_profit or 0.0) * int(product.amount_purchased or 0)
                total += product_profit
            except (AttributeError, TypeError, ValueError):
                continue
        return float(total)

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

    def save(self, *args, **kwargs):
        """
        Override save para recalcular 'pay_status' cuando 'received_value_of_client' cambie o durante creación.
        Esto asegura que las operaciones directas de creación actualicen el estado de pago correctamente,
        pero *no* sobrescribe manualmente `pay_status` si esta propiedad se establece explícitamente y el
        valor de `received_value_of_client` no ha cambiado.
        """
        # Determinar el costo total para poder comparar
        try:
            total_cost = self.total_cost
        except Exception:
            total_cost = 0

        # Redondear ambos valores para evitar problemas de precisión en punto flotante
        received_rounded = round(self.received_value_of_client, 2)
        total_rounded = round(total_cost, 2)

        if not self.pk:
            # Nueva instancia en create: calcular pay_status en base a received_value_of_client
            if received_rounded >= total_rounded and total_rounded > 0:
                self.pay_status = 'Pagado'
            elif received_rounded > 0:
                self.pay_status = 'Parcial'
            else:
                self.pay_status = 'No pagado'
        else:
            # Intentar comparar con instancia anterior para ver si received_value_of_client cambió
            try:
                previous = Order.objects.get(pk=self.pk)
                if previous.received_value_of_client != self.received_value_of_client:
                    if received_rounded >= total_rounded and total_rounded > 0:
                        self.pay_status = 'Pagado'
                    elif received_rounded > 0:
                        self.pay_status = 'Parcial'
                    else:
                        self.pay_status = 'No pagado'
            except Order.DoesNotExist:
                # En caso de que la instancia no exista, proceder como creación
                if received_rounded >= total_rounded and total_rounded > 0:
                    self.pay_status = 'Pagado'
                elif received_rounded > 0:
                    self.pay_status = 'Parcial'
                else:
                    self.pay_status = 'No pagado'

        super().save(*args, **kwargs)