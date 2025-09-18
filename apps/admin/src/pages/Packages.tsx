import { PackagesHeader, PackagesStats, PackagesFilters, PackagesTable } from '@/components/packages';
import { useState } from 'react';

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

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
      <PackagesTable />
    </div>
  );
}
