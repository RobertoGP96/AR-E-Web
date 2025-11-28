import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PackageFilters from '../package-filters';
import { vi } from 'vitest';

vi.mock('@/hooks/package/usePackages', () => ({
  usePackages: () => ({ packages: [], isLoading: false }),
}));

function Wrapper() {
  const [filters, setFilters] = React.useState({ search: '', status_of_processing: 'all', agency_name: undefined, arrival_date_from: '', arrival_date_to: '' });
  return <PackageFilters filters={filters} onFiltersChange={(f) => setFilters(f)} resultCount={0} />;
}

describe('PackageFilters', () => {
  it('no badge when default', () => {
    render(<Wrapper />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows badge when agency filter applied', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /Filtrar/i });
    await user.click(trigger);
    const search = screen.getByPlaceholderText(/Buscar por ID, tracking o destinatario/i);
    await user.type(search, 'abc');
    const apply = screen.getByRole('button', { name: /Aplicar/i });
    await user.click(apply);
    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});

export {};
