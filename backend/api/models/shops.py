"""Shop and shopping related models"""

from django.utils import timezone
from django.db import models
from api.enums import PaymentStatusEnum


class Shop(models.Model):
    """Shops in catalog"""

    name = models.CharField(max_length=100, unique=True)
    link = models.URLField(unique=True)
    is_active = models.BooleanField(default=True)
    tax_rate = models.FloatField(default=0.0, help_text="Tasa de impuestos para esta tienda")
    

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class BuyingAccounts(models.Model):
    """Accounts for buying in Shops"""

    account_name = models.CharField(max_length=100)
    shop = models.ForeignKey('Shop', on_delete=models.CASCADE, related_name='buying_accounts', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.account_name} - {self.shop.name if self.shop else 'Sin tienda'}"

    class Meta:
        ordering = ['account_name']
        verbose_name = "Cuenta de Compra"
        verbose_name_plural = "Cuentas de Compra"


class ShoppingReceip(models.Model):
    """Receipt for each buy in shops"""

    shopping_account = models.ForeignKey(
        BuyingAccounts, on_delete=models.CASCADE, related_name="buys"
    )
    shop_of_buy = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="buys")
    status_of_shopping = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in PaymentStatusEnum],
        default=PaymentStatusEnum.NO_PAGADO.value
    )
    card_id=models.TextField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Numero de tarjeta"
    )
    buy_date = models.DateTimeField(default=timezone.now)
    total_cost_of_purchase = models.FloatField(
        default=0,
        help_text="Costo total real de la compra (lo que se pagó efectivamente)"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Compra en {self.shop_of_buy.name} - {self.buy_date.strftime('%Y-%m-%d')}"

    def _calculate_product_cost(self, product_buyed):
        """
        Calcula el costo de un producto comprado según la lógica:
        - Si amount_buyed == amount_requested: usar total_cost directamente
        - Si son diferentes: recalcular usando la fórmula del producto
        """
        product = product_buyed.original_product
        if not product:
            return 0.0
        
        amount_buyed = product_buyed.amount_buyed or 0
        amount_requested = product.amount_requested or 0
        
        # Si las cantidades coinciden, usar el total_cost original
        if amount_buyed == amount_requested:
            return float(product.total_cost or 0)
        
        # Si las cantidades son diferentes, recalcular
        unit_price = float(product.shop_cost or 0)
        shipping_cost = float(product.shop_delivery_cost or 0)
        shop_tax_rate = float(product.shop_taxes or 0)
        added_taxes = float(product.added_taxes or 0)
        own_taxes = float(product.own_taxes or 0)
        charge_iva = product.charge_iva if product.charge_iva is not None else True
        
        # Fórmula igual que en el frontend
        subtotal = unit_price * amount_buyed
        base = subtotal + shipping_cost
        base_impuesto = base * 0.07 if charge_iva else 0
        base_para_tarifa = base + base_impuesto
        tarifa_tienda = base_para_tarifa * (shop_tax_rate / 100)
        total = base + base_impuesto + tarifa_tienda + added_taxes + own_taxes
        
        return round(total, 2)

    @property
    def total_cost_of_shopping(self):
        """
        Suma del costo de todos los productos en esta compra.
        Si amount_buyed == amount_requested: usa total_cost del producto.
        Si son diferentes: recalcula el costo proporcionalmente.
        """
        total = 0.0
        for product_buyed in self.buyed_products.select_related('original_product').all():
            total += self._calculate_product_cost(product_buyed)
        return round(total, 2)

    @property
    def total_cost_excluding_refunds(self):
        """
        Suma del costo excluyendo productos reembolsados.
        Sigue la misma lógica de cálculo proporcional.
        """
        total = 0.0
        for product_buyed in self.buyed_products.select_related('original_product').filter(is_refunded=False):
            total += self._calculate_product_cost(product_buyed)
        # También incluir los que tienen is_refunded=None
        for product_buyed in self.buyed_products.select_related('original_product').filter(is_refunded__isnull=True):
            total += self._calculate_product_cost(product_buyed)
        return round(total, 2)

    @property
    def total_refunded(self):
        """
        Suma total de los montos reembolsados en esta compra.
        """
        from django.db.models import Sum
        total = self.buyed_products.filter(is_refunded=True).aggregate(
            total=Sum('refund_amount')
        )['total'] or 0
        return float(total)

    @property
    def real_cost_paid(self):
        """
        Costo real pagado después de restar los reembolsos.
        Este es el costo efectivo de la compra = total_cost_of_purchase - total_refunded
        """
        return float(self.total_cost_of_purchase - self.total_refunded)

    def delete(self, *args, **kwargs):
        """
        Al eliminar un ShoppingReceip, descuenta las cantidades compradas de los productos originales
        y actualiza sus estados antes de eliminar el recibo y sus productos comprados.
        """
        from api.enums import ProductStatusEnum
        
        # Obtener todos los productos comprados antes de eliminar
        buyed_products = list(self.buyed_products.all())
        
        # Para cada producto comprado, descontar la cantidad del producto original
        for buyed_product in buyed_products:
            product = buyed_product.original_product
            if product:
                # Descontar la cantidad comprada
                product.amount_purchased = max(0, product.amount_purchased - buyed_product.amount_buyed)
                
                # Si la cantidad comprada es menor que la solicitada, cambiar el estado a ENCARGADO
                if product.amount_purchased < product.amount_requested:
                    product.status = ProductStatusEnum.ENCARGADO.value
                
                # Guardar los cambios en el producto
                product.save(update_fields=['amount_purchased', 'status', 'updated_at'])
        
        # Ahora eliminar el recibo (esto eliminará en cascada los ProductBuyed)
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Recibo de Compra"
        verbose_name_plural = "Recibos de Compra"