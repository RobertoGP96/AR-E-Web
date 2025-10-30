import { PackagesHeader, PackagesStats, PackagesFilters, PackagesTable } from '@/components/packages';
import { useState } from 'react';
import { usePackages } from '@/hooks/package';

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const filters = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    // Agregar otros filtros si es necesario
  };

  const { packages, isLoading } = usePackages(filters);

  return (
    <div className="space-y-5">
      <PackagesHeader />
      <PackagesStats />
      <PackagesFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
      />
      <PackagesTable packages={packages} isLoading={isLoading} />
    </div>
  );
}
