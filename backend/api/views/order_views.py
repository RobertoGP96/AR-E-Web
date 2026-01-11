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

        # Filtros por rol - aplicar restricción de seguridad
        if user.role == 'agent':
            # Los agentes solo ven sus órdenes asignadas
            queryset = queryset.filter(sales_manager=user)
        elif user.role == 'client':
            # Los clientes solo ven sus propias órdenes
            queryset = queryset.filter(client=user)
        # Los admins ven todas (solo aplican otros filtros)

        # Filtros adicionales - solo aplicados si no violarían la restricción de seguridad
        # estado
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # pago
        pay_status_filter = self.request.query_params.get('pay_status') or self.request.query_params.get('pay_status')
        if pay_status_filter:
            queryset = queryset.filter(pay_status=pay_status_filter)

        # cliente - solo aplicar si el usuario es admin o agent
        if user.role != 'client':
            client_id = self.request.query_params.get('client') or self.request.query_params.get('client_id')
            if client_id:
                try:
                    client_id_int = int(client_id)
                    queryset = queryset.filter(client__id=client_id_int)
                except ValueError:
                    pass

        # sales_manager - solo aplicar si el usuario es admin
        if user.role == 'admin':
            sales_manager_id = self.request.query_params.get('sales_manager') or self.request.query_params.get('sales_manager_id')
            if sales_manager_id:
                try:
                    sales_manager_id_int = int(sales_manager_id)
                    queryset = queryset.filter(sales_manager__id=sales_manager_id_int)
                except ValueError:
                    pass

        # fecha - accept both date_from/date_to and created_from/created_to for compatibility
        date_from = self.request.query_params.get('date_from') or self.request.query_params.get('created_from')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to') or self.request.query_params.get('created_to')
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        # búsqueda por texto (id, cliente, email, sales_manager)
        search = self.request.query_params.get('search')
        if search:
            try:
                # intentar buscar por id numérico
                search_id = int(search)
                queryset = queryset.filter(Q(id=search_id) |
                                           Q(client__name__icontains=search) |
                                           Q(client__last_name__icontains=search) |
                                           Q(client__email__icontains=search) |
                                           Q(sales_manager__name__icontains=search) |
                                           Q(sales_manager__last_name__icontains=search))
            except ValueError:
                queryset = queryset.filter(Q(client__name__icontains=search) |
                                           Q(client__last_name__icontains=search) |
                                           Q(client__email__icontains=search) |
                                           Q(sales_manager__name__icontains=search) |
                                           Q(sales_manager__last_name__icontains=search))

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
        summary="Obtener mis órdenes",
        description="Obtiene las órdenes del usuario autenticado.",
        tags=["Órdenes"]
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_orders(self, request):
        """
        Endpoint que devuelve las órdenes del usuario autenticado.
        Los clientes verán solo sus órdenes.
        Los agentes verán las órdenes que gestionan.
        Los administradores pueden ver todas (a través del queryset filtrado).
        """
        from rest_framework.pagination import PageNumberPagination
        
        user = request.user
        queryset = self.get_queryset()

        # Paginar los resultados
        paginator = PageNumberPagination()
        paginator.page_size_query_param = 'per_page'
        paginator.page_size = 20
        
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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

        # Validar permisos por rol (solo comprobación para agents -> sales_manager)
        user = request.user
        if user.role == 'agent' and order.sales_manager != user:
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
            # Asignar agente como sales_manager en el modelo Order
            order.sales_manager = user
        elif role == 'client':
            # Permitir reasignar el cliente de la orden
            order.client = user
        else:
            return Response(
                {"error": "Rol no soportado para asignación"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)