from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Sum, Count, Avg
from api.models import Product, ProductBuyed, ProductReceived, ProductDelivery
from api.serializers import (
    ProductSerializer, ProductCreateSerializer, ProductUpdateSerializer,
    ProductBuyedSerializer, ProductReceivedSerializer, ProductDeliverySerializer,
    ProductTimelineSerializer, ProductTimelineFormattedSerializer
)
from api.permissions.permissions import ReadOnly, AdminPermission, AgentPermission, BuyerPermission


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de productos.
    """
    queryset = Product.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated, (AdminPermission | AgentPermission)]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related(
            'order',
            'order__client',
            'order__sales_manager',
            'shop',
            'category'
        ).all().order_by('-created_at')
        
        user = self.request.user

        # Filtros por rol
        if user.role == 'agent':
            # El campo real en Order es 'sales_manager'
            queryset = queryset.filter(order__sales_manager=user)
        elif user.role == 'client':
            # Los clientes están relacionados en Order vía 'client'
            queryset = queryset.filter(order__client=user)

        # Filtros adicionales
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order_id=order_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        # Filtrar por tienda si se proporciona el parámetro shop
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)

        return queryset

    @extend_schema(
        summary="Listar productos",
        description="Obtiene una lista de productos con filtros opcionales.",
        tags=["Productos"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear producto",
        description="Crea un nuevo producto.",
        request=ProductCreateSerializer,
        tags=["Productos"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener producto",
        description="Obtiene los detalles de un producto específico.",
        tags=["Productos"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar producto",
        description="Actualiza completamente un producto.",
        request=ProductUpdateSerializer,
        tags=["Productos"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar producto parcialmente",
        description="Actualiza parcialmente un producto.",
        request=ProductUpdateSerializer,
        tags=["Productos"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar producto",
        description="Elimina un producto.",
        tags=["Productos"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener timeline del producto",
        description="Obtiene los datos de la timeline del producto incluyendo buys, receiveds y delivers.",
        tags=["Productos"]
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def timeline(self, request, pk=None):
        """
        Endpoint para obtener los datos de la timeline de un producto.
        Retorna los eventos ya formateados y listos para renderizar en el frontend.
        """
        product = self.get_object()
        serializer = ProductTimelineFormattedSerializer(product)
        return Response(serializer.data)


class ProductBuyedViewSet(viewsets.ModelViewSet):
    """
    ViewSet para productos comprados.
    """
    queryset = ProductBuyed.objects.all().order_by('-created_at')
    serializer_class = ProductBuyedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProductBuyed.objects.all().order_by('-created_at')
        user = self.request.user

        # Filtrar ProductBuyed por relaciones existentes en el modelo
        if user.role == 'agent':
            queryset = queryset.filter(original_product__order__sales_manager=user)
        elif user.role == 'client':
            queryset = queryset.filter(original_product__order__client=user)

        return queryset

    @extend_schema(
        summary="Marcar como comprado",
        description="Marca un producto como comprado.",
        tags=["Productos Comprados"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_purchased(self, request, pk=None):
        product_buyed = self.get_object()
        product_buyed.status = 'purchased'
        product_buyed.save()

        serializer = self.get_serializer(product_buyed)
        return Response(serializer.data)


class ProductReceivedViewSet(viewsets.ModelViewSet):
    """
    ViewSet para productos recibidos.
    """
    queryset = ProductReceived.objects.all().order_by('-created_at')
    serializer_class = ProductReceivedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProductReceived.objects.all().order_by('-created_at')
        user = self.request.user

        # Filtrar ProductReceived por relaciones existentes
        if user.role == 'agent':
            queryset = queryset.filter(original_product__order__sales_manager=user)

        return queryset

    @extend_schema(
        summary="Marcar como recibido",
        description="Marca un producto como recibido.",
        tags=["Productos Recibidos"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_received(self, request, pk=None):
        product_received = self.get_object()
        product_received.status = 'received'
        product_received.save()

        serializer = self.get_serializer(product_received)
        return Response(serializer.data)


class ProductDeliveryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para entregas de productos.
    """
    queryset = ProductDelivery.objects.all().order_by('-created_at')
    serializer_class = ProductDeliverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProductDelivery.objects.all().order_by('-created_at')
        user = self.request.user

        # Filtrar ProductDelivery por relaciones existentes
        if user.role == 'client':
            queryset = queryset.filter(original_product__order__client=user)
        elif user.role == 'agent':
            queryset = queryset.filter(original_product__order__sales_manager=user)

        return queryset

    @extend_schema(
        summary="Marcar como entregado",
        description="Marca un producto como entregado.",
        tags=["Entregas"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_delivered(self, request, pk=None):
        product_delivery = self.get_object()
        product_delivery.status = 'delivered'
        product_delivery.save()

        serializer = self.get_serializer(product_delivery)
        return Response(serializer.data)