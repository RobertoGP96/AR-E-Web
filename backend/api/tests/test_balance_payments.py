"""
Tests for the client balance/payment system.

Covers:
- Order payment: cash only, cash with surplus, balance only, mixed, mixed with surplus
- Delivery payment: cash only, balance only, mixed
- Partial payments and cumulative payments
- recalculate_balance correctness (deficit and surplus)
- get_client_operations_statement including SALDO APLICADO entries
- Running balance (saldo corriente) per operation row

Key formula (RN-021 2.0.0, ADR-0009 — doc/procesos/reglas/pagos.md):
    per item: covered = cash + applied; surplus = max(0, covered − cost);
              pending = max(0, cost − covered)
    balance (saldo a favor) = max(0, Σ surplus − Σ applied)   -> CustomUser.balance (>= 0)
    debt    (deuda)         = Σ pending                        -> CustomUser.debt
    net     (posición neta) = Σ cash − Σ cost  (the 1.x formula; statement running balance)
    NOTE: balance_applied is NOT cash; it consumes credit and reduces the item's debt.
"""

import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save

from api.models import Order, DeliverReceip, Category
from api.notifications.signals_notifications import notify_order_created
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
    """Create an order whose total_costs field is set directly (no products needed).

    Disconnects the notification signal to avoid IntegrityError when no agent is assigned.
    """
    post_save.disconnect(notify_order_created, sender=Order)
    try:
        order = Order.objects.create(client=client)
    finally:
        post_save.connect(notify_order_created, sender=Order)
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
    """Cash payment that matches the order cost exactly."""

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
    """Cash payment that exceeds the order cost → balance increases."""

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
    """Order paid entirely with client balance (no cash).

    Now that the early-return bug is fixed, add_received_value(0, applied_balance=X)
    correctly registers the balance_applied without requiring cash > 0.
    """

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)

    def test_balance_only_payment_via_method(self):
        self.order.add_received_value(0, applied_balance=100.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 0.0)
        self.assertEqual(self.order.balance_applied, 100.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_balance_only_recalculate_gives_negative(self):
        """balance_applied is NOT cash: no credit, and the order is covered → no debt (net −100)."""
        self.order.add_received_value(0, applied_balance=100.0)
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()

        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 0.0)
        self.assertEqual(self.client_user.net_position, 0.0)


class OrderPaymentMixedTest(TestCase):
    """Order paid with a mix of cash and applied balance."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=150.0)

    def test_mixed_payment_marks_paid(self):
        self.order.add_received_value(100.0, applied_balance=50.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 100.0)
        self.assertEqual(self.order.balance_applied, 50.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_mixed_payment_recalculate_balance(self):
        """Cash 100 + applied 50 cover the 150: no credit and no debt."""
        self.order.add_received_value(100.0, applied_balance=50.0)
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 0.0)


class OrderPaymentMixedWithSurplusTest(TestCase):
    """Mixed payment where cash alone exceeds cost."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)

    def test_mixed_surplus_marks_paid(self):
        # 120 cash + 30 balance = 150 > 100
        self.order.add_received_value(120.0, applied_balance=30.0)
        self.order.refresh_from_db()

        self.assertEqual(self.order.received_value_of_client, 120.0)
        self.assertEqual(self.order.balance_applied, 30.0)
        self.assertEqual(self.order.pay_status, "Pagado")

    def test_mixed_surplus_balance_is_positive(self):
        """Surplus 50 (150 covered − 100) minus the 30 applied → credit 20."""
        self.order.add_received_value(120.0, applied_balance=30.0)
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 20.0)


# ---------------------------------------------------------------------------
# Delivery payment tests
# ---------------------------------------------------------------------------

class DeliveryPaymentCashOnlyTest(TestCase):
    """Delivery paid entirely with cash."""

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
    """Delivery paid entirely with client balance (no cash).

    Now that the early-return bug is fixed, add_payment_amount(0, applied_balance=X)
    correctly registers the balance without requiring cash > 0.
    """

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=50.0)

    def test_balance_only_payment_via_method(self):
        self.delivery.add_payment_amount(0, applied_balance=50.0)
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.payment_amount, 0.0)
        self.assertEqual(self.delivery.balance_applied, 50.0)
        self.assertEqual(self.delivery.payment_status, "Pagado")

    def test_balance_only_recalculate_gives_negative(self):
        """balance_applied is NOT cash: no credit; the delivery is covered → no debt."""
        self.delivery.add_payment_amount(0, applied_balance=50.0)
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 0.0)


class DeliveryPaymentMixedTest(TestCase):
    """Delivery paid with mixed cash and balance."""

    def setUp(self):
        self.client_user = make_client()
        self.delivery = make_delivery(self.client_user, weight_cost=80.0)

    def test_mixed_payment_marks_paid(self):
        self.delivery.add_payment_amount(50.0, applied_balance=30.0)
        self.delivery.refresh_from_db()

        self.assertEqual(self.delivery.payment_amount, 50.0)
        self.assertEqual(self.delivery.balance_applied, 30.0)
        self.assertEqual(self.delivery.payment_status, "Pagado")

    def test_mixed_payment_recalculate_balance(self):
        """Cash 50 + applied 30 cover the 80: no credit and no debt."""
        self.delivery.add_payment_amount(50.0, applied_balance=30.0)
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 0.0)


# ---------------------------------------------------------------------------
# Partial & cumulative payment tests
# ---------------------------------------------------------------------------

class OrderPartialPaymentTest(TestCase):
    """Partial payment that doesn't cover the full cost."""

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=200.0)

    def test_partial_payment_sets_parcial_status(self):
        self.order.add_received_value(50.0, applied_balance=30.0)
        self.order.refresh_from_db()
        self.assertEqual(self.order.pay_status, "Parcial")

    def test_partial_payment_values_stored_correctly(self):
        self.order.add_received_value(50.0, applied_balance=30.0)
        self.order.refresh_from_db()
        self.assertEqual(self.order.received_value_of_client, 50.0)
        self.assertEqual(self.order.balance_applied, 30.0)


class OrderCumulativePaymentsTest(TestCase):
    """Multiple add_received_value calls accumulate correctly."""

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
    """recalculate_balance stores the debt in `debt` and keeps `balance` at 0.

    Order: pending 200 − 100 − 50 = 50; delivery: pending 80 − 40 − 20 = 20.
    balance_applied is NOT counted as cash (no surplus anywhere → credit 0).
    """

    def setUp(self):
        self.client_user = make_client()

        # Order: cost=200, received=100 cash, balance_applied=50
        self.order = make_order(self.client_user, total_costs=200.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=100.0,
            balance_applied=50.0,
        )

        # Delivery: cost=80, payment_amount=40 cash, balance_applied=20
        self.delivery = make_delivery(self.client_user, weight_cost=80.0)
        DeliverReceip.objects.filter(pk=self.delivery.pk).update(
            payment_amount=40.0,
            balance_applied=20.0,
        )

    def test_recalculate_balance_debt(self):
        # credit: no item is overpaid → 0; debt: 50 + 20 = 70
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 70.0)

    def test_recalculate_balance_saves_to_db(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance, 0.0)
        self.assertEqual(self.client_user.debt, 70.0)
        # net position (1.x formula): (100 + 40) − (200 + 80) = −140 ≠ balance − debt
        # because the applied balance (70) has no surplus backing it (RN-021-10).
        self.assertEqual(self.client_user.net_position, -70.0)

    def test_balance_status_is_deuda(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance_status, "DEUDA")


class RecalculateBalanceSurplusTest(TestCase):
    """recalculate_balance produces a positive balance (surplus)."""

    def setUp(self):
        self.client_user = make_client()

        # Order: cost=100, received=150 cash, balance_applied=0
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=150.0,
            balance_applied=0.0,
        )

    def test_recalculate_balance_surplus(self):
        # (150) - (100) = 50
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 50.0)

    def test_balance_status_is_saldo_a_favor(self):
        self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.balance_status, "SALDO A FAVOR")


class RecalculateBalanceZeroTest(TestCase):
    """recalculate_balance returns 0 when cash paid exactly equals costs."""

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


class RecalculateBalanceDoesNotDoubleCountTest(TestCase):
    """REGRESSION: Ensure balance_applied is NOT double-counted.

    If balance_applied were added to the received side, balance would
    be higher than expected. This test guards against that bug.
    """

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=60.0,
            balance_applied=40.0,
        )

    def test_balance_ignores_balance_applied(self):
        # 60 cash + 40 applied cover the 100: no debt, and the applied 40 is
        # NOT credit (it would be double-counting) → balance 0.
        new_balance = self.client_user.recalculate_balance()
        self.client_user.refresh_from_db()
        self.assertEqual(new_balance, 0.0)
        self.assertEqual(self.client_user.debt, 0.0)


class RecalculateBalanceNoTransactionsTest(TestCase):
    """recalculate_balance returns 0 for a client with no activity."""

    def setUp(self):
        self.client_user = make_client()

    def test_zero_balance_with_no_activity(self):
        new_balance = self.client_user.recalculate_balance()
        self.assertEqual(new_balance, 0.0)


# ---------------------------------------------------------------------------
# Operations statement tests
# ---------------------------------------------------------------------------

class OperationsStatementBalanceAppliedTest(TestCase):
    """Statement includes SALDO APLICADO rows for orders with balance_applied."""

    def setUp(self):
        self.client_user = make_client()
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

    def test_saldo_aplicado_shows_as_debit(self):
        """SALDO APLICADO rows have debit=balance_applied, credit=0."""
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(len(saldo_ops), 1)
        self.assertEqual(saldo_ops[0]["debit"], 50.0)
        self.assertEqual(saldo_ops[0]["credit"], 0.0)

    def test_summary_excludes_saldo_aplicado(self):
        """Summary totals only count cash operations (not SALDO APLICADO)."""
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        # total_credits = 100 (payment cash only)
        # total_debits = 200 (order creation)
        # final_balance = 100 - 200 = -100
        self.assertEqual(summary["total_credits"], 100.0)
        self.assertEqual(summary["total_debits"], 200.0)
        self.assertEqual(summary["final_balance"], -100.0)

    def test_statement_status_is_deuda(self):
        result = get_client_operations_statement(self.client_user.pk)
        self.assertEqual(result["statement"]["summary"]["status"], "DEUDA")


class OperationsStatementRunningBalanceTest(TestCase):
    """Running balance (saldo corriente) is correct per operation row.

    SALDO APLICADO rows do NOT change the running balance.
    """

    def setUp(self):
        self.client_user = make_client()
        self.order = make_order(self.client_user, total_costs=200.0)
        Order.objects.filter(pk=self.order.pk).update(
            received_value_of_client=150.0,
            balance_applied=50.0,
            pay_status="Pagado",
        )

    def test_running_balance_saldo_aplicado_does_not_change_balance(self):
        """SALDO APLICADO rows must NOT change the running balance."""
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]

        # Find the SALDO APLICADO row and the operation immediately before it
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(len(saldo_ops), 1)

        saldo_idx = next(i for i, op in enumerate(operations) if op["type"] == "SALDO APLICADO")
        prev_balance = operations[saldo_idx - 1]["balance"] if saldo_idx > 0 else 0.0

        # SALDO APLICADO should carry the same running balance as the previous row
        self.assertEqual(saldo_ops[0]["balance"], prev_balance)

    def test_final_balance_only_counts_cash(self):
        """Summary final_balance = cash_credits - cash_debits (ignoring SALDO APLICADO)."""
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        # credits: 150 (cash), debits: 200 (order cost)
        # SALDO APLICADO (50) excluded → final = 150 - 200 = -50
        self.assertEqual(summary["final_balance"], -50.0)


class OperationsStatementDeliveryBalanceAppliedTest(TestCase):
    """Statement includes SALDO APLICADO for delivery payments."""

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

    def test_delivery_saldo_aplicado_shows_as_debit(self):
        result = get_client_operations_statement(self.client_user.pk)
        operations = result["statement"]["operations"]
        saldo_ops = [op for op in operations if op["type"] == "SALDO APLICADO"]
        self.assertEqual(saldo_ops[0]["debit"], 30.0)
        self.assertEqual(saldo_ops[0]["credit"], 0.0)

    def test_delivery_final_balance_correct(self):
        result = get_client_operations_statement(self.client_user.pk)
        summary = result["statement"]["summary"]
        # debits: 80 (delivery creation), credits: 50 (cash payment)
        # SALDO APLICADO excluded → final = 50 - 80 = -30
        self.assertEqual(summary["final_balance"], -30.0)


class OperationsStatementNoBalanceAppliedTest(TestCase):
    """No SALDO APLICADO rows when no balance was applied."""

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


class OperationsStatementSurplusTest(TestCase):
    """Statement reflects surplus correctly."""

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


class OperationsStatementNotFoundTest(TestCase):
    """get_client_operations_statement handles missing client gracefully."""

    def test_nonexistent_client_returns_error(self):
        result = get_client_operations_statement(999999)
        self.assertIn("error", result)


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
            received_value_of_client=100.0, balance_applied=0.0)
        order.refresh_from_db()
        self.assertEqual(order.balance, 0.0)

    def test_balance_property_surplus(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=120.0, balance_applied=0.0)
        order.refresh_from_db()
        self.assertEqual(order.balance, 20.0)

    def test_balance_property_deficit(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=60.0, balance_applied=0.0)
        order.refresh_from_db()
        self.assertEqual(order.balance, -40.0)

    def test_balance_property_mixed_payment(self):
        order = make_order(self.client_user, total_costs=100.0)
        Order.objects.filter(pk=order.pk).update(
            received_value_of_client=60.0, balance_applied=40.0)
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
        # RN-021 2.0.0: client B owes 50 (debt) and has no credit, even though
        # client A has a 100 surplus.
        balance_b = self.client_b.recalculate_balance()
        self.client_b.refresh_from_db()
        self.assertEqual(balance_b, 0.0)
        self.assertEqual(self.client_b.debt, 50.0)
        self.assertEqual(self.client_b.net_position, -50.0)
