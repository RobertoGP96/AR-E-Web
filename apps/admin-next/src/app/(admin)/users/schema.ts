import { z } from 'zod';

export const USER_ROLES = [
  'user',
  'agent',
  'accountant',
  'logistical',
  'admin',
  'client',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

const baseUserShape = {
  name: z.string().trim().min(2, 'Min 2 characters').max(100),
  lastName: z.string().trim().min(2, 'Min 2 characters').max(100),
  phoneNumber: z.string().trim().min(7, 'Min 7 characters').max(20),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email'
    ),
  homeAddress: z.string().trim().max(200).optional().default(''),
  role: z.enum(USER_ROLES),
  agentProfit: z.coerce.number().min(0).default(0),
  balance: z.coerce.number().default(0),
  assignedAgentId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isActive: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.null()])
    .transform((v) => v === 'on' || v === 'true'),
};

export const createUserSchema = z.object({
  ...baseUserShape,
  password: z.string().min(6, 'Min 6 characters'),
});

export const editUserSchema = z.object(baseUserShape);

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Min 6 characters'),
    confirm: z.string().min(6, 'Min 6 characters'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;

export interface UserRow {
  id: string;
  name: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  homeAddress: string;
  role: UserRole;
  agentProfit: number;
  balance: number;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  isActive: boolean;
  isVerified: boolean;
  dateJoined: string;
}

export interface AgentOption {
  id: string;
  label: string;
  role: UserRole;
}
