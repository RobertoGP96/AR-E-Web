/**
 * ES-paquete — máquina de estados del paquete (INV-006). Módulo puro.
 *
 *   Enviado ──(primera llegada, automático)──▶ Recibido ──(terminar revisión)──▶ Procesado
 *                                                  ▲──────────(reabrir, solo admin)────────┘
 */
export const PACKAGE_STATUSES = ['Enviado', 'Recibido', 'Procesado'] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export type PackageAction = 'receive' | 'finish' | 'reopen';

interface Transition {
  from: readonly PackageStatus[];
  to: PackageStatus;
  roles: readonly string[];
  label: string;
}

const TRANSITIONS: Record<PackageAction, Transition> = {
  receive: {
    from: ['Enviado'],
    to: 'Recibido',
    roles: ['admin', 'logistical'],
    label: 'Marcar recibido',
  },
  finish: {
    from: ['Enviado', 'Recibido'],
    to: 'Procesado',
    roles: ['admin', 'logistical'],
    label: 'Terminar revisión',
  },
  reopen: {
    from: ['Procesado'],
    to: 'Recibido',
    roles: ['admin'],
    label: 'Reabrir revisión',
  },
};

export function isPackageStatus(value: string): value is PackageStatus {
  return (PACKAGE_STATUSES as readonly string[]).includes(value);
}

export function nextPackageStatus(
  current: string,
  action: PackageAction,
  role: string
): { ok: true; to: PackageStatus } | { ok: false; error: string } {
  const t = TRANSITIONS[action];
  if (!t) return { ok: false, error: 'Acción desconocida' };
  if (!t.roles.includes(role)) {
    return { ok: false, error: `Solo ${t.roles.join(' o ')} puede «${t.label}»` };
  }
  if (!isPackageStatus(current) || !t.from.includes(current)) {
    return {
      ok: false,
      error: `No se puede «${t.label}» un paquete en estado «${current}»`,
    };
  }
  return { ok: true, to: t.to };
}

/** Acciones explícitas disponibles en la UI (la recepción es automática). */
export function packageActionsFor(
  current: string,
  role: string
): { action: PackageAction; label: string; to: PackageStatus }[] {
  return (['finish', 'reopen'] as const)
    .filter((a) => nextPackageStatus(current, a, role).ok)
    .map((a) => ({ action: a, label: TRANSITIONS[a].label, to: TRANSITIONS[a].to }));
}
