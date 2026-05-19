import { z } from 'zod';

export const ORDER_STATUSES = [
  'Encargado',
  'Procesando',
  'Completado',
  'Cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAY_STATUSES = ['No pagado', 'Pagado', 'Parcial'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];

// Prisma enum identifiers (the DB stores "No pagado" via @map but the
// generated client uses the name "NoPagado").
export type DbPayStatus = 'NoPagado' | 'Pagado' | 'Parcial';

export function toDbPayStatus(p: PayStatus): DbPayStatus {
  return p === 'No pagado' ? 'NoPagado' : p;
}

export function fromDbPayStatus(p: DbPayStatus): PayStatus {
  return p === 'NoPagado' ? 'No pagado' : p;
}

export const orderFormSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  salesManagerId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z.enum(ORDER_STATUSES),
  observations: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  receivedValueOfClient: z.coerce.number().min(0, 'Must be ≥ 0'),
  balanceApplied: z.coerce.number().min(0, 'Must be ≥ 0'),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(100),
  shopId: z.string().min(1, 'Select a shop'),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  link: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  sku: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  amountRequested: z.coerce.number().int().min(1, 'Min 1'),
  shopCost: z.coerce.number().min(0, 'Must be ≥ 0'),
  shopDeliveryCost: z.coerce.number().min(0).default(0),
  shopTaxes: z.coerce.number().min(0).max(100).default(0),
  chargeIva: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.null()])
    .transform((v) => v === 'on' || v === 'true'),
  addedTaxes: z.coerce.number().min(0).default(0),
  ownTaxes: z.coerce.number().min(0).default(0),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export interface OrderRow {
  id: string;
  clientName: string;
  clientId: string;
  salesManagerName: string | null;
  status: OrderStatus;
  payStatus: PayStatus;
  totalCosts: number;
  receivedValueOfClient: number;
  balanceApplied: number;
  productCount: number;
  observations: string | null;
  createdAt: string;
}

export interface ProductRow {
  id: string;
  name: string;
  shopId: string;
  shopName: string;
  categoryId: string | null;
  categoryName: string | null;
  link: string | null;
  sku: string | null;
  description: string | null;
  amountRequested: number;
  amountPurchased: number;
  amountReceived: number;
  amountDelivered: number;
  status: string;
  shopCost: number;
  shopDeliveryCost: number;
  shopTaxes: number;
  chargeIva: boolean;
  baseTax: number;
  shopTaxAmount: number;
  ownTaxes: number;
  addedTaxes: number;
  totalCost: number;
}

export interface SelectOption {
  id: string;
  label: string;
  taxRate?: number;
}
