import { z } from 'zod';

export const shopFormSchema = z.object({
  name: z.string().trim().min(2, 'Min 2 characters').max(100, 'Max 100'),
  link: z
    .string()
    .trim()
    .min(1, 'Required')
    .regex(/^https?:\/\/.+/i, 'Must start with http:// or https://'),
  taxRate: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  isActive: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.null()])
    .transform((v) => v === 'on' || v === 'true'),
});

export type ShopFormInput = z.infer<typeof shopFormSchema>;

export interface ShopRow {
  id: string;
  name: string;
  link: string;
  isActive: boolean;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
}
