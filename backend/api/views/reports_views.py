from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from api.services.expense_analysis_service import analyze_expenses
from api.permissions.permissions import AdminPermission, AccountantPermission


class ExpenseAnalysisView(APIView):
    """API View que expone análisis agregados de los gastos."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Análisis de gastos",
        description="Retorna un reporte agregado de los gastos: totales, por categoría y tendencia mensual.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        # Admins / Accountant only
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

        # If parsing returns None but params present, try parse without time via date
        if start_date_str and start_date is None:
            try:
                start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d')
                start_date = timezone.make_aware(start_date)
            except Exception:
                start_date = None

        if end_date_str and end_date is None:
            try:
                end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d')
                end_date = timezone.make_aware(end_date)
            except Exception:
                end_date = None

        analysis = analyze_expenses(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de gastos obtenido'}, status=status.HTTP_200_OK)
