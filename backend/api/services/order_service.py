"""
Service: Order financial analysis helpers

Functions that aggregate and analyze Order data for reports and dashboards.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Case, When, FloatField, Q, Avg, Subquery, OuterRef
from django.db.models.functions import TruncMonth
from django.utils import timezone
from api.models import Order, Product


def analyze_orders(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    months_back: int = 12,
    **kwargs
) -> Dict[str, Any]:
    """
    Analyze order financial metrics with comprehensive breakdowns.
    
    Args:
        start_date: Start of analysis period (optional)
        end_date: End of analysis period (optional)
        months_back: Number of months to analyze if dates not provided (default: 12)
    
    Returns:
        Dictionary containing:
            - summary: Overall financial metrics
            - payment_analysis: Breakdown by payment status
            - status_analysis: Breakdown by order status
            - trends: Monthly time series data
    """
    # Determine date range
    if not end_date:
        end_date = timezone.now()
    if not start_date:
        start_date = (end_date.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)
    
    # Base queryset with date filters
    orders = Order.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )

    payment_out_date = Order.objects.filter(
        payment_date__gte=start_date,
        payment_date__lte=end_date
    )
    
    summary_payment_out_date = payment_out_date.aggregate(
        total_revenue=Sum('received_value_of_client'),
        total_payments=Count('id'),
    )

    # ===== MAIN SUMMARY METRICS =====
    summary_metrics = orders.aggregate(
        # Ingresos generales: suma total de lo que deben pagar los clientes
        total_revenue=Sum('total_costs'),
        
        # Ingresos pagados: suma de pedidos con estado 'paid'
        paid_revenue=Sum(
            Case(
                When(pay_status='Pagado', then='received_value_of_client'),
                default=0,
                output_field=FloatField()
            )
        ),
        
        # Contadores
        total_orders=Count('id'),
        paid_orders=Count('id', filter=Q(pay_status='Pagado')),
    )
    
    # Extract and calculate summary values
    total_revenue = float(summary_metrics['total_revenue'] or 0)
    paid_revenue = float(summary_metrics['paid_revenue'] or 0)
    total_orders = int(summary_metrics['total_orders'] or 0)
    paid_orders = int(summary_metrics['paid_orders'] or 0)

    #Out Date Metrics
    total_revenue_out_date = float(summary_payment_out_date['total_revenue'] or 0)
    total_payments_out_date = int(summary_payment_out_date['total_payments'] or 0)
    
    # Derived metrics
    unpaid_revenue = total_revenue - paid_revenue
    unpaid_orders = total_orders - paid_orders
    payment_index = round((paid_revenue / total_revenue * 100), 2) if total_revenue > 0 else 0.0
    avg_order_value = round((total_revenue / total_orders), 2) if total_orders > 0 else 0.0
    
    summary = {
        'total_revenue': round(total_revenue, 2),
        'paid_revenue': round(paid_revenue, 2),
        'unpaid_revenue': round(unpaid_revenue, 2),
        'payment_index': payment_index,
        'total_orders': total_orders,
        'paid_orders': paid_orders,
        'unpaid_orders': unpaid_orders,
        'avg_order_value': avg_order_value,
    }
    
    summary_out_date = {
        'total_revenue': round(total_revenue_out_date, 2),
        'total_payments': total_payments_out_date,
    }   

    # ===== PAYMENT STATUS BREAKDOWN =====
    payment_breakdown = orders.values('pay_status').annotate(
        order_count=Count('id'),
        revenue=Sum('total_costs'),
        avg_value=Avg('total_costs'),
    ).order_by('-revenue')
    
    payment_analysis = {
        row['pay_status'] or 'unknown': {
            'order_count': row['order_count'],
            'revenue': round(float(row['revenue'] or 0), 2),
            'avg_value': round(float(row['avg_value'] or 0), 2),
            'percentage_of_total': round(
                (float(row['revenue'] or 0) / total_revenue * 100), 2
            ) if total_revenue > 0 else 0.0
        }
        for row in payment_breakdown
    }
    
    # ===== ORDER STATUS BREAKDOWN =====
    status_breakdown = orders.values('status').annotate(
        order_count=Count('id'),
        revenue=Sum('received_value_of_client'),
        paid_count=Count('id', filter=Q(pay_status='Pagado')),
        paid_revenue=Sum(
            Case(
                When(pay_status='Pagado', then='received_value_of_client'),
                default=0,
                output_field=FloatField()
            )
        ),
    ).order_by('-revenue')
    
    status_analysis = {
        row['status'] or 'unknown': {
            'order_count': row['order_count'],
            'revenue': round(float(row['revenue'] or 0), 2),
            'paid_count': row['paid_count'],
            'paid_revenue': round(float(row['paid_revenue'] or 0), 2),
            'unpaid_count': row['order_count'] - row['paid_count'],
            'payment_rate': round(
                (row['paid_count'] / row['order_count'] * 100), 2
            ) if row['order_count'] > 0 else 0.0
        }
        for row in status_breakdown
    }
    
    # ===== MONTHLY TRENDS =====
    monthly_data = orders.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        order_count=Count('id'),
        total_revenue=Sum('total_costs'),
        paid_revenue=Sum(
            Case(
                When(pay_status='Pagado', then='received_value_of_client'),
                default=0,
                output_field=FloatField()
            )
        ),
        paid_count=Count('id', filter=Q(pay_status='Pagado')),
    ).order_by('month')
    
    trends = [
        {
            'month': row['month'].strftime('%Y-%m'),
            'order_count': row['order_count'],
            'total_revenue': round(float(row['total_revenue'] or 0), 2),
            'paid_revenue': round(float(row['paid_revenue'] or 0), 2),
            'unpaid_revenue': round(
                float(row['total_revenue'] or 0) - float(row['paid_revenue'] or 0), 2
            ),
            'paid_count': row['paid_count'],
            'unpaid_count': row['order_count'] - row['paid_count'],
            'payment_index': round(
                (float(row['paid_revenue'] or 0) / float(row['total_revenue'] or 1) * 100), 2
            ) if row['total_revenue'] else 0.0,
            'avg_order_value': round(
                (float(row['total_revenue'] or 0) / row['order_count']), 2
            ) if row['order_count'] > 0 else 0.0
        }
        for row in monthly_data
    ]
    
    return {
        'period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
        },
        'summary': summary,
        'payment_out_date': summary_out_date,
        'payment_analysis': payment_analysis,
        'status_analysis': status_analysis,
        'trends': trends,
    }