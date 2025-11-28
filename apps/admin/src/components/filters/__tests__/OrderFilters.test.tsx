import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderFilters from '../order-filters';
import { vi } from 'vitest';

vi.mock('@/hooks/user', () => ({
  useUsers: () => ({ data: { results: [{ id: 1, full_name: 'Agent One', name: 'Agent', last_name: 'One' }] }, isLoading: false }),
}));

function Wrapper() {
  const [filters, setFilters] = React.useState({ search: '', status: 'all', pay_status: 'all', sales_manager: undefined, date_from: '', date_to: '' });
  return <OrderFilters filters={filters} onFiltersChange={(f) => setFilters(f)} resultCount={0} />;
}

describe('OrderFilters', () => {
  it('no badge or counter when mounted with default filters', () => {
    render(<Wrapper />);
    // The substring 'Filtrar' is the Popover trigger button label
    const button = screen.getByRole('button', { name: /Filtrar/i });
    // Expect there is no small badge (count) visible
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it('shows badge when a search filter is applied', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /Filtrar/i });
    await user.click(trigger);
    const search = screen.getByPlaceholderText(/Buscar por ID, cliente, email o manager/i);
    await user.type(search, 'ABC123');
    const apply = screen.getByRole('button', { name: /Aplicar/i });
    await user.click(apply);
    // After applying, there should be a badge with '1' count
    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});

export {};
