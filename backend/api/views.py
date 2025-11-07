"Vistas de la API"
from rest_framework.fields import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_field
from rest_framework import serializers

# Serializer para recuperación de contraseña
class PasswordRecoverSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=False)
    password_secret = serializers.CharField(required=False)

# Serializer para subida/eliminación de imágenes
class ImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField(required=False)
    public_id = serializers.CharField(required=False)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import api_view, action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Sum, Count
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from api.permissions.permissions import (
    ClientOrderViewPermission,
    ReadOnly,
    ReadOnlyorPost,
    AccountantPermission,
    AdminPermission,
    AgentPermission,
    BuyerPermission,
    LogisticalPermission,
)
from api.serializers import (
    ProductDeliverySerializer,
    ShoppingReceipSerializer,
    UserSerializer,
    UserProfileSerializer,
    OrderSerializer,
    ShopSerializer,
    BuyingAccountsSerializer,
    CommonInformationSerializer,
    ProductSerializer,
    ProductBuyedSerializer,
    ProductReceivedSerializer,
    PackageSerializer,
    DeliverReceipSerializer,
    CategorySerializer,
    AmazonScrapingRequestSerializer,
    AmazonScrapingResponseSerializer,
    EvidenceImagesSerializer,
)
from api.models import (
    Order,
    ProductBuyed,
    Shop,
    BuyingAccounts,
    CommonInformation,
    Product,
    ShoppingReceip,
    ProductReceived,
    ProductDelivery,
    Package,
    DeliverReceip,
    EvidenceImages,
    Category,
)
from api.utils.email_sender import send_email
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
import cloudinary.uploader

User = get_user_model()


# Auth JWt


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers

class PhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para login con número de teléfono.
    """
    phone_number = serializers.CharField(required=True)

    def validate(self, attrs):
        phone_number = attrs.get("phone_number")
        password = attrs.get("password")
        user = None
        if phone_number and password:
            try:
                user = User.objects.get(phone_number=phone_number)
            except User.DoesNotExist:
                raise serializers.ValidationError({"phone_number": "No existe usuario con ese número."})
            if not user.check_password(password):
                raise serializers.ValidationError({"password": "Contraseña incorrecta."})
            if not user.is_active:
                raise serializers.ValidationError({"phone_number": "Usuario inactivo."})
        else:
            raise serializers.ValidationError("Debe proporcionar número de teléfono y contraseña.")
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": user_data
        }


class EmailOrPhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para login con email o número de teléfono.
    Permite flexibilidad para usar cualquiera de los dos métodos de autenticación.
    """
    # Definir campos sin source redundante
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Eliminar el campo username heredado del padre
        if 'username' in self.fields:
            self.fields.pop('username')

    def validate(self, attrs):
        email = attrs.get("email")
        phone_number = attrs.get("phone_number")
        password = attrs.get("password")
        user = None

        # Validar que se proporcione al menos uno de los identificadores
        if not email and not phone_number:
            raise serializers.ValidationError({
                "error": "Debe proporcionar email o número de teléfono."
            })

        # Validar contraseña
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es requerida."})

        # Intentar autenticar por email
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    "email": "No existe usuario con ese email."
                })
        
        # Intentar autenticar por teléfono si no se proporcionó email o no se encontró usuario
        elif phone_number:
            try:
                user = User.objects.get(phone_number=phone_number)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    "phone_number": "No existe usuario con ese número de teléfono."
                })

        # Validar contraseña
        if user and not user.check_password(password):
            raise serializers.ValidationError({"password": "Contraseña incorrecta."})

        # Validar que el usuario esté activo
        if user and not user.is_active:
            raise serializers.ValidationError({
                "error": "Usuario inactivo. Contacte al administrador."
            })

        # Generar tokens
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": user_data
        }

from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

@extend_schema(
    summary="Login con email o número de teléfono",
    description="Obtiene el par de tokens JWT usando email o número de teléfono con contraseña.",
    request=EmailOrPhoneTokenObtainPairSerializer,
    responses={200: OpenApiTypes.OBJECT},
    tags=["Autenticación"],
    examples=[
        OpenApiExample(
            "Ejemplo login con email",
            value={"email": "usuario@correo.com", "password": "123456"},
            request_only=True
        ),
        OpenApiExample(
            "Ejemplo login con teléfono",
            value={"phone_number": "+5355555555", "password": "123456"},
            request_only=True
        ),
        OpenApiExample(
            "Ejemplo respuesta",
            value={
                "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI...",
                "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI...",
                "user": {
                    "user_id": 1,
                    "email": "usuario@correo.com",
                    "name": "Nombre",
                    "last_name": "Apellido",
                    "home_address": "Dirección",
                    "phone_number": "+5355555555",
                    "role": "user",
                    "agent_profit": 0,
                    "is_staff": False
                }
            },
            response_only=True
        )
    ]
)
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Obtención de token JWT para autenticación de usuarios.
    Permite autenticación usando email o número de teléfono.
    """
    serializer_class = EmailOrPhoneTokenObtainPairSerializer


class Protection(APIView):
    """
    Endpoint protegido que verifica la validez del token JWT.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Verifica autenticación",
        description="Devuelve 200 si el token JWT es válido.",
        responses={200: None},
        tags=["Autenticación"]
    )
    def get(self, request):
        """Respuesta de seguridad"""
        if request:
            return Response(status=status.HTTP_200_OK)
        raise ValidationError({"message": "no_request"})


# UserManagement


class UserViewSet(viewsets.ModelViewSet):
    """
    Gestión de usuarios: registro, consulta, actualización y eliminación.
    Soporta filtrado por rol, estado activo, estado verificado y búsqueda por texto.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly | ReadOnlyorPost]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['id', 'name', 'date_joined']
    ordering = ['-date_joined']  # Orden por defecto: más recientes primero

    @extend_schema(
        summary="Registrar usuario",
        description="Crea un nuevo usuario. Si la verificación por email está habilitada, envía correo de verificación.",
        responses={201: UserSerializer},
        tags=["Usuarios"]
    )
    def perform_create(self, serializer):
        from django.conf import settings
        
        # Verificar si la verificación por email está habilitada
        email_verification_enabled = getattr(settings, 'ENABLE_EMAIL_VERIFICATION', False)
        
        if email_verification_enabled and self.request.data.get("email"):
            # Solo si está habilitada la verificación Y se proporciona email
            try:
                verify_secret = get_random_string(length=32)
                send_email(
                    self.request.data["name"], self.request.data["email"], verify_secret
                )
                return serializer.save(
                    verification_secret=verify_secret,
                    sent_verification_email=True,
                    is_verified=False,  # Requiere verificación
                    is_active=True  # Activo pero no verificado
                )
            except Exception as e:
                raise ValidationError({"error": str(e)}) from e
        else:
            # Activación automática cuando no se requiere verificación por email
            return serializer.save(
                verification_secret=None,
                sent_verification_email=False,
                is_verified=True,  # Verificado automáticamente
                is_active=True  # Activo
            )


class PasswordRecoverList(APIView):
    """
    Recuperación y cambio de contraseña de usuario.
    """
    serializer_class = PasswordRecoverSerializer
    @extend_schema(
        summary="Solicitar recuperación de contraseña",
        description="Envía un correo con el enlace para recuperar la contraseña.",
        responses={200: None},
        tags=["Usuarios"]
    )
    def post(self, request):
        password_secret = get_random_string(length=32)
        try:
            user = User.objects.get(email=request.data["email"])
            user.password_secret = password_secret
            user.save()
            print(
                f"Porfavor ve a <a href='http://localhost:5173/recover-password/{password_secret}'>este link</a> para cambiar tu contraseña."
            )
            return Response(
                {"message": "Password recuperado"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            raise ValidationError({"message": "Email no existe" + str(e)}) from e

    @extend_schema(
        summary="Actualizar contraseña",
        description="Actualiza la contraseña usando el secreto enviado por correo.",
        responses={200: None},
        tags=["Usuarios"]
    )
    def put(self, request, password_secret=None):
        """Actualiza la contraseña"""
        try:
            user = User.objects.get(password_secret=password_secret)
            user.set_user_password(request.data["password"])
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            raise ValidationError({"message": "Error"}) from e


@extend_schema(
    summary="Verificar correo de usuario",
    description="Verifica el correo electrónico del usuario usando el secreto de verificación.",
    responses={200: None},
    tags=["Usuarios"]
)
@api_view(["GET"])
def verify_user(request, verification_secret: str):
    """Verifica el correo electrónico del usuario."""
    if request:
        try:
            user = User.objects.get(verification_secret=verification_secret)
            user.verify()
            return Response({"message": "user_registered"}, status=status.HTTP_200_OK)
        except Exception as e:
            raise ValidationError({"message": "unable to register user"}) from e
    raise ValidationError({"message": "no_request"})
    serializer_class = PasswordRecoverSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    Gestión de órdenes: creación, consulta, actualización y eliminación de órdenes.
    Soporta filtrado por estado, estado de pago, cliente, agente y fechas.
    Los administradores y agentes tienen acceso completo (crear, ver, editar, eliminar).
    """
    # Seleccionar related users para que el serializer anidado los incluya
    # en la misma respuesta (evita N+1 queries)
    queryset = Order.objects.all().select_related('client', 'sales_manager').prefetch_related("products")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, (AgentPermission | AdminPermission | ClientOrderViewPermission)]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'pay_status', 'client', 'sales_manager']
    search_fields = ['client__name', 'client__last_name', 'client__email', 'sales_manager__name']
    ordering_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Crear orden",
        description="Crea una nueva orden. Si no se especifica sales_manager, se asigna el usuario actual.",
        responses={201: OrderSerializer},
        tags=["Órdenes"]
    )
    def perform_create(self, serializer):
        user = User.objects.get(id=self.request.user.id)
        # Si no se proporciona sales_manager en el request, usar el usuario actual
        if not serializer.validated_data.get('sales_manager'):
            return serializer.save(sales_manager=user)
        return serializer.save()

    @extend_schema(
        summary="Mis órdenes",
        description="Retorna las órdenes pertenecientes al usuario autenticado (client).",
        responses={200: OrderSerializer},
        tags=["Órdenes"]
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="my-orders")
    def my_orders(self, request):
        """Devuelve las órdenes cuyo campo `client` sea el usuario autenticado."""
        # Filtrar por el cliente autenticado y aplicar los filtros/ordenación/paginación del viewset
        queryset = self.filter_queryset(self.get_queryset().filter(client=request.user))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Órdenes disponibles para delivery por cliente",
        description="Retorna las órdenes de un cliente específico que tienen productos pendientes de entregar y no están canceladas ni completadas.",
        parameters=[
            OpenApiParameter(
                name='client_id',
                type=int,
                location=OpenApiParameter.QUERY,
                description='ID del cliente para filtrar las órdenes',
                required=True
            )
        ],
        responses={200: OrderSerializer(many=True)},
        tags=["Órdenes"]
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="available-for-delivery")
    def available_for_delivery(self, request):
        """
        Devuelve las órdenes disponibles para crear un delivery.
        Una orden está disponible si:
        - Pertenece al cliente especificado
        - NO está cancelada
        - NO está completada
        - Tiene productos con cantidad pendiente de entregar (amount_purchased > amount_delivered)
        """
        client_id = request.query_params.get('client_id')
        
        if not client_id:
            return Response(
                {"error": "El parámetro 'client_id' es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Filtrar órdenes del cliente que no están canceladas ni completadas
            queryset = self.get_queryset().filter(
                client_id=client_id
            ).exclude(
                status__in=[OrderStatusEnum.CANCELADO.value, OrderStatusEnum.COMPLETADO.value]
            )
            
            # Filtrar solo las que tienen productos pendientes de entregar
            available_orders = []
            for order in queryset:
                if order.available_for_delivery:
                    available_orders.append(order)
            
            serializer = self.get_serializer(available_orders, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])


class ShopViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de tiendas",
        description="Obtén todas las tiendas registradas en el sistema, incluyendo nombre, link y cuentas de compra asociadas.",
        tags=["Tiendas"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"name": "Amazon", "link": "https://amazon.com", "buying_accounts": ["Cuenta Amazon"]},
                    {"name": "eBay", "link": "https://ebay.com", "buying_accounts": ["Cuenta eBay"]}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Detalle de tienda",
        description="Obtén la información detallada de una tienda específica por su nombre.",
        tags=["Tiendas"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value={"name": "Amazon", "link": "https://amazon.com", "buying_accounts": ["Cuenta Amazon"]},
                response_only=True
            )
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    """
    Gestión de tiendas: consulta, actualización y eliminación por nombre.
    Soporta filtrado por estado activo y búsqueda por nombre.
    """
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [ReadOnly | AdminPermission]
    lookup_field = "name"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'link']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @extend_schema(
        summary="Obtener tienda por nombre",
        description="Devuelve la información de la tienda especificada por nombre.",
        responses={200: ShopSerializer},
        tags=["Tiendas"]
    )
    def get_object(self):
        try:
            shop = Shop.objects.get(name=self.kwargs["name"])
        except Exception as e:
            raise ValidationError({"error": str(e)}) from e
        return shop


class BuyingAccountsViewsSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de cuentas de compra",
        description="Obtén todas las cuentas de compra asociadas a las tiendas. Útil para gestión y selección de métodos de pago en compras.",
        tags=["Cuentas de compra"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"account_name": "Cuenta Amazon", "shop": "Amazon"},
                    {"account_name": "Cuenta eBay", "shop": "eBay"}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de cuentas de compra.
    Soporta filtrado por tienda y búsqueda por nombre de cuenta.
    """
    queryset = BuyingAccounts.objects.all()
    serializer_class = BuyingAccountsSerializer
    permission_classes = [ReadOnly | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['shop']
    search_fields = ['account_name']
    ordering_fields = ['account_name', 'created_at']
    ordering = ['account_name']


class CommonInformationViewSet(viewsets.ModelViewSet):
    """
    Información común del sistema.
    """
    queryset = CommonInformation.objects.all()
    serializer_class = CommonInformationSerializer
    permission_classes = [ReadOnly | AdminPermission]

    @extend_schema(
        summary="Obtener información común",
        description="Devuelve la información común del sistema.",
        responses={200: CommonInformationSerializer},
        tags=["Información común"]
    )
    def get_object(self):
        return CommonInformation.get_instance()


@extend_schema(tags=["Categorías"])
class CategoryViewSet(viewsets.ModelViewSet):
    """
    Gestión de categorías de productos.
    Soporta filtrado por nombre y búsqueda.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnly | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'shipping_cost_per_pound']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de productos",
        description="Consulta todos los productos disponibles en el sistema, incluyendo detalles como nombre, SKU, tienda, estado y costos asociados.",
        tags=["Productos"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"id": 1, "sku": "SKU123", "name": "Laptop HP", "shop": "Amazon", "status": "Comprado", "total_cost": 1200.0},
                    {"id": 2, "sku": "SKU456", "name": "Mouse Logitech", "shop": "eBay", "status": "Encargado", "total_cost": 25.0}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de productos.
    Soporta filtrado por estado, tienda, orden, categoría y búsqueda por nombre/SKU.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # Allow read-only for everyone and write access for agents or admins
    permission_classes = [ReadOnly | (AgentPermission | AdminPermission)]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'shop', 'order', 'category']
    search_fields = ['name', 'sku', 'description', 'link']
    ordering_fields = ['created_at', 'name', 'shop_cost', 'total_cost'
]
    ordering = ['-created_at']


class ShoppingReceipViewSet(viewsets.ModelViewSet):
    """
    Gestión de recibos de compra y productos comprados.
    Soporta filtrado por estado, cuenta y tienda, y búsqueda por fecha.
    Permite crear recibos de compra con productos asociados en una sola operación.
    """
    queryset = ShoppingReceip.objects.all()
    serializer_class = ShoppingReceipSerializer
    permission_classes = [ReadOnly | BuyerPermission | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status_of_shopping', 'shopping_account', 'shop_of_buy']
    search_fields = ['shopping_account__account_name', 'shop_of_buy__name']
    ordering_fields = ['buy_date', 'created_at']
    ordering = ['-buy_date']

    @extend_schema(
        summary="Crear recibo de compra con productos",
        description="""Crea un recibo de compra y opcionalmente los productos comprados asociados.
        
        **Campos requeridos para ShoppingReceip:**
        - shopping_account: Nombre de la cuenta de compra
        - shop_of_buy: Nombre de la tienda
        
        **Campos opcionales para ShoppingReceip:**
        - buy_date: Fecha de compra (por defecto: fecha actual)
        - status_of_shopping: Estado del shopping
        
        **Campo opcional para productos comprados:**
        - buyed_products: Lista de productos comprados (cada producto debe tener original_product y amount_buyed)
        
        **Nota:** Si no se especifica buy_date en los productos, se usará automáticamente la buy_date del recibo.
        """,
        request=ShoppingReceipSerializer,
        responses={
            201: ShoppingReceipSerializer,
            400: OpenApiTypes.OBJECT
        },
        tags=["Recibos de compra"],
        examples=[
            OpenApiExample(
                "Crear recibo con productos",
                value={
                    "shopping_account": "CuentaPrincipal",
                    "shop_of_buy": "Amazon",
                    "buy_date": "2025-10-22T10:00:00Z",
                    "buyed_products": [
                        {
                            "original_product": "uuid-del-producto",
                            "amount_buyed": 2,
                            "actual_cost_of_product": 25.50,
                            "real_cost_of_product": 25.50
                        }
                    ]
                }
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


class ProductBuyedViewSet(viewsets.ModelViewSet):
    """
    Gestión de productos comprados.
    Soporta filtrado por producto original y recibo de compra.
    
    **Campos requeridos para crear:**
    - original_product: ID del producto original
    - amount_buyed: Cantidad comprada
    
    **Campos opcionales:**
    - shoping_receip: Recibo de compra (se asigna automáticamente si se crea desde ShoppingReceip)
    - actual_cost_of_product, shop_discount, offer_discount, buy_date, observation, real_cost_of_product
    
    **Nota:** Al crear desde ShoppingReceip, buy_date se toma automáticamente del recibo si no se especifica.
    """
    queryset = ProductBuyed.objects.all()
    serializer_class = ProductBuyedSerializer
    permission_classes = [ReadOnly | AccountantPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['original_product', 'shoping_receip']
    search_fields = ['original_product__name', 'original_product__sku']
    ordering_fields = ['buy_date', 'created_at', 'actual_cost_of_product']
    ordering = ['-buy_date']

    @extend_schema(
        summary="Crear producto comprado",
        description="""Registra un producto como comprado. Actualiza automáticamente la cantidad comprada del producto original.
        
        **Campos requeridos:**
        - original_product: ID del producto original
        - amount_buyed: Cantidad comprada (debe ser positiva)
        
        **Campos opcionales:**
        - shoping_receip: ID del recibo de compra
        - actual_cost_of_product: Costo real del producto
        - shop_discount: Descuento de la tienda
        - offer_discount: Descuento por oferta
        - buy_date: Fecha de compra (por defecto: fecha actual)
        - observation: Observaciones
        - real_cost_of_product: Costo real final
        
        **Nota:** La cantidad comprada se suma automáticamente al producto original.
        """,
        request=ProductBuyedSerializer,
        responses={
            201: ProductBuyedSerializer,
            400: OpenApiTypes.OBJECT
        },
        tags=["Productos comprados"],
        examples=[
            OpenApiExample(
                "Crear producto comprado",
                value={
                    "original_product": "uuid-del-producto",
                    "amount_buyed": 3,
                    "actual_cost_of_product": 45.00,
                    "real_cost_of_product": 42.50,
                    "shop_discount": 2.50
                }
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Listado de productos comprados",
        description="Obtén el historial de productos adquiridos por los agentes, con detalles de compra, descuentos y costos reales.",
        tags=["Productos comprados"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {
                        "id": 1,
                        "original_product": "uuid-producto-1",
                        "amount_buyed": 2,
                        "actual_cost_of_product": 25.00,
                        "real_cost_of_product": 22.50,
                        "buy_date": "2025-10-22T10:00:00Z"
                    }
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class ProductReceivedViewSet(viewsets.ModelViewSet):
    """
    Gestión de productos recibidos y entrega de productos.
    Soporta filtrado por orden, producto, paquete y recibo de entrega.
    """
    queryset = ProductReceived.objects.all()
    serializer_class = ProductReceivedSerializer
    permission_classes = [ReadOnly | LogisticalPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['original_product', 'package']
    search_fields = ['original_product__name', 'original_product__sku', 'package__number_of_tracking']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Registrar productos recibidos",
        description="Crea registros de productos recibidos y los asocia a un paquete.",
        responses={201: ProductReceivedSerializer},
        tags=["Productos recibidos"]
    )
    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            try:
                if "contained_products" in request.data and (
                    "package" in request.data
                ):
                    contained_products = request.data["contained_products"]
                    for product in contained_products:
                        product["package"] = request.data[
                            "package"
                        ]
                        product_serializer = ProductReceivedSerializer(data=product)
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                return Response(
                    {"Message": "Product Creation success"},
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                raise ValidationError(f"Error al procesar productos: {str(e)}") from e

    @extend_schema(
        summary="Entregar productos",
        description="Actualiza el estado de productos como entregados.",
        responses={201: ProductReceivedSerializer},
        tags=["Productos recibidos"]
    )
    @action(detail=False, methods=["patch"], permission_classes=[IsAuthenticated])
    def deliver_products(self, request):
        with transaction.atomic():
            try:
                if "delivered_products" in request.data and (
                    "deliver_receip" in request.data
                ):
                    delivered_products = request.data["delivered_products"]
                    for product in delivered_products:

                        instance = ProductReceived.objects.get(id=product["id"])
                        # Note: ProductReceived doesn't have deliver_receip field
                        # This might need to be moved to ProductDeliveryViewSet
                        product_serializer = ProductReceivedSerializer(
                            instance, data=product, partial=True
                        )
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                        print(product_serializer.data)
                    return Response(
                        {"Message": "Product Update success"},
                        status=status.HTTP_200_OK,
                    )
                raise ValidationError("Argumentos incompletos o incorrectos")
            except Exception as e:
                raise ValidationError(f"Error al procesar productos: {str(e)}") from e



class ProductDeliveryViewSet(viewsets.ModelViewSet):
    """
    Gestión de productos entregados.
    Soporta filtrado por orden, producto y recibo de entrega.
    """
    queryset = ProductDelivery.objects.all()
    serializer_class = ProductDeliverySerializer
    permission_classes = [ReadOnly | LogisticalPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['original_product', 'deliver_receip']
    search_fields = ['original_product__name', 'original_product__sku', 'deliver_receip__id']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Registrar productos entregados",
        description="Crea registros de productos entregados y los asocia a un recibo de entrega.",
        responses={201: ProductDeliverySerializer},
        tags=["Productos entregados"]
    )
    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            try:
                if "delivered_products" in request.data and (
                    "deliver_receip" in request.data
                ):
                    delivered_products = request.data["delivered_products"]
                    for product in delivered_products:
                        product["deliver_receip"] = request.data["deliver_receip"]
                        product_serializer = ProductDeliverySerializer(data=product)
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                return Response(
                    {"Message": "Product Delivery Creation success"},
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                raise ValidationError(f"Error al procesar entregas: {str(e)}") from e

    @extend_schema(
        summary="Actualizar entregas",
        description="Actualiza registros de productos entregados.",
        responses={200: ProductDeliverySerializer},
        tags=["Productos entregados"]
    )
    @action(detail=False, methods=["patch"], permission_classes=[IsAuthenticated])
    def update_deliveries(self, request):
        with transaction.atomic():
            try:
                if "delivered_products" in request.data:
                    delivered_products = request.data["delivered_products"]
                    for product in delivered_products:
                        instance = ProductDelivery.objects.get(id=product["id"])
                        product_serializer = ProductDeliverySerializer(
                            instance, data=product, partial=True
                        )
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                    return Response(
                        {"Message": "Product Delivery Update success"},
                        status=status.HTTP_200_OK,
                    )
                raise ValidationError("Argumentos incompletos")
            except Exception as e:
                raise ValidationError(f"Error al actualizar entregas: {str(e)}") from e



class PackageViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de paquetes",
        description="Consulta todos los paquetes gestionados en el sistema, incluyendo número de tracking, agencia y productos contenidos.",
        tags=["Paquetes"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"id": 1, "number_of_tracking": "TRK123", "agency_name": "DHL", "status_of_processing": "En tránsito"},
                    {"id": 2, "number_of_tracking": "TRK456", "agency_name": "FedEx", "status_of_processing": "Entregado"}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de paquetes.
    Soporta filtrado por estado y agencia, y búsqueda por número de tracking.
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [ReadOnly | LogisticalPermission | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status_of_processing', 'agency_name']
    search_fields = ['number_of_tracking', 'agency_name']
    ordering_fields = ['created_at', 'agency_name']
    ordering = ['-created_at']

    @extend_schema(
        summary="Agregar productos recibidos a un paquete",
        description="Permite agregar una lista de productos recibidos a un paquete específico.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "products": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "original_product": {"type": "integer", "description": "ID del producto"},
                                "amount_received": {"type": "integer", "description": "Cantidad recibida"},
                                "observation": {"type": "string", "description": "Observación opcional"}
                            },
                            "required": ["original_product", "amount_received"]
                        }
                    }
                },
                "required": ["products"]
            }
        },
        responses={
            201: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "added_products": {"type": "integer"}
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}}
        },
        tags=["Paquetes"]
    )
    @action(detail=True, methods=['post'], permission_classes=[LogisticalPermission | AdminPermission])
    def add_products(self, request, pk=None):
        """
        Agregar productos recibidos a un paquete específico.
        """
        try:
            package = self.get_object()
            products_data = request.data.get('products', [])

            if not products_data:
                return Response(
                    {'error': 'Se requiere una lista de productos'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            added_count = 0
            with transaction.atomic():
                for product_data in products_data:
                    # Validar datos requeridos
                    original_product_id = product_data.get('original_product')
                    amount_received = product_data.get('amount_received')

                    if not original_product_id or not amount_received:
                        raise ValidationError(
                            f'Faltan datos requeridos para el producto: original_product y amount_received son obligatorios'
                        )

                    # Crear el producto recibido
                    product_received_data = {
                        'original_product': original_product_id,
                        'package': package.id,
                        'amount_received': amount_received,
                        'observation': product_data.get('observation', '')
                    }

                    serializer = ProductReceivedSerializer(data=product_received_data)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    added_count += 1

            return Response(
                {
                    'message': f'Se agregaron {added_count} productos al paquete exitosamente',
                    'added_products': added_count
                },
                status=status.HTTP_201_CREATED
            )

        except Package.DoesNotExist:
            return Response(
                {'error': 'Paquete no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeliverReceipViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de recibos de entrega",
        description="Obtén todos los recibos de entrega generados, con información de productos entregados, fechas y estado.",
        tags=["Recibos de entrega"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"id": 1, "client": 1, "deliver_date": "2025-08-21", "status": "entregado"},
                    {"id": 2, "client": 2, "deliver_date": "2025-08-20", "status": "pendiente"}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de recibos de entrega.
    Soporta filtrado por cliente y estado, y búsqueda por nombre de cliente.
    """
    queryset = DeliverReceip.objects.all()
    serializer_class = DeliverReceipSerializer
    permission_classes = [ReadOnly | LogisticalPermission | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['client', 'status', 'category']
    search_fields = ['client__full_name', 'client__phone_number', 'id']
    ordering_fields = ['deliver_date', 'created_at', 'weight']
    ordering = ['-deliver_date']
    
    def get_queryset(self):
        """
        Personaliza el queryset para obtener datos relacionados del cliente.
        """
        queryset = super().get_queryset()
        # Obtener datos del cliente, su agente asignado y la categoría
        return queryset.select_related('client', 'client__assigned_agent', 'category')


class ImageUploadApiView(APIView):
    serializer_class = ImageUploadSerializer
    """
    Subida y eliminación de imágenes de evidencia.
    """
    @extend_schema(
        summary="Subir imagen",
        description="Sube una imagen de evidencia al servidor.",
        responses={201: None},
        tags=["Imágenes"]
    )
    def post(self, request):
        if "image" in request.FILES:
            picture = request.FILES.get("image")
            if not picture.name.lower().endswith((".png", ".jpg", ".jpeg")):
                raise ValidationError(
                    "El archivo debe ser una imagen (.png, .jpg, .jpeg)."
                )
            try:
                upload_result = cloudinary.uploader.upload(picture, quality=10)
                print(upload_result)
                image_url = upload_result["secure_url"]
            except Exception as e:
                raise ValidationError(str(e)) from e
            image = EvidenceImages(
                image_url=image_url, public_id=upload_result["public_id"]
            )
            image.save()
            return Response(
                {"image_url": image_url, "public_id": upload_result["public_id"]},
                status=status.HTTP_201_CREATED,
            )

    @extend_schema(
        summary="Eliminar imagen",
        description="Elimina una imagen de evidencia del servidor.",
        responses={200: None},
        tags=["Imágenes"]
    )
    def delete(self, request):
        if "public_id" in request.data:
            try:
                print(request.data)
                EvidenceImages.objects.get(public_id=request.data["public_id"]).delete()
                print(request.data["public_id"])
                destroy_result = cloudinary.uploader.destroy(request.data["public_id"])
            except Exception as e:
                raise ValidationError(str(e)) from e
            return Response(
                {"destroy result": destroy_result}, status=status.HTTP_200_OK
            )


class EvidenceImagesViewSet(viewsets.ModelViewSet):
    """
    Gestión de imágenes de evidencia.
    Soporta filtrado por public_id y búsqueda por URL.
    """
    queryset = EvidenceImages.objects.all()
    serializer_class = EvidenceImagesSerializer
    permission_classes = [ReadOnly | AdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['public_id']
    search_fields = ['image_url', 'public_id']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Listado de imágenes de evidencia",
        description="Obtén todas las imágenes de evidencia almacenadas en el sistema.",
        tags=["Imágenes de evidencia"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {
                        "id": 1,
                        "image_url": "https://cloudinary.com/image.jpg",
                        "public_id": "evidence/image123",
                        "created_at": "2025-10-22T10:00:00Z"
                    }
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear imagen de evidencia",
        description="Registra una nueva imagen de evidencia en el sistema.",
        request=EvidenceImagesSerializer,
        responses={201: EvidenceImagesSerializer},
        tags=["Imágenes de evidencia"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener imagen de evidencia",
        description="Obtén detalles de una imagen de evidencia específica.",
        responses={200: EvidenceImagesSerializer},
        tags=["Imágenes de evidencia"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar imagen de evidencia",
        description="Actualiza la información de una imagen de evidencia.",
        request=EvidenceImagesSerializer,
        responses={200: EvidenceImagesSerializer},
        tags=["Imágenes de evidencia"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar parcialmente imagen de evidencia",
        description="Actualiza parcialmente la información de una imagen de evidencia.",
        request=EvidenceImagesSerializer,
        responses={200: EvidenceImagesSerializer},
        tags=["Imágenes de evidencia"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar imagen de evidencia",
        description="Elimina una imagen de evidencia del sistema.",
        responses={204: None},
        tags=["Imágenes de evidencia"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# Vista para Amazon Scraping
class AmazonScrapingView(APIView):
    """Vista para hacer scraping de productos de Amazon"""
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Obtener datos de producto o carrito de Amazon",
        description="Realiza scraping de un producto individual o carrito de Amazon para obtener datos como título, precio, imágenes, etc. Si es un carrito, retorna información de todos los productos contenidos.",
        request=AmazonScrapingRequestSerializer,
        responses={
            200: AmazonScrapingResponseSerializer,
            400: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        },
        tags=["Amazon Scraping"]
    )
    def post(self, request):
        """Endpoint para hacer scraping de productos de Amazon"""
        try:
            # Validar datos de entrada
            serializer = AmazonScrapingRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {
                        'success': False,
                        'error': 'Datos de entrada inválidos',
                        'details': serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            url = serializer.validated_data['url']
            
            # Realizar scraping
            from api.utils.amazon_scraper import amazon_scraper
            result = amazon_scraper.scrape_product(url)
            
            # Validar respuesta
            response_serializer = AmazonScrapingResponseSerializer(data=result)
            if response_serializer.is_valid():
                if result['success']:
                    return Response(
                        response_serializer.validated_data,
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        response_serializer.validated_data,
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {
                        'success': False,
                        'error': 'Error al procesar la respuesta del scraping'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': f'Error inesperado: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateAdminUserView(APIView):
    """Vista para crear usuarios administrativos con clave secreta"""
    
    permission_classes = []  # No requiere autenticación, pero validará clave secreta
    
    @extend_schema(
        summary="Crear usuario administrativo",
        description="Crea un usuario con rol de administrador. Requiere una clave secreta para la validación. Devuelve las credenciales del usuario creado.",
        request=OpenApiTypes.OBJECT,
        responses={
            201: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        },
        tags=["Administración"]
    )
    def post(self, request):
        """Crear un usuario administrativo con clave secreta"""
        try:
            from django.conf import settings
            
            # Validar que se proporcione la clave secreta
            secret_key = request.data.get('secret_key')
            if not secret_key:
                return Response(
                    {
                        'success': False,
                        'error': 'La clave secreta es requerida'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar la clave secreta
            admin_secret_key = getattr(settings, 'ADMIN_CREATION_SECRET_KEY', None)
            if not admin_secret_key:
                return Response(
                    {
                        'success': False,
                        'error': 'La funcionalidad de creación de administradores no está configurada'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if secret_key != admin_secret_key:
                return Response(
                    {
                        'success': False,
                        'error': 'Clave secreta incorrecta'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar datos requeridos
            required_fields = ['name', 'last_name', 'phone_number', 'home_address']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {
                            'success': False,
                            'error': f'El campo {field} es requerido'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Verificar que el número de teléfono no esté en uso
            phone_number = request.data.get('phone_number')
            if User.objects.filter(phone_number=phone_number).exists():
                return Response(
                    {
                        'success': False,
                        'error': 'Ya existe un usuario con ese número de teléfono'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar email si se proporciona
            email = request.data.get('email')
            if email and User.objects.filter(email=email).exists():
                return Response(
                    {
                        'success': False,
                        'error': 'Ya existe un usuario con ese email'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar contraseña si no se proporciona
            password = request.data.get('password')
            if not password:
                password = get_random_string(length=12)
            
            # Crear el usuario administrativo
            admin_user = User.objects.create_user(
                phone_number=phone_number,
                password=password,
                name=request.data.get('name'),
                last_name=request.data.get('last_name'),
                email=email or '',
                home_address=request.data.get('home_address'),
                role='admin',
                is_staff=True,
                is_active=True,
                is_verified=True,
                is_superuser=True  # Dar permisos de superusuario
            )
            
            # Preparar respuesta con credenciales
            response_data = {
                'success': True,
                'message': 'Usuario administrador creado exitosamente',
                'admin_user': {
                    'id': admin_user.id,
                    'name': admin_user.name,
                    'last_name': admin_user.last_name,
                    'email': admin_user.email,
                    'phone_number': admin_user.phone_number,
                    'home_address': admin_user.home_address,
                    'role': admin_user.role,
                    'is_staff': admin_user.is_staff,
                    'is_active': admin_user.is_active,
                    'is_verified': admin_user.is_verified,
                    'password': password  # Solo devolver la contraseña generada
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': f'Error inesperado al crear usuario administrador: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CurrentUserView(APIView):
    """
    Vista para obtener y actualizar información del usuario actual basado en el token de autenticación.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Obtener perfil del usuario actual",
        description="Obtiene la información completa del usuario autenticado actual incluyendo fecha de registro.",
        responses={200: UserProfileSerializer},
        tags=["Usuario Actual"]
    )
    def get(self, request):
        """Obtener información del usuario actual"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="Actualizar perfil del usuario actual",
        description="Actualiza información del usuario autenticado actual. Solo puede actualizar sus propios datos.",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        tags=["Usuario Actual"]
    )
    def patch(self, request):
        """Actualizar información del usuario actual"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Guardar los cambios
            serializer.save()
            
            # Devolver datos actualizados
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Datos inválidos',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


from django.utils import timezone
from datetime import timedelta


class DashboardMetricsView(APIView):
    permission_classes = [AdminPermission]

    @extend_schema(
        summary="Obtener métricas del dashboard",
        description="Devuelve métricas agregadas para el panel de administración",
        responses={200: serializers.Serializer},
        tags=["Dashboard"]
    )
    def get(self, request):
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        last_month_start = (month_ago.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_month_end = month_ago.replace(day=1) - timedelta(days=1)

        # Usuarios
        users_total = User.objects.count()
        users_active = User.objects.filter(is_active=True).count()
        users_verified = User.objects.filter(is_verified=True).count()
        users_agents = User.objects.filter(role='agent').count()

        # Productos
        products_total = Product.objects.count()
        products_in_stock = Product.objects.filter(amount_purchased__gt=0).count()
        products_out_of_stock = Product.objects.filter(amount_purchased=0).count()
        products_pending_delivery = Product.objects.filter(amount_delivered__lt=F('amount_purchased')).count()
        
        # Productos por categoría
        products_by_category = Product.objects.values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]  # Top 10 categorías

        # Órdenes
        orders_total = Order.objects.count()
        orders_pending = Order.objects.filter(status__in=['ENCARGADO', 'COMPRADO']).count()
        orders_completed = Order.objects.filter(status='ENTREGADO').count()
        orders_today = Order.objects.filter(created_at__date=today).count()
        orders_this_week = Order.objects.filter(created_at__date__gte=week_ago).count()
        orders_this_month = Order.objects.filter(created_at__date__gte=month_ago).count()

        # Revenue - asumiendo de órdenes con pay_status 'PAGADO'
        revenue_total = Order.objects.filter(pay_status='PAGADO').aggregate(total=Sum('products__total_cost'))['total'] or 0
        revenue_today = Order.objects.filter(pay_status='PAGADO', created_at__date=today).aggregate(total=Sum('products__total_cost'))['total'] or 0
        revenue_this_week = Order.objects.filter(pay_status='PAGADO', created_at__date__gte=week_ago).aggregate(total=Sum('products__total_cost'))['total'] or 0
        revenue_this_month = Order.objects.filter(pay_status='PAGADO', created_at__date__gte=month_ago).aggregate(total=Sum('products__total_cost'))['total'] or 0
        revenue_last_month = Order.objects.filter(pay_status='PAGADO', created_at__date__range=(last_month_start, last_month_end)).aggregate(total=Sum('products__total_cost'))['total'] or 0

        # Compras (ProductBuyed)
        purchases_total = ProductBuyed.objects.count()
        purchases_today = ProductBuyed.objects.filter(buy_date__date=today).count()
        purchases_this_week = ProductBuyed.objects.filter(buy_date__date__gte=week_ago).count()
        purchases_this_month = ProductBuyed.objects.filter(buy_date__date__gte=month_ago).count()

        # Paquetes (Package)
        packages_total = Package.objects.count()
        packages_sent = Package.objects.filter(status_of_processing='Enviado').count()
        packages_in_transit = Package.objects.filter(status_of_processing='Recibido').count()
        packages_delivered = Package.objects.filter(status_of_processing='Procesado').count()
        # Como no hay estado de "retrasado" en el enum, usaremos 0
        packages_delayed = 0

        # Entregas (ProductDelivery)
        deliveries_total = ProductDelivery.objects.count()
        deliveries_today = ProductDelivery.objects.filter(created_at__date=today).count()
        deliveries_this_week = ProductDelivery.objects.filter(created_at__date__gte=week_ago).count()
        # Entregas pendientes: productos con amount_delivered < amount_purchased
        deliveries_pending = Product.objects.filter(
            amount_delivered__lt=F('amount_purchased'),
            amount_purchased__gt=0
        ).count()

        metrics = {
            'users': {
                'total': users_total,
                'active': users_active,
                'verified': users_verified,
                'agents': users_agents
            },
            'products': {
                'total': products_total,
                'in_stock': products_in_stock,
                'out_of_stock': products_out_of_stock,
                'pending_delivery': products_pending_delivery,
                'by_category': [
                    {
                        'category': item['category__name'] or 'Sin categoría',
                        'count': item['count']
                    }
                    for item in products_by_category
                ]
            },
            'orders': {
                'total': orders_total,
                'pending': orders_pending,
                'completed': orders_completed,
                'today': orders_today,
                'this_week': orders_this_week,
                'this_month': orders_this_month
            },
            'revenue': {
                'total': revenue_total,
                'today': revenue_today,
                'this_week': revenue_this_week,
                'this_month': revenue_this_month,
                'last_month': revenue_last_month
            },
            'purchases': {
                'total': purchases_total,
                'today': purchases_today,
                'this_week': purchases_this_week,
                'this_month': purchases_this_month
            },
            'packages': {
                'total': packages_total,
                'sent': packages_sent,
                'in_transit': packages_in_transit,
                'delivered': packages_delivered,
                'delayed': packages_delayed
            },
            'deliveries': {
                'total': deliveries_total,
                'today': deliveries_today,
                'this_week': deliveries_this_week,
                'pending': deliveries_pending
            }
        }

        return Response({
            'success': True,
            'data': metrics,
            'message': 'Métricas del dashboard obtenidas exitosamente'
        })


class ProfitReportsView(APIView):
    permission_classes = [AdminPermission]

    @extend_schema(
        summary="Obtener reportes de ganancias",
        description="Devuelve reportes de ganancias mensuales del sistema y por agente",
        responses={200: serializers.Serializer},
        tags=["Reports"]
    )
    def get(self, request):
        # Obtener el rango de fechas (últimos 12 meses)
        now = timezone.now()
        current_date = now.date()
        
        # Calcular ganancias mensuales para los últimos 12 meses
        monthly_reports = []
        for i in range(11, -1, -1):  # De 11 meses atrás hasta el mes actual
            # Calcular el primer y último día del mes
            if i == 0:
                month_start = current_date.replace(day=1)
                month_end = current_date
            else:
                target_date = current_date - timedelta(days=30 * i)
                month_start = target_date.replace(day=1)
                # Calcular el último día del mes
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
            
            # Calcular ingresos del mes (sum de total_cost de productos en órdenes pagadas)
            revenue = Order.objects.filter(
                pay_status='PAGADO',
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).aggregate(total=Sum('products__total_cost'))['total'] or 0
            
            # Calcular costos reales del mes (sum de real_cost_of_product de productos comprados)
            product_costs = ProductBuyed.objects.filter(
                buy_date__gte=month_start,
                buy_date__lte=month_end
            ).aggregate(total=Sum('real_cost_of_product'))['total'] or 0
            
            # Calcular costos de entrega del mes (sum de weight_cost de deliveries)
            delivery_costs = DeliverReceip.objects.filter(
                deliver_date__gte=month_start,
                deliver_date__lte=month_end
            ).aggregate(total=Sum('weight_cost'))['total'] or 0
            
            # Calcular ganancias de agentes del mes (sum de manager_profit de entregas)
            agent_profits = DeliverReceip.objects.filter(
                deliver_date__gte=month_start,
                deliver_date__lte=month_end
            ).aggregate(total=Sum('manager_profit'))['total'] or 0
            
            # Total de costos = costos de productos + costos de entrega
            costs = product_costs + delivery_costs
            
            # Ganancia proyectada del sistema = ingresos - costos - ganancias de agentes
            system_profit = revenue - costs - agent_profits
            
            monthly_reports.append({
                'month': month_start.strftime('%B %Y'),
                'month_short': month_start.strftime('%b'),
                'revenue': float(revenue),
                'costs': float(costs),
                'product_costs': float(product_costs),
                'delivery_costs': float(delivery_costs),
                'agent_profits': float(agent_profits),
                'system_profit': float(system_profit),
                'projected_profit': float(system_profit)  # Para compatibilidad con el frontend
            })
        
        # Calcular ganancias por agente (totales)
        agents = User.objects.filter(role='agent', is_active=True)
        agent_reports = []
        
        for agent in agents:
            # Total de ganancias del agente (basado en deliveries de sus clientes asignados)
            total_profit = DeliverReceip.objects.filter(
                client__assigned_agent=agent
            ).aggregate(total=Sum('manager_profit'))['total'] or 0
            
            # Ganancias del mes actual
            month_start = current_date.replace(day=1)
            current_month_profit = DeliverReceip.objects.filter(
                client__assigned_agent=agent,
                deliver_date__gte=month_start,
                deliver_date__lte=current_date
            ).aggregate(total=Sum('manager_profit'))['total'] or 0
            
            # Número de clientes asignados
            # Cuenta clientes únicos que tienen órdenes con este agente como sales_manager
            # o que tienen el agente explícitamente asignado
            clients_with_assigned_agent = User.objects.filter(
                assigned_agent=agent, 
                role='client'
            ).values_list('id', flat=True)
            
            clients_with_orders = Order.objects.filter(
                sales_manager=agent
            ).values_list('client_id', flat=True).distinct()
            
            # Combinar ambos conjuntos y eliminar duplicados
            all_client_ids = set(clients_with_assigned_agent) | set(clients_with_orders)
            clients_count = len(all_client_ids)
            
            # Número de órdenes gestionadas
            orders_count = Order.objects.filter(sales_manager=agent).count()
            
            # Órdenes completadas
            orders_completed = Order.objects.filter(
                sales_manager=agent,
                status='ENTREGADO'
            ).count()
            
            agent_reports.append({
                'agent_id': agent.id,
                'agent_name': agent.full_name,
                'agent_phone': agent.phone_number,
                'total_profit': float(total_profit),
                'current_month_profit': float(current_month_profit),
                'clients_count': clients_count,
                'orders_count': orders_count,
                'orders_completed': orders_completed
            })
        
        # Ordenar agentes por ganancia total (mayor a menor)
        agent_reports.sort(key=lambda x: x['total_profit'], reverse=True)
        
        # Calcular totales generales
        total_revenue = sum(report['revenue'] for report in monthly_reports)
        total_costs = sum(report['costs'] for report in monthly_reports)
        total_product_costs = sum(report['product_costs'] for report in monthly_reports)
        total_delivery_costs = sum(report['delivery_costs'] for report in monthly_reports)
        total_agent_profits = sum(report['agent_profits'] for report in monthly_reports)
        total_system_profit = sum(report['system_profit'] for report in monthly_reports)
        
        return Response({
            'success': True,
            'data': {
                'monthly_reports': monthly_reports,
                'agent_reports': agent_reports,
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_costs': float(total_costs),
                    'total_product_costs': float(total_product_costs),
                    'total_delivery_costs': float(total_delivery_costs),
                    'total_agent_profits': float(total_agent_profits),
                    'total_system_profit': float(total_system_profit),
                    'profit_margin': float((total_system_profit / total_revenue * 100) if total_revenue > 0 else 0)
                }
            },
            'message': 'Reportes de ganancias obtenidos exitosamente'
        })
