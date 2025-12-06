"""Service for Expected Metrics business logic"""

from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple
from decimal import Decimal

from api.models.balance import Balance
from api.models import Order, ProductBuyed, DeliverReceip


class BalanceService:
    """
    Service class for handling Expected Metrics business logic.
    Provides methods for calculating actual values, summaries, and date range operations.
    """

    @staticmethod
    def calculate_range_data(start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Calculate actual data (weight, cost, profit) for a given date range.

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format

        Returns:
            Dict containing calculated data for the range
        """
        try:
            # Parse dates
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()

            # Calculate delivery data
            deliveries = DeliverReceip.objects.filter(
                deliver_date__date__gte=start,
                deliver_date__date__lte=end
            )

            delivery_data = deliveries.aggregate(
                total_weight=Sum('weight'),
                total_delivery_cost=Sum('weight_cost')
            )

            total_weight_raw = delivery_data['total_weight'] or 0
            total_delivery_cost_raw = delivery_data['total_delivery_cost'] or 0
            total_weight = Decimal(str(total_weight_raw)) if total_weight_raw is not None else Decimal('0')
            total_delivery_cost = Decimal(str(total_delivery_cost_raw)) if total_delivery_cost_raw is not None else Decimal('0')

            # Calculate orders data
            orders = Order.objects.filter(
                created_at__date__gte=start,
                created_at__date__lte=end
            )

            orders_data = orders.aggregate(
                total_revenue=Sum('received_value_of_client')
            )

            total_revenue_raw = orders_data['total_revenue'] or 0
            total_revenue = Decimal(str(total_revenue_raw)) if total_revenue_raw is not None else Decimal('0')

            # Calculate total profit as revenue - cost for each order
            total_order_profit = Decimal('0')
            for order in orders:
                total_order_profit += Decimal(str(order.balance))  # balance = received - cost

            # Calculate purchase costs
            products_bought = ProductBuyed.objects.filter(
                shoping_receip__buy_date__date__gte=start,
                shoping_receip__buy_date__date__lte=end
            )

            purchase_data = products_bought.aggregate(
                total_purchase_cost=Sum('real_cost_of_product')
            )
            total_purchase_cost_raw = purchase_data['total_purchase_cost'] or 0
            total_purchase_cost = Decimal(str(total_purchase_cost_raw)) if total_purchase_cost_raw is not None else Decimal('0')

            # Calculate totals
            total_cost = total_delivery_cost + total_purchase_cost
            total_profit = total_order_profit

            return {
                'success': True,
                'start_date': start_date,
                'end_date': end_date,
                'total_weight': total_weight,
                'total_delivery_cost': total_delivery_cost,
                'total_purchase_cost': total_purchase_cost,
                'total_cost': total_cost,
                'total_revenue': total_revenue,
                'total_profit': total_profit,
                'orders_count': orders.count(),
                'deliveries_count': deliveries.count(),
                'products_bought_count': products_bought.count(),
            }

        except ValueError as e:
            return {
                'success': False,
                'error': f'Invalid date format: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error calculating range data: {str(e)}'
            }

    @staticmethod
    def get_summary_statistics() -> Dict[str, Any]:
        """
        Get summary statistics of all metrics.

        Returns:
            Dict containing aggregated statistics
        """
        balances = Balance.objects.all()

        # Aggregate using the model fields that exist in the current model version
        summary_data = balances.aggregate(
            total_system_weight=Sum('system_weight'),
            total_registered_weight=Sum('registered_weight'),
            
            total_registered_revenue=Sum('registered_revenue'),
            total_registered_profit=Sum('registered_profit'),
            total_invoice_cost=Sum('invoice_cost'),
            total_invoice_weight=Sum('invoice_weight'),
            
            total_revenues=Sum("revenues"),
            total_expenses=Sum("expenses"),
  
            total_cost= Sum("total_cost"),
            total_profit= Sum("real_profit"),
        )

        summary_data.update({
            'balances_count': balances.count()
        })

        return summary_data

    @staticmethod
    def filter_metrics_by_date_range(start_date: str, end_date: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Filter metrics by custom date range.

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format

        Returns:
            Tuple of (success, data_dict)
        """
        if not start_date or not end_date:
            return False, {'error': 'Se requieren parámetros start y end'}

        try:
            # Parse dates
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()

            # Filter metrics that overlap with the date range
            metrics = Balance.objects.filter(
                Q(start_date__lte=end) & Q(end_date__gte=start)
            )

            return True, {
                'metrics': metrics,
                'count': metrics.count()
            }

        except ValueError:
            return False, {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}

    @staticmethod
    def validate_date_range(start_date: str, end_date: str) -> Tuple[bool, str]:
        """
        Validate date range parameters.

        Args:
            start_date: Start date string
            end_date: End date string

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not start_date or not end_date:
            return False, 'Se requieren parámetros start y end'

        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()

            if start > end:
                return False, 'La fecha de inicio no puede ser posterior a la fecha de fin'

            return True, ''

        except ValueError:
            return False, 'Formato de fecha inválido. Use YYYY-MM-DD'