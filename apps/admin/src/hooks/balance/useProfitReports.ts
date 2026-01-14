import { useQuery } from '@tanstack/react-query';
import { fetchProfitReports } from '@/services/reports/reports';
import type { ProfitReportsData } from '@/services/reports/reports';

export function useProfitReports() {
  return useQuery<ProfitReportsData, Error>({
    queryKey: ['profitReports'],
    queryFn: fetchProfitReports,
  });
}
