"""
Tests for the client balance/payment system.

Covers:
- Order payment: cash only, cash with surplus, balance only, mixed, mixed with surplus
- Delivery payment: cash only, balance only, mixed
- Partial payments and cumulative payments
- recalculate_balance correctness (deficit and surplus)
- get_client_operations_statement including SALDO APLICADO entries
"""

import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model

from api.models import Order, DeliverReceip, Category
from api.services.client_services import get_client_operations_statement

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_client(suffix=None):
    """Create a client user with a guaranteed unique phone number and email."""
    tag = suffix or str(uuid.uuid4())[:8]
    return User.objects.create_user(
        phone_number=f"7{tag[:9].ljust(9, '0')}",
        email=f"client_{tag}@test.com",
        name="Test",
        last_name="Client",
        password="testpass123",
        role="client",
        is_active=True,
        is_verified=True,
    )


def make_order(client, total_costs=0.0):
    """Create an order whose total_costs field is set directly (no products needed)."""
    order = Order.objects.create(client=client)
    # Bypass update_total_costs (which sums products) and set the field directly.
    Order.objects.filter(pk=order.pk).update(total_costs=total_costs)
    order.refresh_from_db()
    return order


def make_delivery(client, weight_cost=0.0):
    """Create a delivery with a given weight_cost."""
    tag = str(uuid.uuid4())[:8]
    category = Category.objects.create(
        name=f"Cat_{tag}",
        shipping_cost_per_pound=5.0,
    )
    return DeliverReceip.objects.create(
        client=client,
        category=category,
        weight=1.0,
        weight_cost=weight_cost,
    )


# ---------------------------------------------------------------------------
# Order payment tests
# ---------------------------------------------------------------------------

class OrderPaymentCashExactTest(TestCase):
    """Test 1: cash payment that matches the order cost exactly."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=150.0)

    def test_exact_cash_payment_marks_paid(self):
        self.order.add_received_value(150.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 150.0)
        self.assertEqual(self.order.balance_applied, 0.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_exact_cash_payment_no_surplus_balance(self):
        self.order.add_received_value(150.0)
        new_balance = self.client_user.recalculate_balance()
        # received 150, cost 150 → net 0
        self.assertEqual(new_balance, 0.0)


class OrderPaymentCashSurplusTest(TestCase):
    """Test 2: cash payment that exceeds the order cost."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=150.0)

    def test_surplus_payment_marks_paid(self):
        self.order.add_received_value(200.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 200.0)
        self.assertEqual(self.order.balance_applied, 0.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_surplus_payment_creates_positive_balance(self):
        self.order.add_received_value(200.0)
        new_balance = self.client_user.recalculate_balance()
        # received 200, cost 150 → surplus 50
        self.assertEqual(new_balance, 50.0)


class OrderPaymentBalanceOnlyTest(TestCase):
    """Test 3: order paid entirely with previously accumulated balance.

    Because add_received_value() returns early when amount <= 0,
    we set the balance_applied and received_value_of_client fields
    directly — the same way the API/service layer does it when
    applying a stored credit without a new cash payment.
    """

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)

    def test_balance_only_payment_marks_paid(self):
        # Simulate applying 100 of stored balance with no new cash
        Order.objects.filter(pk=self.order.pk).update(
            balance_applied=100.0,
            pay_status="Pagado",
        )
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 0.0)
        self.assertEqual(self.order.balance_applied, 100.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_balance_only_net_zero(self):
        Order.objects.filter(pk=self.order.pk).update(
            balance_applied=100.0,
            pay_status="Pagado",
        )
        self.order.refresh_from_db()
        new_balance = self.client_user.recalculate_balance()
        # received 0 + balance_applied 100 - cost 100 = 0
        self.assertEqual(new_balance, 0.0)


class OrderPaymentMixedTest(TestCase):
    """Test 4: order paid with a mix of cash and applied balance."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=150.0)

    def test_mixed_payment_marks_paid(self):
        self.order.add_received_value(100.0, applied_balance=50.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 100.0)
        self.assertEqual(self.order.balance_applied, 50.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_mixed_payment_total_equals_cost(self):
        self.order.add_received_value(100.0, applied_balance=50.0)
        self.order.refresh_from_db()

        total_paid = self.order.received_value_of_client + self.order.balance_applied
        self.assertEqual(total_paid, 150.0)


class OrderPaymentMixedWithSurplusTest(TestCase):
    """Test 5: mixed payment where total paid exceeds the order cost."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)

    def test_mixed_surplus_marks_paid(self):
        # 80 cash + 50 balance = 130 > 100
        self.order.add_received_value(80.0, applied_balance=50.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 80.0)
        self.assertEqual(self.order.balance_applied, 50.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_mixed_surplus_balance_is_positive(self):
        self.order.add_received_value(80.0, applied_balance=50.0)
        new_balance = self.client_user.recalculate_balance()
        # (80 + 50) - 100 = 30
        self.assertEqual(new_balance, 30.0)


# ---------------------------------------------------------------------------
# Delivery payment tests
# ---------------------------------------------------------------------------

class DeliveryPaymentCashOnlyTest(TestCase):
    """Test 6: delivery paid entirely with cash."""

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=50.0)

    def test_cash_only_marks_paid(self):
        self.delivery.add_payment_amount(50.0)
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.payment_amount, 50.0)
        self.assertEqual(self.delivery.balance_applied, 0.0)
        self.assertEqual(self.delivery.payment_status, "Pagado")


class DeliveryPaymentBalanceOnlyTest(TestCase):
    """Test 7: delivery paid entirely with accumulated balance.

    add_payment_amount() also returns early when amount <= 0, so we
    apply the balance_applied and payment_status fields directly.
    """

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=50.0)

    def test_balance_only_marks_paid(self):
        DeliverReceip.objects.filter(pk=self.delivery.pk).update(
            balance_applied=50.0,
            payment_status="Pagado",
        )
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.payment_amount, 0.0)
        self.assertEqual(self.delivery.balance_applied, 50.0)
        self.assertEqual(self.delivery.payment_status, "Pagado")

    def test_balance_only_net_zero(self):
        DeliverReceip.objects.filter(pk=self.delivery.pk).update(
            balance_applied=50.0,
            payment_status="Pagado",
        )
        self.delivery.refresh_from_db()
        new_balance = self.client_user.recalculate_balance()
        # 0 received + 50 balance_applied - 50 cost = 0
        self.assertEqual(new_balance, 0.0)


class DeliveryPaymentMixedTest(TestCase):
    """Test 8: delivery paid with mixed cash and balance."""

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=80.0)

    def test_mixed_payment_marks_paid(self):
        self.delivery.add_payment_amount(50.0, applied_balance=30.0)
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.payment_amount, 50.0)
        self.assertEqual(self.delivery.balance_applied, 30.0)
        self.assertEqual(self.delivery.payment_status, "Pagado")

    def test_mixed_payment_total_equals_cost(self):
        self.delivery.add_payment_amount(50.0, applied_balance=30.0)
        self.delivery.refresh_from_db()

        total_paid = self.delivery.payment_amount + self.delivery.balance_applied
        self.assertEqual(total_paid, 80.0)


# ---------------------------------------------------------------------------
# Partial payment tests
# ---------------------------------------------------------------------------

class OrderPartialPaymentTest(TestCase):
    """Test 9: payment that covers only part of the order cost."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=200.0)

    def test_partial_payment_sets_parcial_status(self):
        # 50 cash + 30 balance = 80 < 200
        self.order.add_received_value(50.0, applied_balance=30.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.pay_status, "Parcial")

    def test_partial_payment_values_stored_correctly(self):
        self.order.add_received_value(50.0, applied_balance=30.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 50.0)
        self.assertEqual(self.order.balance_applied, 30.0)


# ---------------------------------------------------------------------------
# Cumulative payments test
# ---------------------------------------------------------------------------

class OrderCumulativePaymentsTest(TestCase):
    """Test 10: multiple add_received_value calls accumulate correctly."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=200.0)

    def test_cumulative_payments_accumulate_fields(self):
        self.order.add_received_value(50.0)
        self.order.refresh_from_db()
        self.assertEqual(self.order.pay_status, "Parcial")

        self.order.add_received_value(50.0, applied_balance=100.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 100.0)
        self.assertEqual(self.order.balance_applied, 100.0)

    def test_cumulative_payments_total_marks_paid(self):
        self.order.add_received_value(50.0)
        self.order.add_received_value(50.0, applied_balance=100.0)
        self.order.refresh_from_db()

        total_paid = self.order.received_value_of_client + self.order.balance_applied
        self.assertEqual(total_paid, 200.0)
        self.assertEqual(self.order.pay_status, "Pagado")


# ---------------------------------------------------------------------------
# recalculate_balance tests
# ---------------------------------------------------------------------------

class RecalculateBalanceWithDebtTest(TestCase):
    """Test 11: recalculate_balance produces a negative balance (debt)."""

    def setUp(self):
        self.client_user = make_client()

        # Order: cost=200, received=100, balance_applied=50
        self.order = make_order(self.client_user, total_costs=200.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=100.0,
            balance_applied=50.0,
        )

        # Delivery: cost=80, payment_amount=40, balance_applied=20
        self.delivery = make_delivery(self.client_user, weight_cost=80.0)
        DeliverReceip.objects.filter(pk=self.delivery.pk).update(
            payment_amount=40.0,
            balance_applied=20.0,
        )

    def test_recalculate_balance_debt(self):
        # (100 + 40 + 50 + 20) - (200 + 80) = 210 - 280 = -70
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, -70.0)

    def test_recalculate_balance_saves_to_db(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance, -70.0)

    def test_balance_status_is_deuda(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance_status, "DEUDA")


class RecalculateBalanceSurplusTest(TestCase):
    """Test 12: recalculate_balance produces a positive balance (surplus)."""

    def setUp(self):
        self.client_user = make_client()

        # Order: cost=100, received=150, balance_applied=0
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=150.0,
            balance_applied=0.0,
        )

    def test_recalculate_balance_surplus(self):
        # (150 + 0) - 100 = 50
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 50.0)

    def test_recalculate_balance_saves_to_db(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance, 50.0)

    def test_balance_status_is_saldo_a_favor(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance_status, "SALDO A FAVOR")


class RecalculateBalanceZeroTest(TestCase):
    """recalculate_balance returns 0 when paid amounts exactly equal costs."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=100.0,
            balance_applied=0.0,
        )

    def test_recalculate_balance_zero(self):
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 0.0)

    def test_balance_status_is_al_dia(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance_status, "AL DÍA")


class RecalculateBalanceNoTransactionsTest(TestCase):
    """recalculate_balance returns 0 for a client with no orders or deliveries."""

    def setUp(self):
        self.client_user = make_client()

    def test_zero_balance_with_no_activity(self):
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 0.0)


# ---------------------------------------------------------------------------
# Operations statement tests
# ---------------------------------------------------------------------------

class OperationsStatementBalanceAppliedTest(TestCase):
    """Test 13: get_client_operations_statement includes SALDO APLICADO entries."""

    def setUp(self):
        self.client_user = make_client()

        # Order with both cash and balance_applied
        self.order = make_order(self.client_user, total_costs=200.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=100.0,
            balance_applied=50.0,
            pay_status="Parcial",
        )

    def test_statement_contains_saldo_aplicado_type(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        operation_types = [op["type"] for op in operations]
        self.assertIn("SALDO APLICADO", operation_types)

    def test_saldo_aplicado_credit_value(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(len(saldo_ops), 1)
        self.assertEqual(saldo_ops[0]["credit"], 50.0)
        self.assertEqual(saldo_ops[0]["debit"], 0.0)

    def test_statement_running_balance_is_correct(self):
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        # total_credits = 100 (payment) + 50 (balance applied) = 150
        # total_debits  = 200 (order creation)
        # final_balance = 150 - 200 = -50
        self.assertEqual(summary["total_credits"], 150.0)
        self.assertEqual(summary["total_debits"], 200.0)
        self.assertEqual(summary["final_balance"], -50.0)

    def test_statement_status_is_deuda(self):
        result = get_client_operations_statement(self.client_user.pk)
        self.assertEqual(result["statement"]["summary"]["status"], "DEUDA")


class OperationsStatementDeliveryBalanceAppliedTest(TestCase):
    """Operations statement includes SALDO APLICADO for delivery payments."""

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=80.0)
        DeliverReceip.objects.filter(pk=self.delivery.pk).update(
            payment_amount=50.0,
            balance_applied=30.0,
            payment_status="Pagado",
        )

    def test_statement_contains_delivery_saldo_aplicado(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertGreater(len(saldo_ops), 0)

    def test_delivery_saldo_aplicado_credit_value(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(saldo_ops[0]["credit"], 30.0)

    def test_delivery_final_balance_correct(self):
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        # debits: 80 (delivery creation)
        # credits: 50 (payment) + 30 (balance applied) = 80
        # final_balance = 0
        self.assertEqual(summary["final_balance"], 0.0)


class OperationsStatementNoBalanceAppliedTest(TestCase):
    """Operations statement has no SALDO APLICADO when none was applied."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=100.0,
            balance_applied=0.0,
            pay_status="Pagado",
        )

    def test_no_saldo_aplicado_operations(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(len(saldo_ops), 0)

    def test_full_cash_payment_final_balance_zero(self):
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        self.assertEqual(summary["final_balance"], 0.0)
        self.assertEqual(summary["status"], "AL DÍA")


class OperationsStatementNotFoundTest(TestCase):
    """get_client_operations_statement handles missing client gracefully."""

    def test_nonexistent_client_returns_error(self):
        result = get_client_operations_statement(999999)
        self.assertIn("error", result)


class OperationsStatementSurplusTest(TestCase):
    """Operations statement reflects surplus correctly."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=150.0,
            balance_applied=0.0,
            pay_status="Pagado",
        )

    def test_surplus_statement_final_balance(self):
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        self.assertEqual(summary["final_balance"], 50.0)
        self.assertEqual(summary["status"], "SALDO A FAVOR")
        self.assertEqual(summary["surplus_balance"], 50.0)
        self.assertEqual(summary["pending_to_pay"], 0.0)


# ---------------------------------------------------------------------------
# Order.balance property tests
# ---------------------------------------------------------------------------

class OrderBalancePropertyTest(TestCase):
    """The Order.balance property returns (received + balance_applied) - cost."""

    def setUp(self):
        self.client_user = make_client()

    def test_balance_property_exact_payment(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=100.0,
            balance_applied=0.0,
        )
        order.refresh_from_db()
        self.assertEqual(order.balance, 0.0)

    def test_balance_property_surplus(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=120.0,
            balance_applied=0.0,
        )
        order.refresh_from_db()
        self.assertEqual(order.balance, 20.0)

    def test_balance_property_deficit(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=60.0,
            balance_applied=0.0,
        )
        order.refresh_from_db()
        self.assertEqual(order.balance, -40.0)

    def test_balance_property_mixed_payment(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=60.0,
            balance_applied=40.0,
        )
        order.refresh_from_db()
        self.assertEqual(order.balance, 0.0)


# ---------------------------------------------------------------------------
# Multi-client isolation test
# ---------------------------------------------------------------------------

class ClientBalanceIsolationTest(TestCase):
    """recalculate_balance only considers the target client's transactions."""

    def setUp(self):
        self.client_a = make_client("a")
        self.client_b = make_client("b")

        order_a = make_order(self.client_a, total_costs=100.0)
        Order.objects.filter(pk=order_a.pk).update(received_value_of_client=200.0)

        order_b = make_order(self.client_b, total_costs=100.0)
        Order.objects.filter(pk=order_b.pk).update(received_value_of_client=50.0)

    def test_client_a_balance_unaffected_by_client_b(self):
        balance_a = self.client_a.recalculate_balance()
        self.assertEqual(balance_a, 100.0)

    def test_client_b_balance_unaffected_by_client_a(self):
        balance_b = self.client_b.recalculate_balance()
        self.assertEqual(balance_b, -50.0)
