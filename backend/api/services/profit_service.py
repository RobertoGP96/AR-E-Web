"""
Business logic services for profit calculations and metrics.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any, Tuple
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from api.models import Order, Product, CustomUser, DeliverReceip


class ProfitCalculationService:
    """
    Service for calculating profits and financial metrics.
    """

    @staticmethod
    def calculate_order_profit(order) -> Decimal:
        """
        Calculate profit for a specific order.

        Args:
            order: Order instance

        Returns:
            Profit amount as Decimal
        """
        if not order.total_amount:
            return Decimal('0.00')

        # Calculate total cost of products in order
        total_cost = Decimal('0.00')
        for product in order.products.all():
            if product.cost_price:
                total_cost += product.cost_price

        # Calculate profit (revenue - cost)
        profit = order.total_amount - total_cost

        return profit.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_agent_profit(agent, period_days: int = 30) -> Dict[str, Any]:
        """
        Calculate profit metrics for an agent.

        Args:
            agent: CustomUser instance (agent)
            period_days: Number of days to look back

        Returns:
            Dict with profit metrics
        """
        start_date = timezone.now() - timedelta(days=period_days)

        # Get agent's orders in period
        orders = Order.objects.filter(
            agent=agent,
            created_at__gte=start_date
        )

        total_revenue = orders.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        total_orders = orders.count()

        # Calculate total cost
        total_cost = Decimal('0.00')
        for order in orders:
            for product in order.products.all():
                if product.cost_price:
                    total_cost += product.cost_price

        # Calculate profit
        total_profit = total_revenue - total_cost

        # Calculate profit margin
        profit_margin = Decimal('0.00')
        if total_revenue > 0:
            profit_margin = (total_profit / total_revenue) * 100

        return {
            'total_revenue': total_revenue.quantize(Decimal('0.01')),
            'total_cost': total_cost.quantize(Decimal('0.01')),
            'total_profit': total_profit.quantize(Decimal('0.01')),
            'profit_margin': profit_margin.quantize(Decimal('0.01')),
            'total_orders': total_orders,
            'period_days': period_days,
        }

    @staticmethod
    def calculate_global_metrics(period_days: int = 30) -> Dict[str, Any]:
        """
        Calculate global financial metrics.

        Args:
            period_days: Number of days to look back

        Returns:
            Dict with global metrics
        """
        start_date = timezone.now() - timedelta(days=period_days)

        # Orders in period
        orders = Order.objects.filter(created_at__gte=start_date)

        total_revenue = orders.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        total_orders = orders.count()

        # Calculate total cost
        total_cost = Decimal('0.00')
        for order in orders:
            for product in order.products.all():
                if product.cost_price:
                    total_cost += product.cost_price

        # Calculate profit
        total_profit = total_revenue - total_cost

        # Calculate profit margin
        profit_margin = Decimal('0.00')
        if total_revenue > 0:
            profit_margin = (total_profit / total_revenue) * 100

        # Agent profits
        agents = CustomUser.objects.filter(role='agent')
        agent_profits = []
        for agent in agents:
            agent_metrics = ProfitCalculationService.calculate_agent_profit(agent, period_days)
            agent_profits.append({
                'agent_id': agent.id,
                'agent_name': f"{agent.first_name} {agent.last_name}",
                'profit': agent_metrics['total_profit'],
                'orders': agent_metrics['total_orders'],
            })

        # Sort agents by profit
        agent_profits.sort(key=lambda x: x['profit'], reverse=True)

        return {
            'total_revenue': total_revenue.quantize(Decimal('0.01')),
            'total_cost': total_cost.quantize(Decimal('0.01')),
            'total_profit': total_profit.quantize(Decimal('0.01')),
            'profit_margin': profit_margin.quantize(Decimal('0.01')),
            'total_orders': total_orders,
            'period_days': period_days,
            'agent_profits': agent_profits,
        }


class MetricsService:
    """
    Service for calculating various business metrics.
    """

    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        """
        Get comprehensive dashboard metrics.

        Returns:
            Dict with all dashboard metrics
        """
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Basic counts
        metrics = {
            'total_users': CustomUser.objects.count(),
            'active_users': CustomUser.objects.filter(is_active=True).count(),
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'completed_orders': Order.objects.filter(status='completed').count(),
            'total_products': Product.objects.count(),
            'total_deliveries': DeliverReceip.objects.count(),
        }

        # Recent activity (last 30 days)
        recent_orders = Order.objects.filter(created_at__gte=thirty_days_ago)
        metrics.update({
            'recent_orders': recent_orders.count(),
            'recent_revenue': recent_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0.00'),
        })

        # User role distribution
        metrics.update({
            'admin_users': CustomUser.objects.filter(role='admin').count(),
            'agent_users': CustomUser.objects.filter(role='agent').count(),
            'buyer_users': CustomUser.objects.filter(role='buyer').count(),
            'logistical_users': CustomUser.objects.filter(role='logistical').count(),
            'client_users': CustomUser.objects.filter(role='client').count(),
        })

        # Order status distribution
        order_status_counts = Order.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        metrics['order_status_distribution'] = {
            item['status']: item['count'] for item in order_status_counts
        }

        # Delivery status distribution
        delivery_status_counts = DeliverReceip.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        metrics['delivery_status_distribution'] = {
            item['status']: item['count'] for item in delivery_status_counts
        }

        return metrics

    @staticmethod
    def get_system_health() -> Dict[str, Any]:
        """
        Get system health metrics.

        Returns:
            Dict with system health information
        """
        # Database connection check
        try:
            # Simple query to test database connection
            CustomUser.objects.count()
            db_status = 'healthy'
        except Exception as e:
            db_status = f'unhealthy: {str(e)}'

        # Recent errors (this would need proper error logging)
        recent_errors = 0  # Placeholder

        # System uptime (simplified)
        uptime_hours = 0  # Placeholder

        return {
            'database_status': db_status,
            'recent_errors': recent_errors,
            'uptime_hours': uptime_hours,
            'timestamp': timezone.now(),
        }