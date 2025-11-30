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

// Mock orders report service so the component doesn't call the real API during test
vi.mock('@/services/orders/get-order-reports', () => ({
  getOrderReportsAnalysis: async () => ({
    data: {
      total_revenue: 1500,
      average_revenue: 300,
      count: 5,
      total_cost: 800,
      orders_by_status: { created: 2, completed: 3 },
      monthly_trend: [
        { month: '2025-01', total: 700 },
        { month: '2025-02', total: 800 },
      ],
      orders: [
        { id: 1, revenue: 300, total_cost: 150, balance: 150, pay_status: 'paid', status: 'completed', created_at: '2025-02-10T10:00:00Z' },
        { id: 2, revenue: 200, total_cost: 90, balance: 110, pay_status: 'pending', status: 'created', created_at: '2025-02-08T12:00:00Z' },
      ],
    }
  })
}))

vi.mock('@/services/delivery/get-deliveries', () => ({
  getDeliveryReportsAnalysis: async () => ({
    data: {
      total_delivery_revenue: 300,
      total_delivery_expenses: 150,
      total_manager_profit: 30,
      total_system_profit: 120,
      total_weight: 25,
      average_weight: 12.5,
      average_delivery_cost: 50,
      count: 2,
      deliveries_by_status: { completed: 2 },
      deliveries_by_category: {
        'Test Cat': { count: 2, total_weight: 25, total_delivery_revenue: 300, total_delivery_expenses: 150, total_manager_profit: 30, total_system_profit: 120 },
      },
      monthly_trend: [ { month: '2025-02', total: 300, total_weight: 25 } ],
    }
  })
}))

describe('BalanceReport', () => {
  it('renders and shows the report title', async () => {
    render(<BalanceReport />);
    expect(screen.getByText(/Reportes Financieros/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Ingresos/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Pedidos/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Entregas por Categoría/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Test Cat/i)).toBeInTheDocument());
  });
});
