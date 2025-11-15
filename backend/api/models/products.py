"""Product related models"""

import uuid
from django.utils import timezone
from django.db import models
from api.enums import ProductStatusEnum, OrderStatusEnum


class Category(models.Model):
    """Categorías de productos con costo de envío por libra"""

    name = models.CharField(max_length=100, unique=True)
    shipping_cost_per_pound = models.FloatField(default=0, help_text="Costo de envío por libra para esta categoría")
    client_shipping_charge = models.FloatField(default=0, help_text="Cantidad que se le cobra al cliente por el envío por libra")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"


class Product(models.Model):
    """Products in shop"""

    # Product information
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    sku = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=100)
    link = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    shop = models.ForeignKey('api.Shop', on_delete=models.CASCADE)
    description = models.TextField(max_length=200,blank=True, null=True)
    observation = models.TextField(max_length=200,blank=True, null=True)
    category = models.ForeignKey('api.Category', on_delete=models.SET_NULL, null=True, blank=True)
    amount_requested = models.IntegerField()
    
    # Nuevos campos para control de cantidades
    amount_purchased = models.IntegerField(default=0, help_text="Cantidad total de productos comprados")
    amount_received = models.IntegerField(default=0, help_text="Cantidad total de productos recibidos")
    amount_delivered = models.IntegerField(default=0, help_text="Cantidad total de productos entregados")
    
    order = models.ForeignKey('api.Order', on_delete=models.CASCADE, related_name="products")
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in ProductStatusEnum],
        default=ProductStatusEnum.ENCARGADO.value
    )
    product_pictures = models.ManyToManyField('api.EvidenceImages', blank=True)    # Product prices
    shop_cost = models.FloatField()
    shop_delivery_cost = models.FloatField(default=0)
    shop_taxes = models.FloatField(default=0)
    charge_iva = models.BooleanField(
        default=True,
        help_text="Indica si se debe cobrar IVA (7%) para este producto"
    )
    base_tax = models.FloatField(default=0, help_text="IVA 7% calculado sobre (precio + envío)")
    shop_tax_amount = models.FloatField(default=0, help_text="Impuesto adicional calculado (3% o 5%)")
    own_taxes = models.FloatField(default=0)
    added_taxes = models.FloatField(default=0)
    total_cost = models.FloatField(default=0)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.name} - {self.sku}"

    @property
    def pending_purchase(self):
        """Cantidad pendiente de comprar"""
        return self.amount_requested - self.amount_purchased

    @property
    def pending_delivery(self):
        """Cantidad pendiente de entregar"""
        return self.amount_purchased - self.amount_delivered

    @property
    def is_fully_purchased(self):
        """Verifica si se ha comprado toda la cantidad solicitada"""
        return self.amount_purchased >= self.amount_requested

    @property
    def is_fully_delivered(self):
        """Verifica si se ha entregado toda la cantidad comprada"""
        return self.amount_delivered >= self.amount_purchased

    @property
    def total_received(self):
        return sum(pr.amount_received for pr in self.receiveds.all())

    @property
    def total_delivered(self):
        return sum(pr.amount_delivered for pr in self.delivers.all())

    @property
    def system_expenses(self):
        """
        Gastos del sistema para este producto.
        Fórmula: precio + envío + (7% del precio si charge_iva=True) + impuesto adicional (added_taxes)
        """
        base_price = self.shop_cost
        shipping = self.shop_delivery_cost
        # Solo aplicar IVA si charge_iva es True
        base_tax = (base_price * 0.07) if self.charge_iva else 0
        additional_tax = self.added_taxes

        return base_price + shipping + base_tax + additional_tax

    @property
    def system_profit(self):
        """
        Ganancia del sistema para este producto.
        Fórmula: (costo total cobrado al cliente - gastos del sistema) + impuestos propios (own_taxes)

        El campo own_taxes representa impuestos adicionales que se suman a las ganancias del sistema.
        """
        base_profit = float(self.total_cost) - self.system_expenses
        return base_profit + self.own_taxes

    class Meta:
        ordering = ['-created_at']


class ProductBuyed(models.Model):
    """Bought Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="buys"
    )
    actual_cost_of_product = models.FloatField(default=0)
    shop_discount = models.FloatField(default=0)
    offer_discount = models.FloatField(default=0)
    buy_date = models.DateTimeField(default=timezone.now)
    shoping_receip = models.ForeignKey(
        'api.ShoppingReceip', on_delete=models.CASCADE, related_name="buyed_products", null=True, blank=True
    )
    amount_buyed = models.IntegerField()
    observation = models.TextField(max_length=200, null=True, blank=True)
    real_cost_of_product = models.FloatField(default=0)
    is_refunded = models.BooleanField(
        default=False,
        help_text="Indica si este producto comprado ha sido reembolsado"
    )
    refund_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha en que se realizó el reembolso"
    )
    refund_amount = models.FloatField(
        default=0,
        help_text="Monto del reembolso realizado"
    )
    refund_notes = models.TextField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Notas sobre el reembolso"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def save(self, *args, **kwargs):
        """
        Al guardar un ProductBuyed, actualiza el amount_purchased y el estado del producto original
        """
        is_new = self.pk is None

        super().save(*args, **kwargs)

        # Recalcular el total comprado del producto
        if self.original_product:
            total_purchased = sum(
                pb.amount_buyed
                for pb in self.original_product.buys.all()
            )
            self.original_product.amount_purchased = total_purchased

            # Actualizar estado si se ha comprado toda la cantidad solicitada
            if total_purchased >= self.original_product.amount_requested:
                if self.original_product.status == ProductStatusEnum.ENCARGADO.value:
                    self.original_product.status = ProductStatusEnum.COMPRADO.value
                    self.original_product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
                else:
                    self.original_product.save(update_fields=['amount_purchased', 'updated_at'])
            else:
                self.original_product.save(update_fields=['amount_purchased', 'updated_at'])

    def delete(self, *args, **kwargs):
        """
        Al eliminar un ProductBuyed, recalcula el amount_purchased y estado del producto original
        """
        product = self.original_product

        super().delete(*args, **kwargs)

        # Recalcular el total comprado del producto
        if product:
            total_purchased = sum(
                pb.amount_buyed
                for pb in product.buys.all()
            )
            product.amount_purchased = total_purchased

            # Si después de eliminar ya no está completamente comprado, volver a ENCARGADO
            if total_purchased < product.amount_requested:
                if product.status == ProductStatusEnum.COMPRADO.value:
                    product.status = ProductStatusEnum.ENCARGADO.value
                    product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
                else:
                    product.save(update_fields=['amount_purchased', 'updated_at'])
            else:
                product.save(update_fields=['amount_purchased', 'updated_at'])

    def __str__(self):
        return f"{self.original_product.name} - Comprado: {self.amount_buyed}"

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Producto Comprado"
        verbose_name_plural = "Productos Comprados"


class ProductReceived(models.Model):
    """Received Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="receiveds"
    )
    package = models.ForeignKey(
        'api.Package',
        on_delete=models.CASCADE,
        related_name="package_products",
        null=True,
        blank=True,
    )
    amount_received = models.IntegerField(default=1)
    observation = models.TextField(max_length=200, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.original_product.name} - Recibido: {self.amount_received}"

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

            # Si la cantidad recibida es igual o mayor a la solicitada, cambiar estado a RECIBIDO
            if total_received >= self.original_product.amount_requested:
                # Solo cambiar a RECIBIDO si está en COMPRADO o ENCARGADO
                if self.original_product.status in [ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
                    self.original_product.status = ProductStatusEnum.RECIBIDO.value

            self.original_product.save(update_fields=['amount_received', 'status', 'updated_at'])

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

            # Si después de eliminar ya no está completamente recibido
            if total_received < product.amount_requested:
                if product.status == ProductStatusEnum.RECIBIDO.value:
                    # Volver al estado anterior (COMPRADO si hay algo comprado, ENCARGADO si no)
                    if product.amount_purchased >= product.amount_requested:
                        product.status = ProductStatusEnum.COMPRADO.value
                    else:
                        product.status = ProductStatusEnum.ENCARGADO.value

            product.save(update_fields=['amount_received', 'status', 'updated_at'])

    @property
    def total_received(self):
        """Total amount received across all ProductReceived instances for this product"""
        return sum(pr.amount_received for pr in self.original_product.receiveds.all())

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Producto Recibido"
        verbose_name_plural = "Productos Recibidos"


class ProductDelivery(models.Model):
    """Received Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="delivers"
    )

    reception= models.DateField(null=True, blank=True)

    deliver_receip = models.ForeignKey(
        'api.DeliverReceip',
        on_delete=models.CASCADE,
        related_name="delivered_products",
        null=True,
        blank=True,
    )

    amount_delivered = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.original_product.name} - Recibido: {self.amount_delivered}"

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

            # Si la cantidad entregada es igual o mayor a la solicitada, cambiar estado a ENTREGADO
            if total_delivered >= self.original_product.amount_requested:
                # Solo cambiar a ENTREGADO si está en RECIBIDO, COMPRADO o ENCARGADO
                if self.original_product.status in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.COMPRADO.value, ProductStatusEnum.ENCARGADO.value]:
                    self.original_product.status = ProductStatusEnum.ENTREGADO.value
                    self.original_product.save(update_fields=['amount_delivered', 'status', 'updated_at'])
                else:
                    self.original_product.save(update_fields=['amount_delivered', 'updated_at'])
            else:
                self.original_product.save(update_fields=['amount_delivered', 'updated_at'])

        # Verificar si la orden debe cambiar a COMPLETADO
        if self.original_product.order:
            self.original_product.order.update_status_based_on_delivery()

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
            if total_delivered < product.amount_requested:
                if product.status == ProductStatusEnum.ENTREGADO.value:
                    # Volver al estado anterior basado en lo que se ha recibido/comprado
                    total_received = sum(pr.amount_received for pr in product.receiveds.all())
                    if total_received >= product.amount_requested:
                        product.status = ProductStatusEnum.RECIBIDO.value
                    elif product.amount_purchased >= product.amount_requested:
                        product.status = ProductStatusEnum.COMPRADO.value
                    else:
                        product.status = ProductStatusEnum.ENCARGADO.value
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

    def update_product_delivered_amount(self):
        """
        Recalcula y actualiza el amount_delivered del producto original
        basado en todos sus ProductDelivery
        """
        if self.original_product:
            total = sum(
                pd.amount_delivered
                for pd in self.original_product.delivers.all()
            )
            self.original_product.amount_delivered = total
            self.original_product.save(update_fields=['amount_delivered'])

    @property
    def total_delivered(self):
        """Total amount delivered across all ProductDelivery instances for this product"""
        return sum(pd.amount_delivered for pd in self.original_product.delivers.all())

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Producto Entregado"
        verbose_name_plural = "Productos Entregados"