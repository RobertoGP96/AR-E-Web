"""
Tests for Expense API
"""

from django.test import TestCase
from rest_framework import status
from api.tests import BaseAPITestCase
from api.models import Expense


class ExpenseAPITest(BaseAPITestCase):
    def test_admin_can_create_expense_and_created_by_set(self):
        self.authenticate_user(self.admin_user)
        data = {
            'date': '2025-11-22T00:00:00Z',
            'amount': 100.0,
            'category': 'Operativo',
            'description': 'Expense test'
        }
        response = self.client.post('/shein_shop/api_data/expense/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expense = Expense.objects.latest('created_at')
        self.assertEqual(expense.amount, 100.0)
        self.assertEqual(expense.created_by, self.admin_user)

    def test_non_admin_cannot_create_expense(self):
        self.authenticate_user(self.agent_user)
        data = {
            'date': '2025-11-22T00:00:00Z',
            'amount': 50.0,
            'category': 'Operativo',
            'description': 'Not allowed'
        }
        response = self.client.post('/shein_shop/api_data/expense/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_accountant_can_create_expense_and_created_by_set(self):
        # Create an accountant user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        account_user = User.objects.create_user(
            email='accountant@test.com',
            phone_number='5555555555',
            name='Accountant',
            last_name='User',
            password='testpass123',
            role='accountant',
            is_active=True,
            is_verified=True
        )
        self.authenticate_user(account_user)
        data = {
            'date': '2025-11-22T00:00:00Z',
            'amount': 200.0,
            'category': 'Operativo',
            'description': 'Expense created by accountant'
        }
        response = self.client.post('/shein_shop/api_data/expense/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expense = Expense.objects.latest('created_at')
        self.assertEqual(expense.created_by, account_user)

    def test_non_admin_only_sees_own_expenses(self):
        # Create expenses with different creators
        Expense.objects.create(amount=10.0, category='Operativo', created_by=self.admin_user)
        Expense.objects.create(amount=20.0, category='Operativo', created_by=self.client_user)

        self.authenticate_user(self.client_user)
        response = self.client.get('/shein_shop/api_data/expense/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated results
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(float(results[0]['amount']), 20.0)
