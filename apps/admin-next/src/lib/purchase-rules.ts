/**
 * Reglas puras de la compra (INV-001: pedido ≥ comprado ≥ recibido ≥
 * entregado). Devuelven el mensaje de error o null si la operación es
 * válida; las actions las evalúan dentro de la transacción con datos
 * releídos.
 */

export interface BuyedRowState {
  amountBuyed: number;
  quantityRefuned: number;
}

export interface ProductPurchaseState {
  name: string;
  amountPurchased: number;
  amountReceived: number;
}

/** Quitar una fila de compra no puede dejar comprado < recibido. */
export function canRemoveBuyed(
  product: ProductPurchaseState,
  row: BuyedRowState
): string | null {
  const effective = Math.max(0, row.amountBuyed - row.quantityRefuned);
  const after = product.amountPurchased - effective;
  if (after < product.amountReceived) {
    const blocked = product.amountReceived - after;
    return `No se puede quitar: ${blocked} unidad(es) de «${product.name}» ya fueron recibidas. Elimina primero la recepción en su paquete.`;
  }
  return null;
}

/** Reembolsar reduce lo comprado; tampoco puede bajar de lo recibido. */
export function canRefund(
  product: ProductPurchaseState,
  row: BuyedRowState,
  quantity: number
): string | null {
  const refundable = Math.max(0, row.amountBuyed - row.quantityRefuned);
  if (quantity > refundable) {
    return `Solo quedan ${refundable} unidad(es) por reembolsar (${row.quantityRefuned} de ${row.amountBuyed} ya reembolsadas).`;
  }
  const after = product.amountPurchased - quantity;
  if (after < product.amountReceived) {
    return `No se puede reembolsar: ${product.amountReceived - after} unidad(es) de «${product.name}» ya fueron recibidas.`;
  }
  return null;
}

/** Las notas de reembolso se acumulan por líneas con fecha y cantidad. */
export function appendRefundNote(
  existing: string | null,
  note: string,
  quantity: number,
  amount: number,
  date: Date,
  max = 500
): { ok: true; value: string | null } | { ok: false; error: string } {
  const stamp = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const line = `${stamp} · ${quantity} ud · $${amount.toFixed(2)}${
    note.trim() ? `: ${note.trim()}` : ''
  }`;
  const value = existing ? `${existing}\n${line}` : line;
  if (value.length > max) {
    return {
      ok: false,
      error: `Las notas de reembolso acumuladas superan ${max} caracteres.`,
    };
  }
  return { ok: true, value };
}
