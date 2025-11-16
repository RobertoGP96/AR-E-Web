from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from api.models import Invoice, Tag
from api.serializers import InvoiceSerializer, TagSerializer, InvoiceCreateSerializer
from api.permissions.permissions import ReadOnly, AdminPermission


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tags.
    """
    queryset = Tag.objects.all().order_by('-created_at')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    @extend_schema(
        summary="Listar tags",
        description="Obtiene una lista de todos los tags.",
        tags=["Tags"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear tag",
        description="Crea un nuevo tag.",
        tags=["Tags"]
    )
    def create(self, request, *args, **kwargs):
        # Use InvoiceCreateSerializer to validate and save (handles nested tags),
        # but return the created invoice using InvoiceSerializer so the response
        # includes related tags.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()
        # Return the invoice serialized with InvoiceSerializer to include tags
        output_serializer = InvoiceSerializer(invoice, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Obtener tag",
        description="Obtiene los detalles de un tag específico.",
        tags=["Tags"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar tag",
        description="Actualiza completamente un tag.",
        tags=["Tags"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar tag parcialmente",
        description="Actualiza parcialmente un tag.",
        tags=["Tags"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar tag",
        description="Elimina un tag.",
        tags=["Tags"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de invoices.
    """
    queryset = Invoice.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    @extend_schema(
        summary="Listar invoices",
        description="Obtiene una lista de todos los invoices.",
        tags=["Invoices"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear invoice",
        description="Crea un nuevo invoice. Puede incluir tags en la misma petición.",
        tags=["Invoices"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener invoice",
        description="Obtiene los detalles de un invoice específico.",
        tags=["Invoices"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar invoice",
        description="Actualiza completamente un invoice.",
        tags=["Invoices"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar invoice parcialmente",
        description="Actualiza parcialmente un invoice.",
        tags=["Invoices"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar invoice",
        description="Elimina un invoice.",
        tags=["Invoices"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    @extend_schema(
        summary="Obtener tags de invoice",
        description="Obtiene todas las tags asociadas a un invoice específico.",
        tags=["Invoices"]
    )
    def tags(self, request, pk=None):
        """
        Endpoint para obtener las tags de un invoice específico.
        """
        invoice = self.get_object()
        tags = invoice.tag_set.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)