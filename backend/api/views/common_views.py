from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from api.models import Category, CommonInformation, EvidenceImages
from api.serializers import (
    CategorySerializer, CommonInformationSerializer,
    EvidenceImagesSerializer, ImageUploadSerializer
)
from api.permissions.permissions import ReadOnly, AdminPermission
import cloudinary.uploader


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de categorías.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    @extend_schema(
        summary="Listar categorías",
        description="Obtiene una lista de todas las categorías.",
        tags=["Categorías"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear categoría",
        description="Crea una nueva categoría.",
        tags=["Categorías"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener categoría",
        description="Obtiene los detalles de una categoría específica.",
        tags=["Categorías"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar categoría",
        description="Actualiza completamente una categoría.",
        tags=["Categorías"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar categoría parcialmente",
        description="Actualiza parcialmente una categoría.",
        tags=["Categorías"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar categoría",
        description="Elimina una categoría.",
        tags=["Categorías"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class CommonInformationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para información común del sistema.
    """
    queryset = CommonInformation.objects.all()
    serializer_class = CommonInformationSerializer
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    @extend_schema(
        summary="Listar información común",
        description="Obtiene la información común del sistema.",
        tags=["Información Común"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear información común",
        description="Crea nueva información común.",
        tags=["Información Común"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener información común",
        description="Obtiene información común específica.",
        tags=["Información Común"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar información común",
        description="Actualiza completamente la información común.",
        tags=["Información Común"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar información común parcialmente",
        description="Actualiza parcialmente la información común.",
        tags=["Información Común"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar información común",
        description="Elimina información común.",
        tags=["Información Común"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class EvidenceImagesViewSet(viewsets.ModelViewSet):
    """
    ViewSet para imágenes de evidencia.
    """
    queryset = EvidenceImages.objects.all().order_by('-created_at')
    serializer_class = EvidenceImagesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = EvidenceImages.objects.all().order_by('-created_at')
        user = self.request.user

        # Filtros por rol y permisos
        if user.role == 'agent':
            queryset = queryset.filter(
                Q(order__agent=user) |
                Q(delivery__order__agent=user) |
                Q(product__order__agent=user)
            )
        elif user.role == 'buyer':
            queryset = queryset.filter(
                Q(order__buyer=user) |
                Q(product_buyed__buyer=user)
            )
        elif user.role == 'logistical':
            queryset = queryset.filter(
                Q(delivery__logistical=user) |
                Q(product_received__logistical=user) |
                Q(deliver_receip__delivery__logistical=user)
            )
        elif user.role == 'client':
            queryset = queryset.filter(
                Q(order__client=user) |
                Q(delivery__order__client=user)
            )

        return queryset

    @extend_schema(
        summary="Listar imágenes de evidencia",
        description="Obtiene una lista de imágenes de evidencia.",
        tags=["Imágenes de Evidencia"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear imagen de evidencia",
        description="Crea una nueva imagen de evidencia.",
        tags=["Imágenes de Evidencia"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener imagen de evidencia",
        description="Obtiene los detalles de una imagen de evidencia específica.",
        tags=["Imágenes de Evidencia"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar imagen de evidencia",
        description="Actualiza completamente una imagen de evidencia.",
        tags=["Imágenes de Evidencia"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar imagen de evidencia parcialmente",
        description="Actualiza parcialmente una imagen de evidencia.",
        tags=["Imágenes de Evidencia"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar imagen de evidencia",
        description="Elimina una imagen de evidencia.",
        tags=["Imágenes de Evidencia"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


@extend_schema(
    summary="Subir imagen",
    description="Sube una imagen a Cloudinary y devuelve la URL.",
    tags=["Imágenes"]
)
class ImageUploadApiView(APIView):
    """
    Vista para subir imágenes a Cloudinary.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ImageUploadSerializer(data=request.data)
        if serializer.is_valid():
            image_file = serializer.validated_data['image']

            try:
                # Subir a Cloudinary
                upload_result = cloudinary.uploader.upload(image_file)
                image_url = upload_result['secure_url']

                return Response({
                    'message': 'Imagen subida exitosamente',
                    'image_url': image_url
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({
                    'error': f'Error al subir imagen: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)