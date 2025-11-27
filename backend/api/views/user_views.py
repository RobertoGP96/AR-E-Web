from rest_framework import viewsets, status, views
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.contrib.auth import get_user_model
from api.models import CustomUser
from api.serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from api.permissions.permissions import ReadOnly, AdminPermission, AgentPermission, BuyerPermission, LogisticalPermission


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]
    # Habilitar filtros y búsqueda para que los query params funcionen desde el frontend
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'name', 'last_name', 'phone_number']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @extend_schema(
        summary="Listar usuarios",
        description="Obtiene una lista de todos los usuarios.",
        responses={200: UserSerializer(many=True)},
        tags=["Usuarios"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear usuario",
        description="Crea un nuevo usuario.",
        request=UserCreateSerializer,
        responses={201: UserSerializer},
        tags=["Usuarios"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener usuario",
        description="Obtiene los detalles de un usuario específico.",
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar usuario",
        description="Actualiza completamente un usuario.",
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar usuario parcialmente",
        description="Actualiza parcialmente un usuario.",
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar usuario",
        description="Elimina un usuario.",
        responses={204: None},
        tags=["Usuarios"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Perfil del usuario actual",
        description="Obtiene el perfil del usuario autenticado.",
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        summary="Actualizar perfil",
        description="Actualiza el perfil del usuario autenticado.",
        request=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    @action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Cambiar contraseña",
        description="Cambia la contraseña del usuario autenticado.",
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
        tags=["Usuarios"],
        examples=[
            OpenApiExample(
                "Cambiar contraseña",
                value={
                    "old_password": "oldpassword123",
                    "new_password": "newpassword123"
                },
                request_only=True
            )
        ]
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response(
                {"error": "Contraseña actual incorrecta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({"message": "Contraseña cambiada exitosamente"})

    @extend_schema(
        summary="Estadísticas de usuarios",
        description="Obtiene estadísticas generales de usuarios.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Usuarios"]
    )
    @action(detail=False, methods=['get'], permission_classes=[AdminPermission])
    def stats(self, request):
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        staff_users = CustomUser.objects.filter(is_staff=True).count()

        return Response({
            "total_users": total_users,
            "active_users": active_users,
            "staff_users": staff_users
        })


class CurrentUserView(views.APIView):
    """
    Vista para obtener el usuario actual.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Usuario actual",
        description="Obtiene la información del usuario autenticado.",
        responses={200: UserSerializer},
        tags=["Usuarios"]
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)