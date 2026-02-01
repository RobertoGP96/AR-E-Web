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
        dict: contains totals, by_status, by_shop, by_card, and monthly trend
    """
    # 1. Base Queryset Filtering
    qs = ShoppingReceip.objects.all()
    if start_date:
        qs = qs.filter(buy_date__gte=start_date)
    if end_date:
        qs = qs.filter(buy_date__lte=end_date)

    # 2. Annotate with Refund Totals for each receipt
    # We use Coalesce to handle None values as 0.0
    annotated_qs = qs.annotate(
        receipt_refunded=Coalesce(
            Sum('buyed_products__refund_amount', filter=Q(buyed_products__is_refunded=True)),
            0.0,
            output_field=FloatField()
        ),
        products_count=Count('buyed_products')
    )

    # 3. Overall Totals
    totals_agg = annotated_qs.aggregate(
        count=Count('id'),
        total_gross=Sum('total_cost_of_purchase'),
        total_refunded=Sum('receipt_refunded'),
        total_products=Sum('products_count')
    )

    total_count = totals_agg['count'] or 0
    total_gross = float(totals_agg['total_gross'] or 0.0)
    total_refunded = float(totals_agg['total_refunded'] or 0.0)
    total_net = total_gross - total_refunded
    total_products = int(totals_agg['total_products'] or 0)
    
    avg_purchase = (total_gross / total_count) if total_count else 0.0

    # 4. Breakdown by Shop
    shop_qs = annotated_qs.values(
        shop_id=F('shop_of_buy__id'),
        shop_name=F('shop_of_buy__name')
    ).annotate(
        count=Count('id'),
        gross=Sum('total_cost_of_purchase'),
        refunded=Sum('receipt_refunded'),
        products=Sum('products_count')
    ).order_by('-gross')

    by_shop = {}
    for item in shop_qs:
        name = item['shop_name'] or 'Sin tienda'
        by_shop[name] = {
            'count': item['count'],
            'total_purchase_amount': float(item['gross'] or 0.0),
            'total_refunded': float(item['refunded'] or 0.0),
            'total_real_cost_paid': float((item['gross'] or 0.0) - (item['refunded'] or 0.0)),
            'total_products': item['products']
        }

    # 5. Breakdown by Card
    card_qs = annotated_qs.values('card_id').annotate(
        count=Count('id'),
        gross=Sum('total_cost_of_purchase'),
        refunded=Sum('receipt_refunded'),
        products=Sum('products_count')
    ).order_by('-gross')

    by_card = {}
    for item in card_qs:
        card = item['card_id'] or 'Sin tarjeta'
        by_card[card] = {
            'count': item['count'],
            'total_purchase_amount': float(item['gross'] or 0.0),
            'total_refunded': float(item['refunded'] or 0.0),
            'total_real_cost_paid': float((item['gross'] or 0.0) - (item['refunded'] or 0.0)),
            'total_products': item['products']
        }

    # 6. Breakdown by Payment Status
    status_qs = annotated_qs.values('status_of_shopping').annotate(
        count=Count('id'),
        gross=Sum('total_cost_of_purchase'),
        refunded=Sum('receipt_refunded'),
        products=Sum('products_count')
    ).order_by('-gross')

    by_status = {}
    for item in status_qs:
        status = item['status_of_shopping'] or PaymentStatusEnum.NO_PAGADO.value
        by_status[status] = {
            'count': item['count'],
            'total_amount': float(item['gross'] or 0.0),
            'total_refunded': float(item['refunded'] or 0.0),
            'net_amount': float((item['gross'] or 0.0) - (item['refunded'] or 0.0)),
            'avg_amount': float(item['gross'] or 0.0) / item['count'] if item['count'] else 0.0
        }

    # 7. Refund Analysis (Count of receipts with it least one refund)
    refunded_receipts_count = annotated_qs.filter(receipt_refunded__gt=0).count()
    non_refunded_count = total_count - refunded_receipts_count
    refund_rate = (refunded_receipts_count / total_count * 100) if total_count else 0.0

    # 8. Monthly Trend
    if not start_date and not end_date:
        now = timezone.now()
        end_date = now
        from datetime import timedelta
        start_date = (now.replace(day=1) - timedelta(days=months_back * 30)).replace(day=1)

    trend_qs = annotated_qs.filter(buy_date__gte=start_date, buy_date__lte=end_date) \
        .annotate(month=TruncMonth('buy_date')) \
        .values('month') \
        .annotate(
            count=Count('id'),
            gross=Sum('total_cost_of_purchase'),
            refunded=Sum('receipt_refunded')
        ) \
        .order_by('month')

    monthly_trend = []
    for row in trend_qs:
        monthly_trend.append({
            'month': row['month'].strftime('%Y-%m') if row['month'] else None,
            'count': row['count'],
            'total_purchase_amount': float(row['gross'] or 0.0),
            'total_refunded': float(row['refunded'] or 0.0)
        })

    return {
        'totals': {
            'count': total_count,
            'total_purchase_amount': total_gross,
            'total_refunded': total_refunded,
            'total_real_cost_paid': total_net,
            'total_products_bought': total_products,
            'avg_purchase_amount': avg_purchase_amount,
        },
        'by_status': by_status,
        'by_shop': by_shop,
        'by_card': by_card,
        'monthly_trend': monthly_trend,
        'refunded_purchases_count': refunded_receipts_count,
        'non_refunded_purchases_count': non_refunded_count,
        'refund_rate_percentage': refund_rate,
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
    from django.db.models import Sum, Count, Q, FloatField, IntegerField
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
    # CAMBIO: Usar nombres diferentes para las anotaciones
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
        
        # Obtener el valor de refunded_total del objeto anotado
        refunded_total = float(getattr(purchase, 'refunded_total', 0) or 0)
        
        # Agregar la operación de compra
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
        
        # Si hay reembolsos, agregarlos como operaciones separadas
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
                    'amount': float(refund['refund_amount']) * -1,  # Negativo para indicar salida
                    'status': 'REEMBOLSADO',
                    'shop': purchase.shop_of_buy.name if purchase.shop_of_buy else 'Tienda desconocida',
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