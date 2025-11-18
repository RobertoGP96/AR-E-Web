"""Service for Invoice range calculations"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, Any

from django.db.models import Sum, F, ExpressionWrapper, DecimalField

from api.models import Invoice, Tag


class InvoiceService:
    """Invoice related aggregation service"""

    @staticmethod
    def calculate_range_data(start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Calculate invoice totals and tag data for a date range.

        Returns a dict with aggregated values.
        """
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()

            invoices = Invoice.objects.filter(date__date__gte=start, date__date__lte=end)
            invoice_data = invoices.aggregate(total_invoices_amount=Sum('total'))

            total_invoices_amount_raw = invoice_data['total_invoices_amount'] or 0
            total_invoices_amount = Decimal(str(total_invoices_amount_raw)) if total_invoices_amount_raw is not None else Decimal('0')

            tags = Tag.objects.filter(invoice__date__date__gte=start, invoice__date__date__lte=end)

            tags_data = tags.aggregate(
                total_weight=Sum('weight'),
                total_fixed_cost=Sum('fixed_cost'),
                total_subtotal=Sum('subtotal'),
            )

            weight_raw = tags_data['total_weight'] or 0
            total_weight = Decimal(str(weight_raw)) if weight_raw is not None else Decimal('0')

            fixed_raw = tags_data['total_fixed_cost'] or 0
            total_fixed_cost = Decimal(str(fixed_raw)) if fixed_raw is not None else Decimal('0')

            subtotal_raw = tags_data['total_subtotal'] or 0
            total_subtotal = Decimal(str(subtotal_raw)) if subtotal_raw is not None else Decimal('0')

            # Calculate total shipping as sum(weight * cost_per_lb)
            shipping_expr = ExpressionWrapper(F('weight') * F('cost_per_lb'), output_field=DecimalField(max_digits=12, decimal_places=2))
            shipping_data = tags.aggregate(total_shipping=Sum(shipping_expr))
            shipping_raw = shipping_data['total_shipping'] or 0
            total_shipping = Decimal(str(shipping_raw)) if shipping_raw is not None else Decimal('0')

            return {
                'success': True,
                'start_date': start_date,
                'end_date': end_date,
                'invoices_count': invoices.count(),
                'total_invoices_amount': total_invoices_amount,
                'tags_count': tags.count(),
                'total_tag_weight': total_weight,
                'total_fixed_cost': total_fixed_cost,
                'total_tag_subtotal': total_subtotal,
                'total_shipping_cost': total_shipping,
                'total_tag_costs': total_shipping + total_fixed_cost + total_subtotal,
            }

        except ValueError as e:
            return { 'success': False, 'error': f'Invalid date format: {str(e)}' }
        except Exception as e:
            return { 'success': False, 'error': f'Error calculating invoice range: {str(e)}' }
