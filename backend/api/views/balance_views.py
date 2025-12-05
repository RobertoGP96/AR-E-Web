"""Views for Expected Metrics"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from api.models.balance import Balance
from api.serializers.balances_serializers import (
    BalanceSerializer,
)
from api.permissions.permissions import AdminPermission, AccountantPermission
from api.services.balance_service import BalanceService


class BalanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Expected Metrics.
    Provides CRUD operations and additional actions for calculating actual values.

    Permissions:
    - Admin and Accountant can create, update, and delete
    - Others with authentication can view
    """

    queryset = Balance.objects.all()
    permission_classes = [IsAuthenticated, AdminPermission | AccountantPermission]
    serializer_class = BalanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['start_date', 'end_date']
    search_fields = ['notes']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-start_date', '-end_date']

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Get summary statistics of all balances.

        Returns:
        - Total expected costs
        - Total expected profits
        - Total actual costs
        - Total actual profits
        - Overall variances
        """
        summary_data = BalanceService.get_summary_statistics()
        return Response(summary_data, status=status.HTTP_200_OK)