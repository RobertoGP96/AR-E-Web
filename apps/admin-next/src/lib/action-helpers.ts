import { auth } from '@/auth';
import { STAFF_ROLES } from '@/lib/roles';

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

// Los conjuntos de roles viven en src/lib/roles.ts (módulo puro, sin
// imports) para que los componentes cliente puedan usarlos sin arrastrar
// `@/auth` → Prisma al bundle del navegador. Se re-exportan por
// compatibilidad con las actions existentes.
export { ROLES, STAFF_ROLES } from '@/lib/roles';

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
