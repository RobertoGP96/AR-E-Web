import * as React from 'react';
import { useProfitReports } from './balance/useProfitReports';
import { useInvoiceRangeData } from './balance/useInvoiceRangeData';
import { useExpensesAnalysis } from './balance/useExpensesAnalysis';
import { useDeliveryAnalysis } from './balance/useDeliveryAnalysis';
import { useOrdersAnalysis } from './balance/useOrdersAnalysis';
import { usePurchasesAnalysis } from './balance/usePurchasesAnalysis';
import type { MonthlyReport } from '@/services/reports/reports';

export interface UseBalanceDataProps {
  startDate?: Date;
  endDate?: Date;
}

export function useBalanceData({ startDate, endDate }: UseBalanceDataProps) {
  // Format dates to ISO strings for API calls
  const startIso = startDate ? 
    `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` 
    : undefined;
  
  const endIso = endDate ? 
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` 
    : undefined;

  // Use individual hooks for each data type
  const { 
    data: reports, 
    isLoading: isLoadingReports, 
    error: reportsError 
  } = useProfitReports();

  const { 
    data: invoicesRangeData, 
    isLoading: isLoadingInvoices 
  } = useInvoiceRangeData({ startDate: startIso, endDate: endIso });

  const {
    data: expensesAnalysis,
    isLoading: isLoadingExpensesAnalysis,
    error: expenseError,
  } = useExpensesAnalysis({ startDate: startIso, endDate: endIso });

  const { 
    data: deliveryAnalysis, 
    isLoading: isLoadingDeliveryAnalysis, 
    error: deliveryAnalysisError 
  } = useDeliveryAnalysis({ startDate: startIso, endDate: endIso });

  const { 
    data: ordersAnalysis, 
    isLoading: isLoadingOrders, 
    error: ordersError 
  } = useOrdersAnalysis({ startDate: startIso, endDate: endIso });

  const { 
    data: purchasesAnalysis, 
    isLoading: isLoadingPurchases, 
    error: purchasesError 
  } = usePurchasesAnalysis({ startDate: startIso, endDate: endIso });

  // Filter monthly reports by selected date range
  const filteredMonthly = React.useMemo(() => {
    if (!reports || !reports.monthly_reports) return [] as MonthlyReport[];
    const months: MonthlyReport[] = reports.monthly_reports || [];
    if (!startDate || !endDate) return months;

    // Convert each month like '2023-11' to Date (first day of month)
    const startKey = new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime();
    const endKey = new Date(endDate.getFullYear(), endDate.getMonth(), 1).getTime();
    
    return months.filter(m => {
      try {
        const parts = String(m.month).split('-');
        if (parts.length < 2) return false;
        const mo = Number(parts[1]) - 1;
        const yr = Number(parts[0]);
        const d = new Date(yr, mo, 1).getTime();
        return d >= startKey && d <= endKey;
      } catch {
        return false;
      }
    });
  }, [reports, startDate, endDate]);

  // Calculate summary data
  const summary = React.useMemo(() => {
    if (!reports) return null;
    const monthly = filteredMonthly;
    
    // Calculate total revenue, expenses, and profit from monthly reports
    const totals = monthly.reduce(
      (acc, curr) => {
        acc.revenue += curr.revenue || 0;
        acc.expenses += curr.total_expenses || 0;
        acc.profit += (curr.revenue - curr.total_expenses) || 0;
        return acc;
      },
      { revenue: 0, expenses: 0, profit: 0 }
    );

    return {
      ...totals,
      averageProfit: monthly.length > 0 ? totals.profit / monthly.length : 0,
      monthCount: monthly.length,
    };
  }, [reports, filteredMonthly]);

  // Combined loading state
  const isLoading = 
    isLoadingReports || 
    isLoadingInvoices || 
    isLoadingExpensesAnalysis || 
    isLoadingDeliveryAnalysis || 
    isLoadingOrders || 
    isLoadingPurchases;

  // Combined error state
  const error = 
    reportsError || 
    expenseError || 
    deliveryAnalysisError || 
    ordersError || 
    purchasesError;

  return {
    // Data
    reports,
    invoicesRangeData,
    expensesAnalysis,
    deliveryAnalysis,
    ordersAnalysis,
    purchasesAnalysis,
    filteredMonthly,
    summary,
    
    // Loading states
    isLoading,
    isLoadingReports,
    isLoadingInvoices,
    isLoadingExpensesAnalysis,
    isLoadingDeliveryAnalysis,
    isLoadingOrders,
    isLoadingPurchases,
    
    // Errors
    error,
    reportsError,
    expenseError,
    deliveryAnalysisError,
    ordersError,
    purchasesError,
  };
}

export default useBalanceData;
