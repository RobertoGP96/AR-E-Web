"""
RN-021 (2.0.0, ADR-0009) — Saldo a favor y deuda del cliente.

`compute_client_balance` es PURA, espejo de
apps/admin-next/src/lib/client-balance.ts y verificada por
doc/procesos/casos/client-balance.json. Cada orden y cada entrega del
cliente es una partida con costo, efectivo cobrado y saldo aplicado:

    cubierto  = round2(efectivo + saldo_aplicado)
    sobrepago = max(0, round2(cubierto − costo))
    pendiente = max(0, round2(costo − cubierto))

    balance (saldo a favor) = max(0, round2(Σ sobrepago − Σ saldo_aplicado))
    debt    (deuda)         = round2(Σ pendiente)
    net     (posición neta) = round2(Σ efectivo − Σ costo)

`balance` es lo que se puede aplicar a otra partida (RN-022); `debt` lo
que el cliente debe; `net` es la fórmula de RN-021 1.x (balance − debt
salvo con datos históricos inconsistentes, caso RN-021-10).

Las funciones con sufijo `_for_client` leen la base de datos y las usan
`CustomUser.recalculate_balance`, las señales y los reportes.
(`balance_service.py` es otra cosa: el generador de balances por período.)
"""
from typing import Any, Dict, Iterable, List, Mapping


def _round2(value: Any) -> float:
    return round(float(value or 0.0), 2)


def compute_client_balance(items: Iterable[Mapping[str, Any]]) -> Dict[str, float]:
    surplus = 0.0
    applied = 0.0
    pending = 0.0
    cash = 0.0
    cost = 0.0
    for raw in items:
        item_cost = _round2(raw.get('cost'))
        item_cash = _round2(raw.get('cash'))
        item_applied = _round2(raw.get('applied'))
        covered = _round2(item_cash + item_applied)
        surplus += max(0.0, _round2(covered - item_cost))
        pending += max(0.0, _round2(item_cost - covered))
        applied += item_applied
        cash += item_cash
        cost += item_cost
    return {
        'balance': max(0.0, _round2(surplus - applied)),
        'debt': _round2(pending),
        'net': _round2(cash - cost),
    }


def balance_status(balance: float, debt: float) -> str:
    """DEUDA manda sobre SALDO A FAVOR; si no hay ninguno, AL DÍA."""
    if _round2(debt) > 0.0:
        return 'DEUDA'
    if _round2(balance) > 0.0:
        return 'SALDO A FAVOR'
    return 'AL DÍA'


def balance_items_for_client(client) -> List[Dict[str, Any]]:
    """Partidas (órdenes y entregas) del cliente tal como las lee RN-021."""
    from api.models.orders import Order
    from api.models.deliveries import DeliverReceip

    items: List[Dict[str, Any]] = []
    for cost, cash, applied in Order.objects.filter(client=client).values_list(
        'total_costs', 'received_value_of_client', 'balance_applied'
    ):
        items.append({'kind': 'order', 'cost': cost, 'cash': cash, 'applied': applied})
    for cost, cash, applied in DeliverReceip.objects.filter(client=client).values_list(
        'weight_cost', 'payment_amount', 'balance_applied'
    ):
        items.append({'kind': 'delivery', 'cost': cost, 'cash': cash, 'applied': applied})
    return items


def compute_balance_for_client(client) -> Dict[str, float]:
    return compute_client_balance(balance_items_for_client(client))


def balance_items_by_client(client_ids: Iterable[int]) -> Dict[int, List[Dict[str, Any]]]:
    """Partidas agrupadas por cliente, en dos consultas (reportes de varios clientes)."""
    from api.models.orders import Order
    from api.models.deliveries import DeliverReceip

    ids = list(client_ids)
    grouped: Dict[int, List[Dict[str, Any]]] = {cid: [] for cid in ids}
    for cid, cost, cash, applied in Order.objects.filter(client_id__in=ids).values_list(
        'client_id', 'total_costs', 'received_value_of_client', 'balance_applied'
    ):
        grouped.setdefault(cid, []).append({'kind': 'order', 'cost': cost, 'cash': cash, 'applied': applied})
    for cid, cost, cash, applied in DeliverReceip.objects.filter(client_id__in=ids).values_list(
        'client_id', 'weight_cost', 'payment_amount', 'balance_applied'
    ):
        grouped.setdefault(cid, []).append({'kind': 'delivery', 'cost': cost, 'cash': cash, 'applied': applied})
    return grouped
