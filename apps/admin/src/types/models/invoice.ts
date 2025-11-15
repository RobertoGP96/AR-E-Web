/**
 * Tipos para el modelo Invoice
 */

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
  type: string;
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
  type: string;
  weight: number;
  cost_per_lb: number;
  fixed_cost: number;
  subtotal: number;
}

export interface UpdateTagData extends Partial<CreateTagData> {
  id: ID;
}

// Filtros para invoices
export interface InvoiceFilters {
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