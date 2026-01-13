from rest_framework import serializers
from api.models import Product, Category, ProductBuyed, ProductReceived, ProductDelivery, Shop, Order, ShoppingReceip, Package, DeliverReceip
from django.db.models import Sum
import json
from drf_spectacular.utils import extend_schema_field


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
    category = serializers.SlugRelatedField(
        queryset=Category.objects.all(),
        slug_field="name",
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "La categoría {value} no existe.",
            "invalid": "El valor proporcionado para la categoría no es válido.",
        },
    )
    # product_pictures is stored in DB as a JSON string; expose it as a single string in the API
    product_pictures = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status = serializers.SerializerMethodField(read_only=True)
    total_cost = serializers.FloatField(required=True)
    amount_buyed = serializers.SerializerMethodField(read_only=True)
    amount_delivered = serializers.SerializerMethodField(read_only=True)
    amount_received = serializers.SerializerMethodField(read_only=True)
    cost_per_product = serializers.SerializerMethodField(read_only=True)
    system_expenses = serializers.SerializerMethodField(read_only=True)
    system_profit = serializers.SerializerMethodField(read_only=True)

    class Meta:
        """MetaClassName"""

        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "link",
            "image_url",
            "shop",
            "description",
            "observation",
            "category",
            "amount_requested",
            "amount_buyed",
            "amount_delivered",
            "amount_received",
            "amount_purchased",
            "order",
            "status",
            "product_pictures",
            "shop_cost",
            "shop_delivery_cost",
            "shop_taxes",
            "charge_iva",
            "base_tax",
            "shop_tax_amount",
            "own_taxes",
            "added_taxes",
            "total_cost",
            "cost_per_product",
            "system_expenses",
            "system_profit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        """Return product_pictures exactly as stored (string)."""
        ret = super().to_representation(instance)
        raw = getattr(instance, 'product_pictures', None)
        ret['product_pictures'] = raw if raw is not None else ''
        return ret

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
        """Retorna la cantidad total de productos recibidos desde la base de datos"""
        return obj.amount_received

    @extend_schema_field(float)
    def get_cost_per_product(self, obj):
        return getattr(obj, 'cost_per_product', 0.0)

    @extend_schema_field(float)
    def get_system_expenses(self, obj):
        """Retorna los gastos del sistema para este producto"""
        return float(obj.system_expenses) if hasattr(obj, 'system_expenses') else 0.0

    @extend_schema_field(float)
    def get_system_profit(self, obj):
        """Retorna la ganancia del sistema para este producto"""
        return float(obj.system_profit) if hasattr(obj, 'system_profit') else 0.0

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


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializador para categorías de productos con costo de envío por libra.
    """

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "shipping_cost_per_pound",
            "client_shipping_charge",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        """Validar unicidad del nombre de categoría"""
        if self.instance:
            # En actualización, excluir la instancia actual
            if Category.objects.filter(name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Ya existe una categoría con este nombre.")
        else:
            # En creación, verificar unicidad
            if Category.objects.filter(name=value).exists():
                raise serializers.ValidationError("Ya existe una categoría con este nombre.")
        return value

    def validate_shipping_cost_per_pound(self, value):
        """Validar que el costo de envío no sea negativo"""
        if value < 0:
            raise serializers.ValidationError("El costo de envío por libra no puede ser negativo.")
        return value

    def validate_client_shipping_charge(self, value):
        """Validar que el cargo al cliente no sea negativo"""
        if value < 0:
            raise serializers.ValidationError("El cargo de envío al cliente no puede ser negativo.")
        return value


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

    shoping_receip = serializers.SlugRelatedField(
        queryset=ShoppingReceip.objects.all(),
        slug_field="id",
        required=False,
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
            "shoping_receip",
            "amount_buyed",
            "quantity_refuned",
            "shop_discount",
            "offer_discount",
            "buy_date",
            "observation",
            "real_cost_of_product",
            "is_refunded",
            "refund_date",
            "refund_amount",
            "refund_notes",
            "original_product_details",
        ]
        read_only_fields = ["id"]

    @extend_schema_field(dict)
    def get_original_product_details(self, obj):
        return ProductSerializer(obj.original_product).data

    def validate(self, attrs):
        # Solo validar amount_buyed si está presente en los datos
        if "amount_buyed" in attrs:
            if attrs["amount_buyed"] <= 0:
                raise serializers.ValidationError(
                    "La cantidad comprada debe ser un número positivo."
                )
            if "original_product" in attrs:
                if (
                    attrs["amount_buyed"] + attrs["original_product"].amount_purchased
                    > attrs["original_product"].amount_requested
                ):
                    raise serializers.ValidationError(
                        "La cantidad comprada no puede ser mayor a la solicitada."
                    )
        return attrs


class ProductReceivedSerializer(serializers.ModelSerializer):
    """
    Serializador para productos recibidos por logística, con validaciones de cantidad y detalles del producto.
    """
    """Product received by the logistical"""

    original_product = ProductSerializer(read_only=True)
    original_product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='original_product',
        write_only=True,
        error_messages={
            "does_not_exist": "El producto {value} no existe.",
            "invalid": "El valor proporcionado para el producto no es válido.",
        },
    )

    package_id = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        source='package',
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "El paquete {value} no existe.",
            "invalid": "El valor proporcionado para el paquete no es válido.",
        },
    )


    class Meta:
        model = ProductReceived
        fields = [
            "id",
            "original_product",
            "original_product_id",
            "package_id",
            "amount_received",
            "observation",
            "created_at",
            "updated_at"
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
                < attrs["amount_received"] + attrs["original_product"].total_received
            ):
                raise serializers.ValidationError(
                    "La cantidad recibida no puede ser mayor a la solicitada."
                )
        return attrs



class ProductDeliverySerializer(serializers.ModelSerializer):
    """
    Serializador para productos entregados con validaciones de cantidad y detalles del producto.
    """
    """Product delivered and received by the logistical"""

    original_product = ProductSerializer(read_only=True)
    original_product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='original_product',
        write_only=True,
        error_messages={
            "does_not_exist": "El producto {value} no existe.",
            "invalid": "El valor proporcionado para el producto no es válido.",
        },
    )

    deliver_receip_id = serializers.PrimaryKeyRelatedField(
        queryset=DeliverReceip.objects.all(),
        source='deliver_receip',
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "El recibo de entrega {value} no existe.",
            "invalid": "El valor proporcionado para el recibo de entrega no es válido.",
        },
    )

    class Meta:
        model = ProductDelivery
        fields = [
            "id",
            "original_product",
            "original_product_id",
            "deliver_receip_id",
            "amount_delivered",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs.get("amount_delivered") and attrs.get("original_product"):
            if attrs["amount_delivered"] <= 0:
                raise serializers.ValidationError(
                    "La cantidad entregada debe ser un número positivo."
                )
            total_received = sum(pr.amount_received for pr in attrs["original_product"].receiveds.all())
            if total_received < attrs["amount_delivered"] + attrs["original_product"].amount_delivered:
                raise serializers.ValidationError(
                    "La cantidad entregada no puede ser mayor a la recibida."
                )
        return attrs


class ProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear productos.
    """
    class Meta:
        model = Product
        # Ajustar los campos al modelo Product tal como está definido
        fields = [
            'order',
            'shop',
            'name',
            'description',
            'link',
            'sku',
            'amount_requested',
            'category',
            'status',
            'observation',
            'product_pictures',
            'shop_cost',
            'shop_delivery_cost',
            'shop_taxes',
            'charge_iva',
            'base_tax',
            'shop_tax_amount',
            'own_taxes',
            'added_taxes',
            'total_cost',
        ]

    def validate_amount_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad solicitada debe ser un número positivo.")
        return value

    def validate_shop_cost(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El costo de la tienda no puede ser negativo.")
        return value

    def create(self, validated_data):
        # Ensure product_pictures is a valid single URL string or empty
        pic_val = validated_data.get('product_pictures')
        if pic_val is None or (isinstance(pic_val, str) and pic_val == ''):
            validated_data['product_pictures'] = ''
        elif isinstance(pic_val, str):
            # Validate that the provided string is a URL
            serializers.URLField().run_validation(pic_val)
            validated_data['product_pictures'] = pic_val
        else:
            raise serializers.ValidationError({
                'product_pictures': 'product_pictures must be a single URL string.'
            })
        return super().create(validated_data)

    def validate_product_pictures(self, value):
        # Accept only a single URL string or empty
        if value is None or value == '':
            return ''
        if not isinstance(value, str):
            raise serializers.ValidationError('product_pictures must be a string URL.')
        try:
            serializers.URLField().run_validation(value)
            return value
        except Exception:
            raise serializers.ValidationError('product_pictures must be a valid URL string.')

    def update(self, instance, validated_data):
        # Only accept a string URL for product_pictures
        pic_val = validated_data.get('product_pictures')
        if pic_val is None or (isinstance(pic_val, str) and pic_val == ''):
            validated_data['product_pictures'] = ''
        elif isinstance(pic_val, str):
            serializers.URLField().run_validation(pic_val)
            validated_data['product_pictures'] = pic_val
        elif pic_val is not None:
            raise serializers.ValidationError({
                'product_pictures': 'product_pictures must be a single URL string.'
            })
        return super().update(instance, validated_data)


class ProductUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar productos.
    """
    class Meta:
        model = Product
        fields = [
            'name',
            'description',
            'link',
            'sku',
            'shop_cost',
            'shop_delivery_cost',
            'shop_taxes',
            'charge_iva',
            'base_tax',
            'shop_tax_amount',
            'own_taxes',
            'added_taxes',
            'total_cost',
            'amount_requested',
            'category',
            'status',
            'observation',
            'product_pictures',
        ]

    def validate_amount_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad solicitada debe ser un número positivo.")
        return value

    def validate_shop_cost(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El costo de la tienda no puede ser negativo.")
        return value
    
    def update(self, instance, validated_data):
        pic_val = validated_data.get('product_pictures')
        if isinstance(pic_val, list):
            for i in pic_val:
                serializers.URLField().run_validation(i)
            validated_data['product_pictures'] = json.dumps(pic_val)
        elif isinstance(pic_val, str):
            try:
                parsed = json.loads(pic_val)
                if isinstance(parsed, list):
                    for i in parsed:
                        serializers.URLField().run_validation(i)
                    validated_data['product_pictures'] = pic_val
                elif isinstance(parsed, str):
                    serializers.URLField().run_validation(parsed)
                    validated_data['product_pictures'] = json.dumps([parsed])
                else:
                    raise Exception()
            except Exception:
                try:
                    serializers.URLField().run_validation(pic_val)
                    validated_data['product_pictures'] = pic_val
                except Exception:
                    validated_data['product_pictures'] = getattr(instance, 'product_pictures', '')
        return super().update(instance, validated_data)

    def validate_product_pictures(self, value):
        if value is None or value == '':
            return ''
        if isinstance(value, list):
            for i in value:
                serializers.URLField().run_validation(i)
            return json.dumps(value)
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    for i in parsed:
                        serializers.URLField().run_validation(i)
                    return value
                if isinstance(parsed, str):
                    serializers.URLField().run_validation(parsed)
                    return json.dumps([parsed])
            except Exception:
                try:
                    serializers.URLField().run_validation(value)
                    return value
                except Exception:
                    raise serializers.ValidationError("product_pictures must be a JSON array of URLs or a single URL string.")
        raise serializers.ValidationError("product_pictures must be a string or a list of URLs.")


# ============================================================================
# SERIALIZADORES PARA TIMELINE DEL PRODUCTO
# ============================================================================

class ProductBuyedTimelineSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para ProductBuyed para la timeline.
    """
    class Meta:
        model = ProductBuyed
        fields = ['id', 'buy_date', 'amount_buyed', 'created_at']


class ProductReceivedTimelineSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para ProductReceived para la timeline.
    """
    class Meta:
        model = ProductReceived
        fields = ['id', 'amount_received', 'created_at']


class ProductDeliveryTimelineSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para ProductDelivery para la timeline.
    """
    class Meta:
        model = ProductDelivery
        fields = ['id', 'amount_delivered', 'created_at']


class ProductTimelineSerializer(serializers.ModelSerializer):
    """
    Serializador para obtener los datos de la timeline de un producto.
    Incluye las relaciones buys, receiveds y delivers con sus fechas.
    """
    buys = ProductBuyedTimelineSerializer(many=True, read_only=True)
    receiveds = ProductReceivedTimelineSerializer(many=True, read_only=True)
    delivers = ProductDeliveryTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'status',
            'created_at',
            'updated_at',
            'amount_requested',
            'amount_purchased',
            'amount_received',
            'amount_delivered',
            'buys',
            'receiveds',
            'delivers',
        ]
        read_only_fields = fields


class ProductTimelineFormattedSerializer(serializers.ModelSerializer):
    """
    Serializador que retorna la timeline del producto ya formateada
    con los eventos listos para renderizar en el frontend.
    """
    events = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'status',
            'created_at',
            'updated_at',
            'events',
        ]
        read_only_fields = fields

    @extend_schema_field(list)
    def get_events(self, obj):
        """
        Construye y retorna los eventos de la timeline ya formateados.
        Cada evento incluye toda la información necesaria para renderizar.
        """
        events = []

        # Estado config mapping
        status_config = {
            'created': {
                'label': 'Registro Creado',
                'icon': 'check-circle-2',
                'color': 'text-gray-600',
                'bgColor': 'bg-gray-100',
            },
            'purchased': {
                'label': 'Comprado',
                'icon': 'shopping-cart',
                'color': 'text-blue-600',
                'bgColor': 'bg-blue-100',
            },
            'received': {
                'label': 'Recibido',
                'icon': 'package',
                'color': 'text-yellow-600',
                'bgColor': 'bg-yellow-100',
            },
            'delivered': {
                'label': 'Entregado',
                'icon': 'truck',
                'color': 'text-green-600',
                'bgColor': 'bg-green-100',
            },
        }

        # Evento de creación
        if obj.created_at:
            events.append({
                'status': 'created',
                'date': obj.created_at.isoformat(),
                'label': status_config['created']['label'],
                'description': 'El producto fue registrado en el sistema',
                'icon': status_config['created']['icon'],
                'color': status_config['created']['color'],
                'bgColor': status_config['created']['bgColor'],
                'isCompleted': True,
            })

        # Evento de compra
        if obj.buys.exists() and obj.amount_purchased and obj.amount_purchased > 0:
            first_buy = obj.buys.first()
            total_amount = obj.buys.aggregate(Sum('amount_buyed'))['amount_buyed__sum'] or 0
            
            events.append({
                'status': 'purchased',
                'date': (first_buy.buy_date or obj.created_at).isoformat(),
                'label': status_config['purchased']['label'],
                'description': f'Se compraron {int(total_amount)} unidad(es) del producto',
                'icon': status_config['purchased']['icon'],
                'color': status_config['purchased']['color'],
                'bgColor': status_config['purchased']['bgColor'],
                'isCompleted': True,
            })

        # Evento de recepción
        if obj.receiveds.exists() and obj.amount_received and obj.amount_received > 0:
            first_received = obj.receiveds.first()
            total_amount = obj.receiveds.aggregate(Sum('amount_received'))['amount_received__sum'] or 0
            
            events.append({
                'status': 'received',
                'date': first_received.created_at.isoformat(),
                'label': status_config['received']['label'],
                'description': f'Se recibieron {int(total_amount)} unidad(es) del producto',
                'icon': status_config['received']['icon'],
                'color': status_config['received']['color'],
                'bgColor': status_config['received']['bgColor'],
                'isCompleted': True,
            })

        # Evento de entrega
        if obj.delivers.exists() and obj.amount_delivered and obj.amount_delivered > 0:
            first_delivery = obj.delivers.first()
            total_amount = obj.delivers.aggregate(Sum('amount_delivered'))['amount_delivered__sum'] or 0
            
            events.append({
                'status': 'delivered',
                'date': first_delivery.created_at.isoformat(),
                'label': status_config['delivered']['label'],
                'description': f'Se entregaron {int(total_amount)} unidad(es) al cliente',
                'icon': status_config['delivered']['icon'],
                'color': status_config['delivered']['color'],
                'bgColor': status_config['delivered']['bgColor'],
                'isCompleted': True,
            })

        # Ordenar eventos por fecha
        events.sort(key=lambda x: x['date'])

        return events