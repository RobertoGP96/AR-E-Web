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
        """Mantiene la compatibilidad con el campo calculado anterior"""
        return float(obj.total_costs)

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
            "total_costs",
            "total_cost",
            "products",
            "received_value_of_client",
            "payment_date",
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
            amount_to_add = validated_data.pop('received_value_of_client')
            pay_status = validated_data.get('pay_status')
            try:
                instance.add_received_value(amount_to_add, pay_status=pay_status)
            except Exception as e:
                # Log en caso de errores inesperados, luego intentar actualizar otras partes igualmente
                print(f"[OrderSerializer] Error al añadir received value: {e}")

            # Actualizar otros campos si los hay (ya removimos el campo recibido)
            # super().update se encargará de setear pay_status si estaba en validated_data,
            # pero ya lo seteamos en add_received_value. No hace daño.
            instance = super().update(instance, validated_data)
        else:
            # Si no se actualizó received_value_of_client, actualizar normalmente
            instance = super().update(instance, validated_data)

        return instance


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear órdenes.
    """

    # Definir explícitamente los campos write-only para validar correctamente
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        write_only=True,
        source='client',
        error_messages={
            "does_not_exist": "El cliente con ID {value} no existe.",
            "invalid": "El valor proporcionado para el cliente no es válido.",
        },
    )

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

    class Meta:
        model = Order
        fields = [
            "id",  # Asegurar que el ID se incluya en la respuesta
            "client_id",
            "sales_manager_id",
            "status",
            "pay_status",
            "observations",
            "received_value_of_client",
            "total_costs",
        ]
        read_only_fields = ["id", "total_costs"]  # Marcar el ID como solo lectura

    def validate_sales_manager(self, value):
        if value and value.role != 'agent':
            raise serializers.ValidationError("El usuario no es agente.")
        return value

    def create(self, validated_data):
        """
        Crear orden y ajustar `pay_status` si se proporciona `received_value_of_client`.
        """
        received = validated_data.get('received_value_of_client', 0) or 0
        pay_status = validated_data.get('pay_status')
        # Crear la instancia primeramente
        instance = super().create(validated_data)

        # Si existe un received > 0, reutilizamos el método del modelo para sumar y recalcular
        if received and received > 0:
            try:
                instance.add_received_value(received, pay_status=pay_status)
            except Exception as e:
                print(f"[OrderCreateSerializer] Error al aplicar received_value_of_client: {e}")

        return instance


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
            "payment_date",
            "total_costs"
        ]
        read_only_fields = ["total_costs"]

    def validate_sales_manager(self, value):
        if value and value.role != 'agent':
            raise serializers.ValidationError("El usuario no es agente.")
        return value

    def update(self, instance, validated_data):
        """
        Actualiza la orden parcialmente y verifica automáticamente el estado de pago
        cuando se actualiza `received_value_of_client`.

        Se comporta igual que la implementación en `OrderSerializer.update` para
        preservar la acumulación y cálculo del estado de pago.
        """
        # Manejar la actualización del monto recibido de forma acumulativa
        if 'received_value_of_client' in validated_data:
            amount_to_add = validated_data.pop('received_value_of_client')
            pay_status = validated_data.get('pay_status')
            try:
                instance.add_received_value(amount_to_add, pay_status=pay_status)
            except Exception as e:
                print(f"[OrderUpdateSerializer] Error al añadir received value: {e}")

            # Actualizar otros campos
            instance = super().update(instance, validated_data)
        else:
            instance = super().update(instance, validated_data)

        return instance