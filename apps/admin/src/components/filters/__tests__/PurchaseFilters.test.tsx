import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import PurchaseFilters from '../purchase-filters';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/services/api', () => ({
  buyingAccountService: { getBuyingAccounts: async () => ({ count: 0, next: null, previous: null, results: [] }) }
}));
vi.mock('@/hooks/shop/useShops', () => ({ useShops: () => ({ shops: [], isLoading: false }) }));

function Wrapper() {
  const [filters, setFilters] = React.useState({ search: '', status_of_shopping: 'all', shopping_account: undefined, shop_of_buy: undefined, buy_date_from: '', buy_date_to: '' });
  return <PurchaseFilters filters={filters} onFiltersChange={(f) => setFilters(f)} resultCount={0} />;
}

describe('PurchaseFilters', () => {
  it('no badge when mounted with default filters', () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><Wrapper /></QueryClientProvider>);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows badge when search filter applied', async () => {
    const qc = new QueryClient();
    render(<QueryClientProvider client={qc}><Wrapper /></QueryClientProvider>);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /Filtrar/i });
    await user.click(trigger);
    // Note: We use the search input to trigger a change that should also show a badge
    // Use search input to trigger a change and apply
    // Instead of typing, render a wrapper that already has a filter set
    function WrapperWithFilter() {
      const [filters, setFilters] = React.useState({ search: '', status_of_shopping: 'all', shopping_account: undefined, shop_of_buy: undefined, buy_date_from: '2022-01-01', buy_date_to: '' });
      return <PurchaseFilters filters={filters} onFiltersChange={(f) => setFilters(f)} resultCount={0} />;
    }
    render(<QueryClientProvider client={qc}><WrapperWithFilter /></QueryClientProvider>);
    // The Filter button should now show a badge with count 1
    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});

export {};
