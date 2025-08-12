import { DeliveryHeader, DeliveryStats, DeliveryFilters, DeliveryGrid } from '@/components/delivery';
import { useState } from 'react';
import type { DeliveryRouteData } from '@/types/models/deliveryRoute';

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

  const handleStartRoute = (route: DeliveryRouteData) => {
    console.log('Iniciar ruta:', route);
  };

  const handleViewMap = (route: DeliveryRouteData) => {
    console.log('Ver mapa de la ruta:', route);
  };

  const handleContactDriver = (route: DeliveryRouteData) => {
    console.log('Contactar conductor:', route);
  };

  const handleEditRoute = (route: DeliveryRouteData) => {
    console.log('Editar ruta:', route);
  };

  const handleViewReport = (route: DeliveryRouteData) => {
    console.log('Ver reporte de la ruta:', route);
  };

  const handleDownloadReport = (route: DeliveryRouteData) => {
    console.log('Descargar reporte:', route);
  };

  const handleRouteClick = (route: DeliveryRouteData) => {
    console.log('Ver detalles de la ruta:', route);
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
      <DeliveryGrid 
        onStartRoute={handleStartRoute}
        onViewMap={handleViewMap}
        onContactDriver={handleContactDriver}
        onEditRoute={handleEditRoute}
        onViewReport={handleViewReport}
        onDownloadReport={handleDownloadReport}
        onRouteClick={handleRouteClick}
      />
    </div>
  );
}
