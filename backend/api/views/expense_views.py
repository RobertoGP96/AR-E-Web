from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from api.models import Expense
from api.serializers import ExpenseSerializer
from api.permissions.permissions import AdminPermission, ReadOnly, AccountantPermission
from api.services.expense_analysis_service import analyze_expenses
from datetime import datetime


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de gastos."""
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission | ReadOnly]

    @extend_schema(
        summary="Listar gastos",
        description="Obtiene una lista de gastos registrados en el sistema.",
        tags=["Gastos"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        """Restringir el queryset a gastos del usuario para usuarios no administradores."""
        user = self.request.user
        queryset = Expense.objects.all().order_by('-date')
        # Admins y staff pueden ver todo; resto solo su propio gasto
        if not getattr(user, 'is_staff', False):
            queryset = queryset.filter(created_by=user)
        return queryset

    @extend_schema(
        summary="Crear gasto",
        description="Registra un nuevo gasto en el sistema.",
        tags=["Gastos"]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Asignar el usuario actual como creado por."""
        serializer.save(created_by=self.request.user)

    @extend_schema(
        summary="Obtener gasto",
        description="Obtiene los detalles de un gasto específico.",
        tags=["Gastos"]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Actualizar gasto",
        description="Actualiza un gasto existente.",
        tags=["Gastos"]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        summary="Eliminar gasto",
        description="Elimina un gasto del sistema.",
        tags=["Gastos"]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='analysis', permission_classes=[IsAuthenticated])
    @extend_schema(
        summary="Análisis de gastos (ViewSet)",
        description="Retorna el análisis agregado usando el servicio de gastos: totales, por categoría y tendencia.",
        tags=["Gastos"]
    )
    def analysis(self, request):
        """
        Endpoint adicional para exponer el análisis de gastos vía el ViewSet de Expense.

        Query params aceptados:
        - start_date: YYYY-MM-DD or ISO datetime
        - end_date: YYYY-MM-DD or ISO datetime
        - months_back: integer (si no se pasa start_date/end_date)
        """
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        months_back = request.query_params.get('months_back')

        start_date = None
        end_date = None
        try:
            if start_date_str:
                start_date = parse_datetime(start_date_str) or None
                if start_date is None:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                    start_date = timezone.make_aware(start_date)

            if end_date_str:
                end_date = parse_datetime(end_date_str) or None
                if end_date is None:
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                    end_date = timezone.make_aware(end_date)

            months_back_val = int(months_back) if months_back is not None else None
        except (ValueError, TypeError):
            return Response({'success': False, 'message': 'Parámetros de fecha inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        analysis = analyze_expenses(start_date=start_date, end_date=end_date, months_back=months_back_val or 12)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de gastos obtenido'}, status=status.HTTP_200_OK)
