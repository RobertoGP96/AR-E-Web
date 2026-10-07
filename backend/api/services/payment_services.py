"""
RN-023 — Redistribución de un sobrepago (doc/procesos/reglas/pagos.md,
ADR-0008). Funciones PURAS, espejo de apps/admin-next/src/lib/surplus.ts y
verificadas por doc/procesos/casos/surplus-distribution.json.

Cuando el cliente paga en una orden o entrega más de lo que cuesta, el
exceso de EFECTIVO se reparte entre sus otras órdenes y entregas con
pendiente, de la más antigua a la más reciente. Lo que no alcance a
colocarse se queda en el origen como sobrepago (saldo a favor, RN-021).
El balance del cliente no cambia: solo se mueve efectivo entre partidas.

Django todavía no expone un endpoint que aplique el plan (deuda
documentada en conformidad.md); admin-next lo hace en
src/lib/surplus-redistribution.ts.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Mapping


def _round2(value: float) -> float:
    return round(float(value), 2)


def _parse_date(value: Any) -> float:
    """ISO 8601 → timestamp (segundos). Acepta datetime o str."""
    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value)
        if text.endswith('Z'):
            text = text[:-1] + '+00:00'
        dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp()


def _sort_key(target: Mapping[str, Any]):
    kind_rank = 0 if target['kind'] == 'order' else 1
    raw_id = str(target['id'])
    try:
        numeric_id = int(raw_id)
        id_key = (0, numeric_id, '')
    except ValueError:
        id_key = (1, 0, raw_id)
    return (_parse_date(target['date']), kind_rank, id_key)


def sort_surplus_targets(targets: Iterable[Mapping[str, Any]]) -> List[Mapping[str, Any]]:
    """Orden canónico: fecha ascendente; a igual fecha, órdenes antes que entregas; luego id."""
    return sorted(targets, key=_sort_key)


def plan_surplus_distribution(surplus: float, targets: Iterable[Mapping[str, Any]]) -> Dict[str, Any]:
    """
    Reparte `surplus` entre `targets` ({kind, id, pending, date}). Cada
    destino recibe min(restante, pendiente); se ignoran pendientes <= 0; se
    detiene cuando no queda nada. Devuelve {'allocations': [...], 'remaining': x}.
    """
    remaining = _round2(max(0.0, float(surplus)))
    allocations: List[Dict[str, Any]] = []
    if remaining <= 0:
        return {'allocations': allocations, 'remaining': 0.0}

    for target in sort_surplus_targets(targets):
        if remaining <= 0:
            break
        pending = _round2(target['pending'])
        if pending <= 0:
            continue
        amount = _round2(min(remaining, pending))
        if amount <= 0:
            continue
        allocations.append({'kind': target['kind'], 'id': str(target['id']), 'amount': amount})
        remaining = _round2(remaining - amount)

    return {'allocations': allocations, 'remaining': remaining}


def movable_surplus(cost: float, cash: float, balance_applied: float) -> float:
    """
    Exceso de EFECTIVO que puede moverse desde una partida: lo cobrado por
    encima del costo, pero nunca más que el efectivo registrado (el saldo
    aplicado no se mueve, RN-022).
    """
    excess = _round2(float(cash) + float(balance_applied) - float(cost))
    if excess <= 0:
        return 0.0
    return _round2(min(excess, max(0.0, float(cash))))
