from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from api.models import (
    CommonInformation,
    CustomUser,
    Shop,
    BuyingAccounts,
    ShoppingReceip,
    Product,
    DeliverReceip,
    Package,
    ProductBuyed,
    ProductReceived,
    Order,
    EvidenceImages,
)
from drf_spectacular.utils import extend_schema_field
import re


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo CustomUser.
    Incluye validaciones personalizadas para email y teléfono, y gestiona la creación de usuarios con contraseña encriptada.
    """
    user_id = serializers.IntegerField(source="id", read_only=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        """Class of model"""

        model = CustomUser
        fields = [
            "user_id",
            "email",
            "name",
            "password",
            "last_name",
            "home_address",
            "phone_number",
            "role",
            "agent_profit",
            "is_staff",
        ]

    def validate_phone_number(self, value):
        if re.search(r"^\+?\d+$", value):
            return value
        raise serializers.ValidationError(
            {"error": "El numero de telefono no es valido"}
        )

    def validate_email(self, value):
        """Verification of email"""
        # Si el email está vacío o es None, retornar None
        if not value or value.strip() == '':
            return None
            
        # Solo validar unicidad si el email tiene valor
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError({"error": "El email ya existe."})
        return value

    def create(self, validated_data):
        user = super().create(validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializador para productos. Proporciona información detallada, validaciones y campos calculados para el modelo Product.
    """
    """Product information provided by the agent"""

    shop = serializers.SlugRelatedField(
        queryset=Shop.objects.all(),
        slug_field="name",
        error_messages={
            "does_not_exist": "La tienda {value} no existe.",
            "invalid": "El valor proporcionado para la tienda no es válido.",
        },
    )
    order = serializers.SlugRelatedField(
        queryset=Order.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    product_pictures = serializers.SlugRelatedField(
        queryset=EvidenceImages.objects.all(),
        many=True,
        slug_field="image_url",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    status = serializers.SerializerMethodField(read_only=True)
    total_cost = serializers.FloatField(required=True)
    amount_buyed = serializers.SerializerMethodField(read_only=True)
    amount_delivered = serializers.SerializerMethodField(read_only=True)
    amount_received = serializers.SerializerMethodField(read_only=True)
    cost_per_product = serializers.SerializerMethodField(read_only=True)

    class Meta:
        """MetaClassName"""

        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "link",
            "shop",
            "description",
            "observation",
            "category",
            "amount_requested",
            "amount_buyed",
            "amount_delivered",
            "amount_received",
            "order",
            "status",
            "product_pictures",
            "shop_cost",
            "shop_delivery_cost",
            "shop_taxes",
            "own_taxes",
            "added_taxes",
            "total_cost",
            "cost_per_product",
        ]
        read_only_fields = ["id"]

    @extend_schema_field(str)
    def get_status(self, obj):
        count = 0
        try:
            for product in self.instance.filter(id=obj.id).first().buys.all():
                count += product.amount_buyed
        except AttributeError:
            if obj is None:
                return "Encargado"
            for product in obj.buys.all():
                count += product.amount_buyed
        if count == obj.amount_requested:
            return "Comprado"
        if count != 0:
            return "Parcialmente comprado"
        return "Encargado"

    @extend_schema_field(int)
    def get_amount_buyed(self, obj):
        return getattr(obj, 'amount_buyed', 0)

    @extend_schema_field(int)
    def get_amount_delivered(self, obj):
        return getattr(obj, 'amount_delivered', 0)

    @extend_schema_field(int)
    def get_amount_received(self, obj):
        return getattr(obj, 'amount_received', 0)

    @extend_schema_field(float)
    def get_cost_per_product(self, obj):
        return getattr(obj, 'cost_per_product', 0.0)

    def validate_shop_cost(self, value):
        """Ensure shop_cost is not negative."""
        if value < 0:
            raise serializers.ValidationError(
                "El costo de la tienda no puede ser negativo."
            )
        return value

    def validate_amount_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La cantidad solicitada debe ser un número positivo."
            )
        return value

    def validate_total_cost(self, value):
        """Ensure shop_cost is not negative."""
        if value < 0:
            raise serializers.ValidationError(
                "El costo de la tienda no puede ser negativo."
            )
        return value


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializador para órdenes. Incluye validaciones de agente y campos calculados relacionados con pagos y productos.
    """
    client = serializers.SlugRelatedField(
        queryset=CustomUser.objects.all(),
        slug_field="email",
        error_messages={
            "does_not_exist": "El cliente con el correo {value} no existe.",
            "invalid": "El valor proporcionado para el cliente no es válido.",
        },
    )
    sales_manager = serializers.SlugRelatedField(
        slug_field="email",
        read_only=True,
        error_messages={
            "does_not_exist": "El agente con el correo {value} no existe.",
            "invalid": "El valor proporcionado para el agente no es válido.",
        },
    )
    products = ProductSerializer(many=True, read_only=True)

    total_cost = serializers.SerializerMethodField(read_only=True)
    received_value_of_client = serializers.SerializerMethodField(read_only=True)
    extra_payments = serializers.SerializerMethodField(read_only=True)

    @extend_schema_field(float)
    def get_total_cost(self, obj):
        return getattr(obj, 'total_cost', 0.0)

    @extend_schema_field(float)
    def get_received_value_of_client(self, obj):
        return getattr(obj, 'received_value_of_client', 0.0)

    @extend_schema_field(float)
    def get_extra_payments(self, obj):
        return getattr(obj, 'extra_payments', 0.0)

    class Meta:
        """Class of model"""

        model = Order
        fields = [
            "id",
            "client",
            "sales_manager",
            "status",
            "pay_status",
            "total_cost",
            "products",
            "received_value_of_client",
            "extra_payments",
        ]
        depth = 0
        read_only_fields = ["id"]

    def validate_sales_manager(self, value):
        """Agent Validation"""
        if CustomUser.objects.get(email=value.email).role == 'agent':
            return value
        raise serializers.ValidationError("El usuario no es agente.")


class ShopSerializer(serializers.ModelSerializer):
    """
    Serializador para tiendas. Muestra cuentas de compra asociadas.
    """
    """Serializer of diferents shops"""

    buying_accounts = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        """Class of model"""

        model = Shop
        fields = ["name", "link", "buying_accounts"]


class BuyingAccountsSerializer(serializers.ModelSerializer):
    """
    Serializador para cuentas de compra asociadas a tiendas.
    """
    """Serializer of buying accounts"""

    shop = serializers.SlugRelatedField(
        queryset=Shop.objects.all(),
        slug_field="name",
        error_messages={
            "does_not_exist": "La tienda {value} no existe.",
            "invalid": "El valor proporcionado para la tienda no es válido.",
        },
    )

    class Meta:
        """Class of model"""

        model = BuyingAccounts
        fields = ["account_name", "shop"]


class CommonInformationSerializer(serializers.ModelSerializer):
    """
    Serializador para información común administrada por el admin.
    """
    """Common information introduced for the admin"""

    class Meta:
        """Class of model"""

        model = CommonInformation
        fields = ["change_rate", "cost_per_pound"]


class ProductBuyedSerializer(serializers.ModelSerializer):
    """
    Serializador para productos comprados por el agente, con validaciones de cantidad y detalles del producto original.
    """
    """Product buyed by the agent"""

    original_product = serializers.SlugRelatedField(
        queryset=Product.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El producto {value} no existe.",
            "invalid": "El valor proporcionado para el producto no es válido.",
        },
        write_only=True,
    )
    original_product_details = serializers.SerializerMethodField(read_only=True)
    order = serializers.SlugRelatedField(
        queryset=Order.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    shoping_receip = serializers.SlugRelatedField(
        queryset=ShoppingReceip.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El recibo de compra {value} no existe.",
            "invalid": "El valor proporcionado para el recibo no es válido.",
        },
    )

    class Meta:
        """Class of model"""

        model = ProductBuyed
        fields = [
            "id",
            "original_product",
            "order",
            "shoping_receip",
            "actual_cost_of_product",
            "amount_buyed",
            "shop_discount",
            "offer_discount",
            "buy_date",
            "observation",
            "real_cost_of_product",
            "original_product_details",
        ]
        read_only_fields = ["id"]

    @extend_schema_field(dict)
    def get_original_product_details(self, obj):
        return ProductSerializer(obj.original_product).data

    def validate(self, attrs):
        if attrs["amount_buyed"] <= 0:
            raise serializers.ValidationError(
                "La cantidad comprada debe ser un número positivo."
            )
        if (
            attrs["amount_buyed"] + attrs["original_product"].amount_buyed()
            > attrs["original_product"].amount_requested
        ):
            raise serializers.ValidationError(
                "La cantidad comprada no puede ser mayor a la solicitada."
            )
        return attrs


class ShoppingReceipSerializer(serializers.ModelSerializer):
    """
    Serializador para recibos de compra, incluye productos comprados y cálculo de costo total.
    """
    """Shopping Receip Serializer"""

    shopping_account = serializers.SlugRelatedField(
        queryset=BuyingAccounts.objects.all(),
        slug_field="account_name",
        error_messages={
            "does_not_exist": "La cuenta de compra {value} no existe.",
            "invalid": "El valor proporcionado para la cuenta de compra no es válido.",
        },
    )
    shop_of_buy = serializers.SlugRelatedField(
        queryset=Shop.objects.all(),
        slug_field="name",
        error_messages={
            "does_not_exist": "La tienda {value} no existe.",
            "invalid": "El valor proporcionado para la cuenta de compra no es válido.",
        },
    )
    buyed_products = ProductBuyedSerializer(many=True, read_only=True)

    total_cost_of_shopping = serializers.SerializerMethodField(read_only=True)

    @extend_schema_field(float)
    def get_total_cost_of_shopping(self, obj):
        return obj.total_cost_of_shopping() if hasattr(obj, 'total_cost_of_shopping') else 0.0

    class Meta:
        """Class of model"""

        model = ShoppingReceip
        fields = [
            "id",
            "shopping_account",
            "shop_of_buy",
            "total_cost_of_shopping",
            "buy_date",
            "buyed_products",
        ]
        read_only_fields = ["id"]


class ProductReceivedSerializer(serializers.ModelSerializer):
    """
    Serializador para productos recibidos y entregados por logística, con validaciones de cantidad y detalles del producto.
    """
    """Product delivered and received by the logistical"""

    original_product = serializers.SlugRelatedField(
        queryset=Product.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El producto {value} no existe.",
            "invalid": "El valor proporcionado para el producto no es válido.",
        },
        write_only=True,
    )
    original_product_detail = ProductSerializer(
        source="original_product", read_only=True
    )
    order = serializers.SlugRelatedField(
        queryset=Order.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    package_where_was_send = serializers.SlugRelatedField(
        queryset=Package.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El paquete {value} no existe.",
            "invalid": "El valor proporcionado para el paquete no es válido.",
        },
    )
    deliver_receip = serializers.SlugRelatedField(
        queryset=DeliverReceip.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El recibo de entrega {value} no existe.",
            "invalid": "El valor proporcionado para el recibo de entrega no es válido.",
        },
        required=False,
    )

    class Meta:
        model = ProductReceived
        fields = [
            "id",
            "original_product",
            "original_product_detail",
            "order",
            "reception_date_in_eeuu",
            "reception_date_in_cuba",
            "package_where_was_send",
            "deliver_receip",
            "amount_received",
            "amount_delivered",
            "observation",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs.get("amount_received") and attrs.get("original_product"):
            if attrs["amount_received"] <= 0:
                raise serializers.ValidationError(
                    "La cantidad recibida debe ser un número positivo."
                )
            if (
                attrs["original_product"].amount_requested
                < attrs["amount_received"] + attrs["original_product"].amount_received()
            ):
                raise serializers.ValidationError(
                    "La cantidad recibida no puede ser mayor a la solicitada."
                )
        if attrs.get("amount_delivered") and self.instance:
            print(self.instance.original_product)
            if attrs["amount_delivered"] <= 0:
                raise serializers.ValidationError(
                    f"La cantidad entregada debe ser un número positivo en el producto {self.instance.original_product.id}."
                )
            print(attrs["amount_delivered"])
            if (
                self.instance.amount_received
                < attrs["amount_delivered"]
                + self.instance.original_product.amount_delivered()
            ):
                raise serializers.ValidationError(
                    f"La cantidad entregada no puede ser mayor a la recibida en el producto {self.instance.original_product.id}."
                )
        return attrs


class DeliverReceipSerializer(serializers.ModelSerializer):
    """
    Serializador para recibos de entrega, incluye productos entregados y cálculo de costo total de entrega.
    """
    """Deliver Receip Serializer"""

    order = serializers.SlugRelatedField(
        queryset=Order.objects.all(),
        slug_field="id",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    deliver_picture = serializers.SlugRelatedField(
        queryset=EvidenceImages.objects.all(),
        many=True,
        slug_field="image_url",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    delivered_products = ProductReceivedSerializer(many=True, read_only=True)

    total_cost_of_deliver = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliverReceip
        fields = [
            "id",
            "order",
            "deliver_date",
            "deliver_picture",
            "delivered_products",
            "weight",
            "status",
            "total_cost_of_deliver",
        ]
        read_only_fields = ["id"]

    @extend_schema_field(float)
    def get_total_cost_of_deliver(self, obj):
        # Calcula el costo total de la entrega usando los campos del modelo
        # Puedes ajustar la lógica según tu necesidad
        # Ejemplo: suma de peso * costo por libra + ganancia del manager
        if hasattr(obj, 'weight_cost') and hasattr(obj, 'manager_profit'):
            return (obj.weight or 0) * (obj.weight_cost or 0) + (obj.manager_profit or 0)
        return 0.0


class PackageSerializer(serializers.ModelSerializer):
    """
    Serializador para paquetes, muestra productos contenidos y fotos asociadas.
    """
    """Package Serializer"""

    package_picture = serializers.SlugRelatedField(
        queryset=EvidenceImages.objects.all(),
        many=True,
        slug_field="image_url",
        error_messages={
            "does_not_exist": "El pedido {value} no existe.",
            "invalid": "El valor proporcionado para el pedido no es válido.",
        },
    )
    contained_products = ProductReceivedSerializer(many=True, read_only=True)

    class Meta:
        model = Package
        fields = [
            "id",
            "number_of_tracking",
            "agency_name",
            "status_of_processing",
            "package_picture",
            "contained_products",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# Serializers para Amazon Scraping
class AmazonScrapingRequestSerializer(serializers.Serializer):
    """Serializer para validar la solicitud de scraping de Amazon"""
    url = serializers.URLField(
        required=True,
        help_text="URL del producto de Amazon o carrito que se quiere scrapear"
    )
    
    def validate_url(self, value):
        """Validar que la URL sea de Amazon"""
        from api.utils.amazon_scraper import amazon_scraper
        
        if not amazon_scraper.validate_amazon_url(value):
            raise serializers.ValidationError(
                "La URL debe ser de Amazon válida (producto o carrito)"
            )
        
        return value


class CartProductSerializer(serializers.Serializer):
    """Serializer para productos individuales dentro de un carrito"""
    asin = serializers.CharField(max_length=20)
    title = serializers.CharField(max_length=500)
    price = serializers.FloatField(allow_null=True, required=False)
    quantity = serializers.IntegerField(default=1)
    image = serializers.URLField(allow_blank=True, required=False)
    url = serializers.URLField()


class AmazonCartDataSerializer(serializers.Serializer):
    """Serializer para datos de carrito de Amazon"""
    type = serializers.CharField(default='cart')
    title = serializers.CharField(max_length=500, default='Carrito de Amazon')
    url = serializers.URLField()
    total_items = serializers.IntegerField()
    total_price = serializers.FloatField()
    currency = serializers.CharField(max_length=10, default='USD')
    products = CartProductSerializer(many=True)
    product_count = serializers.IntegerField()


class AmazonProductDataSerializer(serializers.Serializer):
    """Serializer para los datos del producto obtenidos de Amazon"""
    type = serializers.CharField(default='product')
    asin = serializers.CharField(max_length=20, allow_null=True, required=False)
    title = serializers.CharField(max_length=500)
    price = serializers.FloatField(allow_null=True, required=False)
    currency = serializers.CharField(max_length=10, default='USD')
    description = serializers.CharField(allow_blank=True, required=False)
    images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list
    )
    specifications = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )
    category = serializers.CharField(max_length=500, allow_blank=True, required=False)
    rating = serializers.FloatField(allow_null=True, required=False)
    reviews_count = serializers.IntegerField(allow_null=True, required=False)
    availability = serializers.CharField(max_length=200, allow_blank=True, required=False)
    url = serializers.URLField()


class AmazonScrapingResponseSerializer(serializers.Serializer):
    """Serializer para la respuesta del scraping de Amazon (producto o carrito)"""
    success = serializers.BooleanField()
    data = serializers.SerializerMethodField()
    error = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def get_data(self, obj):
        """Determinar qué serializer usar según el tipo de datos"""
        if not obj.get('success', False) or 'data' not in obj:
            return None
            
        data = obj['data']
        data_type = data.get('type', 'product')
        
        if data_type == 'cart':
            serializer = AmazonCartDataSerializer(data=data)
        else:
            serializer = AmazonProductDataSerializer(data=data)
            
        if serializer.is_valid():
            return serializer.validated_data
        else:
            return data  # Retornar datos sin validar si hay problemas
    
    def to_representation(self, instance):
        """Personalizar la representación de la respuesta"""
        representation = super().to_representation(instance)
        
        # Si no hay éxito, no incluir el campo 'data'
        if not representation.get('success', False):
            representation.pop('data', None)
        else:
            # Si hay éxito, no incluir el campo 'error'
            representation.pop('error', None)
            
        return representation
