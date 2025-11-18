from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from api.services.invoice_service import InvoiceService
from api.models import Invoice, Tag, CustomUser


class InvoiceServiceTest(TestCase):
    def setUp(self):
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)

        # Create invoices
        self.invoice1 = Invoice.objects.create(date=self.today, total=Decimal('100.00'))
        self.invoice2 = Invoice.objects.create(date=self.today, total=Decimal('200.00'))

        # Create tags for invoice1
        Tag.objects.create(invoice=self.invoice1, type='type1', weight=Decimal('10'), cost_per_lb=Decimal('2.50'), fixed_cost=Decimal('5.00'), subtotal=Decimal('100.00'))

        # Tag for invoice2
        Tag.objects.create(invoice=self.invoice2, type='type2', weight=Decimal('5'), cost_per_lb=Decimal('3.00'), fixed_cost=Decimal('2.00'), subtotal=Decimal('50.00'))

    def test_calculate_range_data(self):
        result = InvoiceService.calculate_range_data(self.yesterday.strftime('%Y-%m-%d'), self.tomorrow.strftime('%Y-%m-%d'))

        self.assertTrue(result['success'])
        self.assertEqual(result['invoices_count'], 2)
        self.assertEqual(result['total_invoices_amount'], Decimal('300.00'))
        self.assertEqual(result['tags_count'], 2)
        self.assertEqual(result['total_tag_weight'], Decimal('15'))
        self.assertEqual(result['total_fixed_cost'], Decimal('7.00'))
        # shipping cost = 10*2.5 + 5*3.0 = 25 + 15 = 40
        self.assertEqual(result['total_shipping_cost'], Decimal('40'))
        self.assertEqual(result['total_tag_subtotal'], Decimal('150.00'))