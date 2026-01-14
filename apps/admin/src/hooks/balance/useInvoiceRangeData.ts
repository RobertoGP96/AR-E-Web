import { useQuery } from '@tanstack/react-query';
import { calculateInvoiceRangeData } from '@/services/invoices/calculate-range-data';
import type { InvoiceRangeData } from '@/types/models/invoice';

interface UseInvoiceRangeDataProps {
  startDate?: string;
  endDate?: string;
}

export function useInvoiceRangeData({ startDate, endDate }: UseInvoiceRangeDataProps) {
  return useQuery<InvoiceRangeData | null, Error>({
    queryKey: ['invoices-range-data', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      return await calculateInvoiceRangeData(startDate, endDate);
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}
