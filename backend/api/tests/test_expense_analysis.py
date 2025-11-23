"""
Tests for expense analysis service and endpoint
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from api.tests import BaseAPITestCase
from api.models import Expense
from api.services.expense_analysis_service import analyze_expenses


class ExpenseAnalysisServiceTest(TestCase):
    def test_service_aggregates_correctly(self):
        now = timezone.now()
        Expense.objects.create(date=now - timedelta(days=30), amount=100.0, category='Operativo')
        Expense.objects.create(date=now - timedelta(days=10), amount=50.0, category='Envio')
        Expense.objects.create(date=now - timedelta(days=5), amount=25.0, category='Envio')

        analysis = analyze_expenses()
        self.assertEqual(float(analysis['total_expenses']), 175.0)
        self.assertEqual(int(analysis['count']), 3)
        self.assertAlmostEqual(float(analysis['average_expense']), 175.0 / 3, places=2)
        self.assertIn('Envio', analysis['expenses_by_category'])
        self.assertEqual(float(analysis['expenses_by_category']['Envio']), 75.0)


class ExpenseAnalysisAPITest(BaseAPITestCase):
    def test_admin_can_retrieve_expense_analysis(self):
        self.authenticate_user(self.admin_user)
        now = timezone.now()
        Expense.objects.create(date=now - timedelta(days=30), amount=100.0, category='Operativo')
        Expense.objects.create(date=now - timedelta(days=10), amount=50.0, category='Envio')

        response = self.client.get('/shein_shop/api_data/reports/expenses/')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('data', {})
        self.assertIn('total_expenses', data)
        self.assertIn('expenses_by_category', data)
        self.assertEqual(float(data['total_expenses']), 150.0)

    def test_admin_can_retrieve_expense_analysis_viewset(self):
        """Test that the new ViewSet action `analysis` returns expense analysis"""
        self.authenticate_user(self.admin_user)
        now = timezone.now()
        Expense.objects.create(date=now - timedelta(days=30), amount=100.0, category='Operativo')
        Expense.objects.create(date=now - timedelta(days=10), amount=50.0, category='Envio')

        response = self.client.get('/shein_shop/api_data/expense/analysis/')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('data', {})
        self.assertIn('total_expenses', data)
        self.assertIn('expenses_by_category', data)
        self.assertEqual(float(data['total_expenses']), 150.0)
