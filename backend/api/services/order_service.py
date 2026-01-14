"""
Service: Order financial analysis helpers

Functions that aggregate and analyze Order data for reports and dashboards.
"""
from typing import Dict, Any, List
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Sum, Count, Case, When, FloatField, Q
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
    
    # Apply date filters
    if start_date:
        qs = qs.filter(created_at__gte=start_date)
    if end_date:
        qs = qs.filter(created_at__lte=end_date)

    # Separate queries for paid and unpaid orders
    paid_orders = qs.filter(pay_status='paid')
    unpaid_orders = qs.exclude(pay_status='paid')
    
    # Basic aggregates for all orders
    total_revenue = qs.aggregate(total=Sum('received_value_of_client'))['total'] or 0.0
    paid_revenue = paid_orders.aggregate(total=Sum('received_value_of_client'))['total'] or 0.0
    unpaid_revenue = unpaid_orders.aggregate(total=Sum('received_value_of_client'))['total'] or 0.0
    
    # Counts
    total_count = qs.count()
    paid_count = paid_orders.count()
    unpaid_count = unpaid_orders.count()
    
    # Averages
    avg_revenue = (total_revenue / total_count) if total_count else 0.0
    avg_paid = (paid_revenue / paid_count) if paid_count else 0.0
    avg_unpaid = (unpaid_revenue / unpaid_count) if unpaid_count else 0.0

    # Payment status breakdown
    payment_status = qs.values('pay_status').annotate(
        count=Count('id'),
        total=Sum('received_value_of_client')
    ).order_by('-total')
    
    payment_breakdown = {
        row['pay_status']: {
            'count': row['count'],
            'total': float(row['total'] or 0.0),
            'percentage': (row['total'] / total_revenue * 100) if total_revenue > 0 else 0.0
        }
        for row in payment_status
    }

    # Initialize totals
    total_cost = 0.0
    total_paid_cost = 0.0
    total_unpaid_cost = 0.0
    total_expenses = 0.0
    total_paid_expenses = 0.0
    total_unpaid_expenses = 0.0
    total_profit = 0.0
    total_paid_profit = 0.0
    total_unpaid_profit = 0.0
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

    # Orders by status with financials
    status_qs = qs.values('status').annotate(
        count=Count('id'),
        total_revenue=Sum('received_value_of_client'),
        avg_revenue=Sum('received_value_of_client')/Count('id'),
        paid_count=Count('id', filter=Q(pay_status='paid')),
        unpaid_count=Count('id', filter=~Q(pay_status='paid'))
    ).order_by('-total_revenue')
    
    orders_by_status = {
        row['status']: {
            'count': int(row['count']),
            'total_revenue': float(row['total_revenue'] or 0.0),
            'avg_revenue': float(row['avg_revenue'] or 0.0),
            'paid_count': int(row['paid_count'] or 0),
            'unpaid_count': int(row['unpaid_count'] or 0)
        }
        for row in status_qs
    }

    # Monthly trend with paid/unpaid breakdown
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    # Get monthly trend with paid/unpaid breakdown
    trend_qs = Order.objects.filter(created_at__gte=start_date, created_at__lte=end_date)
    trend_qs = trend_qs.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('received_value_of_client'),
        paid=Sum(Case(
            When(pay_status='paid', then='received_value_of_client'),
            default=0.0,
            output_field=FloatField()
        )),
        unpaid=Sum(Case(
            When(~Q(pay_status='paid'), then='received_value_of_client'),
            default=0.0,
            output_field=FloatField()
        )),
        order_count=Count('id')
    ).order_by('month')
    
    monthly_trend: List[Dict[str, Any]] = [
        {
            'month': row['month'].strftime('%Y-%m') if row['month'] else None,
            'total': float(row['total'] or 0.0),
            'paid': float(row['paid'] or 0.0),
            'unpaid': float(row['unpaid'] or 0.0),
            'order_count': row['order_count']
        }
        for row in trend_qs
    ]

    return {
        # Totals
        'total_revenue': float(total_revenue),
        'paid_revenue': float(paid_revenue),
        'unpaid_revenue': float(unpaid_revenue),
        
        # Counts
        'total_count': int(total_count),
        'paid_count': int(paid_count),
        'unpaid_count': int(unpaid_count),
        
        # Averages
        'average_revenue': float(avg_revenue),
        'average_paid': float(avg_paid),
        'average_unpaid': float(avg_unpaid),
        
        # Financials
        'total_cost': float(total_cost),
        'total_expenses': float(total_expenses),
        'total_profit': float(total_profit),
        'total_paid_cost': float(total_paid_cost),
        'total_paid_expenses': float(total_paid_expenses),
        'total_paid_profit': float(total_paid_profit),
        'total_unpaid_cost': float(total_unpaid_cost),
        'total_unpaid_expenses': float(total_unpaid_expenses),
        'total_unpaid_profit': float(total_unpaid_profit),
        
        # Breakdowns
        'payment_breakdown': payment_breakdown,
        'orders_by_status': orders_by_status,
        'monthly_trend': monthly_trend,
        'orders': per_order_details,
    }
