/**
 * Hooks personalizados para gestionar Expenses con TanStack Query
 */
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { ExpenseFilters, CreateExpenseData, UpdateExpenseData } from '@/types/models/expenses';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/services/expenses/expenses';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.lists(), { filters }] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
};

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => getExpenses(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExpense(id?: number) {
  return useQuery({
    queryKey: id ? expenseKeys.detail(id) : expenseKeys.details(),
    queryFn: () => (id ? getExpenseById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}

export function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: expenseKeys.lists() }),
    invalidateExpense: (id: number) => queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) }),
  };
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => createExpense(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.lists() }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExpenseData) => updateExpense(data.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.lists() }),
  });
}

export default {};
