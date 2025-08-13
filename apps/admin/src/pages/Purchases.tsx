import PurshasesHeader from '@/components/purshases/PurshasesHeader';
import PurshasesStats from '@/components/purshases/PurshasesStats';
import PurshasesTable from '@/components/purshases/PurshasesTable';
import PurshasesFilters from '@/components/purshases/PurshasesFilters';

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
