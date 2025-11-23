import { z } from 'zod';

export const expenseCategorySchema = z.enum([
  'Envio',
  'Tasas',
  'Sueldo',
  'Publicidad',
  'Operativo',
  'Entrega',
  'Otro',
] as const);

export const createExpenseSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0').refine((v) => Number(v.toFixed(2)) === v, { message: 'No más de 2 decimales' }),
  category: expenseCategorySchema,
  description: z.string().max(2048).optional(),
  recurrent: z.boolean().optional(),
});

export const editExpenseSchema = createExpenseSchema.partial().extend({
  // For edit, id is required at the payload level when calling backend.
  id: z.number().optional(),
});

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type EditExpenseFormData = z.infer<typeof editExpenseSchema>;
