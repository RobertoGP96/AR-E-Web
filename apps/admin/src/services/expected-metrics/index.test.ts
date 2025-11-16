import { describe, expect, test } from 'vitest';
import { expectedMetricsService } from './index';

describe('expectedMetricsService calculations', () => {
  test('calculateProjectedValues handles expectedWeight = 0', () => {
    const input = {
      range_delivery_weight: '0',
      range_delivery_cost: '0',
      range_revenue: '100',
      range_profit: '50',
      delivery_real_weight: '50',
      delivery_real_cost: '10',
      others_costs: '5',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const { projected_profit, projected_profit_difference, projected_profit_variance_percentage } = expectedMetricsService.calculateProjectedValues(input);

    // If expectedWeight is 0, projectedRevenue should fall back to expectedRevenue (100), then profit computed
    expect(projected_profit).toBeCloseTo(100 - 10 - 5);
    expect(projected_profit_difference).toBeCloseTo((100 - 10 - 5) - 50);
    expect(projected_profit_variance_percentage).toBeGreaterThan(-100);
  });

  test('calculateProjectedValues scales revenue by weight', () => {
    const input = {
      range_delivery_weight: '100',
      range_delivery_cost: '0',
      range_revenue: '200',
      range_profit: '80',
      delivery_real_weight: '50',
      delivery_real_cost: '20',
      others_costs: '10',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const { projected_profit } = expectedMetricsService.calculateProjectedValues(input);
    // projectedRevenue = 200 * (50 / 100) = 100
    // projected_profit = 100 - 20 - 10 = 70
    expect(projected_profit).toBeCloseTo(70);
  });

  test('calculateTableValues protects division and NaN cases', () => {
    const metric = {
      range_delivery_weight: '0',
      delivery_real_weight: '50',
      range_revenue: '200',
      range_profit: '100',
      delivery_real_cost: '20',
      range_delivery_cost: '10',
      others_costs: '5',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const table = expectedMetricsService.calculateTableValues(metric);
    // With range_delivery_weight = 0 we should not have Infinity
    expect(Number.isFinite(table.projectedRevenue)).toBeTruthy();
    expect(Number.isFinite(table.projectedProfit)).toBeTruthy();
  });
});
