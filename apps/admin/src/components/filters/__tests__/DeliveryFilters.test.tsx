import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeliveryFilters from '../delivery-filters';
import { vi } from 'vitest';

vi.mock('@/hooks/delivery/useDeliverys', () => ({
  useDeliveries: () => ({ deliveries: [], isLoading: false }),
}));

function Wrapper() {
  const [filters, setFilters] = React.useState({ search: '', status: 'all', zone: undefined, deliver_date_from: '', deliver_date_to: '' });
  return <DeliveryFilters filters={filters} onFiltersChange={(f) => setFilters(f)} resultCount={0} />;
}

describe('DeliveryFilters', () => {
  it('no badge on mount', () => {
    render(<Wrapper />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows badge when zone filter applied', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /Filtrar/i });
    await user.click(trigger);
    const search = screen.getByPlaceholderText(/Buscar por ID, orden o cliente/i);
    await user.type(search, 'abc');
    const apply = screen.getByRole('button', { name: /Aplicar/i });
    await user.click(apply);
    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});

export {};
