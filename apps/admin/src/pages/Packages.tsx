import { PackagesHeader, PackagesStats, PackagesFilters, PackagesTable } from '@/components/packages';
import { useState } from 'react';
import type { PackageTableData } from '@/types/models/packageTable';

export default function Packages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const handleAddPackage = () => {
    console.log('Agregar nuevo paquete');
  };

  const handleTrackPackage = (pkg: PackageTableData) => {
    console.log('Rastrear paquete:', pkg);
  };

  const handleEditPackage = (pkg: PackageTableData) => {
    console.log('Editar paquete:', pkg);
  };

  const handleDeliverPackage = (pkg: PackageTableData) => {
    console.log('Entregar paquete:', pkg);
  };

  const handleViewPackage = (pkg: PackageTableData) => {
    console.log('Ver detalles del paquete:', pkg);
  };

  const handleInvoicePackage = (pkg: PackageTableData) => {
    console.log('Facturar paquete:', pkg);
  };

  const handlePackageClick = (pkg: PackageTableData) => {
    console.log('Ver detalles del paquete:', pkg);
  };

  return (
    <div className="space-y-6">
      <PackagesHeader onAddPackage={handleAddPackage} />
      <PackagesStats />
      <PackagesFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
      />
      <PackagesTable 
        onTrackPackage={handleTrackPackage}
        onEditPackage={handleEditPackage}
        onDeliverPackage={handleDeliverPackage}
        onViewPackage={handleViewPackage}
        onInvoicePackage={handleInvoicePackage}
        onPackageClick={handlePackageClick}
      />
    </div>
  );
}
