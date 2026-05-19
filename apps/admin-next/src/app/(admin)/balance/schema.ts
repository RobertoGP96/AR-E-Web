import { z } from 'zod';

export const balanceFormSchema = z
  .object({
    startDate: z
      .string()
      .min(1, 'Required')
      .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
    endDate: z
      .string()
      .min(1, 'Required')
      .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
    systemWeight: z.coerce.number().min(0, 'Must be ≥ 0'),
    registeredWeight: z.coerce.number().min(0, 'Must be ≥ 0'),
    revenues: z.coerce.number().min(0, 'Must be ≥ 0'),
    buysCosts: z.coerce.number().min(0, 'Must be ≥ 0'),
    costs: z.coerce.number().min(0, 'Must be ≥ 0'),
    expenses: z.coerce.number().min(0, 'Must be ≥ 0'),
    notes: z
      .string()
      .trim()
      .max(2000, 'Max 2000 chars')
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine((data) => Date.parse(data.endDate) >= Date.parse(data.startDate), {
    message: 'End date must be ≥ start date',
    path: ['endDate'],
  });

export type BalanceFormInput = z.infer<typeof balanceFormSchema>;

export interface BalanceRow {
  id: string;
  startDate: string;
  endDate: string;
  systemWeight: number;
  registeredWeight: number;
  revenues: number;
  buysCosts: number;
  costs: number;
  expenses: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
