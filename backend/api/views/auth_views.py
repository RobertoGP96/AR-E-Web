from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from api.serializers import PasswordRecoverSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


# Serializer para recuperación de contraseña
class PasswordRecoverSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=False)
    password_secret = serializers.CharField(required=False)


# Auth JWT
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