"""
Service: Purchase analysis helpers

Functions that aggregate and analyze ShoppingReceip data for reports and dashboards.
"""
from typing import Dict, Any, List, DefaultDict
from collections import defaultdict
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.db.models import Sum, Count, Q, F, Case, When, Value, CharField
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
        dict: contains totals, by_status, by_shop, refund metrics, and monthly trend
    """
    qs = ShoppingReceip.objects.all()
    if start_date:
        qs = qs.filter(buy_date__gte=start_date)
    if end_date:
        qs = qs.filter(buy_date__lte=end_date)

    # Basic aggregates
    count = qs.count()
    
    # Totals computed in python to handle derived properties correctly
    total_purchase_amount = 0.0
    total_refunded = 0.0
    total_real_cost_paid = 0.0
    total_operational_expenses = 0.0
    total_products_bought = 0
    
    purchases_list = list(qs)
    
    for purchase in purchases_list:
        try:
            total_purchase_amount += float(purchase.total_cost_of_purchase or 0.0)
        except Exception:
            total_purchase_amount += 0.0
        
        try:
            total_refunded += float(purchase.total_refunded or 0.0)
        except Exception:
            total_refunded += 0.0
        
        try:
            total_real_cost_paid += float(purchase.real_cost_paid or 0.0)
        except Exception:
            total_real_cost_paid += 0.0
        
        try:
            total_operational_expenses += float(purchase.operational_expenses or 0.0)
        except Exception:
            total_operational_expenses += 0.0
        
        try:
            total_products_bought += purchase.buyed_products.count()
        except Exception:
            pass

    avg_purchase_amount = (total_purchase_amount / count) if count else 0.0
    avg_refund_amount = (total_refunded / count) if count else 0.0

    # By status
    status_qs = qs.values('status_of_shopping').annotate(count=Count('id')).order_by('-count')
    purchases_by_status = {
        row['status_of_shopping']: int(row['count']) 
        for row in status_qs
    }

    # By shop
    purchases_by_shop = {}
    for purchase in purchases_list:
        shop_name = purchase.shop_of_buy.name if purchase.shop_of_buy else 'Sin tienda'
        
        if shop_name not in purchases_by_shop:
            purchases_by_shop[shop_name] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0,
                'total_operational_expenses': 0.0,
                'total_products': 0,
            }
        
        try:
            purchases_by_shop[shop_name]['count'] += 1
            purchases_by_shop[shop_name]['total_purchase_amount'] += float(purchase.total_cost_of_purchase or 0.0)
            purchases_by_shop[shop_name]['total_refunded'] += float(purchase.total_refunded or 0.0)
            purchases_by_shop[shop_name]['total_real_cost_paid'] += float(purchase.real_cost_paid or 0.0)
            purchases_by_shop[shop_name]['total_operational_expenses'] += float(purchase.operational_expenses or 0.0)
            purchases_by_shop[shop_name]['total_products'] += purchase.buyed_products.count()
        except Exception as e:
            print(f"Error processing shop data for purchase {purchase.id}: {str(e)}")
            
    # By card
    card_breakdown = {}
    for purchase in purchases_list:
        card = purchase.card_id or 'Sin tarjeta'
        
        if card not in card_breakdown:
            card_breakdown[card] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0,
                'total_operational_expenses': 0.0,
                'by_payment_status': {
                    status: {
                        'count': 0,
                        'total_amount': 0.0,
                        'total_refunded': 0.0
                    } for status in list(PaymentStatusEnum.__members__.values())
                }
            }
        
        try:
            card_breakdown[card]['count'] += 1
            card_breakdown[card]['total_purchase_amount'] += float(purchase.total_cost_of_purchase or 0.0)
            card_breakdown[card]['total_refunded'] += float(purchase.total_refunded or 0.0)
            card_breakdown[card]['total_real_cost_paid'] += float(purchase.real_cost_paid or 0.0)
            card_breakdown[card]['total_operational_expenses'] += float(purchase.operational_expenses or 0.0)
            
            # Update payment status breakdown for this card
            status = purchase.status_of_shopping or PaymentStatusEnum.NO_PAGADO.value
            card_breakdown[card]['by_payment_status'][status]['count'] += 1
            card_breakdown[card]['by_payment_status'][status]['total_amount'] += float(purchase.total_cost_of_purchase or 0.0)
            card_breakdown[card]['by_payment_status'][status]['total_refunded'] += float(purchase.total_refunded or 0.0)
        except Exception as e:
            print(f"Error processing card data for purchase {purchase.id}: {str(e)}")
    
    # By payment status
    payment_status_breakdown = {
        status: {
            'count': 0,
            'total_amount': 0.0,
            'total_refunded': 0.0,
            'avg_amount': 0.0
        } for status in PaymentStatusEnum.values
    }
    
    for purchase in purchases_list:
        status = purchase.status_of_shopping or PaymentStatusEnum.NO_PAGADO.value
        try:
            amount = float(purchase.total_cost_of_purchase or 0.0)
            refunded = float(purchase.total_refunded or 0.0)
            
            payment_status_breakdown[status]['count'] += 1
            payment_status_breakdown[status]['total_amount'] += amount
            payment_status_breakdown[status]['total_refunded'] += refunded
        except Exception as e:
            print(f"Error processing payment status for purchase {purchase.id}: {str(e)}")
    
    # Calculate averages for payment status breakdown
    for status in payment_status_breakdown:
        count = payment_status_breakdown[status]['count']
        if count > 0:
            payment_status_breakdown[status]['avg_amount'] = (
                payment_status_breakdown[status]['total_amount'] / count
            )
            pass

    # By buying account
    purchases_by_account = {}
    for purchase in purchases_list:
        account_name = purchase.shopping_account.account_name if purchase.shopping_account else 'Sin cuenta'
        
        if account_name not in purchases_by_account:
            purchases_by_account[account_name] = {
                'count': 0,
                'total_purchase_amount': 0.0,
                'total_refunded': 0.0,
                'total_real_cost_paid': 0.0,
            }
        
        try:
            purchases_by_account[account_name]['count'] += 1
            purchases_by_account[account_name]['total_purchase_amount'] += float(purchase.total_cost_of_purchase or 0.0)
            purchases_by_account[account_name]['total_refunded'] += float(purchase.total_refunded or 0.0)
            purchases_by_account[account_name]['total_real_cost_paid'] += float(purchase.real_cost_paid or 0.0)
        except Exception:
            pass

    # Refund analysis
    refunded_purchases_count = qs.filter(
        buyed_products__is_refunded=True
    ).distinct().count()
    
    non_refunded_count = count - refunded_purchases_count
    refund_rate = (refunded_purchases_count / count * 100) if count else 0.0

    # Monthly trend
    now = timezone.now()
    if not start_date and not end_date:
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 31)).replace(day=1)

    trend_qs = ShoppingReceip.objects.filter(buy_date__gte=start_date, buy_date__lte=end_date)
    trend_qs = trend_qs.annotate(month=TruncMonth('buy_date')).values('month').annotate(count=Count('id')).order_by('month')

    monthly_trend: List[Dict[str, Any]] = []
    for row in trend_qs:
        mo = row['month']
        mo_start = mo
        
        # Filter by month to compute aggregates
        month_items = ShoppingReceip.objects.filter(
            buy_date__year=mo_start.year, 
            buy_date__month=mo_start.month
        )
        
        month_total_purchase = 0.0
        month_total_refunded = 0.0
        month_count = 0
        
        for purchase in month_items:
            try:
                month_total_purchase += float(purchase.total_cost_of_purchase or 0.0)
                month_total_refunded += float(purchase.total_refunded or 0.0)
                month_count += 1
            except Exception:
                pass
        
        monthly_trend.append({
            'month': mo.strftime('%Y-%m') if mo else None,
            'count': month_count,
            'total_purchase_amount': float(month_total_purchase),
            'total_refunded': float(month_total_refunded)
        })
    return {
        'totals': {
            'count': count,
            'total_purchase_amount': total_purchase_amount,
            'total_refunded': total_refunded,
            'total_real_cost_paid': total_real_cost_paid,
            'total_operational_expenses': total_operational_expenses,
            'total_products_bought': total_products_bought,
            'avg_purchase_amount': avg_purchase_amount,
            'avg_refund_amount': avg_refund_amount,
        },
        'by_status': purchases_by_status,
        'by_shop': purchases_by_shop,
        'by_card': card_breakdown,
        'by_payment_status': payment_status_breakdown,
        'by_account': purchases_by_account,
        'monthly_trend': monthly_trend,
        'refunded_purchases_count': int(refunded_purchases_count),
        'non_refunded_purchases_count': int(non_refunded_count),
        'refund_rate_percentage': float(refund_rate),
    }


def get_purchases_summary(start_date=None, end_date=None) -> Dict[str, Any]:
    """Get a quick summary of purchases for a date range.
    
    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
    
    Returns:
        dict: Quick summary with key metrics
    """
    data = analyze_purchases(start_date=start_date, end_date=end_date)
    
    return {
        'purchases_count': data['count'],
        'total_spent': data['total_purchase_amount'],
        'total_refunded': data['total_refunded'],
        'net_spent': data['total_real_cost_paid'],
        'operational_expenses': data['total_operational_expenses'],
        'products_count': data['total_products_bought'],
        'average_purchase': data['average_purchase_amount'],
        'refund_rate': data['refund_rate_percentage'],
    }


def analyze_product_buys(start_date=None, end_date=None) -> Dict[str, Any]:
    """Analyze individual product purchases with refund metrics.
    
    Args:
        start_date (datetime, optional): Start of the range
        end_date (datetime, optional): End of the range
    
    Returns:
        dict: Contains aggregates and breakdown by product and refund status
    """
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
