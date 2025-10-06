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
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from api.permissions.permissions import (
    ReadOnly,
    ReadOnlyorPost,
    AccountantPermission,
    AdminPermission,
    AgentPermission,
    BuyerPermission,
    LogisticalPermission,
)
from api.serializers import (
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
    AmazonScrapingRequestSerializer,
    AmazonScrapingResponseSerializer,
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
    Package,
    DeliverReceip,
    EvidenceImages,
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

from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    summary="Login con número de teléfono",
    description="Obtiene el par de tokens JWT usando el número de teléfono y contraseña.",
    request=PhoneTokenObtainPairSerializer,
    responses={200: OpenApiTypes.OBJECT},
    tags=["Autenticación"],
    examples=[
        OpenApiExample(
            "Ejemplo login",
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
    "Obtención de token JWT para autenticación de usuarios por número de teléfono."
    serializer_class = PhoneTokenObtainPairSerializer


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
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly | ReadOnlyorPost]

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
    parameters=[
        {
            'name': 'verification_secret',
            'required': True,
            'type': 'string',
            'location': 'path',
            'schema': {'type': 'string'}
        }
    ],
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
    """
    queryset = Order.objects.all().prefetch_related("delivery_receipts", "products")
    serializer_class = OrderSerializer
    permission_classes = [AgentPermission & (IsAuthenticated | ReadOnlyorPost)]

    @extend_schema(
        summary="Crear orden",
        description="Crea una nueva orden y la asocia al usuario actual.",
        responses={201: OrderSerializer},
        tags=["Órdenes"]
    )
    def perform_create(self, serializer):
        user = User.objects.get(id=self.request.user.id)
        return serializer.save(sales_manager=user)

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
    """
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [ReadOnly | AdminPermission]
    lookup_field = "name"

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
    """
    queryset = BuyingAccounts.objects.all()
    serializer_class = BuyingAccountsSerializer
    permission_classes = [ReadOnly | AdminPermission]


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
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [ReadOnly | AgentPermission]


class ShoppingReceipViewSet(viewsets.ModelViewSet):
    """
    Gestión de recibos de compra y productos comprados.
    """
    queryset = ShoppingReceip.objects.all()
    serializer_class = ShoppingReceipSerializer
    permission_classes = [ReadOnly | BuyerPermission]

    @extend_schema(
        summary="Crear recibo de compra",
        description="Crea un recibo de compra y los productos asociados.",
        responses={201: ShoppingReceipSerializer},
        tags=["Recibos de compra"]
    )
    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            if "shopping_account" in request.data and "shop_of_buy" in request.data:
                serializer = ShoppingReceipSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                try:
                    if "buyed_products" in request.data:
                        for product in request.data["buyed_products"]:
                            product["shoping_receip"] = serializer.data["id"]
                            product_serializer = ProductBuyedSerializer(data=product)
                            product_serializer.is_valid(raise_exception=True)
                            product_serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    raise ValidationError(
                        f"Error al procesar productos: {str(e)}"
                    ) from e
            return Response(
                {"message": "Faltan datos"}, status=status.HTTP_400_BAD_REQUEST
            )


class ProductBuyedViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de productos comprados",
        description="Obtén el historial de productos adquiridos por los agentes, con detalles de compra, descuentos y costos reales.",
        tags=["Productos comprados"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"id": 1, "original_product": 1, "order": 1, "actual_cost_of_product": 1200.0, "amount_buyed": 1},
                    {"id": 2, "original_product": 2, "order": 2, "actual_cost_of_product": 25.0, "amount_buyed": 2}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de productos comprados.
    """
    queryset = ProductBuyed.objects.all()
    serializer_class = ProductBuyedSerializer
    permission_classes = [ReadOnly | AccountantPermission]


class ProductReceivedViewSet(viewsets.ModelViewSet):
    """
    Gestión de productos recibidos y entrega de productos.
    """
    queryset = ProductReceived.objects.all()
    serializer_class = ProductReceivedSerializer
    permission_classes = [ReadOnly | LogisticalPermission]

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
                    "package_where_was_send" in request.data
                ):
                    contained_products = request.data["contained_products"]
                    for product in contained_products:
                        product["package_where_was_send"] = request.data[
                            "package_where_was_send"
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
                    and not "package_where_was_send" in request.data
                ):
                    delivered_products = request.data["delivered_products"]
                    for product in delivered_products:

                        instance = ProductReceived.objects.get(id=product["id"])
                        product["deliver_receip"] = request.data["deliver_receip"]
                        product_serializer = ProductReceivedSerializer(
                            instance, data=product, partial=True
                        )
                        product_serializer.is_valid(raise_exception=True)
                        product_serializer.save()
                        print(product_serializer.data)
                    return Response(
                        {"Message": "Product Creation success"},
                        status=status.HTTP_201_CREATED,
                    )
                raise ValidationError("Argumentos incompletos o incorrectos")
            except Exception as e:
                raise ValidationError(f"Error al procesar productos: {str(e)}") from e


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
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [ReadOnly | LogisticalPermission]


class DeliverReceipViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary="Listado de recibos de entrega",
        description="Obtén todos los recibos de entrega generados, con información de productos entregados, fechas y estado.",
        tags=["Recibos de entrega"],
        examples=[
            OpenApiExample(
                "Ejemplo de respuesta",
                value=[
                    {"id": 1, "order": 1, "deliver_date": "2025-08-21", "status": "Entregado"},
                    {"id": 2, "order": 2, "deliver_date": "2025-08-20", "status": "Pendiente"}
                ],
                response_only=True
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    """
    Gestión de recibos de entrega.
    """
    queryset = DeliverReceip.objects.all()
    serializer_class = DeliverReceipSerializer
    permission_classes = [ReadOnly | LogisticalPermission]


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
            400: "Error de validación",
            500: "Error interno del servidor"
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
        request={
            'type': 'object',
            'properties': {
                'secret_key': {
                    'type': 'string',
                    'description': 'Clave secreta para crear administradores'
                },
                'name': {
                    'type': 'string',
                    'description': 'Nombre del administrador'
                },
                'last_name': {
                    'type': 'string', 
                    'description': 'Apellido del administrador'
                },
                'email': {
                    'type': 'string',
                    'format': 'email',
                    'description': 'Email del administrador (opcional)'
                },
                'phone_number': {
                    'type': 'string',
                    'description': 'Número de teléfono del administrador'
                },
                'home_address': {
                    'type': 'string',
                    'description': 'Dirección del administrador'
                },
                'password': {
                    'type': 'string',
                    'description': 'Contraseña del administrador (opcional, se genera automáticamente si no se proporciona)'
                }
            },
            'required': ['secret_key', 'name', 'last_name', 'phone_number', 'home_address']
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'admin_user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'integer'},
                            'name': {'type': 'string'},
                            'last_name': {'type': 'string'},
                            'email': {'type': 'string'},
                            'phone_number': {'type': 'string'},
                            'role': {'type': 'string'},
                            'is_staff': {'type': 'boolean'},
                            'is_active': {'type': 'boolean'},
                            'password': {'type': 'string', 'description': 'Solo se devuelve la contraseña generada'}
                        }
                    }
                }
            },
            400: "Error de validación o clave secreta incorrecta",
            500: "Error interno del servidor"
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
