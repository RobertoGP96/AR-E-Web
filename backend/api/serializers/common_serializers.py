from rest_framework import serializers
from api.models import CommonInformation


class CommonInformationSerializer(serializers.ModelSerializer):
    """
    Serializador para configuración global del sistema.
    Maneja la tasa de cambio y el costo de envío por libra.
    """

    class Meta:
        model = CommonInformation
        fields = ["id", "change_rate", "cost_per_pound", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_change_rate(self, value):
        """Validar que la tasa de cambio sea positiva"""
        if value < 0:
            raise serializers.ValidationError(
                "La tasa de cambio no puede ser negativa."
            )
        return value

    def validate_cost_per_pound(self, value):
        """Validar que el costo por libra sea positivo"""
        if value < 0:
            raise serializers.ValidationError(
                "El costo por libra no puede ser negativo."
            )
        return value


# EvidenceImages model removed: image upload API returns direct URLs. Keep
# ImageUploadSerializer below for handling uploads to external service.


class ImageUploadSerializer(serializers.Serializer):
    """
    Serializador para subir imágenes.
    """
    image = serializers.ImageField(required=False)
    public_id = serializers.CharField(required=False)