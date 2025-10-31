import { DeliveryHeader, DeliveryStats, DeliveryFilters, DeliveryTable } from '@/components/delivery';
import { useState } from 'react';
import { useDeliveries } from '@/hooks/delivery/useDeliverys';

export default function Delivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const filters = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    // Agregar otros filtros si es necesario
  };

  const { deliveries, isLoading } = useDeliveries(filters);

  return (
    <div className="space-y-6">
      <DeliveryHeader />
      <DeliveryStats />
      <DeliveryFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        zoneFilter={zoneFilter}
        onZoneFilterChange={setZoneFilter}
      />
      <DeliveryTable deliveries={deliveries} isLoading={isLoading} />
    </div>
  );
}
