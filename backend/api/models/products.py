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
    # Antes: M2M con EvidenceImages; ahora almacenamos las URLs reales en texto (JSON list)
    product_pictures = models.TextField(blank=True, null=True, help_text='image URLs')
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

    def save(self, *args, **kwargs):
        # Round financial fields
        self.shop_cost = round(self.shop_cost or 0.0, 2)
        self.shop_delivery_cost = round(self.shop_delivery_cost or 0.0, 2)
        self.shop_taxes = round(self.shop_taxes or 0.0, 2)
        self.base_tax = round(self.base_tax or 0.0, 2)
        self.shop_tax_amount = round(self.shop_tax_amount or 0.0, 2)
        self.own_taxes = round(self.own_taxes or 0.0, 2)
        self.added_taxes = round(self.added_taxes or 0.0, 2)
        self.total_cost = round(self.total_cost or 0.0, 2)
        super().save(*args, **kwargs)

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

        return round(base_price + shipping + base_tax + additional_tax, 2)

    @property
    def system_profit(self):
        """
        Ganancia del sistema para este producto.
        Fórmula: (costo total cobrado al cliente - gastos del sistema) + impuestos propios (own_taxes)

        El campo own_taxes representa impuestos adicionales que se suman a las ganancias del sistema.
        """
        base_profit = float(self.total_cost) - self.system_expenses
        return round(base_profit + self.own_taxes, 2)

    class Meta:
        ordering = ['-created_at']


class ProductBuyed(models.Model):
    """Bought Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="buys"
    )
    shop_discount = models.FloatField(default=0)
    offer_discount = models.FloatField(default=0)
    buy_date = models.DateTimeField(default=timezone.now)
    shoping_receip = models.ForeignKey(
        'api.ShoppingReceip', on_delete=models.CASCADE, related_name="buyed_products", null=True, blank=True
    )
    amount_buyed = models.IntegerField(default=0)
    quantity_refuned = models.IntegerField(default=0)
    
    #Refuned data
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
    observation = models.TextField(max_length=200, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def save(self, *args, **kwargs):
        """
        Al guardar un ProductBuyed, actualiza el amount_purchased y el estado del producto original.
        También maneja la lógica de reembolso actualizando las cantidades y estados correspondientes.
        """
        is_new = self.pk is None
        
        # Si es una actualización, obtener el estado anterior
        old_instance = None
        if not is_new:
            old_instance = ProductBuyed.objects.get(pk=self.pk)
        
        super().save(*args, **kwargs)

        if self.original_product:
            # Si se está realizando un reembolso
            if not is_new and old_instance and self.is_refunded != old_instance.is_refunded and self.is_refunded:
                # Restar la cantidad reembolsada del total comprado
                self.original_product.amount_purchased = max(0, self.original_product.amount_purchased - self.quantity_refuned)
                
                # Si la cantidad comprada es menor a la solicitada, volver a estado ENCARGADO
                if self.original_product.amount_purchased < self.original_product.amount_requested:
                    self.original_product.status = ProductStatusEnum.ENCARGADO.value
                
                # Guardar los cambios
                self.original_product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
                return
                
            # Recalcular el total comprado del producto
            total_purchased = sum(
                pb.amount_buyed
                for pb in self.original_product.buys.all()
            )
            self.original_product.amount_purchased = total_purchased

            # Actualizar estado según la cantidad comprada
            if total_purchased >= self.original_product.amount_requested:
                if self.original_product.status == ProductStatusEnum.ENCARGADO.value:
                    self.original_product.status = ProductStatusEnum.COMPRADO.value
            else:
                self.original_product.status = ProductStatusEnum.ENCARGADO.value
                
            self.original_product.save(update_fields=['amount_purchased', 'status', 'updated_at'])

    def delete(self, *args, **kwargs):
        """
        Al eliminar un ProductBuyed, descuenta la cantidad comprada del producto original
        y actualiza el estado a ENCARGADO si la cantidad encargada y comprada son diferentes
        """
        product = self.original_product
        
        # Guardar la cantidad comprada que se va a eliminar
        amount_to_remove = self.amount_buyed

        # Llamar al delete original
        super().delete(*args, **kwargs)

        if product:
            # Restar la cantidad comprada del total
            product.amount_purchased -= amount_to_remove
            
            # Asegurarse de que no tengamos valores negativos
            if product.amount_purchased < 0:
                product.amount_purchased = 0
            
            # Si la cantidad comprada es menor que la solicitada, cambiar el estado a ENCARGADO
            if product.amount_purchased < product.amount_requested:
                product.status = ProductStatusEnum.ENCARGADO.value
            
            # Guardar los cambios
            product.save(update_fields=['amount_purchased', 'status', 'updated_at'])

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

            # Si la cantidad recibida es igual a la COMPRADA, cambiar estado a RECIBIDO
            if total_received == self.original_product.amount_purchased and self.original_product.amount_purchased > 0:
                # Solo cambiar a RECIBIDO si está en COMPRADO
                if self.original_product.status == ProductStatusEnum.COMPRADO.value:
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
            if total_received < product.amount_purchased:
                if product.status == ProductStatusEnum.RECIBIDO.value:
                    # Volver a COMPRADO
                    product.status = ProductStatusEnum.COMPRADO.value

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

            # Si la cantidad entregada es igual a la RECIBIDA Y COMPRADA, cambiar estado a ENTREGADO
            if (total_delivered == self.original_product.amount_received and 
                total_delivered == self.original_product.amount_purchased and
                self.original_product.amount_purchased > 0):
                # Solo cambiar a ENTREGADO si está en RECIBIDO o COMPRADO
                if self.original_product.status in [ProductStatusEnum.RECIBIDO.value, ProductStatusEnum.COMPRADO.value]:
                    self.original_product.status = ProductStatusEnum.ENTREGADO.value

            self.original_product.save(update_fields=['amount_delivered', 'status', 'updated_at'])

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
            if total_delivered < product.amount_received:
                if product.status == ProductStatusEnum.ENTREGADO.value:
                    # Volver a RECIBIDO si la cantidad entregada es menor a la recibida
                    product.status = ProductStatusEnum.RECIBIDO.value
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