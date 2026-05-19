import { z } from 'zod';

export const TAG_TYPES = ['pesaje', 'nominal'] as const;
export type TagType = (typeof TAG_TYPES)[number];

export const tagInputSchema = z.object({
  type: z.enum(TAG_TYPES),
  weight: z.coerce.number().min(0).default(0),
  costPerLb: z.coerce.number().min(0).default(0),
  fixedCost: z.coerce.number().min(0).default(0),
});

export const invoiceInputSchema = z
  .object({
    date: z
      .string()
      .min(1, 'Required')
      .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
    tags: z.array(tagInputSchema).min(1, 'Add at least one tag'),
  })
  .superRefine((data, ctx) => {
    data.tags.forEach((tag, i) => {
      if (tag.type === 'pesaje') {
        if (tag.weight <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Weight must be > 0',
            path: ['tags', i, 'weight'],
          });
        }
        if (tag.costPerLb <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cost/lb must be > 0',
            path: ['tags', i, 'costPerLb'],
          });
        }
      } else if (tag.type === 'nominal' && tag.fixedCost <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fixed cost must be > 0',
          path: ['tags', i, 'fixedCost'],
        });
      }
    });
  });

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;

export function computeTagSubtotal(tag: {
  type: TagType;
  weight: number;
  costPerLb: number;
  fixedCost: number;
}): number {
  const value =
    tag.type === 'pesaje'
      ? tag.weight * tag.costPerLb + tag.fixedCost
      : tag.fixedCost;
  return Math.round(value * 100) / 100;
}

export interface TagRow {
  id: string;
  type: TagType;
  weight: number;
  costPerLb: number;
  fixedCost: number;
  subtotal: number;
}

export interface InvoiceRow {
  id: string;
  date: string;
  total: number;
  tags: TagRow[];
  createdAt: string;
  updatedAt: string;
}
