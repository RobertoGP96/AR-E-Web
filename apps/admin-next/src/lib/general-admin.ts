import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * «Admin general» (ADR-0007): el admin activo con `is_superuser`, o a
 * falta de él, el admin activo más antiguo (menor id). Es el gestor por
 * defecto de las órdenes creadas por quien no es agente.
 *
 * Módulo de servidor: importa Prisma, nunca desde componentes cliente.
 */
export async function getGeneralAdminId(): Promise<string | null> {
  const admin = await prisma.customUser.findFirst({
    where: { role: 'admin', isActive: true },
    orderBy: [{ isSuperuser: 'desc' }, { id: 'asc' }],
    select: { id: true },
  });
  return admin ? admin.id.toString() : null;
}
