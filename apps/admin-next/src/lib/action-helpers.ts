import { auth } from '@/auth';

export type ActionFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult = { ok: true; id?: string } | ActionFailure;

export interface SessionUser {
  id: string;
  role: string;
  phoneNumber: string;
  name?: string | null;
  email?: string | null;
}

type Guard =
  | { denied: ActionFailure; user: null }
  | { denied: null; user: SessionUser };

/**
 * Role sets mirror apps/admin/src/routes/role-config.ts (the Vite admin),
 * which is the RBAC source of truth for this system. Write access per
 * domain is granted in each actions.ts via requireRole(ROLES.<domain>).
 */
export const STAFF_ROLES = [
  'admin',
  'agent',
  'accountant',
  'logistical',
] as const;

export const ROLES = {
  users: ['admin'],
  shops: ['admin'],
  categories: ['admin'],
  purchases: ['admin'],
  orders: ['admin', 'agent'],
  delivery: ['admin', 'logistical'],
  packages: ['admin', 'logistical'],
  finance: ['admin', 'accountant'], // balance, invoices, expenses, settings
} as const satisfies Record<string, readonly string[]>;

export async function requireRole(
  allowed: readonly string[]
): Promise<Guard> {
  const session = await auth();
  if (!session?.user) {
    return { denied: { ok: false, error: 'Not authenticated' }, user: null };
  }
  const { id, role, phoneNumber, name, email } = session.user;
  if (!id || !allowed.includes(role)) {
    return { denied: { ok: false, error: 'Forbidden' }, user: null };
  }
  return { denied: null, user: { id, role, phoneNumber, name, email } };
}

/** Any staff role (admin, agent, accountant, logistical). */
export function requireStaff(): Promise<Guard> {
  return requireRole(STAFF_ROLES);
}

/** Flatten zod issues into a { "field.path": message } map. */
export function zodFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Parse a client-supplied id into a BigInt, or null if malformed.
 * BigInt("abc") throws — never call it directly on user input.
 */
export function parseId(raw: unknown): bigint | null {
  if (typeof raw !== 'string' || !/^\d{1,19}$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}
