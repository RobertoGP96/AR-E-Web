from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count
from api.models import Package, DeliverReceip
from api.serializers import (
    PackageSerializer, DeliverReceipSerializer
)
from api.permissions.permissions import ReadOnly, AdminPermission, LogisticalPermission


class PackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de paquetes.
    """
    queryset = Package.objects.all().order_by('-created_at')
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Package.objects.all().order_by('-created_at')
        user = self.request.user

        if user.role == 'logistical':
            queryset = queryset.filter(delivery__logistical=user)
        elif user.role == 'client':
            queryset = queryset.filter(delivery__order__client=user)

        return queryset

    @extend_schema(
        summary="Listar paquetes",
        description="Obtiene una lista de paquetes.",
        tags=["Paquetes"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear paquete",
        description="Crea un nuevo paquete.",
        tags=["Paquetes"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener paquete",
        description="Obtiene los detalles de un paquete específico.",
        tags=["Paquetes"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar paquete",
        description="Actualiza completamente un paquete.",
        tags=["Paquetes"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar paquete parcialmente",
        description="Actualiza parcialmente un paquete.",
        tags=["Paquetes"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar paquete",
        description="Elimina un paquete.",
        tags=["Paquetes"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class DeliverReceipViewSet(viewsets.ModelViewSet):
    """
    ViewSet para recibos de entrega.
    """
    queryset = DeliverReceip.objects.all().order_by('-created_at')
    serializer_class = DeliverReceipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = DeliverReceip.objects.all().order_by('-created_at')
        user = self.request.user

        if user.role == 'logistical':
            queryset = queryset.filter(delivery__logistical=user)
        elif user.role == 'client':
            queryset = queryset.filter(delivery__order__client=user)

        return queryset

    @extend_schema(
        summary="Listar recibos de entrega",
        description="Obtiene una lista de recibos de entrega.",
        tags=["Recibos de Entrega"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear recibo de entrega",
        description="Crea un nuevo recibo de entrega.",
        tags=["Recibos de Entrega"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener recibo de entrega",
        description="Obtiene los detalles de un recibo de entrega específico.",
        tags=["Recibos de Entrega"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar recibo de entrega",
        description="Actualiza completamente un recibo de entrega.",
        tags=["Recibos de Entrega"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar recibo de entrega parcialmente",
        description="Actualiza parcialmente un recibo de entrega.",
        tags=["Recibos de Entrega"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar recibo de entrega",
        description="Elimina un recibo de entrega.",
        tags=["Recibos de Entrega"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)