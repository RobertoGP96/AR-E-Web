"""
Service: Expense analysis helpers

Functions that aggregate and analyze Expense data for reports and dashboards.
"""
from django.db.models import Sum, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from api.models import Expense


def analyze_expenses(start_date=None, end_date=None, months_back=12):
    """Return aggregated analysis for expenses.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months

    Returns:
        dict: contains total, count, avg, by_category, monthly_trend
    """
    qs = Expense.objects.all()
    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)

    # Basic aggregations
    total = qs.aggregate(total=Sum('amount'))['total'] or 0
    avg = qs.aggregate(avg=Avg('amount'))['avg'] or 0
    count = qs.count()

    # By category
    by_category_qs = qs.values('category').annotate(total_amount=Sum('amount')).order_by('-total_amount')
    by_category = {row['category']: float(row['total_amount']) for row in by_category_qs}

    # Monthly trend for the specified date range or default last months_back
    now = timezone.now()
    if not start_date and not end_date:
        # build last months_back months window
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back*31)).replace(day=1)

    trend_qs = Expense.objects.filter(date__gte=start_date, date__lte=end_date)
    trend_qs = trend_qs.annotate(month=TruncMonth('date')).values('month').annotate(total=Sum('amount')).order_by('month')
    monthly_trend = [
        {
            'month': row['month'].strftime('%Y-%m') if row['month'] else None,
            'total': float(row['total']) if row['total'] else 0.0,
        }
        for row in trend_qs
    ]

    return {
        'total_expenses': float(total),
        'average_expense': float(avg),
        'count': int(count),
        'expenses_by_category': by_category,
        'monthly_trend': monthly_trend,
    }
