/**
 * Hook personalizado para gestionar invoices con TanStack Query
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  partialUpdateInvoice,
  deleteInvoice
} from '@/services/invoices';
import type { InvoiceFilters, CreateInvoiceData, UpdateInvoiceData } from '@/types/models';

/**
 * Query key factory para invoices
 */
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: InvoiceFilters) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
};

/**
 * Hook para obtener lista de invoices con paginación y filtros
 */
export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => getInvoices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un invoice por ID
 */
export function useInvoice(id: number) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });
}

/**
 * Hook para invalidar cache de invoices
 */
export function useInvalidateInvoices() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
    invalidateInvoice: (id: number) => queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) }),
  };
}

/**
 * Hook para crear un nuevo invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceData: CreateInvoiceData) => createInvoice(invoiceData),
    onSuccess: () => {
      // Invalidar el cache de la lista de invoices
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar un invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceData: UpdateInvoiceData) => updateInvoice(invoiceData.id, invoiceData),
    onSuccess: (data) => {
      // Invalidar el cache del invoice específico y las listas
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar parcialmente un invoice
 */
export function usePartialUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UpdateInvoiceData> }) =>
      partialUpdateInvoice(id, data),
    onSuccess: (data) => {
      // Invalidar el cache del invoice específico y las listas
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar un invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: number) => deleteInvoice(invoiceId),
    onSuccess: () => {
      // Invalidar el cache de las listas de invoices
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}