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
