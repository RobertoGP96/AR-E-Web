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
