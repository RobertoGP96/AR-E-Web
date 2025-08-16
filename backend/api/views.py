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
    OrderSerializer,
    ShopSerializer,
    BuyingAccountsSerializer,
    CommonInformationSerializer,
    ProductSerializer,
    ProductBuyedSerializer,
    ProductReceivedSerializer,
    PackageSerializer,
    DeliverReceipSerializer,
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


class MyTokenObtainPairView(TokenObtainPairView):
    "Obtención de token JWT para autenticación de usuarios."
    serializer_class = TokenObtainPairSerializer


class Protection(APIView):
    """
    Endpoint protegido que verifica la validez del token JWT.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Verifica autenticación",
        description="Devuelve 200 si el token JWT es válido.",
        responses={200: None}
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
        description="Crea un nuevo usuario y envía correo de verificación.",
        responses={201: UserSerializer}
    )
    def perform_create(self, serializer):
        try:
            verify_secret = get_random_string(length=32)
            send_email(
                self.request.data["name"], self.request.data["email"], verify_secret
            )
        except Exception as e:
            raise ValidationError({"error": str(e)}) from e
        return serializer.save(
            verification_secret=verify_secret,
            sent_verification_email=True,
        )


class PasswordRecoverList(APIView):
    """
    Recuperación y cambio de contraseña de usuario.
    """
    serializer_class = PasswordRecoverSerializer
    @extend_schema(
        summary="Solicitar recuperación de contraseña",
        description="Envía un correo con el enlace para recuperar la contraseña.",
        responses={200: None}
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
        responses={200: None}
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
    responses={200: None}
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
        responses={201: OrderSerializer}
    )
    def perform_create(self, serializer):
        user = User.objects.get(id=self.request.user.id)
        return serializer.save(sales_manager=user)

    # @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])


class ShopViewSet(viewsets.ModelViewSet):
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
        responses={200: ShopSerializer}
    )
    def get_object(self):
        try:
            shop = Shop.objects.get(name=self.kwargs["name"])
        except Exception as e:
            raise ValidationError({"error": str(e)}) from e
        return shop


class BuyingAccountsViewsSet(viewsets.ModelViewSet):
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
        responses={200: CommonInformationSerializer}
    )
    def get_object(self):
        return CommonInformation.get_instance()


class ProductViewSet(viewsets.ModelViewSet):
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
        responses={201: ShoppingReceipSerializer}
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
        responses={201: ProductReceivedSerializer}
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
        responses={201: ProductReceivedSerializer}
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
    """
    Gestión de paquetes.
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [ReadOnly | LogisticalPermission]


class DeliverReceipViewSet(viewsets.ModelViewSet):
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
        responses={201: None}
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
        responses={200: None}
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
