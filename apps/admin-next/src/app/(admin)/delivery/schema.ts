import { z } from 'zod';

// The status/payment_status columns are VARCHAR in the Django-owned DB
// and store the display strings verbatim ("En transito", "No pagado"),
// so DB and UI values are identical and the mappers are pass-throughs.
export const DELIVERY_STATUSES = [
  'Pendiente',
  'En transito',
  'Entregado',
  'Fallida',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DbDeliveryStatus = DeliveryStatus;

export function toDbDeliveryStatus(s: DeliveryStatus): DbDeliveryStatus {
  return s;
}
export function fromDbDeliveryStatus(s: DbDeliveryStatus): DeliveryStatus {
  return s;
}

export const PAY_STATUSES = ['No pagado', 'Pagado', 'Parcial'] as const;
export type PayStatus = (typeof PAY_STATUSES)[number];
export type DbPayStatus = PayStatus;

export function toDbPayStatus(p: PayStatus): DbPayStatus {
  return p;
}
export function fromDbPayStatus(p: DbPayStatus): PayStatus {
  return p;
}

// Los montos de pago (monto pagado / saldo aplicado) NO viajan en este
// formulario: se gestionan con la acción de confirmar pago, igual que
// en órdenes.
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
  clientBalance: number;
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
  phoneNumber: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  clientShippingCharge: number;
}
