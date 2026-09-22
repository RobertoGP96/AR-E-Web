/**
 * ES-entrega — fases y máquina de estados de la entrega (INV-006).
 * Módulo puro. La «bolsa» es una entrega Pendiente con peso 0 (INV-003):
 * no tiene transiciones hasta que se pesa.
 *
 *   En preparación ──(pesar)──▶ Pendiente ──(despachar)──▶ En transito ──(entregar)──▶ Entregado
 *                               │                           │
 *                               └──(entregar directo)───────┼──(fallida)──▶ Fallida ──(reintentar)──▶ En transito
 *                               ◀──(devolver a pendiente)───┘
 *   Entregado | Fallida ──(reabrir, solo admin)──▶ Pendiente
 */
export const DELIVERY_STATUSES = [
  'Pendiente',
  'En transito',
  'Entregado',
  'Fallida',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DeliveryPhase = 'En preparación' | DeliveryStatus;
export const DELIVERY_PHASES: readonly DeliveryPhase[] = [
  'En preparación',
  ...DELIVERY_STATUSES,
];

/** Filtro Prisma de bolsa abierta. */
export const OPEN_BAG_FILTER = { status: 'Pendiente', weight: 0 } as const;

export function isDeliveryStatus(value: string): value is DeliveryStatus {
  return (DELIVERY_STATUSES as readonly string[]).includes(value);
}

export function deliveryPhase(d: { status: string; weight: number }): DeliveryPhase {
  if (d.status === 'Pendiente' && d.weight === 0) return 'En preparación';
  return isDeliveryStatus(d.status) ? d.status : 'Pendiente';
}

/** Condición Prisma equivalente a una fase (objeto plano). */
export function phaseWhere(phase: DeliveryPhase): Record<string, unknown> {
  if (phase === 'En preparación') return { ...OPEN_BAG_FILTER };
  if (phase === 'Pendiente') return { status: 'Pendiente', weight: { gt: 0 } };
  return { status: phase };
}

export type DeliveryAction =
  | 'dispatch'
  | 'deliver'
  | 'fail'
  | 'retry'
  | 'undispatch'
  | 'reopen';

interface Transition {
  from: readonly DeliveryStatus[];
  to: DeliveryStatus;
  roles: readonly string[];
  label: string;
  needsWeight: boolean;
  needsProducts: boolean;
}

const STAFF = ['admin', 'logistical'] as const;

const TRANSITIONS: Record<DeliveryAction, Transition> = {
  dispatch: {
    from: ['Pendiente'],
    to: 'En transito',
    roles: STAFF,
    label: 'Despachar',
    needsWeight: true,
    needsProducts: true,
  },
  deliver: {
    from: ['Pendiente', 'En transito'],
    to: 'Entregado',
    roles: STAFF,
    label: 'Marcar entregada',
    needsWeight: true,
    needsProducts: true,
  },
  fail: {
    from: ['En transito'],
    to: 'Fallida',
    roles: STAFF,
    label: 'Marcar fallida',
    needsWeight: false,
    needsProducts: false,
  },
  retry: {
    from: ['Fallida'],
    to: 'En transito',
    roles: STAFF,
    label: 'Reintentar entrega',
    needsWeight: true,
    needsProducts: false,
  },
  undispatch: {
    from: ['En transito'],
    to: 'Pendiente',
    roles: STAFF,
    label: 'Devolver a pendiente',
    needsWeight: false,
    needsProducts: false,
  },
  reopen: {
    from: ['Entregado', 'Fallida'],
    to: 'Pendiente',
    roles: ['admin'],
    label: 'Reabrir',
    needsWeight: false,
    needsProducts: false,
  },
};

export interface DeliveryState {
  status: string;
  weight: number;
  productCount: number;
}

export function nextDeliveryStatus(
  d: DeliveryState,
  action: DeliveryAction,
  role: string
): { ok: true; to: DeliveryStatus } | { ok: false; error: string } {
  const t = TRANSITIONS[action];
  if (!t) return { ok: false, error: 'Acción desconocida' };
  if (!t.roles.includes(role)) {
    return { ok: false, error: `Solo ${t.roles.join(' o ')} puede «${t.label}»` };
  }
  if (deliveryPhase(d) === 'En preparación') {
    return {
      ok: false,
      error: 'La bolsa aún no está pesada: pésala y ciérrala antes',
    };
  }
  if (!isDeliveryStatus(d.status) || !t.from.includes(d.status)) {
    return {
      ok: false,
      error: `No se puede «${t.label}» una entrega en estado «${d.status}»`,
    };
  }
  if (t.needsWeight && !(d.weight > 0)) {
    return { ok: false, error: 'La entrega no tiene peso registrado' };
  }
  if (t.needsProducts && d.productCount <= 0) {
    return { ok: false, error: 'La entrega no tiene productos' };
  }
  return { ok: true, to: t.to };
}

export function deliveryActionsFor(
  d: DeliveryState,
  role: string
): { action: DeliveryAction; label: string; to: DeliveryStatus }[] {
  return (Object.keys(TRANSITIONS) as DeliveryAction[])
    .filter((a) => nextDeliveryStatus(d, a, role).ok)
    .map((a) => ({ action: a, label: TRANSITIONS[a].label, to: TRANSITIONS[a].to }));
}

/** RN-011: solo entrar o salir de «Entregado» cambia el estado de los productos. */
export function affectsProductStatus(from: string, to: string): boolean {
  return from === 'Entregado' || to === 'Entregado';
}

export function deliveryActionLabel(action: DeliveryAction): string {
  return TRANSITIONS[action].label;
}
