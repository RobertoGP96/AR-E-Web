"""
Service: Delivery analysis helpers

Functions that aggregate and analyze DeliverReceip data for reports and dashboards.
"""
from typing import Dict, Any, List
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Count
from api.models import DeliverReceip


def analyze_deliveries(start_date=None, end_date=None, months_back=12) -> Dict[str, Any]:
    """Return aggregated analysis for deliveries.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months

    Returns:
        dict: contains totals and breakdown by status and monthly trend
    """
    qs = DeliverReceip.objects.all()
    if start_date:
        qs = qs.filter(deliver_date__gte=start_date)
    if end_date:
        qs = qs.filter(deliver_date__lte=end_date)

    # Totals computed in python because some values are derived properties
    total_delivery_revenue = 0.0
    total_delivery_expenses = 0.0
    total_manager_profit = 0.0
    total_system_profit = 0.0
    total_weight = 0.0
    count = qs.count()

    for d in qs:
        try:
            total_delivery_revenue += float(d.weight_cost or 0.0)
        except Exception:
            total_delivery_revenue += 0.0
        try:
            total_delivery_expenses += float(d.delivery_expenses or 0.0)
        except Exception:
            total_delivery_expenses += 0.0
        try:
            total_manager_profit += float(d.manager_profit or 0.0)
        except Exception:
            total_manager_profit += 0.0
        try:
            total_system_profit += float(d.system_delivery_profit or 0.0)
        except Exception:
            total_system_profit += 0.0
        try:
            total_weight += float(d.weight or 0.0)
        except Exception:
            total_weight += 0.0

    avg_delivery_cost = (total_delivery_expenses / count) if count else 0.0
    avg_weight = (total_weight / count) if count else 0.0

    # By status
    status_qs = qs.values('status').annotate(count=Count('id')).order_by('-count')
    deliveries_by_status = {row['status']: int(row['count']) for row in status_qs}

    # By category: compute aggregated values per category name
    deliveries_by_category = {}
    for d in qs:
        cat_name = d.category.name if d.category else 'Sin categoría'
        if cat_name not in deliveries_by_category:
            deliveries_by_category[cat_name] = {
                'count': 0,
                'total_weight': 0.0,
                'total_delivery_revenue': 0.0,
                'total_delivery_expenses': 0.0,
                'total_manager_profit': 0.0,
                'total_system_profit': 0.0,
            }
        try:
            deliveries_by_category[cat_name]['count'] += 1
        except Exception:
            pass
        try:
            deliveries_by_category[cat_name]['total_weight'] += float(d.weight or 0.0)
        except Exception:
            pass
        try:
            deliveries_by_category[cat_name]['total_delivery_revenue'] += float(d.weight_cost or 0.0)
        except Exception:
            pass
        try:
            deliveries_by_category[cat_name]['total_delivery_expenses'] += float(d.delivery_expenses or 0.0)
        except Exception:
            pass
        try:
            deliveries_by_category[cat_name]['total_manager_profit'] += float(d.manager_profit or 0.0)
        except Exception:
            pass
        try:
            deliveries_by_category[cat_name]['total_system_profit'] += float(d.system_delivery_profit or 0.0)
        except Exception:
            pass

    # Monthly trend
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    trend_qs = DeliverReceip.objects.filter(deliver_date__gte=start_date, deliver_date__lte=end_date)
    trend_qs = trend_qs.annotate(month=TruncMonth('deliver_date')).values('month').annotate(count=Count('id')).order_by('month')

    monthly_trend: List[Dict[str, Any]] = []
    # We cannot aggregate derived fields easily in ORM so we iterate for accurate sums per month
    for row in trend_qs:
        mo = row['month']
        mo_start = mo
        # Filter by month to compute sum
        month_items = DeliverReceip.objects.filter(deliver_date__year=mo_start.year, deliver_date__month=mo_start.month)
        month_total = 0.0
        month_weight = 0.0
        for d in month_items:
            try:
                month_total += float(d.weight_cost or 0.0)
            except Exception:
                month_total += 0.0
            try:
                month_weight += float(d.weight or 0.0)
            except Exception:
                month_weight += 0.0
        monthly_trend.append({'month': mo.strftime('%Y-%m') if mo else None, 'total': float(month_total), 'total_weight': float(month_weight)})

    return {
        'total_delivery_revenue': float(total_delivery_revenue),
        'total_delivery_expenses': float(total_delivery_expenses),
        'total_manager_profit': float(total_manager_profit),
        'total_system_profit': float(total_system_profit),
        'total_weight': float(total_weight),
        'average_weight': float(avg_weight),
        'average_delivery_cost': float(avg_delivery_cost),
        'count': int(count),
        'deliveries_by_status': deliveries_by_status,
        'deliveries_by_category': deliveries_by_category,
        'monthly_trend': monthly_trend,
    }
