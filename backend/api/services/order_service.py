"""
Service: Order financial analysis helpers

Functions that aggregate and analyze Order data for reports and dashboards.
"""
from typing import Dict, Any, List
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Sum, Count
from api.models import Order


def analyze_orders(start_date=None, end_date=None, months_back=12, limit_per_order=100) -> Dict[str, Any]:
    """Return aggregated financial analysis for orders.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months
        limit_per_order (int): limit per-order details to avoid huge payloads

    Returns:
        dict: contains totals, by_status and monthly_trend and details for orders
    """
    qs = Order.objects.all()
    if start_date:
        qs = qs.filter(created_at__gte=start_date)
    if end_date:
        qs = qs.filter(created_at__lte=end_date)

    # Basic aggregates
    total_revenue = qs.aggregate(total=Sum('received_value_of_client'))['total'] or 0.0
    count = qs.count()
    avg_revenue = (total_revenue / count) if count else 0.0

    # Compute total cost, expenses and profit by iterating orders
    total_cost = 0.0
    total_expenses = 0.0
    total_profit = 0.0
    per_order_details: List[Dict[str, Any]] = []
    for order in qs[:limit_per_order]:
        order_cost = 0.0
        for p in order.products.all():
            try:
                order_cost += float(p.total_cost or 0.0)
            except Exception:
                continue
        
        # Usar las propiedades calculadas del modelo Order
        order_expenses = order.total_expenses
        order_profit = order.total_profit
        balance = float(order.received_value_of_client or 0.0) - float(order_cost)
        
        per_order_details.append({
            'id': order.id,
            'revenue': float(order.received_value_of_client or 0.0),
            'total_cost': float(order_cost),
            'total_expenses': float(order_expenses),
            'total_profit': float(order_profit),
            'balance': float(balance),
            'pay_status': order.pay_status,
            'status': order.status,
            'created_at': order.created_at,
        })
        total_cost += order_cost
        total_expenses += order_expenses
        total_profit += order_profit

    # If the queryset contains more than limit_per_order, still compute total cost, expenses and profit by iterating through all orders
    if count > limit_per_order:
        for order in qs[limit_per_order:]:
            try:
                order_cost = sum(float(p.total_cost or 0.0) for p in order.products.all())
                total_cost += order_cost
                # Usar las propiedades calculadas del modelo Order
                total_expenses += order.total_expenses
                total_profit += order.total_profit
            except Exception:
                continue

    # Orders by status
    status_qs = qs.values('status').annotate(count=Count('id')).order_by('-count')
    orders_by_status = {row['status']: int(row['count']) for row in status_qs}

    # Monthly trend
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    trend_qs = Order.objects.filter(created_at__gte=start_date, created_at__lte=end_date)
    trend_qs = trend_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('received_value_of_client')).order_by('month')
    monthly_trend: List[Dict[str, Any]] = [
        {'month': row['month'].strftime('%Y-%m') if row['month'] else None, 'total': float(row['total'] or 0.0)} for row in trend_qs
    ]

    return {
        'total_revenue': float(total_revenue),
        'average_revenue': float(avg_revenue),
        'count': int(count),
        'total_cost': float(total_cost),
        'total_expenses': float(total_expenses),
        'total_profit': float(total_profit),
        'orders_by_status': orders_by_status,
        'monthly_trend': monthly_trend,
        'orders': per_order_details,
    }
