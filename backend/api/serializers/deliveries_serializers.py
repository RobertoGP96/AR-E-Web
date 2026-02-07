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
    delivered_products = ProductDeliverySerializer(
        many=True,
        required=False,
    )

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
            "payment_status",
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
        delivered_products_data = validated_data.pop('delivered_products', [])
        deliver_receip = DeliverReceip.objects.create(**validated_data)

        for product_data in delivered_products_data:
            ProductDelivery.objects.create(deliver_receip=deliver_receip, **product_data)
        return deliver_receip

    def update(self, instance, validated_data):
        delivered_products_data = validated_data.pop('delivered_products', [])

        # Actualizar campos directos del DeliverReceip
        instance.client = validated_data.get('client', instance.client)
        instance.category = validated_data.get('category', instance.category)
        instance.weight = validated_data.get('weight', instance.weight)
        instance.status = validated_data.get('status', instance.status)
        instance.payment_status = validated_data.get('payment_status', instance.payment_status)
        instance.deliver_date = validated_data.get('deliver_date', instance.deliver_date)
        instance.deliver_picture = validated_data.get('deliver_picture', instance.deliver_picture)
        instance.weight_cost = validated_data.get('weight_cost', instance.weight_cost)
        instance.manager_profit = validated_data.get('manager_profit', instance.manager_profit)
        instance.save()

        # Manejar la actualización de productos entregados
        existing_product_delivery_ids = [pd.id for pd in instance.delivered_products.all()]
        incoming_product_delivery_ids = []

        for product_data in delivered_products_data:
            product_delivery_id = product_data.get('id', None)

            if product_delivery_id in existing_product_delivery_ids:
                # Actualizar producto entregado existente
                product_delivery = ProductDelivery.objects.get(id=product_delivery_id, deliver_receip=instance)
                if 'original_product' in product_data:
                    # Si original_product_id se pasa, asegúrate de que no intente cambiarlo si ya está establecido.
                    # O podrías validar que no ha cambiado. Por ahora, solo actualizamos si es un campo modificable.
                    # Aquí asumo que original_product no se cambia después de la creación.
                    pass
                if 'amount_delivered' in product_data:
                    product_delivery.amount_delivered = product_data['amount_delivered']
                
                product_delivery.save()
                incoming_product_delivery_ids.append(product_delivery_id)
            else:
                # Crear nuevo producto entregado
                if 'original_product' not in product_data:
                    raise serializers.ValidationError({"delivered_products": "original_product es requerido para nuevos productos entregados."})
                
                new_product_delivery = ProductDelivery.objects.create(deliver_receip=instance, **product_data)
                incoming_product_delivery_ids.append(new_product_delivery.id)
        
        # Eliminar productos entregados que ya no están en la lista
        for existing_id in existing_product_delivery_ids:
            if existing_id not in incoming_product_delivery_ids:
                ProductDelivery.objects.filter(id=existing_id, deliver_receip=instance).delete()

        return instance

    def to_representation(self, instance):
        """Ensure deliver_picture is returned as a string."""
        ret = super().to_representation(instance)
        raw = getattr(instance, 'deliver_picture', None)
        ret['deliver_picture'] = raw if raw is not None else ''
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

    package_picture = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
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
        contained_products_data = validated_data.pop('package_products', [])
        package = Package.objects.create(**validated_data)

        # Crear productos contenidos si se proporcionaron
        for product_data in contained_products_data:
            ProductReceived.objects.create(package=package, **product_data)
        return package

    def update(self, instance, validated_data):
        contained_products_data = validated_data.pop('package_products', [])

        # Actualizar campos directos del paquete
        instance.agency_name = validated_data.get('agency_name', instance.agency_name)
        instance.number_of_tracking = validated_data.get('number_of_tracking', instance.number_of_tracking)
        instance.status_of_processing = validated_data.get('status_of_processing', instance.status_of_processing)
        instance.arrival_date = validated_data.get('arrival_date', instance.arrival_date)
        instance.package_picture = validated_data.get('package_picture', instance.package_picture)
        instance.save()

        # Manejar la actualización de productos recibidos
        # Obtener los IDs de los productos recibidos existentes para este paquete
        existing_product_received_ids = [pr.id for pr in instance.package_products.all()]
        
        # Guardar los IDs de los productos recibidos que vienen en la solicitud
        incoming_product_received_ids = []

        for product_data in contained_products_data:
            product_received_id = product_data.get('id', None)

            if product_received_id in existing_product_received_ids:
                # Actualizar producto recibido existente
                product_received = ProductReceived.objects.get(id=product_received_id, package=instance)
                # Solo actualizamos la cantidad recibida y la observación si existen en los datos
                if 'amount_received' in product_data:
                    product_received.amount_received = product_data['amount_received']
                if 'observation' in product_data:
                    product_received.observation = product_data['observation']
                # Nota: original_product no debería cambiar una vez asignado
                product_received.save()
                incoming_product_received_ids.append(product_received_id)
            else:
                # Crear nuevo producto recibido
                # Asegurarse de que original_product_id esté presente para nuevos productos
                if 'original_product' not in product_data:
                    raise serializers.ValidationError({"contained_products": "original_product es requerido para nuevos productos recibidos."})
                
                new_product_received = ProductReceived.objects.create(package=instance, **product_data)
                incoming_product_received_ids.append(new_product_received.id)
        
        # Eliminar productos recibidos que ya no están en la lista
        for existing_id in existing_product_received_ids:
            if existing_id not in incoming_product_received_ids:
                ProductReceived.objects.filter(id=existing_id, package=instance).delete()

        return instance

    def to_representation(self, instance):
        """Ensure package_picture is returned as a string."""
        ret = super().to_representation(instance)
        raw = getattr(instance, 'package_picture', None)
        
        ret['package_picture'] = raw if raw is not None else ''
        return ret