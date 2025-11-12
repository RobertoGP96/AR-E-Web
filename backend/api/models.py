"""Models for api app"""

import uuid
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group, Permission
from django.utils.translation import gettext_lazy as _
from api.managers import CustomUserManager
from api.enums import OrderStatusEnum, PackageStatusEnum, PaymentStatusEnum, DeliveryStatusEnum, ProductStatusEnum

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
    
    # Campos de pago
    received_value_of_client = models.FloatField(
        default=0,
        help_text="Cantidad total recibida del cliente por este pedido"
    )
    
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
    """
    Configuración global del sistema para variables dinámicas.
    Este modelo almacena variables que cambian constantemente y son necesarias
    para los cálculos de costos y ganancias del sistema.
    """

    change_rate = models.FloatField(
        default=0,
        help_text="Tasa de cambio de moneda (ej: USD a moneda local). Valor positivo requerido."
    )
    cost_per_pound = models.FloatField(
        default=0,
        help_text="Costo general de envío por libra en USD. Se usa para calcular costos de entrega."
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    @staticmethod
    def get_instance():
        """
        Obtiene o crea la instancia única de configuración del sistema.
        Este modelo sigue el patrón Singleton.
        """
        instance = CommonInformation.objects.first()
        if not instance:
            instance = CommonInformation.objects.create()
        return instance

    def clean(self):
        """Validaciones personalizadas del modelo"""
        from django.core.exceptions import ValidationError
        
        if self.change_rate < 0:
            raise ValidationError({
                'change_rate': 'La tasa de cambio no puede ser negativa.'
            })
        
        if self.cost_per_pound < 0:
            raise ValidationError({
                'cost_per_pound': 'El costo por libra no puede ser negativo.'
            })

    def save(self, *args, **kwargs):
        """Sobrescribe save para ejecutar validaciones"""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Configuración - Tasa: ${self.change_rate}, Costo/lb: ${self.cost_per_pound}"

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
    amount_received = models.IntegerField(default=0, help_text="Cantidad total de productos recibidos")
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
        Fórmula: costo total cobrado al cliente - gastos del sistema
        """
        return float(self.total_cost) - self.system_expenses

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
    def operational_expenses(self):
        """
        Gastos operativos de la compra = diferencia entre lo pagado y el costo total de productos.
        Representa los gastos adicionales (shipping extra, fees, etc.) de esta compra específica.
        """
        return float(self.total_cost_of_shopping - self.total_cost_of_purchase)

    class Meta:
        ordering = ['-buy_date']
        verbose_name = "Recibo de Compra"
        verbose_name_plural = "Recibos de Compra"



class DeliverReceip(models.Model):
    """Receipt given periodically to user every time they get products"""
    
    client = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="deliveries",
        limit_choices_to={'role': 'client'},
        help_text='Cliente al que pertenece el delivery'
    )
    category = models.ForeignKey(
        'Category', 
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
    deliver_date = models.DateTimeField(default=timezone.now)
    deliver_picture = models.ManyToManyField(EvidenceImages, blank=True)
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
        Package,
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
        DeliverReceip,
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
