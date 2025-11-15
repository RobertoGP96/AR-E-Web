from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field


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

    @extend_schema_field(serializers.DictField)
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


class AmazonScrapingSerializer(serializers.Serializer):
    """
    Serializador para requests de scraping de Amazon.
    """
    url = serializers.URLField(required=True)

    def validate_url(self, value):
        """Validar que la URL sea de Amazon"""
        if 'amazon.com' not in value and 'amzn.to' not in value:
            raise serializers.ValidationError("La URL debe ser de Amazon.")
        return value