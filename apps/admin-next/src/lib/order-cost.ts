/**
 * Faithful re-implementation of the AR-E financial logic.
 *
 * Product cost cascade — mirrors the Vite admin's calculateTotalCost
 * (apps/admin/src/components/products/ProductForm.tsx) and the Django
 * rounding in api/models/products.py:
 *
 *   subtotal      = shopCost * amountRequested
 *   base          = subtotal + shopDeliveryCost
 *   baseTax       = chargeIva ? base * 0.07 : 0
 *   shopTaxAmount = (base + baseTax) * (shopTaxes / 100)
 *   totalCost     = base + baseTax + shopTaxAmount + addedTaxes + ownTaxes
 *
 * Every derived field is rounded to 2 decimals (Django Product.save()).
 */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ProductCostInput {
  shopCost: number;
  amountRequested: number;
  shopDeliveryCost: number;
  shopTaxes: number; // percent, e.g. 5 means 5%
  chargeIva: boolean;
  addedTaxes: number;
  ownTaxes: number;
}

export interface ProductCost {
  baseTax: number;
  shopTaxAmount: number;
  ownTaxes: number;
  addedTaxes: number;
  totalCost: number;
}

export function computeProductCost(i: ProductCostInput): ProductCost {
  const subtotal = i.shopCost * i.amountRequested;
  const base = subtotal + i.shopDeliveryCost;
  const baseTax = i.chargeIva ? base * 0.07 : 0;
  const baseParaTarifa = base + baseTax;
  const shopTaxAmount = baseParaTarifa * (i.shopTaxes / 100);
  const totalCost =
    base + baseTax + shopTaxAmount + i.addedTaxes + i.ownTaxes;
  return {
    baseTax: round2(baseTax),
    shopTaxAmount: round2(shopTaxAmount),
    ownTaxes: round2(i.ownTaxes),
    addedTaxes: round2(i.addedTaxes),
    totalCost: round2(totalCost),
  };
}

export type PayStatus = 'Pagado' | 'Parcial' | 'No pagado';

/** Mirrors Order.save()/add_received_value() in api/models/orders.py. */
export function computePayStatus(
  totalCosts: number,
  receivedValueOfClient: number,
  balanceApplied: number
): PayStatus {
  const tc = round2(totalCosts);
  const totalPaid = round2(receivedValueOfClient + balanceApplied);
  if (totalPaid >= tc && tc > 0) return 'Pagado';
  if (totalPaid > 0) return 'Parcial';
  return 'No pagado';
}

export type ProductStatus =
  | 'Encargado'
  | 'Comprado'
  | 'Recibido'
  | 'Entregado';

/** Mirrors _determine_product_status() in api/signals.py. */
export function deriveProductStatus(
  amountRequested: number,
  amountPurchased: number,
  amountReceived: number,
  amountDelivered: number
): ProductStatus {
  if (
    amountPurchased >= amountRequested &&
    amountReceived >= amountRequested &&
    amountDelivered >= amountReceived &&
    amountDelivered >= amountPurchased &&
    amountDelivered > 0
  ) {
    return 'Entregado';
  }
  if (
    amountPurchased >= amountRequested &&
    amountReceived >= amountRequested &&
    amountDelivered < amountReceived &&
    amountReceived > 0
  ) {
    return 'Recibido';
  }
  if (
    amountPurchased >= amountRequested &&
    amountReceived < amountRequested &&
    amountPurchased > 0
  ) {
    return 'Comprado';
  }
  return 'Encargado';
}

/**
 * RN-004 — Estimación del costo de una compra parcial. Espejo de
 * ShoppingReceip._calculate_product_cost (backend/api/models/shops.py):
 * si se compran todas las unidades pedidas vale el totalCost del
 * producto; si no, la cascada se recalcula con las unidades compradas
 * (envío e impuestos fijos completos, no prorrateados).
 */
export interface BuyedCostInput extends ProductCostInput {
  totalCost: number;
}

export function estimateBuyedCost(
  product: BuyedCostInput,
  unitsBuyed: number
): number {
  if (!Number.isFinite(unitsBuyed) || unitsBuyed <= 0) return 0;
  if (unitsBuyed === product.amountRequested) return round2(product.totalCost);
  return computeProductCost({ ...product, amountRequested: unitsBuyed })
    .totalCost;
}

export function estimatePurchaseTotal(
  rows: { product: BuyedCostInput; units: number }[]
): number {
  return round2(
    rows.reduce((sum, r) => sum + estimateBuyedCost(r.product, r.units), 0)
  );
}

export type OrderStatus = 'Encargado' | 'Procesando' | 'Completado' | 'Cancelado';

/**
 * RN-012 — Estado de la orden derivado de sus productos. Espejo de
 * Order.update_status_based_on_products() (api/models/orders.py):
 * Cancelado se respeta; sin productos no cambia; todos Entregado →
 * Completado; alguno Comprado/Recibido/Entregado → Procesando; si no
 * Encargado.
 */
export function deriveOrderStatus(
  current: string,
  productStatuses: readonly string[]
): OrderStatus {
  if (current === 'Cancelado') return 'Cancelado';
  if (productStatuses.length === 0) {
    return (['Encargado', 'Procesando', 'Completado'] as const).includes(
      current as 'Encargado' | 'Procesando' | 'Completado'
    )
      ? (current as OrderStatus)
      : 'Encargado';
  }
  if (productStatuses.every((s) => s === 'Entregado')) return 'Completado';
  if (productStatuses.some((s) => s === 'Comprado' || s === 'Recibido' || s === 'Entregado')) {
    return 'Procesando';
  }
  return 'Encargado';
}
