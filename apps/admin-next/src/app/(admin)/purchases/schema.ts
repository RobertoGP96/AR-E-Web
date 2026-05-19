import { z } from 'zod';

export const PAY_STATUSES = ['No pagado', 'Pagado', 'Parcial'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];
export type DbPayStatus = 'NoPagado' | 'Pagado' | 'Parcial';

export function toDbPayStatus(p: PayStatus): DbPayStatus {
  return p === 'No pagado' ? 'NoPagado' : p;
}
export function fromDbPayStatus(p: DbPayStatus): PayStatus {
  return p === 'NoPagado' ? 'No pagado' : p;
}

export const purchaseFormSchema = z.object({
  shopOfBuyId: z.string().min(1, 'Select a shop'),
  shoppingAccountId: z.string().min(1, 'Select an account'),
  statusOfShopping: z.enum(PAY_STATUSES),
  cardId: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  buyDate: z
    .string()
    .min(1, 'Required')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
  totalCostOfPurchase: z.coerce.number().min(0, 'Must be ≥ 0'),
});

export type PurchaseFormInput = z.infer<typeof purchaseFormSchema>;

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
}
