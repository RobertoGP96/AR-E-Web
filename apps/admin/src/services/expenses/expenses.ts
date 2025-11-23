import { apiClient } from "@/lib/api-client";
import type { ExpenseFilters, Expense, CreateExpenseData, UpdateExpenseData, ExpenseAnalysisResponse } from "../api";

export const expenseService = {
  getExpenses: async (filters?: ExpenseFilters) => {
    return apiClient.getPaginated<Expense>('/api_data/expense/', filters as Record<string, unknown>);
  },

  getExpenseById: async (id: number) => {
    return apiClient.get<Expense>(`/api_data/expense/${id}/`);
  },

  createExpense: async (data: CreateExpenseData) => {
    return apiClient.post<Expense>('/api_data/expense/', data);
  },

  updateExpense: async (id: number, data: UpdateExpenseData) => {
    return apiClient.patch<Expense>(`/api_data/expense/${id}/`, data);
  },

  deleteExpense: async (id: number) => {
    return apiClient.delete<void>(`/api_data/expense/${id}/`);
  },

  // ViewSet action (registered with the viewset as @action(detail=False, url_path='analysis'))
  getExpenseAnalysis: async (params?: Record<string, unknown>) => {
    return apiClient.get<{ data: ExpenseAnalysisResponse }>('/api_data/expense/analysis/', { params });
  },

  // Reports endpoint
  getExpenseReportsAnalysis: async (params?: Record<string, unknown>) => {
    return apiClient.get<{ data: ExpenseAnalysisResponse }>('/api_data/reports/expenses/', { params });
  }
};

export const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseAnalysis,
  getExpenseReportsAnalysis,
} = expenseService;