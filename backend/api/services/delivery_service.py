"""
Service: Delivery analysis helpers

Functions that aggregate and analyze DeliverReceip data for reports and dashboards.
"""
from typing import Dict, Any, List, DefaultDict
from collections import defaultdict
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Count, F, Sum
from api.models import DeliverReceip, CustomUser


def analyze_deliveries(start_date=None, end_date=None, months_back=12, include_unpaid=True, filter_by_payment_date=False) -> Dict[str, Any]:
    """Return aggregated analysis for deliveries.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months
        include_unpaid (bool): If False, exclude unpaid deliveries from totals (useful for financial reporting)
        filter_by_payment_date (bool): If True, filter by payment_date instead of deliver_date

    Returns:
        dict: contains totals, breakdown by status, monthly trend, and agent breakdown
              agent_breakdown includes:
                - agent_id: ID del agente (o None si no tiene)
                - agent_name: Nombre completo del agente (o 'Sin Agente' si no tiene)
                - delivery_count: Número de entregas
                - total_weight: Peso total entregado
                - total_revenue: Ingresos totales generados
                - total_expenses: Gastos totales
                - agent_commission: Comisión total del agente
                - total_profit: Ganancia neta (ingresos - gastos - comisión)
                - paid_count: Entregas pagadas
                - unpaid_count: Entregas no pagadas
    """
    qs = DeliverReceip.objects.select_related('client__assigned_agent').all()
    
    # Filter by payment_date or deliver_date based on parameter
    if filter_by_payment_date:
        if start_date:
            qs = qs.filter(payment_date__gte=start_date)
        if end_date:
            qs = qs.filter(payment_date__lte=end_date)
    else:
        if start_date:
            qs = qs.filter(deliver_date__gte=start_date)
        if end_date:
            qs = qs.filter(deliver_date__lte=end_date)

    # Totals computed in python because some values are derived properties
    # NOTE: Now using payment_amount for revenue calculation when available
    total_delivery_revenue = 0.0
    total_payment_revenue = 0.0  # Revenue based on actual payments received
    total_delivery_expenses = 0.0
    total_manager_profit = 0.0
    total_system_profit = 0.0
    total_weight = 0.0
    count = qs.count()
    
    # Payment status tracking
    paid_count = 0
    unpaid_count = 0
    partial_count = 0
    paid_revenue = 0.0
    unpaid_revenue = 0.0
    partial_revenue = 0.0

    # Initialize agent breakdown
    agent_profits: DefaultDict[str, Dict[str, Any]] = defaultdict(lambda: {
        'agent_id': None,
        'agent_name': 'Sin Agente',
        'delivery_count': 0,
        'paid_count': 0,
        'unpaid_count': 0,
        'partial_count': 0,
        'total_weight': 0.0,
        'total_revenue': 0.0,
        'total_payment_revenue': 0.0,
        'total_expenses': 0.0,
        'total_profit': 0.0,
        'agent_commission': 0.0,
        'paid_revenue': 0.0,
        'unpaid_revenue': 0.0,
        'partial_revenue': 0.0,
    })

    for d in qs:
        # Calculate revenue based on payment_amount when available, otherwise use weight_cost
        try:
            weight_cost = float(d.weight_cost or 0.0)
            # Use payment_amount if it's set (> 0), otherwise use weight_cost
            payment_amount = float(d.payment_amount or 0.0)
            actual_revenue = payment_amount if payment_amount > 0 else weight_cost
            
            total_delivery_revenue += weight_cost  # Expected revenue
            total_payment_revenue += actual_revenue  # Actual revenue received
        except Exception:
            weight_cost = 0.0
            actual_revenue = 0.0
            total_delivery_revenue += 0.0
            total_payment_revenue += 0.0
            
        try:
            delivery_expenses = float(d.delivery_expenses or 0.0)
            total_delivery_expenses += delivery_expenses
        except Exception:
            delivery_expenses = 0.0
            total_delivery_expenses += 0.0
            
        try:
            manager_profit = float(d.manager_profit or 0.0)
            total_manager_profit += manager_profit
        except Exception:
            manager_profit = 0.0
            total_manager_profit += 0.0
            
        try:
            system_profit = float(d.system_delivery_profit or 0.0)
            total_system_profit += system_profit
        except Exception:
            system_profit = 0.0
            total_system_profit += 0.0
            
        try:
            weight = float(d.weight or 0.0)
            total_weight += weight
        except Exception:
            weight = 0.0
            total_weight += 0.0
        
        # Track payment status (supporting 'Pagado', 'No pagado', 'Parcial')
        payment_status = getattr(d, 'payment_status', 'No pagado')
        if payment_status == 'Pagado':
            paid_count += 1
            paid_revenue += actual_revenue
        elif payment_status == 'Parcial':
            partial_count += 1
            partial_revenue += actual_revenue
        else:
            unpaid_count += 1
            unpaid_revenue += weight_cost  # Use expected amount for unpaid
            
        # Process agent information
        agent = d.client.assigned_agent if hasattr(d, 'client') and hasattr(d.client, 'assigned_agent') else None
        agent_key = str(agent.id) if agent and agent.id else 'unassigned'
        
        # Initialize agent data if not exists
        if agent_key not in agent_profits and agent:
            agent_profits[agent_key] = {
                'agent_id': agent.id,
                'agent_name': agent.full_name,
                'delivery_count': 0,
                'paid_count': 0,
                'unpaid_count': 0,
                'partial_count': 0,
                'total_weight': 0.0,
                'total_revenue': 0.0,
                'total_payment_revenue': 0.0,
                'total_expenses': 0.0,
                'total_profit': 0.0,
                'agent_commission': 0.0,
                'paid_revenue': 0.0,
                'unpaid_revenue': 0.0,
                'partial_revenue': 0.0,
            }
        
        # Update agent stats
        agent_profits[agent_key]['delivery_count'] += 1
        
        # Track payment status at agent level
        if payment_status == 'Pagado':
            agent_profits[agent_key]['paid_count'] += 1
            agent_profits[agent_key]['paid_revenue'] += actual_revenue
        elif payment_status == 'Parcial':
            agent_profits[agent_key]['partial_count'] += 1
            agent_profits[agent_key]['partial_revenue'] += actual_revenue
        else:
            agent_profits[agent_key]['unpaid_count'] += 1
            agent_profits[agent_key]['unpaid_revenue'] += weight_cost
        
        agent_profits[agent_key]['total_weight'] += weight
        agent_profits[agent_key]['total_revenue'] += weight_cost
        agent_profits[agent_key]['total_payment_revenue'] += actual_revenue
        agent_profits[agent_key]['total_expenses'] += delivery_expenses
        agent_profits[agent_key]['agent_commission'] += manager_profit
        agent_profits[agent_key]['total_profit'] = (
            agent_profits[agent_key]['total_payment_revenue'] - 
            agent_profits[agent_key]['total_expenses'] - 
            agent_profits[agent_key]['agent_commission']
        )

    avg_delivery_cost = (total_delivery_expenses / count) if count else 0.0
    avg_weight = (total_weight / count) if count else 0.0

    # By status
    status_qs = qs.values('status').annotate(count=Count('id')).order_by('-count')
    deliveries_by_status = {row['status']: int(row['count']) for row in status_qs}
    
    # By payment status
    deliveries_by_payment_status = {
        'Pagado': paid_count,
        'No pagado': unpaid_count,
        'Parcial': partial_count
    }

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

    # Monthly trend - Can filter by payment_date or deliver_date
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    date_field = 'payment_date' if filter_by_payment_date else 'deliver_date'
    trend_qs = DeliverReceip.objects.filter(**{f'{date_field}__gte': start_date, f'{date_field}__lte': end_date})
    trend_qs = trend_qs.annotate(month=TruncMonth(date_field)).values('month').annotate(count=Count('id')).order_by('month')

    monthly_trend: List[Dict[str, Any]] = []
    monthly_payment_trend: List[Dict[str, Any]] = []
    
    # We cannot aggregate derived fields easily in ORM so we iterate for accurate sums per month
    for row in trend_qs:
        mo = row['month']
        mo_start = mo
        # Filter by month to compute sum
        month_items = DeliverReceip.objects.filter(**{f'{date_field}__year': mo_start.year, f'{date_field}__month': mo_start.month})
        month_total = 0.0
        month_payment_total = 0.0
        month_weight = 0.0
        for d in month_items:
            try:
                # Calculate expected revenue (weight_cost)
                month_total += float(d.weight_cost or 0.0)
                # Calculate actual payment revenue (payment_amount or weight_cost)
                payment_amt = float(d.payment_amount or 0.0)
                month_payment_total += payment_amt if payment_amt > 0 else float(d.weight_cost or 0.0)
            except Exception:
                month_total += 0.0
                month_payment_total += 0.0
            try:
                month_weight += float(d.weight or 0.0)
            except Exception:
                month_weight += 0.0
        monthly_trend.append({'month': mo.strftime('%Y-%m') if mo else None, 'total': float(month_total), 'total_weight': float(month_weight)})
        monthly_payment_trend.append({'month': mo.strftime('%Y-%m') if mo else None, 'total': float(month_payment_total), 'total_weight': float(month_weight)})

    # Convert agent_profits to list and sort by total_revenue (descending)
    agent_breakdown = sorted(
        agent_profits.values(),
        key=lambda x: x['total_revenue'],
        reverse=True
    )

    return {
        'total_delivery_revenue': float(total_delivery_revenue),
        'total_payment_revenue': float(total_payment_revenue),  # Actual revenue received
        'total_delivery_expenses': float(total_delivery_expenses),
        'total_manager_profit': float(total_manager_profit),
        'total_system_profit': float(total_system_profit),
        'total_weight': float(total_weight),
        'average_weight': float(avg_weight),
        'average_delivery_cost': float(avg_delivery_cost),
        'count': int(count),
        'paid_count': paid_count,
        'unpaid_count': unpaid_count,
        'partial_count': partial_count,
        'paid_revenue': float(paid_revenue),
        'unpaid_revenue': float(unpaid_revenue),
        'partial_revenue': float(partial_revenue),
        'payment_collection_rate': float(((paid_count + partial_count) / count * 100) if count > 0 else 0),
        'revenue_realization_rate': float((total_payment_revenue / total_delivery_revenue * 100) if total_delivery_revenue > 0 else 0),
        'deliveries_by_status': deliveries_by_status,
        'deliveries_by_payment_status': deliveries_by_payment_status,
        'deliveries_by_category': deliveries_by_category,
        'monthly_trend': monthly_trend,
        'monthly_payment_trend': monthly_payment_trend,  # Trend based on actual payments
        'agent_breakdown': agent_breakdown,  # Add agent breakdown to results
    }


def get_paid_deliveries(start_date=None, end_date=None, filter_by_payment_date=False) -> Dict[str, Any]:
    """
    Get analysis for only PAID deliveries (payment_status='Pagado' or 'Parcial').
    Useful for financial reporting where only paid amounts should be counted.
    
    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        filter_by_payment_date (bool): If True, filter by payment_date instead of deliver_date
    
    Returns:
        dict: Financial metrics based only on paid deliveries
    """
    qs = DeliverReceip.objects.filter(payment_status__in=['Pagado', 'Parcial']).select_related('client__assigned_agent').all()
    
    date_field = 'payment_date' if filter_by_payment_date else 'deliver_date'
    if start_date:
        qs = qs.filter(**{f'{date_field}__gte': start_date})
    if end_date:
        qs = qs.filter(**{f'{date_field}__lte': end_date})
    
    total_expected_revenue = 0.0
    total_actual_revenue = 0.0
    total_expenses = 0.0
    total_profit = 0.0
    total_weight = 0.0
    count = qs.count()
    
    for d in qs:
        try:
            # Expected revenue (weight_cost)
            total_expected_revenue += float(d.weight_cost or 0.0)
            # Actual revenue (payment_amount if set, otherwise weight_cost)
            payment_amt = float(d.payment_amount or 0.0)
            total_actual_revenue += payment_amt if payment_amt > 0 else float(d.weight_cost or 0.0)
        except Exception:
            pass
        
        try:
            total_expenses += float(d.delivery_expenses or 0.0)
        except Exception:
            pass
        
        try:
            total_profit += float(d.system_delivery_profit or 0.0)
        except Exception:
            pass
        
        try:
            total_weight += float(d.weight or 0.0)
        except Exception:
            pass
    
    avg_revenue = (total_actual_revenue / count) if count > 0 else 0.0
    
    return {
        'total_paid_deliveries': count,
        'total_expected_revenue': float(total_expected_revenue),
        'total_actual_revenue': float(total_actual_revenue),
        'revenue_collection_rate': float((total_actual_revenue / total_expected_revenue * 100) if total_expected_revenue > 0 else 0),
        'total_paid_expenses': float(total_expenses),
        'total_paid_profit': float(total_profit),
        'total_paid_weight': float(total_weight),
        'average_paid_revenue': float(avg_revenue),
    }


def get_unpaid_deliveries(start_date=None, end_date=None) -> Dict[str, Any]:
    """
    Get analysis for only UNPAID deliveries (payment_status=False).
    Useful for identifying outstanding balances and collection opportunities.
    
    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
    
    Returns:
        dict: Financial metrics based only on unpaid deliveries
    """
    qs = DeliverReceip.objects.filter(payment_status=False).select_related('client__assigned_agent').all()
    
    if start_date:
        qs = qs.filter(deliver_date__gte=start_date)
    if end_date:
        qs = qs.filter(deliver_date__lte=end_date)
    
    total_revenue = 0.0
    total_expenses = 0.0
    total_profit = 0.0
    total_weight = 0.0
    count = qs.count()
    
    for d in qs:
        try:
            total_revenue += float(d.weight_cost or 0.0)
        except Exception:
            pass
        
        try:
            total_expenses += float(d.delivery_expenses or 0.0)
        except Exception:
            pass
        
        try:
            total_profit += float(d.system_delivery_profit or 0.0)
        except Exception:
            pass
        
        try:
            total_weight += float(d.weight or 0.0)
        except Exception:
            pass
    
    avg_revenue = (total_revenue / count) if count > 0 else 0.0
    
    return {
        'total_unpaid_deliveries': count,
        'total_unpaid_revenue': float(total_revenue),
        'total_unpaid_expenses': float(total_expenses),
        'total_unpaid_profit': float(total_profit),
        'total_unpaid_weight': float(total_weight),
        'average_unpaid_revenue': float(avg_revenue),
    }
