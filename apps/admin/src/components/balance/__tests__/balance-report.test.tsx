import { render, screen, waitFor } from '@testing-library/react';
import BalanceReport from '../balance-report';
import { describe, expect, it, vi } from 'vitest';

// Mock the reports service
vi.mock('@/services/reports/reports', () => ({
  fetchProfitReports: async () => ({
    monthly_reports: [
      { month: '2025-01', month_short: 'ene 2025', revenue: 1000, product_expenses: 400, total_expenses: 450, purchase_operational_expenses: 50, paid_purchase_expenses: 0, delivery_expenses: 30, agent_profits: 150, system_delivery_profit: 20, system_profit: 100, projected_profit: 110 },
      { month: '2025-02', month_short: 'feb 2025', revenue: 2000, product_expenses: 900, total_expenses: 1000, purchase_operational_expenses: 80, paid_purchase_expenses: 0, delivery_expenses: 40, agent_profits: 300, system_delivery_profit: 40, system_profit: 1000, projected_profit: 1100 },
    ],
    agent_reports: [],
    summary: {
      total_revenue: 3000,
      total_expenses: 1450,
      total_product_expenses: 1300,
      total_purchase_operational_expenses: 130,
      total_paid_purchase_expenses: 0,
      total_delivery_expenses: 70,
      total_agent_profits: 450,
      total_system_delivery_profit: 60,
      total_system_profit: 1100,
      profit_margin: 36.66,
    }
  })
}))

describe('BalanceReport', () => {
  it('renders and shows the report title', async () => {
    render(<BalanceReport />);
    expect(screen.getByText(/Reportes Financieros/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Ingresos/i)).toBeInTheDocument());
  });
});
