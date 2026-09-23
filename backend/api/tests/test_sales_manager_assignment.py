"""
ADR-0007 — gestor (`sales_manager`) de una orden: cualquier miembro del
personal puede serlo; el agente siempre a su propio nombre; por defecto
el admin general. Espejo de `apps/admin-next/src/lib/order-manager.test.ts`.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Order
from api.serializers.orders_serializers import OrderCreateSerializer
from api.services.staff_service import (
    SALES_MANAGER_ROLES,
    get_general_admin,
    is_sales_manager_role,
    resolve_sales_manager,
)

User = get_user_model()


def make_user(phone, role, **extra):
    return User.objects.create_user(
        email=f'{role}{phone}@test.com',
        phone_number=phone,
        name=role.capitalize(),
        last_name=phone,
        password='testpass123',
        role=role,
        is_active=True,
        is_verified=True,
        **extra,
    )


class SalesManagerRulesTest(TestCase):
    def setUp(self):
        self.admin_old = make_user('1000000001', 'admin', is_staff=True)
        self.admin_super = make_user('1000000002', 'admin', is_staff=True, is_superuser=True)
        self.agent = make_user('1000000003', 'agent')
        self.accountant = make_user('1000000004', 'accountant')
        self.logistical = make_user('1000000005', 'logistical')
        self.client_user = make_user('1000000006', 'client', assigned_agent=self.agent)

    def test_staff_roles_can_manage_orders(self):
        self.assertEqual(SALES_MANAGER_ROLES, ('admin', 'agent', 'accountant', 'logistical'))
        for role in SALES_MANAGER_ROLES:
            self.assertTrue(is_sales_manager_role(role))
        self.assertFalse(is_sales_manager_role('client'))
        self.assertFalse(is_sales_manager_role('user'))

    def test_general_admin_prefers_superuser_then_oldest(self):
        self.assertEqual(get_general_admin(), self.admin_super)
        self.admin_super.is_active = False
        self.admin_super.save(update_fields=['is_active'])
        self.assertEqual(get_general_admin(), self.admin_old)

    def test_agent_always_manages_own_orders(self):
        self.assertEqual(resolve_sales_manager(self.agent, self.accountant), self.agent)
        self.assertEqual(resolve_sales_manager(self.agent, None), self.agent)

    def test_admin_keeps_requested_staff_or_falls_back_to_general_admin(self):
        self.assertEqual(resolve_sales_manager(self.admin_old, self.logistical), self.logistical)
        self.assertEqual(resolve_sales_manager(self.admin_old, None), self.admin_super)

    def test_no_general_admin_gives_none(self):
        User.objects.filter(role='admin').update(is_active=False)
        self.assertIsNone(resolve_sales_manager(self.accountant, None))


class SalesManagerSerializerTest(TestCase):
    def setUp(self):
        self.admin = make_user('2000000001', 'admin', is_staff=True, is_superuser=True)
        self.agent = make_user('2000000002', 'agent')
        self.accountant = make_user('2000000003', 'accountant')
        self.client_user = make_user('2000000004', 'client', assigned_agent=self.agent)

    def test_validator_accepts_staff_and_rejects_clients(self):
        for staff in (self.admin, self.agent, self.accountant):
            ser = OrderCreateSerializer(data={'client_id': self.client_user.id, 'sales_manager_id': staff.id})
            self.assertTrue(ser.is_valid(), ser.errors)
        ser = OrderCreateSerializer(data={'client_id': self.client_user.id, 'sales_manager_id': self.client_user.id})
        self.assertFalse(ser.is_valid())
        self.assertIn('sales_manager_id', ser.errors)

    def test_create_without_manager_defaults_to_general_admin(self):
        ser = OrderCreateSerializer(data={'client_id': self.client_user.id})
        self.assertTrue(ser.is_valid(), ser.errors)
        order = ser.save()
        self.assertEqual(order.sales_manager, self.admin)

    def test_agent_creating_via_api_is_the_manager(self):
        api = APIClient()
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.agent).access_token}')
        resp = api.post(
            '/arye_system/api_data/order/',
            {'client_id': self.client_user.id, 'sales_manager_id': self.accountant.id},
            format='json',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(Order.objects.get(id=resp.data['id']).sales_manager, self.agent)

    def test_admin_can_reassign_manager_to_staff_via_patch(self):
        order = Order.objects.create(client=self.client_user, sales_manager=self.agent)
        api = APIClient()
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.admin).access_token}')
        resp = api.patch(
            f'/arye_system/api_data/order/{order.id}/',
            {'sales_manager_id': self.accountant.id},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        order.refresh_from_db()
        self.assertEqual(order.sales_manager, self.accountant)
        # Un cliente no puede ser gestor tampoco al editar.
        resp = api.patch(
            f'/arye_system/api_data/order/{order.id}/',
            {'sales_manager_id': self.client_user.id},
            format='json',
        )
        self.assertEqual(resp.status_code, 400, resp.content)
