"""Models for api app"""

import uuid
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group, Permission
from django.utils.translation import gettext_lazy as _
from api.managers import CustomUserManager
from api.enums import OrderStatusEnum, PaymentStatusEnum

# Create your models here.


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    # Account data
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
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    agent_profit = models.FloatField(default=0)

    # Account management
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    sent_verification_email = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_secret = models.CharField(max_length=200, blank=True, null=True)
    password_secret = models.CharField(max_length=200, blank=True, null=True)

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

    def __str__(self):
        return "Pedido #" + str(self.pk) + " creado por " + str(self.client.name)

    def total_cost(self):
        """Total cost of order"""
        cost = 0
        if self.products.all():
            for i in self.products.all():
                cost += i.total_cost
        return cost

    def received_products(self):
        """Total products reciebed"""
        prodlist = []
        if self.delivery_receipts.all():
            for i in self.delivery_receipts.all():
                prodlist.append(i)
        return prodlist

    def received_value_of_client(self):
        """Total value of objects receives by client"""
        value = 0
        if self.delivery_receipts.all():
            for i in self.delivery_receipts.all():
                value += i.total_cost_of_deliver()
        return value

    def extra_payments(self):
        """Extra payment in case of excedent or missing"""
        return self.received_value_of_client() - self.total_cost()

    objects = models.Manager()

class Shop(models.Model):
    """Shops in catalog"""

    name = models.CharField(max_length=100, unique=True)
    link = models.URLField(unique=True)

    objects = models.Manager()


class BuyingAccounts(models.Model):
    """Accounts for buying in Shops"""

    account_name = models.CharField(max_length=100, unique=True)
    objects = models.Manager()

    def __str__(self):
        return self.account_name
        shop = models.ForeignKey('Shop', on_delete=models.CASCADE, related_name='buying_accounts')


class CommonInformation(models.Model):
    """Common information introduced for the admin"""

    change_rate = models.FloatField(default=0)
    cost_per_pound = models.FloatField(default=0)

    objects = models.Manager()

    @staticmethod
    def get_instance():
        instance = CommonInformation.objects.first()
        if not instance:
            instance = CommonInformation.objects.create()
        return instance


class EvidenceImages(models.Model):
    """Images for products"""

    public_id = models.CharField(max_length=200, null=True)
    image_url = models.URLField()

    objects = models.Manager()


class Product(models.Model):
    """Products in shop"""

    # Product information
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    sku = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    link = models.URLField(blank=True, null=True)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    description = models.TextField(max_length=200, null=True)
    observation = models.TextField(max_length=200, null=True)
    category = models.CharField(max_length=200, null=True)
    amount_requested = models.IntegerField()
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="products")
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in OrderStatusEnum],
        default=OrderStatusEnum.ENCARGADO.value
    )
    product_pictures = models.ManyToManyField(EvidenceImages)

    # Product prices
    shop_cost = models.FloatField()
    shop_delivery_cost = models.FloatField(default=0)
    shop_taxes = models.FloatField(default=0)
    own_taxes = models.FloatField(default=0)
    added_taxes = models.FloatField(default=0)
    total_cost = models.FloatField(default=0)

    objects = models.Manager()



class ShoppingReceip(models.Model):
    """Receip for each buy in shops"""

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
    objects = models.Manager()



class DeliverReceip(models.Model):
    """Receip given periodicaly to user every time they get products"""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="delivery_receipts"
    )
    weight = models.FloatField()
    status = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in OrderStatusEnum],
        default=OrderStatusEnum.ENCARGADO.value
    )
    deliver_date = models.DateTimeField(default=timezone.now)
    deliver_picture = models.ManyToManyField(EvidenceImages)
    weight_cost = models.FloatField(default=0)
    manager_profit = models.FloatField(default=0)

    objects = models.Manager()


class Package(models.Model):
    """Packages sent with products"""

    agency_name = models.CharField(max_length=100)
    number_of_tracking = models.CharField(max_length=100)
    status_of_processing = models.CharField(
        max_length=100,
        choices=[(tag.value, tag.value) for tag in OrderStatusEnum],
        default=OrderStatusEnum.ENCARGADO.value
    )
    package_picture = models.ManyToManyField(EvidenceImages)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()


class ProductBuyed(models.Model):
    """Buyed Products"""

    original_product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="buys"
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="buyed_products"
    )
    actual_cost_of_product = models.FloatField(default=0)
    shop_discount = models.FloatField(default=0)
    offer_discount = models.FloatField(default=0)
    buy_date = models.DateTimeField(default=timezone.now)
    shoping_receip = models.ForeignKey(
        ShoppingReceip, on_delete=models.CASCADE, related_name="buyed_products"
    )
    amount_buyed = models.IntegerField()
    observation = models.TextField(max_length=200, null=True)
    real_cost_of_product = models.FloatField()

    objects = models.Manager()

class ProductReceived(models.Model):
    """Buyed Products"""

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
    observation = models.TextField(max_length=200, null=True)

    objects = models.Manager()
