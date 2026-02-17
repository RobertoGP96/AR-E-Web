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

    # Costos totales calculados y almacenados
    total_costs = models.FloatField(
        default=0,
        help_text="Costo total acumulado de todos los productos en la orden"
    )

    objects = models.Manager()

    def update_total_costs(self):
        """
        Recalcula el costo total de la orden basado en sus productos
        y guarda el resultado en el campo total_costs.
        """
        total = round(sum(product.total_cost for product in self.products.all()), 2)
        if self.total_costs != total:
            self.total_costs = total
            self.save(update_fields=['total_costs', 'updated_at'])
        return total

    def __str__(self):
        return f"Pedido #{self.pk} - {self.client.full_name}"

    def update_status_based_on_products(self):
        """
        Actualiza el estado de la orden basándose en el estado de sus productos.
        
        Reglas:
        - Si la orden está CANCELADA, no se modifica.
        - Si TODOS los productos están en estado ENTREGADO → orden en COMPLETADO.
        - Si AL MENOS UN producto está en estado COMPRADO, RECIBIDO o ENTREGADO → orden en PROCESANDO.
        - Si ningún producto ha sido comprado aún → orden permanece en ENCARGADO.
        """
        from api.enums import ProductStatusEnum
        
        if self.status == OrderStatusEnum.CANCELADO.value:
            return  # No cambiar órdenes canceladas
        
        products = self.products.all()
        if not products.exists():
            return  # No hay productos, no cambiar estado
        
        # Obtener los estados de todos los productos
        product_statuses = list(products.values_list('status', flat=True))
        
        # Verificar si TODOS los productos están entregados
        all_delivered = all(
            status == ProductStatusEnum.ENTREGADO.value 
            for status in product_statuses
        )
        
        if all_delivered:
            # Todos los productos entregados → COMPLETADO
            if self.status != OrderStatusEnum.COMPLETADO.value:
                self.status = OrderStatusEnum.COMPLETADO.value
                self.save(update_fields=['status', 'updated_at'])
            return
        
        # Verificar si AL MENOS UN producto está en Comprado, Recibido o Entregado
        processing_statuses = {
            ProductStatusEnum.COMPRADO.value,
            ProductStatusEnum.RECIBIDO.value,
            ProductStatusEnum.ENTREGADO.value,
        }
        
        has_processing_product = any(
            status in processing_statuses
            for status in product_statuses
        )
        
        if has_processing_product:
            # Al menos un producto comprado → PROCESANDO
            if self.status != OrderStatusEnum.PROCESANDO.value:
                self.status = OrderStatusEnum.PROCESANDO.value
                self.save(update_fields=['status', 'updated_at'])
            return
        
        # Ningún producto comprado aún, mantener o volver a ENCARGADO
        if self.status not in [OrderStatusEnum.ENCARGADO.value, OrderStatusEnum.CANCELADO.value]:
            self.status = OrderStatusEnum.ENCARGADO.value
            self.save(update_fields=['status', 'updated_at'])

    def update_status_based_on_delivery(self):
        """
        Actualiza el estado de la orden a COMPLETADO solo cuando todos los productos
        hayan sido completamente entregados (amount_delivered == amount_purchased para todos).
        
        NOTA: Este método está deprecado. Usar update_status_based_on_products() en su lugar.
        """
        if self.status == OrderStatusEnum.CANCELADO.value:
            return  # No cambiar órdenes canceladas

        if self.is_fully_delivered:
            # Todos los productos están entregados, marcar como completado
            if self.status != OrderStatusEnum.COMPLETADO.value:
                self.status = OrderStatusEnum.COMPLETADO.value
                self.save(update_fields=['status', 'updated_at'])

    def add_received_value(self, amount: float, pay_status: str = None) -> None:
        """
        Añade una cantidad a `received_value_of_client` y actualiza `pay_status`.
        Si se proporciona `pay_status`, se usa ese valor en lugar de calcularlo.
        """
        if amount is None:
            return

        try:
            amount_float = float(amount)
        except (TypeError, ValueError):
            return

        if amount_float <= 0:
            if pay_status:
                self.pay_status = pay_status
                self.save(update_fields=['pay_status', 'updated_at'])
            return

        self.received_value_of_client = round(self.received_value_of_client + amount_float, 2)

        if pay_status:
            self.pay_status = pay_status
        else:
            # Calcular el costo total de la orden
            total_costs = self.total_costs

            # Redondear ambos valores para evitar problemas de precisión en punto flotante
            received_rounded = round(self.received_value_of_client, 2)
            total_rounded = round(total_costs, 2)

            # Actualizar el pay_status
            if received_rounded >= total_rounded and total_rounded > 0:
                self.pay_status = 'Pagado'
            elif received_rounded > 0:
                self.pay_status = 'Parcial'
            else:
                self.pay_status = 'No pagado'

        # Guardar cambios
        self.save(update_fields=['received_value_of_client', 'pay_status', 'updated_at'])

    @property
    def total_cost(self):
        """Total cost of order (alias for field total_costs)"""
        return self.total_costs

    @property
    def balance(self):
        """
        Balance del pedido = cantidad recibida - costo total
        Un balance positivo indica que el cliente pagó de más
        Un balance negativo indica que falta por cobrar
        """
        return round(float(self.received_value_of_client - self.total_costs), 2)

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
        return round(float(total), 2)

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
        return round(float(total), 2)

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
        Override save para recalcular 'pay_status' cuando 'received_value_of_client' cambie.
        Ahora respeta si el estado se cambió manualmente desde afuera.
        """
        total_costs = self.total_costs
        received_rounded = round(self.received_value_of_client, 2)
        total_rounded = round(total_costs, 2)

        if not self.pk:
            # En creación, si pay_status es el default, calculamos
            if self.pay_status == PaymentStatusEnum.NO_PAGADO.value:
                if received_rounded >= total_rounded and total_rounded > 0:
                    self.pay_status = 'Pagado'
                elif received_rounded > 0:
                    self.pay_status = 'Parcial'
        else:
            try:
                previous = Order.objects.get(pk=self.pk)
                
                # REGLA 1: Solo auto-recalcular pay_status si el usuario NO lo cambió
                # y el valor recibido SÍ cambió.
                if (previous.pay_status == self.pay_status and 
                    previous.received_value_of_client != self.received_value_of_client):
                    
                    if received_rounded >= total_rounded and total_rounded > 0:
                        self.pay_status = 'Pagado'
                    elif received_rounded > 0:
                        self.pay_status = 'Parcial'
                    else:
                        self.pay_status = 'No pagado'
                
                # REGLA 2: Solo auto-recalcular status si el usuario NO lo cambió
                # (Para evitar que signals sobreescriban cambios manuales)
                # OJO: La lógica de update_status_based_on_products sigue disparándose en signals
                # pero aquí podemos proteger el campo si viene un cambio explícito.
                
            except Order.DoesNotExist:
                pass

        # Asegurar que el valor recibido esté redondeado antes de guardar
        self.received_value_of_client = round(self.received_value_of_client, 2)
        super().save(*args, **kwargs)
