"""
Service: Purchase analysis helpers

Functions that aggregate and analyze ShoppingReceip data for reports and dashboards.
"""
from typing import Dict, Any, List, DefaultDict
from collections import defaultdict
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Sum, Count, Q, F, Case, When, Value, CharField, FloatField, IntegerField
from django.db.models.functions import Coalesce
from api.models import ShoppingReceip, ProductBuyed
from api.enums import PaymentStatusEnum


def analyze_purchases(start_date=None, end_date=None, months_back=12) -> Dict[str, Any]:
    """Return aggregated financial analysis for purchases.

    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
        months_back (int): When start_date/end_date is not provided, compute monthly trend for last `months_back` months

    Returns:
        dict: matches the frontend PurchaseAnalysis interface structure
    """
    # 1. Base Queryset Filtering
    qs = ShoppingReceip.objects.all()
    if start_date:
        qs = qs.filter(buy_date__gte=start_date)
    if end_date:
        qs = qs.filter(buy_date__lte=end_date)

    # 2. Annotate with Refund Totals for each receipt to avoid complex joins in aggregation
    # Using Subquery for refunds per receipt is more robust but for now we use Sum per receipt
    # and then aggregate in Python to avoid duplication issues in complex ORM queries.
    annotated_qs = qs.annotate(
        receipt_refunded=Coalesce(
            Sum('buyed_products__refund_amount', filter=Q(buyed_products__is_refunded=True)),
            0.0,
            output_field=FloatField()
        ),
        products_count=Count('buyed_products')
    ).select_related('shop_of_buy', 'shopping_account').order_by('buy_date')

    # 3. Aggregation in Python to avoid "Sum over Sum" and Join Duplicate errors
    total_count = 0
    total_gross = 0.0
    total_refunded = 0.0
    total_products = 0
    
    by_shop = {}
    card_breakdown = {}
    by_payment_status = {}
    by_account = {}
    trend_map = defaultdict(lambda: {'count': 0, 'gross': 0.0, 'refunded': 0.0})

    for purchase in annotated_qs:
        gross = float(purchase.total_cost_of_purchase or 0.0)
        refunded = float(purchase.receipt_refunded or 0.0)
        products = int(purchase.products_count or 0)
        status = purchase.status_of_shopping or PaymentStatusEnum.NO_PAGADO.value
        card = purchase.card_id or 'Sin tarjeta'
        shop_name = purchase.shop_of_buy.name if purchase.shop_of_buy else 'Sin tienda'
        acc_name = purchase.shopping_account.account_name if purchase.shopping_account else 'Sin cuenta'
        
        # Overall Totals
        total_count += 1
        total_gross += gross
        total_refunded += refunded
        total_products += products
        
        # Shop Breakdown
        if shop_name not in by_shop:
            by_shop[shop_name] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0,
                'total_operational_expenses': 0.0,
                'total_products': 0
            }
        by_shop[shop_name]['count'] += 1
        by_shop[shop_name]['total_purchase_amount'] += gross
        by_shop[shop_name]['total_refunded'] += refunded
        by_shop[shop_name]['total_real_cost_paid'] += (gross - refunded)
        by_shop[shop_name]['total_products'] += products
        
        # Card Breakdown
        if card not in card_breakdown:
            card_breakdown[card] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0,
                'total_operational_expenses': 0.0,
                'by_payment_status': {}
            }
        card_breakdown[card]['count'] += 1
        card_breakdown[card]['total_purchase_amount'] += gross
        card_breakdown[card]['total_refunded'] += refunded
        card_breakdown[card]['total_real_cost_paid'] += (gross - refunded)
        
        if status not in card_breakdown[card]['by_payment_status']:
            card_breakdown[card]['by_payment_status'][status] = {
                'count': 0, 'total_amount': 0.0, 'total_refunded': 0.0
            }
        card_breakdown[card]['by_payment_status'][status]['count'] += 1
        card_breakdown[card]['by_payment_status'][status]['total_amount'] += gross
        card_breakdown[card]['by_payment_status'][status]['total_refunded'] += refunded
        
        # Payment Status Breakdown
        if status not in by_payment_status:
            by_payment_status[status] = {
                'count': 0, 'total_amount': 0.0, 'total_refunded': 0.0, 'avg_amount': 0.0
            }
        by_payment_status[status]['count'] += 1
        by_payment_status[status]['total_amount'] += gross
        by_payment_status[status]['total_refunded'] += refunded
        
        # Account Breakdown
        if acc_name not in by_account:
            by_account[acc_name] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0
            }
        by_account[acc_name]['count'] += 1
        by_account[acc_name]['total_purchase_amount'] += gross
        by_account[acc_name]['total_refunded'] += refunded
        by_account[acc_name]['total_real_cost_paid'] += (gross - refunded)
        
        # Monthly Trend
        month_key = purchase.buy_date.strftime('%Y-%m')
        trend_map[month_key]['count'] += 1
        trend_map[month_key]['gross'] += gross
        trend_map[month_key]['refunded'] += refunded

    # Finalize derived metrics
    total_net = total_gross - total_refunded
    avg_purchase_amount = (total_gross / total_count) if total_count else 0.0
    avg_refund = (total_refunded / total_count) if total_count else 0.0
    
    for s_data in by_payment_status.values():
        if s_data['count'] > 0:
            s_data['avg_amount'] = s_data['total_amount'] / s_data['count']

    # Convert Trend Map to list
    monthly_trend = []
    for m_key in sorted(trend_map.keys()):
        m_data = trend_map[m_key]
        monthly_trend.append({
            'month': m_key,
            'count': m_data['count'],
            'total_purchase_amount': m_data['gross'],
            'total_refunded': m_data['refunded'],
            'net_cost': m_data['gross'] - m_data['refunded']
        })

    # Refund Analysis
    refunded_receipts_count = annotated_qs.filter(receipt_refunded__gt=0).count()
    non_refunded_count = total_count - refunded_receipts_count
    refund_rate = (refunded_receipts_count / total_count * 100) if total_count else 0.0

    return {
        'totals': {
            'count': total_count,
            'total_purchase_amount': total_gross,
            'total_refunded': total_refunded,
            'total_real_cost_paid': total_net,
            'total_operational_expenses': 0.0,
            'total_products_bought': total_products,
            'avg_purchase_amount': avg_purchase_amount,
            'avg_refund_amount': avg_refund,
            'total_profit': 0.0,
        },
        'by_status': {k: v['count'] for k, v in by_payment_status.items()},
        'by_shop': by_shop,
        'by_card': card_breakdown,
        'by_payment_status': by_payment_status,
        'by_account': by_account,
        'monthly_trend': monthly_trend,
        'refunded_purchases_count': refunded_receipts_count,
        'non_refunded_purchases_count': non_refunded_count,
        'refund_rate_percentage': refund_rate,
    }


def get_purchases_summary(start_date=None, end_date=None) -> Dict[str, Any]:
    """Get a quick summary of purchases for a date range."""
    data = analyze_purchases(start_date=start_date, end_date=end_date)
    totals = data['totals']
    
    return {
        'purchases_count': totals['count'],
        'total_spent': totals['total_purchase_amount'],
        'total_refunded': totals['total_refunded'],
        'net_spent': totals['total_real_cost_paid'],
        'products_count': totals['total_products_bought'],
        'average_purchase': totals['avg_purchase_amount'],
        'refund_rate': data['refund_rate_percentage'],
    }


def analyze_product_buys(start_date=None, end_date=None) -> Dict[str, Any]:
    """Analyze individual product purchases with refund metrics."""
    qs = ProductBuyed.objects.all()
    if start_date:
        qs = qs.filter(buy_date__gte=start_date)
    if end_date:
        qs = qs.filter(buy_date__lte=end_date)

    total_buys = qs.count()
    total_amount_buyed = 0.0
    total_cost = 0.0
    total_refunded_items = 0
    total_refund_amount = 0.0

    for buy in qs:
        try:
            total_amount_buyed += buy.amount_buyed
        except Exception:
            pass
        
        try:
            total_cost += buy.amount_buyed
        except Exception:
            pass
        
        if buy.is_refunded:
            total_refunded_items += buy.amount_buyed
            try:
                total_refund_amount += float(buy.refund_amount or 0.0)
            except Exception:
                pass

    # By refund status
    refunded_count = qs.filter(is_refunded=True).count()
    non_refunded_count = total_buys - refunded_count
    refund_percentage = (refunded_count / total_buys * 100) if total_buys else 0.0

    # Top refunded products
    top_refunded = {}
    refunded_products = qs.filter(is_refunded=True).select_related('original_product')
    for buy in refunded_products:
        product_name = buy.original_product.name if buy.original_product else 'Unknown'
        
        if product_name not in top_refunded:
            top_refunded[product_name] = {
                'refund_count': 0,
                'total_refund_amount': 0.0,
            }
        
        top_refunded[product_name]['refund_count'] += 1
        try:
            top_refunded[product_name]['total_refund_amount'] += float(buy.refund_amount or 0.0)
        except Exception:
            pass

    return {
        'total_product_buys': int(total_buys),
        'total_amount_buyed': float(total_amount_buyed),
        'total_cost': float(total_cost),
        'total_refunded_items': int(total_refunded_items),
        'total_refund_amount': float(total_refund_amount),
        'refunded_purchases_count': int(refunded_count),
        'non_refunded_purchases_count': int(non_refunded_count),
        'refund_percentage': float(refund_percentage),
        'top_refunded_products': top_refunded,
    }


def get_card_operations(start_date=None, end_date=None, card_id=None) -> Dict[str, Any]:
    """Obtiene las operaciones por tarjeta, ordenadas por fecha, separando compras y reembolsos."""
    from django.db.models.functions import Coalesce
    
    # Filtrar compras por fechas y tarjeta si se especifica
    purchases_qs = ShoppingReceip.objects.all()
    
    if start_date:
        purchases_qs = purchases_qs.filter(buy_date__gte=start_date)
    if end_date:
        purchases_qs = purchases_qs.filter(buy_date__lte=end_date)
    if card_id:
        purchases_qs = purchases_qs.filter(card_id=card_id)
    
    # Obtener las compras con información de reembolsos
    purchases = purchases_qs.annotate(
        refunded_total=Coalesce(
            Sum('buyed_products__refund_amount', 
                filter=Q(buyed_products__is_refunded=True)),
            0.0,
            output_field=FloatField()
        ),
        refunded_count=Coalesce(
            Count('buyed_products__id', 
                 filter=Q(buyed_products__is_refunded=True)),
            0,
            output_field=IntegerField()
        )
    ).order_by('buy_date')
    
    # Procesar las compras para agrupar por tarjeta
    card_operations = {}
    
    for purchase in purchases:
        card = purchase.card_id or 'SIN_TARJETA'
        
        if card not in card_operations:
            card_operations[card] = {
                'card_id': card,
                'total_purchases': 0,
                'total_refunded': 0,
                'net_amount': 0,
                'operations': []
            }
        
        refunded_total = float(getattr(purchase, 'refunded_total', 0) or 0)
        
        operation = {
            'date': purchase.buy_date,
            'type': 'COMPRA',
            'amount': float(purchase.total_cost_of_purchase),
            'status': purchase.status_of_shopping,
            'shop': purchase.shop_of_buy.name if purchase.shop_of_buy else 'Tienda desconocida',
            'shopping_account': purchase.shopping_account.account_name if purchase.shopping_account else 'Cuenta desconocida',
            'refunded_amount': refunded_total,
            'refund_count': getattr(purchase, 'refunded_count', 0)
        }
        
        card_operations[card]['operations'].append(operation)
        card_operations[card]['total_purchases'] += float(purchase.total_cost_of_purchase)
        card_operations[card]['total_refunded'] += refunded_total
        card_operations[card]['net_amount'] = card_operations[card]['total_purchases'] - card_operations[card]['total_refunded']
        
        if purchase.refunded_count > 0:
            refund_operations = ProductBuyed.objects.filter(
                shoping_receip=purchase,
                is_refunded=True
            ).values(
                'refund_date',
                'refund_amount',
                'original_product__name',
                'refund_notes'
            )
            
            for refund in refund_operations:
                refund_op = {
                    'date': refund['refund_date'] or purchase.buy_date,
                    'type': 'REEMBOLSO',
                    'amount': float(refund['refund_amount']) * -1,
                    'status': 'REEMBOLSADO',
                    'shop': purchase.shop_of_buy.name if purchase.shop_of_buy else 'Tienda desconocida',
                    'product': refund['original_product__name'],
                    'notes': refund['refund_notes'] or ''
                }
                card_operations[card]['operations'].append(refund_op)
    
    for card in card_operations.values():
        card['operations'].sort(key=lambda x: x['date'])
    
    result = []
    for card_data in card_operations.values():
        card_data['operations'] = [
            {**op, 'date': op['date'].isoformat() if op['date'] else None}
            for op in card_data['operations']
        ]
        result.append(card_data)
    
    result.sort(key=lambda x: x['card_id'])
    
    return {
        'cards': result,
        'total_cards': len(result),
        'start_date': start_date.isoformat() if start_date else None,
        'end_date': end_date.isoformat() if end_date else None,
        'card_filter': card_id
    }