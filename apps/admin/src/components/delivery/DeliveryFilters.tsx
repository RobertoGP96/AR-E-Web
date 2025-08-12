import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeliveryFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  zoneFilter?: string;
  onZoneFilterChange?: (value: string) => void;
}

export default function DeliveryFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  zoneFilter,
  onZoneFilterChange
}: DeliveryFiltersProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar rutas, conductores o vehículos..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px] border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-xl bg-white">
              <SelectItem value="all" className="focus:bg-orange-50 focus:text-orange-900">Todos los estados</SelectItem>
              <SelectItem value="planificada" className="focus:bg-orange-50 focus:text-orange-900">Planificada</SelectItem>
              <SelectItem value="en-curso" className="focus:bg-orange-50 focus:text-orange-900">En Curso</SelectItem>
              <SelectItem value="completada" className="focus:bg-orange-50 focus:text-orange-900">Completada</SelectItem>
              <SelectItem value="cancelada" className="focus:bg-orange-50 focus:text-orange-900">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={zoneFilter} onValueChange={onZoneFilterChange}>
            <SelectTrigger className="w-[180px] border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-xl bg-white">
              <SelectItem value="all" className="focus:bg-orange-50 focus:text-orange-900">Todas las zonas</SelectItem>
              <SelectItem value="norte" className="focus:bg-orange-50 focus:text-orange-900">Norte</SelectItem>
              <SelectItem value="sur" className="focus:bg-orange-50 focus:text-orange-900">Sur</SelectItem>
              <SelectItem value="centro" className="focus:bg-orange-50 focus:text-orange-900">Centro</SelectItem>
              <SelectItem value="oriente" className="focus:bg-orange-50 focus:text-orange-900">Oriente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
