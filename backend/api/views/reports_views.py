from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from api.services.expense_analysis_service import analyze_expenses
from api.services.delivery_service import analyze_deliveries
from api.services.order_service import analyze_orders
from api.services.purchases_service import analyze_purchases, get_purchases_summary, analyze_product_buys
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


class DeliveryAnalysisView(APIView):
    """API View para análisis agregados de entregas."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Análisis de entregas",
        description="Retorna un reporte agregado de las entregas: totales, por estado y tendencia mensual.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

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

        analysis = analyze_deliveries(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de entregas obtenido'}, status=status.HTTP_200_OK)


class OrderAnalysisView(APIView):
    """API View para análisis financieros de órdenes."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Análisis financiero de órdenes",
        description="Retorna un reporte financiero agregado de las órdenes: ingresos, costos, balances y tendencia mensual.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

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

        analysis = analyze_orders(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de órdenes obtenido'}, status=status.HTTP_200_OK)


class PurchasesAnalysisView(APIView):
    """API View para análisis agregados de compras."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Análisis de compras",
        description="Retorna un reporte agregado de las compras: totales, por tienda, por cuenta, reembolsos y tendencia mensual.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

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

        analysis = analyze_purchases(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de compras obtenido'}, status=status.HTTP_200_OK)


class PurchasesSummaryView(APIView):
    """API View para resumen rápido de compras."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Resumen de compras",
        description="Retorna un resumen rápido con las métricas clave de compras.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

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

        summary = get_purchases_summary(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': summary, 'message': 'Resumen de compras obtenido'}, status=status.HTTP_200_OK)


class ProductBuysAnalysisView(APIView):
    """API View para análisis de productos comprados."""
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]

    @extend_schema(
        summary="Análisis de productos comprados",
        description="Retorna un análisis agregado de los productos comprados con métricas de reembolsos.",
        tags=["Reportes"]
    )
    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'role', None) in ['admin', 'accountant']):
            return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

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

        analysis = analyze_product_buys(start_date=start_date, end_date=end_date)
        return Response({'success': True, 'data': analysis, 'message': 'Análisis de productos comprados obtenido'}, status=status.HTTP_200_OK)

