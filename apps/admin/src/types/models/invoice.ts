/**
 * Tipos para el modelo Invoice
 */

import type { BaseFilters } from '../api';
import type { ID, DateTime } from './base';

// Modelo principal de Invoice
export interface Invoice {
  id: ID;
  date: DateTime;
  total: number;
  created_at: DateTime;
  updated_at: DateTime;
  tags?: Tag[];
}

// Modelo de Tag relacionado con Invoice
export interface Tag {
  id: ID;
  invoice: ID;
  type?: "pesaje" | "nominal";
  weight: number;
  cost_per_lb: number;
  fixed_cost: number;
  subtotal: number;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar invoice
export interface CreateInvoiceData {
  date: string; // ISO date string
  total: number;
  tags?: CreateTagData[];
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id: ID;
}

// Tipos para crear/editar tag
export interface CreateTagData {
  type?: "pesaje" | "nominal";
  weight: number;
  cost_per_lb: number;
  fixed_cost: number;
  subtotal: number;
}

export interface UpdateTagData extends Partial<CreateTagData> {
  id: ID;
}

// Filtros para invoices
export interface InvoiceFilters extends BaseFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
  total_min?: number;
  total_max?: number;
}

// Respuesta paginada de la API
export interface InvoiceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Invoice[];
}

// Tipo para la respuesta agregada del cálculo por rango de invoices
export interface InvoiceRangeData {
  success: boolean;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  invoices_count: number;
  total_invoices_amount: number;
  tags_count: number;
  total_tag_weight: number;
  total_fixed_cost: number;
  total_tag_subtotal: number;
  total_shipping_cost: number;
  total_tag_costs: number;
}

// Funciones de utilidad
export const invoiceUtils = {
  formatTotal: (total: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(total);
  },

  formatDate: (date: DateTime): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatDateTime: (date: DateTime): string => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  calculateTagTotal: (tags: Tag[]): number => {
    return tags.reduce((total, tag) => total + tag.subtotal, 0);
  }
};