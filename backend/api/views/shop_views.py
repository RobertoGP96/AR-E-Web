from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Q, Count, Sum
from api.models import Shop, BuyingAccounts, ShoppingReceip, CustomUser
from api.serializers import ShopSerializer, ShopCreateSerializer, ShopUpdateSerializer, BuyingAccountsSerializer, ShoppingReceipSerializer
from api.permissions.permissions import ReadOnly, AdminPermission, AgentPermission


class ShopViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tiendas.
    """
    queryset = Shop.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return ShopCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ShopUpdateSerializer
        return ShopSerializer

    @extend_schema(
        summary="Listar tiendas",
        description="Obtiene una lista de todas las tiendas.",
        tags=["Tiendas"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear tienda",
        description="Crea una nueva tienda.",
        request=ShopCreateSerializer,
        tags=["Tiendas"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener tienda",
        description="Obtiene los detalles de una tienda específica.",
        tags=["Tiendas"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar tienda",
        description="Actualiza completamente una tienda.",
        request=ShopUpdateSerializer,
        tags=["Tiendas"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar tienda parcialmente",
        description="Actualiza parcialmente una tienda.",
        request=ShopUpdateSerializer,
        tags=["Tiendas"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar tienda",
        description="Elimina una tienda.",
        tags=["Tiendas"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Estadísticas de tiendas",
        description="Obtiene estadísticas de las tiendas.",
        tags=["Tiendas"]
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        total_shops = Shop.objects.count()
        active_shops = Shop.objects.filter(is_active=True).count()

        stats = Shop.objects.aggregate(
            total_products=Count('product'),
            total_orders=Count('order', distinct=True)
        )

        return Response({
            "total_shops": total_shops,
            "active_shops": active_shops,
            **stats
        })


class BuyingAccountsViewsSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de cuentas de compra.
    """
    queryset = BuyingAccounts.objects.all().order_by('-created_at')
    serializer_class = BuyingAccountsSerializer
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    def get_queryset(self):
        queryset = BuyingAccounts.objects.all().order_by('-created_at')
        user = self.request.user

        if user.role == 'agent':
            queryset = queryset.filter(assigned_agent=user)

        return queryset

    @extend_schema(
        summary="Listar cuentas de compra",
        description="Obtiene una lista de cuentas de compra.",
        tags=["Cuentas de Compra"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear cuenta de compra",
        description="Crea una nueva cuenta de compra.",
        tags=["Cuentas de Compra"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener cuenta de compra",
        description="Obtiene los detalles de una cuenta de compra específica.",
        tags=["Cuentas de Compra"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar cuenta de compra",
        description="Actualiza completamente una cuenta de compra.",
        tags=["Cuentas de Compra"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar cuenta de compra parcialmente",
        description="Actualiza parcialmente una cuenta de compra.",
        tags=["Cuentas de Compra"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar cuenta de compra",
        description="Elimina una cuenta de compra.",
        tags=["Cuentas de Compra"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        summary="Asignar agente",
        description="Asigna un agente a una cuenta de compra.",
        tags=["Cuentas de Compra"]
    )
    @action(detail=True, methods=['post'], permission_classes=[AdminPermission])
    def assign_agent(self, request, pk=None):
        buying_account = self.get_object()
        agent_id = request.data.get('agent_id')

        try:
            agent = CustomUser.objects.get(id=agent_id, role='agent')
        except User.DoesNotExist:
            return Response(
                {"error": "Agente no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        buying_account.assigned_agent = agent
        buying_account.save()

        serializer = self.get_serializer(buying_account)
        return Response(serializer.data)


class ShoppingReceipViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de recibos de compra.
    """
    queryset = ShoppingReceip.objects.all().order_by('-created_at')
    serializer_class = ShoppingReceipSerializer
    permission_classes = [IsAuthenticated, AdminPermission | ReadOnly]

    @extend_schema(
        summary="Listar recibos de compra",
        description="Obtiene una lista de recibos de compra.",
        tags=["Recibos de Compra"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Crear recibo de compra",
        description="Crea un nuevo recibo de compra.",
        tags=["Recibos de Compra"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="Obtener recibo de compra",
        description="Obtiene los detalles de un recibo de compra específico.",
        tags=["Recibos de Compra"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar recibo de compra",
        description="Actualiza completamente un recibo de compra.",
        tags=["Recibos de Compra"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar recibo de compra parcialmente",
        description="Actualiza parcialmente un recibo de compra.",
        tags=["Recibos de Compra"]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar recibo de compra",
        description="Elimina un recibo de compra.",
        tags=["Recibos de Compra"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)