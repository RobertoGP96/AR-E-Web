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
    def pending_received(self):
        """Cantidad pendiente de recibir"""
        return self.amount_purchased - self.amount_received

    @property
    def pending_delivery(self):
        """Cantidad pendiente de entregar"""
        return self.amount_received - self.amount_delivered

    @property
    def is_fully_purchased(self):
        """Verifica si se ha comprado toda la cantidad solicitada"""
        return self.amount_purchased >= self.amount_requested

    @property
    def is_fully_received(self):
        """Verifica si se ha recibido toda la cantidad comprada"""
        return self.amount_received >= self.amount_purchased

    @property
    def is_fully_delivered(self):
        """Verifica si se ha entregado toda la cantidad recibida"""
        return self.amount_delivered >= self.amount_received

    @property
    def total_received(self):
        """Total de productos recibidos (redundante, usa amount_received)"""
        return self.amount_received

    @property
    def total_delivered(self):
        """Total de productos entregados (redundante, usa amount_delivered)"""
        return self.amount_delivered

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
        Guarda el ProductBuyed. La lógica de actualización del product original
        (amount_purchased y estado) se maneja automáticamente a través de signals
        (pre_save para detectar cambios y post_save para actualizar el producto).
        """
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Elimina el ProductBuyed. La lógica de actualización del producto original
        (descuento del amount_purchased y ajuste de estado) se maneja automáticamente
        a través de signals (post_delete).
        """
        super().delete(*args, **kwargs)

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
        Guarda el ProductReceived. La lógica de actualización del producto original
        (amount_received y estado) se maneja automáticamente a través de signals (post_save).
        """
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Elimina el ProductReceived. La lógica de actualización del producto original
        (recálculo del amount_received y ajuste de estado) se maneja automáticamente
        a través de signals (post_delete).
        """
        super().delete(*args, **kwargs)

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
        Guarda el ProductDelivery. La lógica de actualización del producto original
        (amount_delivered, estado) y la orden se maneja automáticamente a través
        de signals (post_save).
        """
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Elimina el ProductDelivery. La lógica de actualización del producto original
        (amount_delivered, estado) y la orden se maneja automáticamente a través
        de signals (post_delete).
        """
        super().delete(*args, **kwargs)

    @property
    def total_delivered(self):
        """Total amount delivered across all ProductDelivery instances for this product"""
        return sum(pd.amount_delivered for pd in self.original_product.delivers.all())


    class Meta:
        ordering = ['-created_at']
        verbose_name = "Producto Entregado"
        verbose_name_plural = "Productos Entregados"