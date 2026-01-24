"""
Service: Order financial analysis helpers

Functions that aggregate and analyze Order data for reports and dashboards.
"""
from typing import Dict, Any, List
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Sum, Count, Case, When, FloatField, Q, F
from api.models import Order


def analyze_orders(start_date=None, end_date=None, months_back=12, limit_per_order=100) -> Dict[str, Any]:
    """Return aggregated financial analysis for orders.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months
        limit_per_order (int): Deprecated parameter, kept for backward compatibility

    Returns:
        dict: contains totals, payment breakdown, status breakdown and monthly trend
    """
    qs = Order.objects.all()
    
    # Apply date filters
    if start_date:
        qs = qs.filter(created_at__gte=start_date)
    if end_date:
        qs = qs.filter(created_at__lte=end_date)

    # Single aggregation query for all metrics
    aggregates = qs.aggregate(
        # Ingresos generales (lo que debe pagar el cliente)
        total_revenue=Sum('received_value_of_client'),
        
        # Ingresos pagados (lo que ha entregado el cliente)
        paid_revenue=Sum(
            Case(
                When(pay_status='paid', then='received_value_of_client'),
                default=0.0,
                output_field=FloatField()
            )
        ),
        
        # Conteos
        total_count=Count('id'),
        paid_count=Count('id', filter=Q(pay_status='paid')),
    )
    
    total_revenue = float(aggregates['total_revenue'] or 0.0)
    paid_revenue = float(aggregates['paid_revenue'] or 0.0)
    total_count = int(aggregates['total_count'] or 0)
    paid_count = int(aggregates['paid_count'] or 0)
    
    # Cálculos derivados
    unpaid_revenue = total_revenue - paid_revenue
    unpaid_count = total_count - paid_count
    payment_index = (paid_revenue / total_revenue * 100) if total_revenue > 0 else 0.0

    # Desglose por estado de pago
    payment_status = qs.values('pay_status').annotate(
        count=Count('id'),
        total=Sum('received_value_of_client')
    ).order_by('-total')
    
    payment_breakdown = {
        row['pay_status']: {
            'count': row['count'],
            'total': float(row['total'] or 0.0),
            'percentage': (float(row['total'] or 0.0) / total_revenue * 100) if total_revenue > 0 else 0.0
        }
        for row in payment_status
    }

    # Desglose por estado del pedido
    status_breakdown = qs.values('status').annotate(
        count=Count('id'),
        total_revenue=Sum('received_value_of_client'),
        paid_count=Count('id', filter=Q(pay_status='paid')),
        unpaid_count=Count('id', filter=~Q(pay_status='paid'))
    ).order_by('-total_revenue')
    
    orders_by_status = {
        row['status']: {
            'count': int(row['count']),
            'total_revenue': float(row['total_revenue'] or 0.0),
            'paid_count': int(row['paid_count'] or 0),
            'unpaid_count': int(row['unpaid_count'] or 0)
        }
        for row in status_breakdown
    }

    # Tendencia mensual
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    trend_qs = Order.objects.filter(
        created_at__gte=start_date, 
        created_at__lte=end_date
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('received_value_of_client'),
        paid=Sum(
            Case(
                When(pay_status='paid', then='received_value_of_client'),
                default=0.0,
                output_field=FloatField()
            )
        ),
        unpaid=Sum(
            Case(
                When(~Q(pay_status='paid'), then='received_value_of_client'),
                default=0.0,
                output_field=FloatField()
            )
        ),
        order_count=Count('id'),
        paid_count=Count('id', filter=Q(pay_status='paid')),
        unpaid_count=Count('id', filter=~Q(pay_status='paid'))
    ).order_by('month')
    
    monthly_trend: List[Dict[str, Any]] = [
        {
            'month': row['month'].strftime('%Y-%m') if row['month'] else None,
            'total': float(row['total'] or 0.0),
            'paid': float(row['paid'] or 0.0),
            'unpaid': float(row['unpaid'] or 0.0),
            'order_count': row['order_count'],
            'paid_count': row['paid_count'],
            'unpaid_count': row['unpaid_count'],
            'payment_index': (float(row['paid'] or 0.0) / float(row['total'] or 1.0) * 100) if row['total'] else 0.0
        }
        for row in trend_qs
    ]

    return {
        # Métricas principales
        'total_revenue': total_revenue,
        'paid_revenue': paid_revenue,
        'unpaid_revenue': unpaid_revenue,
        'payment_index': float(payment_index),
        
        # Conteos
        'total_count': total_count,
        'paid_count': paid_count,
        'unpaid_count': unpaid_count,
        
        # Desgloses
        'payment_breakdown': payment_breakdown,
        'orders_by_status': orders_by_status,
        'monthly_trend': monthly_trend,
    }