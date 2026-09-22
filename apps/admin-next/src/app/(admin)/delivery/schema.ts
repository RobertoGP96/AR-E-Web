import { z } from 'zod';
import {
  DELIVERY_PHASES,
  DELIVERY_STATUSES,
  type DeliveryPhase,
  type DeliveryStatus,
} from '@/lib/delivery-status';

export { DELIVERY_PHASES, DELIVERY_STATUSES, type DeliveryPhase, type DeliveryStatus };

// The status/payment_status columns are VARCHAR in the Django-owned DB
// and store the display strings verbatim ("En transito", "No pagado"),
// so DB and UI values are identical and the mappers are pass-throughs.
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

const pictureSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const dateSchema = z
  .string()
  .min(1, 'Obligatoria')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida');

/**
 * Edición de la cabecera: solo fecha y foto. El estado cambia por
 * transiciones explícitas y el peso por «Pesar»/«Corregir peso».
 */
export const deliveryEditSchema = z.object({
  deliverDate: dateSchema,
  deliverPicture: pictureSchema,
});
export type DeliveryEditInput = z.infer<typeof deliveryEditSchema>;

/** Lote de productos (recibidos sin entregar) para una entrega. */
export const deliveryItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      amount: z.number().int('Cantidad entera').positive('Mínimo 1'),
    })
  )
  .min(1, 'Marca al menos un producto')
  .max(500, 'Máximo 500 productos');
export type DeliveryItemsInput = z.input<typeof deliveryItemsSchema>;

/** «Armar entrega desde recibidos»: llena la bolsa del cliente y, si viene peso, la cierra. */
export const assembleDeliverySchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  items: deliveryItemsSchema,
  /** Peso por categoría (categoryId → lb) para cerrar esas bolsas en el mismo paso. */
  weights: z
    .record(z.string(), z.number().positive('El peso debe ser mayor que 0'))
    .optional(),
});
export type AssembleDeliveryInput = z.input<typeof assembleDeliverySchema>;

/** Datos de «Marcar entregada». */
export const deliverSchema = z.object({
  deliverDate: dateSchema.optional(),
  deliverPicture: pictureSchema,
});
export type DeliverInput = z.input<typeof deliverSchema>;

export interface DeliveryRow {
  id: string;
  clientId: string;
  clientName: string;
  clientBalance: number;
  categoryId: string | null;
  categoryName: string | null;
  weight: number;
  status: DeliveryStatus;
  phase: DeliveryPhase;
  paymentStatus: PayStatus;
  weightCost: number;
  managerProfit: number;
  paymentAmount: number;
  balanceApplied: number;
  deliverDate: string;
  deliverPicture: string | null;
  productCount: number;
  /** Tarifa $/lb de la categoría y ganancia/lb del agente (previews). */
  chargePerLb: number;
  agentProfit: number;
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

/** Producto recibido sin entregar de un cliente (para armar entregas). */
export interface ReceivedCandidate {
  id: string;
  name: string;
  orderId: string;
  categoryId: string | null;
  categoryName: string | null;
  chargePerLb: number;
  /** recibido − entregado. */
  available: number;
}
