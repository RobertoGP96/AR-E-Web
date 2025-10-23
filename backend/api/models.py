"""Models for api app"""

import uuid
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group, Permission
from django.utils.translation import gettext_lazy as _
from api.managers import CustomUserManager
from api.enums import OrderStatusEnum, PaymentStatusEnum, DeliveryStatusEnum, ProductStatusEnum

# Importar modelos de notificaciones para que Django los reconozca
from api.models_notifications import Notification, NotificationPreference  # noqa

class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    email = models.EmailField(_("email"), unique=True, blank=True, null=True)
    name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    home_address = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20, unique=True)
    
    # Roles choices
    ROLE_CHOICES = [
        ('user', 'Usuario'),
        ('agent', 'Agente'),
        ('accountant', 'Contador'),
        ('buyer', 'Comprador'),
        ('logistical', 'Logístico'),
        ('community_manager', 'Community Manager'),
        ('admin', 'Administrador'),
        ('client', 'Cliente'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    agent_profit = models.FloatField(default=0)
    assigned_agent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'agent'},
        related_name='assigned_clients',
        help_text='Agente asignado para este cliente'
    )

    # Account management
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    sent_verification_email = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_secret = models.CharField(max_length=200, blank=True, null=True)
    password_secret = models.CharField(max_length=200, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["name"]

    objects = CustomUserManager()

    def __str__(self):
        return self.name + " " + self.last_name

    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.name} {self.last_name}".strip()

    def has_role(self, role):
        """Check if user has a specific role"""
        return self.role == role

    def is_agent(self):
        """Check if user is an agent"""
        return self.role == 'agent'

    def is_accountant(self):
        """Check if user is an accountant"""
        return self.role == 'accountant'

    def is_buyer(self):
        """Check if user is a buyer"""
        return self.role == 'buyer'

    def is_logistical(self):
        """Check if user is logistical"""
        return self.role == 'logistical'

    def is_community_manager(self):
        """Check if user is community manager"""
        return self.role == 'community_manager'

    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.is_staff

    # Campos para resolver conflictos con el modelo User por defecto
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',  # Cambia el related_name para evitar conflictos
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',  # Cambia el related_name para evitar conflictos
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def verify(self):
        """Verify user account"""
        self.is_verified = True
        self.is_active = True
        self.verification_secret = None
        self.save(update_fields=['is_verified', 'is_active', 'verification_secret'])

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"


class Order(models.Model):
    """Orders in shops"""

    client = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="orders"
    )
    sales_manager = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="managed_orders"
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
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Pedido #{self.pk} - {self.client.full_name}"

    def total_cost(self):
        """Total cost of order"""
        return sum(product.total_cost for product in self.products.all())

    def received_products(self):
        """Total products received"""
        return list(self.delivery_receipts.all())

    def received_value_of_client(self):
        """Total value of objects received by client"""
        return sum(receipt.total_cost_of_deliver() for receipt in self.delivery_receipts.all())

    def extra_payments(self):
        """Extra payment in case of excedent or missing"""
        return self.received_value_of_client() - self.total_cost()

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

    class Meta:
        ordering = ['-created_at']

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


class Category(models.Model):
    """Categorías de productos con costo de envío por libra"""

    name = models.CharField(max_length=100, unique=True)
    shipping_cost_per_pound = models.FloatField(default=0, help_text="Costo de envío por libra para esta categoría")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"


class BuyingAccounts(models.Model):
    """Accounts for buying in Shops"""

    account_name = models.CharField(max_length=100, unique=True)
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


class CommonInformation(models.Model):
    """Common information introduced for the admin"""

    change_rate = models.FloatField(default=0)
    cost_per_pound = models.FloatField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    @staticmethod
    def get_instance():
        instance = CommonInformation.objects.first()
        if not instance:
            instance = CommonInformation.objects.create()
        return instance

    def __str__(self):
        return f"Configuración - Tasa: {self.change_rate}, Costo/lb: {self.cost_per_pound}"

    class Meta:
        verbose_name = "Información Común"
        verbose_name_plural = "Información Común"


class EvidenceImages(models.Model):
    """Images for products"""

    public_id = models.CharField(max_length=200, null=True, blank=True)
    image_url = models.URLField()
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Image: {self.public_id or 'No ID'}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Evidence Image"
        verbose_name_plural = "Evidence Images"


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
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    description = models.TextField(max_length=200,blank=True, null=True)
    observation = models.TextField(max_length=200,blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount_requested = models.IntegerField()
    
    # Nuevos campos para control de cantidades
    amount_purchased = models.IntegerField(default=0, help_text="Cantidad total de productos comprados")
    amount_delivered = models.IntegerField(default=0, help_text="Cantidad total de productos entregados")
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="products")
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in ProductStatusEnum],
        default=ProductStatusEnum.ENCARGADO.value
    )
    product_pictures = models.ManyToManyField(EvidenceImages, blank=True)

    # Product prices
    shop_cost = models.FloatField()
    shop_delivery_cost = models.FloatField(default=0)
    shop_taxes = models.FloatField(default=0)
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
        return sum(pr.amount_received for pr in self.delivers.all())

    @property
    def total_delivered(self):
        return sum(pr.amount_delivered for pr in self.delivers.all())

    class Meta:
        ordering = ['-created_at']



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
    buy_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = models.Manager()

    def __str__(self):
        return f"Compra en {self.shop_of_buy.name} - {self.buy_date.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Recibo de Compra"
        verbose_name_plural = "Recibos de Compra"



class DeliverReceip(models.Model):
    """Receipt given periodically to user every time they get products"""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="delivery_receipts"
    )
    weight = models.FloatField()
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in DeliveryStatusEnum],
        default=DeliveryStatusEnum.PENDIENTE.value
    )
    deliver_date = models.DateTimeField(default=timezone.now)
    deliver_picture = models.ManyToManyField(EvidenceImages, blank=True)
    weight_cost = models.FloatField(default=0)
    manager_profit = models.FloatField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"Entrega - Orden #{self.order.pk} - {self.deliver_date.strftime('%Y-%m-%d')}"

    def total_cost_of_deliver(self):
        """Calculate total cost of delivery"""
        return self.weight_cost + self.manager_profit

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
        choices=[(tag.value, tag.value) for tag in OrderStatusEnum],
        default=OrderStatusEnum.ENCARGADO.value
    )
    package_picture = models.ManyToManyField(EvidenceImages, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.agency_name} - {self.number_of_tracking}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Paquete"
        verbose_name_plural = "Paquetes"


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
        ShoppingReceip, on_delete=models.CASCADE, related_name="buyed_products", null=True, blank=True
    )
    amount_buyed = models.IntegerField()
    observation = models.TextField(max_length=200, null=True, blank=True)
    real_cost_of_product = models.FloatField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def save(self, *args, **kwargs):
        # Si es una creación nueva, incrementar amount_purchased del producto original
        if self.pk is None:
            self.original_product.amount_purchased += self.amount_buyed
            # Verificar si se ha comprado toda la cantidad solicitada
            if self.original_product.amount_purchased >= self.original_product.amount_requested:
                self.original_product.status = ProductStatusEnum.COMPRADO.value
                self.original_product.save(update_fields=['amount_purchased', 'status'])
            else:
                self.original_product.save(update_fields=['amount_purchased'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_product.name} - Comprado: {self.amount_buyed}"

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Producto Comprado"
        verbose_name_plural = "Productos Comprados"

class ProductReceived(models.Model):
    """Received Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="delivers"
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="recieved_products"
    )
    reception_date_in_eeuu = models.DateField(default=timezone.now)
    reception_date_in_cuba = models.DateField(null=True, blank=True)
    package_where_was_send = models.ForeignKey(
        Package, on_delete=models.CASCADE, related_name="contained_products"
    )
    deliver_receip = models.ForeignKey(
        DeliverReceip,
        on_delete=models.CASCADE,
        related_name="delivered_products",
        null=True,
        blank=True,
    )
    amount_received = models.IntegerField()
    amount_delivered = models.IntegerField(default=0)
    observation = models.TextField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f"{self.original_product.name} - Recibido: {self.amount_received}"

    @property
    def total_received(self):
        """Total amount received across all ProductReceived instances"""
        return sum(pr.amount_received for pr in self.delivers.all())

    @property
    def total_delivered(self):
        """Total amount delivered across all ProductReceived instances"""
        return sum(pr.amount_delivered for pr in self.delivers.all())

    class Meta:
        ordering = ['-reception_date_in_eeuu']
        verbose_name = "Producto Recibido"
        verbose_name_plural = "Productos Recibidos"
