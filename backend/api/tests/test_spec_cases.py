"""
Tests de conformidad con la especificación de procesos (doc/procesos/).

Consumen los vectores compartidos de doc/procesos/casos/*.json, los mismos
que ejecuta vitest en apps/admin-next/src/lib/spec-cases.test.ts. La misma
entrada debe producir la misma salida en Django y en admin-next.

Reglas cubiertas:
  - RN-010 / RN-011 estado de producto derivado  -> api.signals._determine_product_status
  - RN-001 costo de producto (formula pura)      -> api.services.purchases_service.calculate_product_buyed_cost
                                                    y ShoppingReceip._calculate_product_cost
  - RN-004 estimacion de compra parcial          -> mismas funciones, rama amount_buyed == amount_requested
  - RN-020 estado de pago                        -> Order.add_received_value (con BD SQLite de test)

Se ejecutan con pytest (pytest-django) o con `python manage.py test api.tests.test_spec_cases`.
"""
import json
import os
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

from django.test import SimpleTestCase, TestCase

from api.models import CustomUser, Order, ShoppingReceip
from api.services.purchases_service import calculate_product_buyed_cost
from api.signals import _determine_product_status

CASES_DIR = Path(__file__).resolve().parents[3] / 'doc' / 'procesos' / 'casos'


def load_cases(name):
    with open(CASES_DIR / name, encoding='utf-8') as fh:
        return json.load(fh)


def _fake_product_buyed(case_input, amount_buyed):
    """Construye objetos duck-typed con los campos que leen las funciones de costo."""
    product = SimpleNamespace(
        shop_cost=case_input['shopCost'],
        amount_requested=case_input['amountRequested'],
        shop_delivery_cost=case_input['shopDeliveryCost'],
        shop_taxes=case_input['shopTaxes'],
        charge_iva=case_input['chargeIva'],
        added_taxes=case_input['addedTaxes'],
        own_taxes=case_input['ownTaxes'],
        total_cost=-1.0,  # centinela: si se usa, la rama fue la incorrecta
    )
    return SimpleNamespace(original_product=product, amount_buyed=amount_buyed)


class ProductStatusSpecCasesTest(SimpleTestCase):
    """RN-010 / RN-011: doc/procesos/reglas/estados.md"""

    def test_hay_al_menos_diez_casos(self):
        self.assertGreaterEqual(len(load_cases('product-status.json')), 10)

    def test_determine_product_status_cumple_los_casos(self):
        for case in load_cases('product-status.json'):
            inp = case['input']
            # RN-011: para el estado solo cuentan las unidades en entregas
            # con estado Entregado. Cuando el caso no las distingue, cuentan
            # todas (RN-010).
            delivered = inp.get('amountDeliveredFinal', inp['amountDelivered'])
            with self.subTest(case['id']):
                status = _determine_product_status(
                    inp['amountPurchased'],
                    inp['amountReceived'],
                    delivered,
                    inp['amountRequested'],
                    'Encargado',
                )
                self.assertEqual(status, case['expected'], case['descripcion'])


class ProductCostSpecCasesTest(SimpleTestCase):
    """RN-001 / RN-004: doc/procesos/reglas/costos.md"""

    def test_hay_al_menos_seis_casos(self):
        self.assertGreaterEqual(len(load_cases('product-cost.json')), 6)

    def test_formula_del_servicio_de_compras_cumple_los_casos(self):
        for case in load_cases('product-cost.json'):
            inp = case['input']
            # amount_buyed distinto de amount_requested fuerza la rama que
            # recalcula con la formula (RN-004); usamos amount_buyed igual a
            # la cantidad del caso y amount_requested + 1 en el producto.
            fake = _fake_product_buyed(inp, amount_buyed=inp['amountRequested'])
            fake.original_product.amount_requested = inp['amountRequested'] + 1
            with self.subTest(case['id']):
                self.assertEqual(
                    calculate_product_buyed_cost(fake),
                    case['expected']['totalCost'],
                    case['descripcion'],
                )

    def test_formula_del_modelo_shopping_receip_cumple_los_casos(self):
        receip = ShoppingReceip()  # instancia sin guardar: el metodo no toca self
        for case in load_cases('product-cost.json'):
            inp = case['input']
            fake = _fake_product_buyed(inp, amount_buyed=inp['amountRequested'])
            fake.original_product.amount_requested = inp['amountRequested'] + 1
            with self.subTest(case['id']):
                self.assertEqual(
                    receip._calculate_product_cost(fake),
                    case['expected']['totalCost'],
                    case['descripcion'],
                )

    def test_rn_004_compra_completa_usa_total_cost_del_producto(self):
        """RN-004: si unidades compradas == pedidas se usa total_cost tal cual."""
        case = load_cases('product-cost.json')[0]
        fake = _fake_product_buyed(case['input'], amount_buyed=case['input']['amountRequested'])
        fake.original_product.total_cost = 999.99
        self.assertEqual(calculate_product_buyed_cost(fake), 999.99)
        self.assertEqual(ShoppingReceip()._calculate_product_cost(fake), 999.99)


class PayStatusSpecCasesTest(TestCase):
    """RN-020: doc/procesos/reglas/pagos.md (Order.add_received_value no es pura: usa BD)."""

    @classmethod
    def setUpTestData(cls):
        cls.client_user = CustomUser.objects.create_user(
            email='spec-client@test.com',
            phone_number='5550000001',
            password='testpass123',
            role='client',
            name='Spec',
            last_name='Client',
        )
        # Las ordenes se crean con sales_manager porque las señales de
        # notificacion (api/signals_notifications.py) fallan con
        # IntegrityError si la orden no tiene agente (bug B7 en
        # doc/procesos/conformidad.md). No es objeto de este test.
        cls.agent_user = CustomUser.objects.create_user(
            email='spec-agent@test.com',
            phone_number='5550000002',
            password='testpass123',
            role='agent',
            name='Spec',
            last_name='Agent',
        )

    def _new_order(self, total_costs):
        return Order.objects.create(
            client=self.client_user,
            sales_manager=self.agent_user,
            total_costs=total_costs,
        )

    def test_hay_al_menos_seis_casos(self):
        self.assertGreaterEqual(len(load_cases('pay-status.json')), 6)

    def test_add_received_value_cumple_los_casos(self):
        for case in load_cases('pay-status.json'):
            inp = case['input']
            with self.subTest(case['id']):
                order = self._new_order(inp['totalCosts'])
                # Pagos acumulativos: el efectivo y el saldo aplicado se suman
                # sobre la orden; con ambos en 0 la orden conserva el default.
                order.add_received_value(
                    inp['receivedValueOfClient'],
                    applied_balance=inp['balanceApplied'],
                )
                order.refresh_from_db()
                self.assertEqual(order.pay_status, case['expected'], case['descripcion'])
                self.assertEqual(
                    order.received_value_of_client,
                    round(inp['receivedValueOfClient'], 2),
                )
                self.assertEqual(order.balance_applied, round(inp['balanceApplied'], 2))

    def test_los_pagos_son_acumulativos(self):
        """RN-020: dos pagos parciales suman; el segundo completa la orden."""
        order = self._new_order(100)
        order.add_received_value(40)
        order.refresh_from_db()
        self.assertEqual(order.pay_status, 'Parcial')
        order.add_received_value(60)
        order.refresh_from_db()
        self.assertEqual(order.received_value_of_client, 100)
        self.assertEqual(order.pay_status, 'Pagado')
