import { DeliveryHeader, DeliveryStats, DeliveryFilters, DeliveryTable } from '@/components/delivery';
import { useState } from 'react';
import { useDeliveries } from '@/hooks/delivery/useDeliverys';
import type { DeliverReceipFilters } from '@/types/api';

export default function Delivery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [filters, setFilters] = useState<DeliverReceipFilters>({ search: undefined, status: undefined, page: 1, per_page: 10 });

  const { deliveries, isLoading } = useDeliveries(filters);

  return (
    <div className="space-y-6">
      <DeliveryHeader />
      <DeliveryStats />
      <DeliveryFilters 
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setFilters(prev => ({ ...prev, search: v, page: 1 })); }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => { setStatusFilter(v); setFilters(prev => ({ ...prev, status: v !== 'all' ? v : undefined, page: 1 })); }}
        zoneFilter={zoneFilter}
        onZoneFilterChange={(v) => { setZoneFilter(v); setFilters(prev => ({ ...prev, zone: v !== 'all' ? v : undefined, page: 1 })); }}
        filters={filters}
        onFiltersChange={(f) => setFilters({ ...f, page: 1 })}
      />
      <DeliveryTable deliveries={deliveries} isLoading={isLoading} />
    </div>
  );
}
