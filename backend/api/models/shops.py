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

    @property
    def total_cost_of_shopping(self):
        """
        Suma del costo total (total_cost) de todos los productos en esta compra.
        Este es el ingreso que se espera recibir del cliente por estos productos.
        """
        from django.db.models import Sum
        total = self.buyed_products.aggregate(
            total=Sum('original_product__total_cost')
        )['total'] or 0
        return float(total)

    @property
    def total_cost_excluding_refunds(self):
        """
        Suma del costo total excluyendo productos reembolsados.
        Este calcula el ingreso esperado del cliente (total_cost) sin contar productos reembolsados.
        """
        from django.db.models import Sum, Q
        total = self.buyed_products.filter(
            Q(is_refunded=False) | Q(is_refunded__isnull=True)
        ).aggregate(
            total=Sum('original_product__total_cost')
        )['total'] or 0
        return float(total)

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

    @property
    def operational_expenses(self):
        """
        Gastos operativos de la compra = diferencia entre lo realmente pagado (después de reembolsos)
        y la suma de los costos reales de los productos comprados (sin reembolsados).
        Representa los gastos adicionales (shipping, fees, etc.) de esta compra específica.
        """
        from django.db.models import Sum, Q, F
        # Sumar el costo real de productos NO reembolsados (real_cost_of_product * amount_buyed)
        total_real_cost_products = self.buyed_products.filter(
            Q(is_refunded=False) | Q(is_refunded__isnull=True)
        ).aggregate(
            total=Sum(F('real_cost_of_product') * F('amount_buyed'))
        )['total'] or 0

        # Gastos operativos = lo pagado (menos reembolsos) - costo real de productos
        return float(self.real_cost_paid - float(total_real_cost_products))

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Recibo de Compra"
        verbose_name_plural = "Recibos de Compra"