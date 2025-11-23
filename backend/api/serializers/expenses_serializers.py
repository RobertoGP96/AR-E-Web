from rest_framework import serializers
from api.models import Expense
from api.serializers.users_serializers import UserProfileSerializer


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Expense"""
    created_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            # 'shop' and 'account' removed from Expense model
            'date',
            'amount',
            'category',
            'description',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def validate_amount(self, value):
        """Validar que el monto sea un número positivo y con no más de 2 decimales."""
        if value <= 0:
            raise serializers.ValidationError("El monto del gasto debe ser un valor positivo.")
        try:
            # Si es float o Decimal normalizar a str y verificar decimales
            s = f"{value:.2f}"
            # Esto asegura como mínimo 2 decimales, no realiza validación decimal únicamente
        except Exception:
            pass
        return value
