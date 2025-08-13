import { DeliveryHeader, DeliveryStats, DeliveryFilters } from '@/components/delivery';
import { useState } from 'react';
import DeliveryTable from '@/components/delivery/DeliveryTable';

export default function Delivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const handleAddRoute = () => {
    console.log('Agregar nueva ruta');
  };

  const handleOptimizeRoutes = () => {
    console.log('Optimizar rutas');
  };


  return (
    <div className="space-y-6">
      <DeliveryHeader 
        onAddRoute={handleAddRoute}
        onOptimizeRoutes={handleOptimizeRoutes}
      />
      <DeliveryStats />
      <DeliveryFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        zoneFilter={zoneFilter}
        onZoneFilterChange={setZoneFilter}
      />
      <DeliveryTable />
    </div>
  );
}
