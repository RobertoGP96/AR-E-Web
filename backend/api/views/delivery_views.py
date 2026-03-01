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
            queryset = queryset.filter(delivery__client=user)  # ✅ Relación directa: delivery.client

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
            queryset = queryset.filter(client=user)  # ✅ Filtrar directamente por cliente

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
        summary="Obtener mis entregas",
        description="Obtiene las entregas del usuario autenticado con paginación.",
        tags=["Recibos de Entrega"],
        parameters=[
            {
                'name': 'page',
                'in': 'query',
                'type': 'integer',
                'description': 'Número de página',
                'default': 1
            },
            {
                'name': 'per_page',
                'in': 'query',
                'type': 'integer',
                'description': 'Elementos por página',
                'default': 20
            },
            {
                'name': 'status',
                'in': 'query',
                'type': 'string',
                'description': 'Filtrar por estado de entrega'
            },
        ]
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="my-deliveries")
    def my_deliveries(self, request):
        """
        ✅ NUEVA ACCIÓN: Obtiene las entregas del cliente autenticado.
        
        Solo clientes pueden acceder a este endpoint.
        El backend valida que solo veas tus propias entregas.
        
        Query params opcionales:
        - status: Filtrar por estado (pendiente, entregado, etc)
        - page: Página (default: 1)
        - per_page: Items por página (default: 20)
        """
        user = request.user
        
        # ✅ SEGURIDAD: Solo clientes pueden ver sus entregas
        if user.role != 'client':
            return Response(
                {"error": "Solo clientes pueden ver sus entregas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ SEGURIDAD: Filtrar entregas solo del cliente autenticado
        queryset = self.get_queryset().filter(client=user).order_by('-deliver_date')
        
        # ✅ FILTRO: Status opcional
        delivery_status = request.query_params.get('status')
        if delivery_status:
            queryset = queryset.filter(status=delivery_status)
        
        # ✅ PAGINACIÓN
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 20))
        start = (page - 1) * per_page
        end = start + per_page
        
        total = queryset.count()
        deliveries = queryset[start:end]
        
        serializer = self.get_serializer(deliveries, many=True)
        
        return Response({
            'count': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
            'results': serializer.data
        })

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

    @extend_schema(
        summary="Aplicar saldo a favor como pago de una entrega",
        description=(
            "Aplica el saldo disponible del cliente (balance positivo) como pago "
            "parcial o total de la entrega. Si no se proporciona `amount`, se aplica "
            "todo el saldo disponible hasta cubrir el costo de la entrega. "
            "El balance del cliente se recalcula automáticamente."
        ),
        tags=["Recibos de Entrega"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='apply_balance')
    def apply_balance(self, request, pk=None):
        """
        Aplica el saldo a favor del cliente como pago de la entrega.

        Body (todos opcionales):
            {
                "amount": 30.00,            // Si no se envía, se usa todo el saldo disponible.
                "payment_date": "2026-02-23"
            }

        Reglas:
          - El cliente debe tener balance > 0.
          - El monto no puede superar el saldo disponible.
          - El monto no puede superar la deuda pendiente de la entrega.
          - El balance se recalcula via signal automáticamente.
        """
        delivery = self.get_object()
        client = delivery.client

        # 1. Verificar saldo disponible
        client.refresh_from_db()
        available_balance = round(float(client.balance), 2)

        if available_balance <= 0:
            return Response(
                {
                    "error": "El cliente no tiene saldo a favor disponible.",
                    "balance": available_balance,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Calcular deuda pendiente de la entrega
        pending_in_delivery = round(float(delivery.weight_cost) - float(delivery.payment_amount), 2)

        if pending_in_delivery <= 0:
            return Response(
                {
                    "error": "Esta entrega ya está completamente pagada.",
                    "payment_amount": float(delivery.payment_amount),
                    "weight_cost": float(delivery.weight_cost),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Determinar el monto a aplicar
        requested_amount = request.data.get('amount')
        if requested_amount is not None:
            try:
                requested_amount = round(float(requested_amount), 2)
            except (TypeError, ValueError):
                return Response(
                    {"error": "El campo 'amount' debe ser un número."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if requested_amount <= 0:
                return Response(
                    {"error": "El monto a aplicar debe ser mayor a 0."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if requested_amount > available_balance:
                return Response(
                    {
                        "error": f"El monto (${requested_amount}) supera el saldo disponible (${available_balance}).",
                        "available_balance": available_balance,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            amount_to_apply = min(requested_amount, pending_in_delivery)
        else:
            amount_to_apply = min(available_balance, pending_in_delivery)

        amount_to_apply = round(amount_to_apply, 2)

        # 4. Registrar el pago en la entrega
        payment_date_raw = request.data.get('payment_date')
        payment_date = None
        if payment_date_raw:
            from django.utils.dateparse import parse_datetime, parse_date
            from django.utils import timezone as tz
            parsed = parse_datetime(str(payment_date_raw)) or parse_date(str(payment_date_raw))
            if parsed:
                payment_date = parsed

        delivery.add_payment_amount(amount_to_apply, payment_date=payment_date)

        # 5. El signal post_save de DeliverReceip recalcula el balance automáticamente.
        client.refresh_from_db()

        serializer = self.get_serializer(delivery)
        return Response(
            {
                "message": f"Se aplicaron ${amount_to_apply} del saldo a favor a la entrega #{delivery.id}.",
                "amount_applied": amount_to_apply,
                "delivery": serializer.data,
                "client_balance_after": round(float(client.balance), 2),
                "client_balance_status": client.balance_status,
            },
            status=status.HTTP_200_OK
        )
