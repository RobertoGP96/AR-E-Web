from rest_framework import serializers
from api.models import Shop, BuyingAccounts, ShoppingReceip, ProductBuyed
from .products_serializers import ProductBuyedSerializer
from drf_spectacular.utils import extend_schema_field


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
        fields = ["id", "account_name", "shop"]
        read_only_fields = ["id"]


class BuyingAccountsNestedSerializer(serializers.ModelSerializer):
    """
    Serializador anidado para cuentas de compra (solo lectura).
    Usado para mostrar cuentas dentro de ShopSerializer.
    """
    class Meta:
        model = BuyingAccounts
        fields = ["id", "account_name", "created_at", "updated_at"]
        read_only_fields = ["id", "account_name", "created_at", "updated_at"]


class ShopSerializer(serializers.ModelSerializer):
    """
    Serializador para tiendas. Incluye cuentas de compra asociadas como objetos completos.
    """
    buying_accounts = BuyingAccountsNestedSerializer(many=True, read_only=True)

    class Meta:
        """Class of model"""
        model = Shop
        fields = ["id", "name", "link", "is_active", "tax_rate", "created_at", "updated_at", "buying_accounts"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShoppingReceipSerializer(serializers.ModelSerializer):
    """
    Serializador para recibos de compra, incluye productos comprados y cálculo de costo total.
    Permite crear un ShoppingReceip con sus ProductBuyed asociados.
    """
    """Shopping Receip Serializer"""

    shopping_account = serializers.PrimaryKeyRelatedField(
        queryset=BuyingAccounts.objects.all(),
        error_messages={
            "does_not_exist": "La cuenta de compra no existe.",
            "invalid": "El ID proporcionado para la cuenta de compra no es válido.",
        }
    )
    
    # Campo de solo lectura para mostrar el nombre de la cuenta
    shopping_account_name = serializers.StringRelatedField(
        source='shopping_account.account_name',
        read_only=True
    )
    shop_of_buy = serializers.SlugRelatedField(
        queryset=Shop.objects.all(),
        slug_field="name",
        error_messages={
            "does_not_exist": "La tienda {value} no existe.",
            "invalid": "El valor proporcionado para la cuenta de compra no es válido.",
        },
    )
    buyed_products = ProductBuyedSerializer(many=True)

    total_cost_of_shopping = serializers.SerializerMethodField(read_only=True)
    total_cost_excluding_refunds = serializers.SerializerMethodField(read_only=True)
    total_refunded = serializers.SerializerMethodField(read_only=True)
    real_cost_paid = serializers.SerializerMethodField(read_only=True)
    operational_expenses = serializers.SerializerMethodField(read_only=True)

    @extend_schema_field(float)
    def get_total_cost_of_shopping(self, obj):
        """Suma del costo total de todos los productos en esta compra"""
        return float(obj.total_cost_of_shopping) if hasattr(obj, 'total_cost_of_shopping') else 0.0

    @extend_schema_field(float)
    def get_total_cost_excluding_refunds(self, obj):
        """Suma del costo total excluyendo productos reembolsados"""
        return float(obj.total_cost_excluding_refunds) if hasattr(obj, 'total_cost_excluding_refunds') else 0.0

    @extend_schema_field(float)
    def get_total_refunded(self, obj):
        """Suma total de los montos reembolsados"""
        return float(obj.total_refunded) if hasattr(obj, 'total_refunded') else 0.0

    @extend_schema_field(float)
    def get_real_cost_paid(self, obj):
        """Costo real pagado después de restar los reembolsos"""
        return float(obj.real_cost_paid) if hasattr(obj, 'real_cost_paid') else 0.0

    @extend_schema_field(float)
    def get_operational_expenses(self, obj):
        """Gastos operativos de la compra (diferencia entre costo de compra y suma de productos sin reembolsos)"""
        return float(obj.operational_expenses) if hasattr(obj, 'operational_expenses') else 0.0

    class Meta:
        """Class of model"""

        model = ShoppingReceip
        fields = [
            "id",
            "shopping_account",
            "shopping_account_name",
            "shop_of_buy",
            "card_id",
            "total_cost_of_purchase",
            "total_cost_of_shopping",
            "total_cost_excluding_refunds",
            "total_refunded",
            "real_cost_paid",
            "operational_expenses",
            "buy_date",
            "buyed_products",
            "status_of_shopping"
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        buyed_products_data = validated_data.pop('buyed_products')
        shopping_receip = super().create(validated_data)

        # Crear los ProductBuyed asociados y asignar el shopping_receip
        for product_data in buyed_products_data:
            # Si no se especifica buy_date, usar la del shopping_receip
            if 'buy_date' not in product_data or product_data['buy_date'] is None:
                product_data['buy_date'] = shopping_receip.buy_date
            product_buyed = ProductBuyed.objects.create(**product_data)
            product_buyed.shoping_receip = shopping_receip
            product_buyed.save()

        return shopping_receip

    def update(self, instance, validated_data):
        buyed_products_data = validated_data.pop('buyed_products', [])
        shopping_receip = super().update(instance, validated_data)

        # Eliminar los ProductBuyed existentes
        shopping_receip.buyed_products.all().delete()

        # Crear los nuevos ProductBuyed asociados
        for product_data in buyed_products_data:
            # Si no se especifica buy_date, usar la del shopping_receip
            if 'buy_date' not in product_data or product_data['buy_date'] is None:
                product_data['buy_date'] = shopping_receip.buy_date
            product_buyed = ProductBuyed.objects.create(**product_data)
            product_buyed.shoping_receip = shopping_receip
            product_buyed.save()

        return shopping_receip


class ShopCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear tiendas.
    """

    class Meta:
        model = Shop
        fields = [
            'name', 'link', 'tax_rate', 'is_active', 
        ]


class ShopUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar tiendas.
    """

    class Meta:
        model = Shop
        fields = [
            'name', 'link', 'tax_rate', 'is_active', 
        ]