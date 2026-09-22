import { z } from 'zod';
import { PACKAGE_STATUSES, type PackageStatus } from '@/lib/package-status';

export { PACKAGE_STATUSES, type PackageStatus };

/**
 * Cabecera del paquete. El estado no viaja en el formulario: nace
 * «Enviado» (o «Recibido» si ya está en el almacén) y solo cambia por
 * las transiciones de `@/lib/package-status` (INV-006).
 */
export const packageFormSchema = z.object({
  agencyName: z.string().trim().min(1, 'Obligatorio').max(100, 'Máximo 100'),
  numberOfTracking: z
    .string()
    .trim()
    .min(1, 'Obligatorio')
    .max(100, 'Máximo 100'),
  arrivalDate: z
    .string()
    .min(1, 'Obligatoria')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida'),
  packagePicture: z
    .string()
    .trim()
    .max(1000, 'Demasiado larga')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  /** Solo al crear: el paquete ya está físicamente en el almacén. */
  alreadyArrived: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.null()])
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});

export type PackageFormInput = z.infer<typeof packageFormSchema>;

/** Corrección manual del estado (solo admin, desde el diálogo de edición). */
export const packageStatusSchema = z.enum(PACKAGE_STATUSES);

// Lote de llegadas: varias recepciones marcadas en un mismo paquete se
// registran de una vez (registerArrivalsAction). El paso Enviado →
// Recibido es automático al registrar la primera llegada.
export const arrivalBatchSchema = z.object({
  packageId: z.string().min(1),
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
    .min(1, 'Marca al menos un producto')
    .max(500, 'Máximo 500 productos por lote'),
});

export type ArrivalBatchInput = z.input<typeof arrivalBatchSchema>;

/** Alta de paquete con llegadas en la misma vista (/packages/new). */
export const packageWithArrivalsSchema = z.object({
  agencyName: z.string().trim().min(1, 'Obligatorio').max(100, 'Máximo 100'),
  numberOfTracking: z.string().trim().min(1, 'Obligatorio').max(100, 'Máximo 100'),
  arrivalDate: z
    .string()
    .min(1, 'Obligatoria')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida'),
  packagePicture: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  alreadyArrived: z.boolean().default(true),
  items: arrivalBatchSchema.shape.items.min(0).max(500, 'Máximo 500 productos por lote'),
});
export type PackageWithArrivalsInput = z.input<typeof packageWithArrivalsSchema>;

export interface PackageRow {
  id: string;
  agencyName: string;
  numberOfTracking: string;
  statusOfProcessing: PackageStatus;
  arrivalDate: string;
  packagePicture: string | null;
  createdAt: string;
  updatedAt: string;
  /** Recepciones registradas en el paquete. */
  receptionCount: number;
}
