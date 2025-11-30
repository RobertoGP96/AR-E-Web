"""
Tests for delivery and order financial analysis services and endpoints
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from api.tests import BaseAPITestCase
from api.models import DeliverReceip, Category, Product, Order
from api.services.delivery_service import analyze_deliveries
from api.services.order_service import analyze_orders


class DeliveryAnalysisServiceTest(BaseAPITestCase):
    def test_service_aggregates_deliveries_correctly(self):
        now = timezone.now()
        cat = Category.objects.create(name='Test Cat', shipping_cost_per_pound=2.0)
        # two deliveries
        d1 = DeliverReceip.objects.create(client=self.client_user, category=cat, weight=5.0, weight_cost=0, manager_profit=1.0, deliver_date=now - timedelta(days=10))
        d2 = DeliverReceip.objects.create(client=self.client_user, category=cat, weight=3.0, weight_cost=0, manager_profit=0.5, deliver_date=now - timedelta(days=5))

        analysis = analyze_deliveries()
        expected_total = float(d1.delivery_expenses + d2.delivery_expenses)
        self.assertAlmostEqual(analysis['total_delivery_expenses'], expected_total, places=2)
        self.assertEqual(analysis['count'], 2)
        self.assertIn(d1.status, analysis['deliveries_by_status'])
        # check total weight
        expected_weight = float(d1.weight + d2.weight)
        self.assertAlmostEqual(analysis['total_weight'], expected_weight, places=2)
        # check monthly trend includes weight per month
        trend = analysis.get('monthly_trend', [])
        self.assertTrue(any(float(m.get('total_weight', 0)) == expected_weight for m in trend))


class OrderAnalysisServiceTest(BaseAPITestCase):
    def test_service_aggregates_orders_correctly(self):
        now = timezone.now()
        order = Order.objects.create(client=self.client_user, received_value_of_client=150.0, created_at=now - timedelta(days=10))
        p1 = Product.objects.create(name='P1', shop_cost=10, total_cost=10.0, amount_requested=1, amount_purchased=1, amount_delivered=1, order=order, category=None, shop=self.test_shop)
        p2 = Product.objects.create(name='P2', shop_cost=20, total_cost=20.0, amount_requested=1, amount_purchased=1, amount_delivered=1, order=order, category=None, shop=self.test_shop)
        self.assertEqual(analysis['count'], 1)
        self.assertAlmostEqual(analysis['total_revenue'], 150.0, places=2)
        self.assertAlmostEqual(analysis['total_cost'], 30.0, places=2)


class DeliveryOrderAPITest(BaseAPITestCase):
    def test_admin_can_retrieve_delivery_analysis(self):
        self.authenticate_user(self.admin_user)
        now = timezone.now()
        cat = Category.objects.create(name='Test Cat 2', shipping_cost_per_pound=3.0)
        DeliverReceip.objects.create(client=self.client_user, category=cat, weight=2.0, weight_cost=0, manager_profit=0.0, deliver_date=now - timedelta(days=15))

        response = self.client.get('/shein_shop/api_data/reports/deliveries/')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('data', {})
        self.assertIn('total_delivery_expenses', data)
        self.assertIn('deliveries_by_status', data)

    def test_admin_can_retrieve_order_analysis(self):
        self.authenticate_user(self.admin_user)
        now = timezone.now()
        order = Order.objects.create(client=self.client_user, received_value_of_client=200.0, created_at=now - timedelta(days=7))
        Product.objects.create(name='P3', shop_cost=30, total_cost=30.0, amount_requested=1, amount_purchased=1, amount_delivered=1, order=order, category=None, shop=None)

        response = self.client.get('/shein_shop/api_data/reports/orders/')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('data', {})
        self.assertIn('total_revenue', data)
        self.assertIn('orders_by_status', data)
