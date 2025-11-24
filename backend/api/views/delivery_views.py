from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count
from api.models import Package, DeliverReceip
from api.serializers import (
    PackageSerializer, DeliverReceipSerializer,
    ProductReceivedSerializer, ProductDeliverySerializer,
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

    @extend_schema(
        summary="Agregar productos al paquete",
        description="Agrega múltiples productos recibidos a un paquete (bulk).",
        tags=["Paquetes"]
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="add_products")
    def add_products(self, request, pk=None):
        """Agregar múltiples productos recibidos al paquete identificado por `pk`.
        Se espera un payload: { "products": [{"original_product_id": <uuid>, "amount_received": <int>, "observation": "..."}, ...] }
        """
        package = self.get_object()
        products = request.data.get("products", [])
        if not isinstance(products, list):
            return Response({"error": "Expected a list of products under 'products' key."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for item in products:
            data = {
                "original_product_id": item.get("original_product_id") or item.get("original_product"),
                "amount_received": item.get("amount_received"),
                "observation": item.get("observation", ""),
                "package_id": package.id,
            }
            serializer = ProductReceivedSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            created_obj = serializer.save()
            created.append(ProductReceivedSerializer(created_obj).data)

        return Response({"created": created}, status=status.HTTP_201_CREATED)


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

    @extend_schema(
        summary="Agregar productos al recibo de entrega",
        description="Agrega múltiples productos entregados a un recibo de entrega (bulk).",
        tags=["Recibos de Entrega"]
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="add_products")
    def add_products(self, request, pk=None):
        """Agregar múltiples product deliveries a un `deliver_receip`.
        Body: { "products": [{"original_product_id": <uuid>, "amount_delivered": <int>}, ...] }
        """
        deliver_receip = self.get_object()
        products = request.data.get("products", [])
        if not isinstance(products, list):
            return Response({"error": "Expected a list of products under 'products' key."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for item in products:
            data = {
                "original_product_id": item.get("original_product_id") or item.get("original_product"),
                "amount_delivered": item.get("amount_delivered"),
                "deliver_receip_id": deliver_receip.id,
            }
            serializer = ProductDeliverySerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            created_obj = serializer.save()
            created.append(ProductDeliverySerializer(created_obj).data)

        return Response({"created": created}, status=status.HTTP_201_CREATED)