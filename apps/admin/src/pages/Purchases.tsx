import PurshasesHeader from '@/components/purshases/PurshasesHeader';
import PurshasesStats from '@/components/purshases/PurshasesStats';
import PurshasesTable from '@/components/purshases/PurshasesTable';
import PurshasesFilters from '@/components/purshases/PurshasesFilters';
import { useState } from 'react';
import type { ShoppingReceipFilters } from '@/types/api';

export default function Purchases() {
  const [filters, setFilters] = useState<ShoppingReceipFilters>({ search: '', page: 1, per_page: 20 });
  return (
    <div className="space-y-6">
      {/* Header */}
      <PurshasesHeader />

      {/* Estadísticas */}
      <PurshasesStats />
      {/* Filtros */}
      <PurshasesFilters filters={filters} onFiltersChange={(f) => setFilters({ ...f, page: 1 })} searchValue={filters.search} onSearchChange={(v) => setFilters(prev => ({ ...prev, search: v, page: 1 }))} />

      {/* Lista de Compras */}
      <PurshasesTable filters={filters} />
    </div>
  );
}
