'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole, parseId, ROLES } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

/**
 * INV-002: la categoría decide en qué bolsa cae el producto. Esta
 * acción desbloquea productos sin categoría (p. ej. importados de
 * Excel) desde el checklist de llegadas sin pasar por la orden.
 */
export async function assignProductCategoryAction(
  productId: string,
  categoryId: string
): Promise<ActionResult> {
  const { denied } = await requireRole(ROLES.categorize);
  if (denied) return denied;

  const cid = parseId(categoryId);
  if (!cid) return { ok: false, error: 'Categoría inválida' };

  const result = await prisma.$transaction(async (tx) => {
    const [product, category, inFlight] = await Promise.all([
      tx.product.findUnique({
        where: { id: productId },
        select: { id: true, categoryId: true, orderId: true },
      }),
      tx.category.findUnique({ where: { id: cid }, select: { id: true } }),
      tx.productDelivery.count({
        where: {
          originalProductId: productId,
          deliverReceip: { status: { not: 'Entregado' } },
        },
      }),
    ]);
    if (!product) return { ok: false as const, error: 'Producto no encontrado' };
    if (!category) return { ok: false as const, error: 'Categoría no encontrada' };
    if (product.categoryId !== null && product.categoryId !== cid && inFlight > 0) {
      return {
        ok: false as const,
        error:
          'El producto está en una bolsa o entrega en curso; sácalo antes de cambiar la categoría',
      };
    }
    await tx.product.update({ where: { id: productId }, data: { categoryId: cid } });
    return { ok: true as const, orderId: product.orderId.toString() };
  });

  if (!result.ok) return result;
  revalidatePath('/delivery/prepare');
  revalidatePath('/packages/[id]', 'page');
  revalidatePath(`/orders/${result.orderId}`);
  revalidatePath('/products');
  return { ok: true };
}
