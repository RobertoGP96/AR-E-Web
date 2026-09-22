import { z } from 'zod';

export const PAY_STATUSES = ['No pagado', 'Pagado', 'Parcial'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];
// VARCHAR column in the Django-owned DB — stores the display strings
// verbatim, so these are pass-throughs.
export type DbPayStatus = PayStatus;

export function toDbPayStatus(p: PayStatus): DbPayStatus {
  return p;
}
export function fromDbPayStatus(p: DbPayStatus): PayStatus {
  return p;
}

export const purchaseFormSchema = z.object({
  shopOfBuyId: z.string().min(1, 'Selecciona una tienda'),
  shoppingAccountId: z.string().min(1, 'Selecciona una cuenta'),
  statusOfShopping: z.enum(PAY_STATUSES),
  cardId: z
    .string()
    .trim()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  buyDate: z
    .string()
    .min(1, 'Obligatoria')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida'),
  totalCostOfPurchase: z.coerce.number().min(0, 'Debe ser ≥ 0'),
});

export type PurchaseFormInput = z.infer<typeof purchaseFormSchema>;

/** Lote de productos comprados (compra nueva o añadir a una existente). */
export const purchaseItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1, 'Producto inválido'),
      amount: z
        .number()
        .int('La cantidad debe ser un entero')
        .min(1, 'Mínimo 1')
        .max(10_000, 'Cantidad demasiado grande'),
    })
  )
  .min(1, 'Marca al menos un producto')
  .max(500, 'Máximo 500 productos por compra');

export const createPurchaseBatchSchema = purchaseFormSchema.extend({
  items: purchaseItemsSchema,
});
export type CreatePurchaseBatchInput = z.input<typeof createPurchaseBatchSchema>;

export const addPurchaseItemsSchema = z.object({
  purchaseId: z.string().regex(/^\d{1,19}$/, 'Compra inválida'),
  items: purchaseItemsSchema,
  /** Suma el costo estimado del lote a totalCostOfPurchase. */
  addToTotal: z.boolean().default(true),
});
export type AddPurchaseItemsInput = z.input<typeof addPurchaseItemsSchema>;

/** Producto pendiente de comprar, tal como lo ve el checklist. */
export interface PendingProduct {
  id: string;
  name: string;
  sku: string | null;
  orderId: string;
  amountRequested: number;
  amountPurchased: number;
  /** pedido − comprado (> 0). */
  pending: number;
  cost: {
    shopCost: number;
    amountRequested: number;
    shopDeliveryCost: number;
    shopTaxes: number;
    chargeIva: boolean;
    addedTaxes: number;
    ownTaxes: number;
    totalCost: number;
  };
}

export interface PendingClientGroup {
  clientId: string;
  clientName: string;
  phoneNumber: string;
  products: PendingProduct[];
}

export interface PendingCandidates {
  groups: PendingClientGroup[];
  totalProducts: number;
  totalUnits: number;
  truncated: boolean;
}

export interface PurchaseRow {
  id: string;
  shopOfBuyId: string;
  shopName: string;
  shoppingAccountId: string;
  accountName: string;
  statusOfShopping: PayStatus;
  cardId: string | null;
  buyDate: string;
  totalCostOfPurchase: number;
  productCount: number;
}

export interface AccountOption {
  id: string;
  label: string;
}

export interface ShopWithAccounts {
  id: string;
  label: string;
  accounts: AccountOption[];
  /** Productos y unidades pendientes de comprar en la tienda. */
  pendingProducts?: number;
  pendingUnits?: number;
}
