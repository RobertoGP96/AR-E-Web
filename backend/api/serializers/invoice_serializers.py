from rest_framework import serializers
from api.models import Invoice, Tag


class TagSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Tag.
    """
    class Meta:
        model = Tag
        fields = [
            'id',
            'invoice',
            'type',
            'weight',
            'cost_per_lb',
            'fixed_cost',
            'subtotal',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Invoice.
    Incluye tags relacionados.
    """
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'date',
            'total',
            'created_at',
            'updated_at',
            'tags'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_total(self, value):
        """
        Validar que el total sea positivo.
        """
        if value <= 0:
            raise serializers.ValidationError("El total debe ser un valor positivo.")
        return value


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear Invoice con tags incluidas.
    """
    tags = TagSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'date',
            'total',
            'tags'
        ]
        read_only_fields = ['id']

    def validate_total(self, value):
        """
        Validar que el total sea positivo.
        """
        if value <= 0:
            raise serializers.ValidationError("El total debe ser un valor positivo.")
        return value

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        invoice = Invoice.objects.create(**validated_data)
        for tag_data in tags_data:
            Tag.objects.create(invoice=invoice, **tag_data)
        return invoice