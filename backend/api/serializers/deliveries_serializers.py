from rest_framework import serializers
from api.models import DeliverReceip, Package, CustomUser, Category, ProductReceived
import json
from .users_serializers import UserSerializer
from .products_serializers import CategorySerializer, ProductReceivedSerializer
from .products_serializers import ProductDeliverySerializer
from drf_spectacular.utils import extend_schema_field


class DeliverReceipSerializer(serializers.ModelSerializer):
    """
    Serializador para recibos de entrega, incluye productos entregados y cálculo de costo total de entrega.
    """
    """Deliver Receip Serializer"""

    # Para escritura (POST/PUT/PATCH) - solo ID (REQUERIDO)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='client'),
        source='client',
        write_only=True,
        required=True,  # Campo requerido
        error_messages={
            "required": "El cliente es obligatorio para crear un delivery.",
            "does_not_exist": "El cliente {value} no existe.",
            "invalid": "El valor proporcionado para el cliente no es válido.",
        },
    )

    # Para lectura (GET) - objeto completo
    client = UserSerializer(read_only=True)

    # Categoría para escritura (opcional)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "La categoría {value} no existe.",
            "invalid": "El valor proporcionado para la categoría no es válido.",
        },
    )

    # Categoría para lectura
    category = CategorySerializer(read_only=True)

    deliver_picture = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    delivered_products = ProductDeliverySerializer(many=True, read_only=True)

    # Nuevos campos calculados
    delivery_expenses = serializers.SerializerMethodField(read_only=True)

    system_delivery_profit = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliverReceip
        fields = [
            "id",
            "client_id",  # Para escritura (requerido)
            "client",     # Para lectura
            "category_id",  # Para escritura (opcional)
            "category",     # Para lectura
            "deliver_date",
            "deliver_picture",
            "delivered_products",
            "weight",
            "status",
            "weight_cost",
            "manager_profit",
            # Nuevos campos calculados
            "delivery_expenses",
            "system_delivery_profit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


    def create(self, validated_data):
        """Handle deliver_picture list input and store it as JSON text on the model."""
        deliver_picture_data = validated_data.pop('deliver_picture', [])
        # Create the delivery receipt without picture data
        delivery = DeliverReceip.objects.create(**validated_data)

        # Store the list of URLs as a JSON string
        try:
            delivery.deliver_picture = json.dumps(deliver_picture_data or [])
        except Exception:
            delivery.deliver_picture = '[]'
        delivery.save(update_fields=['deliver_picture', 'updated_at'])

        return delivery

    def to_representation(self, instance):
        """Ensure deliver_picture is returned as a list (parsed from JSON text)."""
        ret = super().to_representation(instance)
        raw = getattr(instance, 'deliver_picture', None)
        if raw:
            try:
                ret['deliver_picture'] = json.loads(raw)
            except Exception:
                # If not valid JSON, return empty list
                ret['deliver_picture'] = []
        else:
            ret['deliver_picture'] = []
        return ret



    @extend_schema_field(float)
    def get_delivery_expenses(self, obj):
        """Retorna los gastos de la entrega (peso × costo por libra)"""
        return float(obj.delivery_expenses) if hasattr(obj, 'delivery_expenses') else 0.0


    @extend_schema_field(float)
    def get_system_delivery_profit(self, obj):
        """Retorna la ganancia del sistema en esta entrega"""
        return float(obj.system_delivery_profit) if hasattr(obj, 'system_delivery_profit') else 0.0


class PackageSerializer(serializers.ModelSerializer):
    """
    Serializador para paquetes, muestra productos contenidos y fotos asociadas.
    """
    """Package Serializer"""

    package_picture = serializers.ListField(
        child=serializers.URLField(),
        required=False,
    )
    contained_products = ProductReceivedSerializer(
        many=True,
        required=False,
        source='package_products'
    )

    class Meta:
        model = Package
        fields = [
            "id",
            "number_of_tracking",
            "agency_name",
            "status_of_processing",
            "package_picture",
            "arrival_date",
            "contained_products",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        package_picture_data = validated_data.pop('package_picture', [])
        contained_products_data = validated_data.pop('package_products', [])
        package = Package.objects.create(**validated_data)

        # Store package pictures as JSON string
        try:
            package.package_picture = json.dumps(package_picture_data or [])
        except Exception:
            package.package_picture = '[]'
        package.save(update_fields=['package_picture', 'updated_at'])

        # Crear productos contenidos si se proporcionaron
        for product_data in contained_products_data:
            ProductReceived.objects.create(package=package, **product_data)
        return package

    def to_representation(self, instance):
        """Ensure package_picture is returned as a list (parsed from JSON text)."""
        ret = super().to_representation(instance)
        raw = getattr(instance, 'package_picture', None)
        if raw:
            try:
                ret['package_picture'] = json.loads(raw)
            except Exception:
                ret['package_picture'] = []
        else:
            ret['package_picture'] = []
        return ret