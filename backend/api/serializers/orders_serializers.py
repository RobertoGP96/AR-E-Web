from rest_framework import serializers
from api.models import Order, CustomUser
from .users_serializers import UserSerializer
from .products_serializers import ProductSerializer
from drf_spectacular.utils import extend_schema_field


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializador para órdenes. Incluye validaciones de agente y campos calculados relacionados con pagos y productos.
    Acepta ID para cliente y agente.
    """
    # Devolver objetos anidados para client y sales_manager en las respuestas GET
    # mientras se permite enviar solo los IDs en create/update mediante
    # campos write_only (_id).
    client = UserSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True,
        source='client',
        error_messages={
            "does_not_exist": "El cliente con ID {value} no existe.",
            "invalid": "El valor proporcionado para el cliente no es válido.",
        },
    )

    sales_manager = UserSerializer(read_only=True)
    sales_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True,
        source='sales_manager',
        allow_null=True,
        required=False,
        error_messages={
            "does_not_exist": "El agente con ID {value} no existe.",
            "invalid": "El valor proporcionado para el agente no es válido.",
        },
    )

    products = ProductSerializer(many=True, read_only=True)

    total_cost = serializers.SerializerMethodField(read_only=True)

    @extend_schema_field(float)
    def get_total_cost(self, obj):
        val = getattr(obj, 'total_cost', None)
        # Si el atributo es un método, llamarlo; si es un valor (ej. anotación), retornarlo
        if callable(val):
            try:
                return float(val())
            except Exception:
                return 0.0
        return float(val) if val is not None else 0.0

    class Meta:
        """Class of model"""

        model = Order
        fields = [
            "id",
            # Readable nested objects
            "client",
            "sales_manager",
            # Write-only IDs for create/update
            "client_id",
            "sales_manager_id",
            "status",
            "pay_status",
            "observations",
            "created_at",
            "updated_at",
            "total_cost",
            "products",
            "received_value_of_client",
        ]
        depth = 0
        read_only_fields = ["id"]

    def validate_sales_manager(self, value):
        """Agent Validation"""
        if value and value.role != 'agent':
            raise serializers.ValidationError("El usuario no es agente.")
        return value

    def update(self, instance, validated_data):
        """
        Actualiza la orden y verifica automáticamente el estado de pago
        basándose en la cantidad recibida del cliente.

        IMPORTANTE: Si se actualiza 'received_value_of_client', el valor se SUMA
        al valor actual, no se reemplaza. Esto permite pagos parciales acumulativos.
        """
        # Si se está actualizando received_value_of_client, necesitamos manejarlo de forma especial
        # para acumular el valor (sumarlo al anterior) en lugar de reemplazarlo
        if 'received_value_of_client' in validated_data:
            # Guardar el valor que se quiere añadir
            amount_to_add = validated_data['received_value_of_client']
            previous_amount = instance.received_value_of_client

            # Sumar al valor actual en lugar de reemplazarlo
            instance.received_value_of_client += amount_to_add

            print(f"[OrderSerializer] Actualizando pago de orden #{instance.id}")
            print(f"  - Cantidad anterior: ${previous_amount}")
            print(f"  - Cantidad añadida: ${amount_to_add}")
            print(f"  - Nuevo total recibido: ${instance.received_value_of_client}")

            # Remover del validated_data para evitar que super().update() lo sobrescriba
            validated_data.pop('received_value_of_client')

            # Actualizar otros campos si los hay
            instance = super().update(instance, validated_data)

            # Obtener el costo total de la orden
            total_cost = instance.total_cost() if callable(instance.total_cost) else instance.total_cost

            print(f"  - Costo total de la orden: ${total_cost}")

            # Actualizar el estado de pago basándose en el nuevo total acumulado
            if instance.received_value_of_client >= total_cost:
                instance.pay_status = 'Pagado'
                print(f"  - Nuevo estado: Pagado (recibido >= total)")
            elif instance.received_value_of_client > 0:
                instance.pay_status = 'Parcial'
                print(f"  - Nuevo estado: Parcial (recibido < total)")
            else:
                instance.pay_status = 'No pagado'
                print(f"  - Nuevo estado: No pagado (recibido = 0)")

            instance.save()
        else:
            # Si no se actualizó received_value_of_client, actualizar normalmente
            instance = super().update(instance, validated_data)

        return instance


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear órdenes.
    """

    class Meta:
        model = Order
        fields = [
            "client_id",
            "sales_manager_id",
            "status",
            "pay_status",
            "observations",
            "received_value_of_client",
        ]

    def validate_sales_manager(self, value):
        if value and value.role != 'agent':
            raise serializers.ValidationError("El usuario no es agente.")
        return value


class OrderUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar órdenes.
    """

    class Meta:
        model = Order
        fields = [
            "sales_manager_id",
            "status",
            "pay_status",
            "observations",
            "received_value_of_client",
        ]

    def validate_sales_manager(self, value):
        if value and value.role != 'agent':
            raise serializers.ValidationError("El usuario no es agente.")
        return value