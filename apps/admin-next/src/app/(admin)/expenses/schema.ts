import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Envio',
  'Tasas',
  'Sueldo',
  'Publicidad',
  'Operativo',
  'Entrega',
  'Otro',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const expenseFormSchema = z.object({
  date: z
    .string()
    .min(1, 'Required')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
  amount: z.coerce.number().min(0, 'Must be ≥ 0'),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z
    .string()
    .trim()
    .max(500, 'Max 500 chars')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

export interface ExpenseRow {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}
