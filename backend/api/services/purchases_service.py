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
                    status.value: {
                        'count': 0,
                        'total_amount': 0.0,
                        'total_refunded': 0.0
                    } for status in PaymentStatusEnum
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
        status.value: {
            'count': 0,
            'total_amount': 0.0,
            'total_refunded': 0.0,
            'avg_amount': 0.0
        } for status in PaymentStatusEnum
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


def get_card_operations(start_date=None, end_date=None, card_id=None) -> Dict[str, Any]:
    """Obtiene las operaciones por tarjeta, ordenadas por fecha, separando compras y reembolsos.
    
    Args:
        start_date (datetime, optional): Fecha de inicio del rango
        end_date (datetime, optional): Fecha de fin del rango
        card_id (str, optional): ID de la tarjeta específica a filtrar
        
    Returns:
        dict: Diccionario con las operaciones agrupadas por tarjeta, ordenadas por fecha
    """
    from django.db.models import Sum, F, Case, When, Value, IntegerField, FloatField
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
        total_refunded=Coalesce(
            Sum('buyed_products__refund_amount', 
                filter=Q(buyed_products__is_refunded=True)),
            0.0,
            output_field=FloatField()
        ),
        refund_count=Coalesce(
            Count('buyed_products__id', 
                 filter=Q(buyed_products__is_refunded=True)),
            0,
            output_field=IntegerField()
        )
    ).order_by('buy_date')
    
    # Procesar las compras para agrupar por tarjeta
    card_operations = {}
    
    for purchase in purchases:
        # Si no hay tarjeta, la agrupamos como 'SIN_TARJETA'
        card = purchase.card_id or 'SIN_TARJETA'
        
        # Inicializar la estructura de la tarjeta si no existe
        if card not in card_operations:
            card_operations[card] = {
                'card_id': card,
                'total_purchases': 0,
                'total_refunded': 0,
                'net_amount': 0,
                'operations': []
            }
        
        # Obtener el valor de total_refunded del objeto anotado
        total_refunded = float(getattr(purchase, 'total_refunded', 0) or 0)
        
        # Agregar la operación de compra
        operation = {
            'date': purchase.buy_date,
            'type': 'COMPRA',
            'amount': float(purchase.total_cost_of_purchase),
            'status': purchase.status_of_shopping,
            'shop': purchase.shop_of_buy.name if purchase.shop_of_buy else 'Tienda desconocida',
            'shopping_account': purchase.shopping_account.account_name if purchase.shopping_account else 'Cuenta desconocida',
            'refunded_amount': total_refunded,
            'refund_count': getattr(purchase, 'refund_count', 0)
        }
        
        card_operations[card]['operations'].append(operation)
        card_operations[card]['total_purchases'] += float(purchase.total_cost_of_purchase)
        # Usar el valor de total_refunded que ya obtuvimos
        card_operations[card]['total_refunded'] += total_refunded
        card_operations[card]['net_amount'] = card_operations[card]['total_purchases'] - card_operations[card]['total_refunded']
        
        # Si hay reembolsos, agregarlos como operaciones separadas
        if purchase.refund_count > 0:
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
                    'amount': float(refund['refund_amount']) * -1,  # Negativo para indicar salida
                    'status': 'REEMBOLSADO',
                    'shop': purchase.shop_of_buy.name,
                    'product': refund['original_product__name'],
                    'notes': refund['refund_notes'] or ''
                }
                card_operations[card]['operations'].append(refund_op)
    
    # Ordenar las operaciones por fecha para cada tarjeta
    for card in card_operations.values():
        card['operations'].sort(key=lambda x: x['date'])
    
    # Convertir las fechas a string para la respuesta JSON
    result = []
    for card_data in card_operations.values():
        card_data['operations'] = [
            {**op, 'date': op['date'].isoformat() if op['date'] else None}
            for op in card_data['operations']
        ]
        result.append(card_data)
    
    # Ordenar las tarjetas por ID
    result.sort(key=lambda x: x['card_id'])
    
    return {
        'cards': result,
        'total_cards': len(result),
        'start_date': start_date.isoformat() if start_date else None,
        'end_date': end_date.isoformat() if end_date else None,
        'card_filter': card_id
    }
