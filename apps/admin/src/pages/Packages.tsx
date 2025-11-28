import { PackagesHeader, PackagesStats, PackagesFilters, PackagesTable } from '@/components/packages';
import { useState } from 'react';
import { usePackages } from '@/hooks/package';
import type { PackageFilters } from '@/types/api';

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [filters, setFilters] = useState<PackageFilters>({ search: undefined, page: 1, per_page: 10, status_of_processing: undefined });

  const { packages, isLoading } = usePackages(filters);

  return (
    <div className="space-y-5">
      <PackagesHeader />
      <PackagesStats />
      <PackagesFilters 
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setFilters(prev => ({ ...prev, search: v, page: 1 })); }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => { setStatusFilter(v); setFilters(prev => ({ ...prev, status_of_processing: v !== 'all' ? v : undefined, page: 1 })); }}
        cityFilter={cityFilter}
        onCityFilterChange={(v) => { setCityFilter(v); setFilters(prev => ({ ...prev, agency_name: v !== 'all' ? v : undefined, page: 1 })); }}
        filters={filters}
        onFiltersChange={(f) => setFilters({ ...f, page: 1 })}
      />
      <PackagesTable packages={packages} isLoading={isLoading} />
    </div>
  );
}
