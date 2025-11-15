"""Views for Expected Metrics"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from api.models.models_expected_metrics import ExpectedMetrics
from api.serializers.serializers_expected_metrics import (
    ExpectedMetricsSerializer,
    ExpectedMetricsListSerializer
)
from api.permissions.permissions import AdminPermission, AccountantPermission
from api.services.expected_metrics_service import ExpectedMetricsService


class ExpectedMetricsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Expected Metrics.
    Provides CRUD operations and additional actions for calculating actual values.

    Permissions:
    - Admin and Accountant can create, update, and delete
    - Others with authentication can view
    """

    queryset = ExpectedMetrics.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['start_date', 'end_date']
    search_fields = ['notes']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date', '-end_date']

    def get_serializer_class(self):
        """Use lightweight serializer for list action"""
        if self.action == 'list':
            return ExpectedMetricsListSerializer
        return ExpectedMetricsSerializer

    def get_permissions(self):
        """
        Admin and Accountant can create, update, delete
        Authenticated users can view
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'], url_path='calculate-actuals')
    def calculate_actuals(self, request, pk=None):
        """
        Calculate actual costs and profits from real data within the date range.

        This action:
        1. Queries all orders within the date range
        2. Calculates total costs from products bought
        3. Calculates total profits from orders
        4. Updates the ExpectedMetrics instance
        """
        metric = self.get_object()

        result = ExpectedMetricsService.calculate_actuals_for_metric(metric)

        if result['success']:
            serializer = self.get_serializer(result['metric'])
            return Response({
                'message': 'Valores reales calculados exitosamente',
                'data': serializer.data,
                'calculations': {
                    'orders_count': result['orders_count'],
                    'products_bought_count': result['products_bought_count'],
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Error al calcular valores reales',
                'detail': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Get summary statistics of all metrics.

        Returns:
        - Total expected costs
        - Total expected profits
        - Total actual costs
        - Total actual profits
        - Overall variances
        """
        summary_data = ExpectedMetricsService.get_summary_statistics()
        return Response(summary_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='date-range')
    def date_range(self, request):
        """
        Filter metrics by custom date range.

        Query params:
        - start: Start date (YYYY-MM-DD)
        - end: End date (YYYY-MM-DD)
        """
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')

        is_valid, validation_result = ExpectedMetricsService.validate_date_range(start_date, end_date)

        if not is_valid:
            return Response({
                'error': validation_result
            }, status=status.HTTP_400_BAD_REQUEST)

        success, result = ExpectedMetricsService.filter_metrics_by_date_range(start_date, end_date)

        if success:
            serializer = self.get_serializer(result['metrics'], many=True)
            return Response({
                'count': result['count'],
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='calculate-range-data')
    def calculate_range_data(self, request):
        """
        Calculate actual data (weight, cost, profit) for a given date range.

        Query params:
        - start: Start date (YYYY-MM-DD)
        - end: End date (YYYY-MM-DD)
        """
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')

        is_valid, validation_result = ExpectedMetricsService.validate_date_range(start_date, end_date)

        if not is_valid:
            return Response({
                'error': validation_result
            }, status=status.HTTP_400_BAD_REQUEST)

        result = ExpectedMetricsService.calculate_range_data(start_date, end_date)

        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
