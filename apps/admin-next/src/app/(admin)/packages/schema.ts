import { z } from 'zod';

export const PACKAGE_STATUSES = ['Enviado', 'Recibido', 'Procesado'] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const packageFormSchema = z.object({
  agencyName: z.string().trim().min(1, 'Required').max(100, 'Max 100'),
  numberOfTracking: z.string().trim().min(1, 'Required').max(100, 'Max 100'),
  statusOfProcessing: z.enum(PACKAGE_STATUSES),
  arrivalDate: z
    .string()
    .min(1, 'Required')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
  packagePicture: z
    .string()
    .trim()
    .max(1000, 'Too long')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type PackageFormInput = z.infer<typeof packageFormSchema>;

// Lote de llegadas de /delivery/prepare: varias recepciones marcadas en
// un mismo paquete se registran de una vez (registerArrivalsAction).
export const arrivalBatchSchema = z.object({
  packageId: z.string().min(1),
  /** Estado a dejar en el paquete tras registrar (p. ej. Enviado → Recibido). */
  setStatus: z.enum(PACKAGE_STATUSES).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        amount: z
          .number()
          .int('La cantidad debe ser un entero')
          .positive('La cantidad debe ser mayor que 0'),
        observation: z
          .string()
          .trim()
          .max(200, 'La observación no puede exceder 200 caracteres')
          .optional()
          .transform((v) => (v && v.length > 0 ? v : null)),
      })
    )
    .min(1, 'Marca al menos un producto'),
});

export type ArrivalBatchInput = z.input<typeof arrivalBatchSchema>;

export interface PackageRow {
  id: string;
  agencyName: string;
  numberOfTracking: string;
  statusOfProcessing: PackageStatus;
  arrivalDate: string;
  packagePicture: string | null;
  createdAt: string;
  updatedAt: string;
}
