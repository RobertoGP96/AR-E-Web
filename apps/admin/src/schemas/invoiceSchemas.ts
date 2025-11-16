import { z } from 'zod';

// Schema para tags con validación condicional
export const tagSchema = z.object({
  type: z.enum(['pesaje', 'nominal']),
  weight: z.number().optional(),
  cost_per_lb: z.number().optional(),
  fixed_cost: z.number().optional(),
  subtotal: z.number().min(0.01, 'Subtotal debe ser mayor a 0')
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Ensure that there are no more than 2 decimal places.' }),
}).superRefine((data, ctx) => {
  if (data.type === 'pesaje') {
    if (data.weight === undefined || data.weight <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Peso debe ser mayor a 0 para tipo Pesaje',
        path: ['weight']
      });
    }
    if (data.cost_per_lb === undefined || data.cost_per_lb <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Costo por lb debe ser mayor a 0 para tipo Pesaje',
        path: ['cost_per_lb']
      });
    }
  } else if (data.type === 'nominal') {
    if (data.fixed_cost === undefined || data.fixed_cost <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Costo fijo debe ser mayor a 0 para tipo Nominal',
        path: ['fixed_cost']
      });
    }
  }
});

// Schema para crear invoice con tags
export const createInvoiceSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  total: z.number().min(0, 'Total debe ser positivo')
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Ensure that there are no more than 2 decimal places.' }),
  tags: z.array(tagSchema).min(1, 'Debe agregar al menos una tag'),
});

// Schema para editar invoice
export const editInvoiceSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  total: z.number().min(0, 'Total debe ser positivo'),
  tags: z.array(tagSchema),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;