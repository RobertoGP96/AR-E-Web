from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta
from api.models import Order
from api.serializers import OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer
from api.permissions.permissions import ReadOnly, AdminPermission, AgentPermission, BuyerPermission, LogisticalPermission


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de órdenes.
    """
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer

    def get_queryset(self):
        queryset = Order.objects.all().order_by('-created_at')
        user = self.request.user

        # Filtros por rol
        if user.role == 'agent':
            queryset = queryset.filter(agent=user)
        elif user.role == 'buyer':
            queryset = queryset.filter(buyer=user)
        elif user.role == 'logistical':
            queryset = queryset.filter(logistical=user)
        elif user.role == 'client':
            queryset = queryset.filter(client=user)

        # Filtros adicionales
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset

    @extend_schema(
        summary="Listar órdenes",
        description="Obtiene una lista de órdenes con filtros opcionales.",
        tags=["Órdenes"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear orden",
        description="Crea una nueva orden.",
        request=OrderCreateSerializer,
        tags=["Órdenes"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener orden",
        description="Obtiene los detalles de una orden específica.",
        tags=["Órdenes"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar orden",
        description="Actualiza completamente una orden.",
        request=OrderUpdateSerializer,
        tags=["Órdenes"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar orden parcialmente",
        description="Actualiza parcialmente una orden.",
        request=OrderUpdateSerializer,
        tags=["Órdenes"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar orden",
        description="Elimina una orden.",
        tags=["Órdenes"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Estadísticas de órdenes",
        description="Obtiene estadísticas de órdenes por estado.",
        tags=["Órdenes"]
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        user = request.user
        queryset = self.get_queryset()

        stats = queryset.aggregate(
            total_orders=Count('id'),
            pending_orders=Count('id', filter=Q(status='pending')),
            completed_orders=Count('id', filter=Q(status='completed')),
            cancelled_orders=Count('id', filter=Q(status='cancelled')),
            total_amount=Sum('total_amount')
        )

        return Response(stats)

    @extend_schema(
        summary="Cambiar estado de orden",
        description="Cambia el estado de una orden específica.",
        tags=["Órdenes"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
            return Response(
                {"error": "Estado inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar permisos por rol
        user = request.user
        if user.role == 'agent' and order.agent != user:
            return Response(
                {"error": "No tienes permiso para cambiar esta orden"},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'buyer' and order.buyer != user:
            return Response(
                {"error": "No tienes permiso para cambiar esta orden"},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'logistical' and order.logistical != user:
            return Response(
                {"error": "No tienes permiso para cambiar esta orden"},
                status=status.HTTP_403_FORBIDDEN
            )

        order.status = new_status
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @extend_schema(
        summary="Asignar orden",
        description="Asigna una orden a un usuario específico.",
        tags=["Órdenes"]
    )
    @action(detail=True, methods=['post'], permission_classes=[AdminPermission])
    def assign(self, request, pk=None):
        order = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        if role == 'agent':
            order.agent = user
        elif role == 'buyer':
            order.buyer = user
        elif role == 'logistical':
            order.logistical = user
        else:
            return Response(
                {"error": "Rol inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)