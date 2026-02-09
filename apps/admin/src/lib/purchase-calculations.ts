import type { ProductBuyed } from "@/types/models";

// Función para calcular el total según las reglas de la empresa (igual que ProductForm)
export const calculateTotalCost = (
  unitPrice: number,
  quantity: number,
  shippingCost: number,
  shopTaxRate: number = 0,
  addedTaxes: number = 0,
  ownTaxes: number = 0,
  chargeIva: boolean = true,
): number => {
  // Precio del producto multiplicado por cantidad
  const subtotal = unitPrice * quantity;

  // Costo de envío
  const costoEnvio = shippingCost;

  // Base = precio + envío
  const base = subtotal + costoEnvio;

  // Impuesto base: 7% sobre (precio + envío) solo si chargeIva es true
  const baseImpuesto = chargeIva ? base * 0.07 : 0;

  // Base con impuesto = (precio + envío) + (precio + envío) * 0.07 (si aplica)
  const baseParaTarifa = base + baseImpuesto;

  // Tarifa por tienda
  const tarifaTienda = baseParaTarifa * (shopTaxRate / 100);

  // Impuestos adicionales (valor fijo nominal)
  const impuestosAdicionales = addedTaxes;

  // Impuestos propios (valor fijo)
  const impuestosPropios = ownTaxes;

  // Total = base + baseImpuesto + tarifaTienda + impuestosAdicionales + impuestosPropios
  const total =
    base +
    baseImpuesto +
    tarifaTienda +
    impuestosAdicionales +
    impuestosPropios;

  return total;
};

// Función para calcular el costo de un producto comprado
export const calculateProductPurchaseCost = (item: ProductBuyed): number => {
  const productDetails = item.original_product_details;
  if (!productDetails) return 0;

  const amountBuyed = item.amount_buyed;
  const amountRequested = productDetails.amount_requested;

  // Si la cantidad comprada coincide con la encargada, usar total_cost directamente
  if (amountBuyed === amountRequested) {
    return productDetails.total_cost || 0;
  }

  // Si las cantidades son diferentes, recalcular usando la lógica del ProductForm
  const unitPrice = productDetails.shop_cost || 0;
  const shippingCost = productDetails.shop_delivery_cost || 0;
  const shopTaxRate = productDetails.shop_taxes || 0;
  const addedTaxes = productDetails.added_taxes || 0;
  const ownTaxes = productDetails.own_taxes || 0;
  const chargeIva = productDetails.charge_iva ?? true;

  return calculateTotalCost(
    unitPrice,
    amountBuyed,
    shippingCost,
    shopTaxRate,
    addedTaxes,
    ownTaxes,
    chargeIva,
  );
};
