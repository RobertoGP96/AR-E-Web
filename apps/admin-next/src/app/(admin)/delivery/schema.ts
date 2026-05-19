import { z } from 'zod';

// Display values. DeliveryStatus Prisma enum maps EnTransito -> "En transito".
export const DELIVERY_STATUSES = [
  'Pendiente',
  'En transito',
  'Entregado',
  'Fallida',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DbDeliveryStatus =
  | 'Pendiente'
  | 'EnTransito'
  | 'Entregado'
  | 'Fallida';

export function toDbDeliveryStatus(s: DeliveryStatus): DbDeliveryStatus {
  return s === 'En transito' ? 'EnTransito' : s;
}
export function fromDbDeliveryStatus(s: DbDeliveryStatus): DeliveryStatus {
  return s === 'EnTransito' ? 'En transito' : s;
}

export const PAY_STATUSES = ['No pagado', 'Pagado', 'Parcial'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];
export type DbPayStatus = 'NoPagado' | 'Pagado' | 'Parcial';

export function toDbPayStatus(p: PayStatus): DbPayStatus {
  return p === 'No pagado' ? 'NoPagado' : p;
}
export function fromDbPayStatus(p: DbPayStatus): PayStatus {
  return p === 'NoPagado' ? 'No pagado' : p;
}

export const deliveryFormSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  weight: z.coerce.number().min(0, 'Must be ≥ 0'),
  status: z.enum(DELIVERY_STATUSES),
  deliverDate: z
    .string()
    .min(1, 'Required')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
  paymentAmount: z.coerce.number().min(0, 'Must be ≥ 0'),
  balanceApplied: z.coerce.number().min(0, 'Must be ≥ 0'),
  deliverPicture: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type DeliveryFormInput = z.infer<typeof deliveryFormSchema>;

export interface DeliveryRow {
  id: string;
  clientId: string;
  clientName: string;
  categoryId: string | null;
  categoryName: string | null;
  weight: number;
  status: DeliveryStatus;
  paymentStatus: PayStatus;
  weightCost: number;
  managerProfit: number;
  paymentAmount: number;
  balanceApplied: number;
  deliverDate: string;
  deliverPicture: string | null;
}

export interface ClientOption {
  id: string;
  label: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  clientShippingCharge: number;
}
