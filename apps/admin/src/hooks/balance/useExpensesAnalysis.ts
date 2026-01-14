import { useQuery } from '@tanstack/react-query';
import { getExpenseReportsAnalysis } from '@/services/expenses/expenses';
import type { ExpenseAnalysisResponse } from '@/types/models/expenses';

interface UseExpensesAnalysisProps {
  startDate?: string;
  endDate?: string;
}

export function useExpensesAnalysis({ startDate, endDate }: UseExpensesAnalysisProps) {
  return useQuery<ExpenseAnalysisResponse | null, Error>({
    queryKey: ['expenseReportsAnalysis', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      const resp = await getExpenseReportsAnalysis({ start_date: startDate, end_date: endDate });
      return resp?.data ?? null;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}
