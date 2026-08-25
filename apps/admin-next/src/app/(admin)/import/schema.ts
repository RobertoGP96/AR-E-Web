import { z } from 'zod';

/**
 * Payload de confirmación de la importación: el subconjunto del análisis
 * que el administrador decidió importar. El servidor revalida todo y
 * recalcula los costos — nunca confía en números del cliente.
 */

export const IMPORT_SHEETS = ['Shein', 'Amazon', 'Temu', 'Otras 5%'] as const;

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida')
  .nullable();

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const importItemSchema = z.object({
  uid: trimmed(40),
  sheet: z.enum(IMPORT_SHEETS),
  rowNumber: z.number().int().positive(),
  storeName: trimmed(100),
  storeOrderId: z.string().trim().max(100).nullable(),
  groupKey: z.string().trim().max(140).nullable(),
  account: z.string().trim().max(100).nullable(),
  tracking: z.string().trim().max(100).nullable(),
  packageLabel: z.string().trim().max(40).nullable(),
  buyDate: isoDate,
  arrivalDate: isoDate,
  agent: z.string().trim().max(100).nullable(),
  client: trimmed(200),
  sku: z.string().trim().max(100).nullable(),
  description: z.string().trim().max(300).nullable(),
  quantity: z.number().int().min(1).max(9999),
  unitValue: z.number().min(0).max(1_000_000).nullable(),
});

export const importClientSchema = z.object({
  name: trimmed(200),
  agent: z.string().trim().max(100).nullable(),
  mode: z.enum(['new', 'existing']),
  existingId: z.string().regex(/^\d{1,19}$/).nullable(),
});

export const importAgentSchema = z.object({
  name: trimmed(100),
  ratePerPound: z.number().min(0).max(10_000).nullable(),
});

export const importReceiptSchema = z.object({
  key: trimmed(140),
  sheet: z.enum(IMPORT_SHEETS),
  storeName: trimmed(100),
  storeOrderId: z.string().trim().max(100).nullable(),
  account: z.string().trim().max(100).nullable(),
  buyDate: isoDate,
  itemCount: z.number().nullable(),
  declaredValue: z.number().nullable(),
  realCost: z.number().min(0).max(10_000_000).nullable(),
});

export const importExpenseSchema = z.object({
  uid: trimmed(40),
  label: trimmed(100),
  amount: z.number().positive().max(10_000_000),
  category: trimmed(50),
});

export const importPayloadSchema = z
  .object({
    fileName: trimmed(200),
    shipmentTag: z.string().trim().max(20).nullable(),
    agents: z.array(importAgentSchema).max(100),
    clients: z.array(importClientSchema).max(2000),
    items: z.array(importItemSchema).max(5000),
    receipts: z.array(importReceiptSchema).max(2000),
    expenses: z.array(importExpenseSchema).max(100),
  })
  .refine(
    (p) => p.items.length > 0 || p.clients.length > 0 || p.expenses.length > 0,
    'No hay nada seleccionado para importar.'
  );

export type ImportPayload = z.infer<typeof importPayloadSchema>;
