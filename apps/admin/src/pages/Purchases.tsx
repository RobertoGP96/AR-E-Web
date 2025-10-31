import PurshasesHeader from '@/components/packages/purshases/PurshasesHeader';
import PurshasesStats from '@/components/packages/purshases/PurshasesStats';
import PurshasesTable from '@/components/packages/purshases/PurshasesTable';
import PurshasesFilters from '@/components/packages/purshases/PurshasesFilters';

export default function Purchases() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PurshasesHeader />

      {/* Estadísticas */}
      <PurshasesStats />
      {/* Filtros */}
      <PurshasesFilters />

      {/* Lista de Compras */}
      <PurshasesTable />
    </div>
  );
}
