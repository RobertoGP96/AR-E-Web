import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  shippingCostPerPound: z.coerce.number().min(0, 'Must be ≥ 0'),
  clientShippingCharge: z.coerce.number().min(0, 'Must be ≥ 0'),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export interface CategoryRow {
  id: string;
  name: string;
  shippingCostPerPound: number;
  clientShippingCharge: number;
  createdAt: string;
  updatedAt: string;
}
