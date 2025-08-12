import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PackagesFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  cityFilter?: string;
  onCityFilterChange?: (value: string) => void;
}

export default function PackagesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  cityFilter,
  onCityFilterChange
}: PackagesFiltersProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por código de paquete, destinatario..."
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
              <SelectItem value="preparacion" className="focus:bg-orange-50 focus:text-orange-900">En Preparación</SelectItem>
              <SelectItem value="transito" className="focus:bg-orange-50 focus:text-orange-900">En Tránsito</SelectItem>
              <SelectItem value="entrega" className="focus:bg-orange-50 focus:text-orange-900">Para Entrega</SelectItem>
              <SelectItem value="entregado" className="focus:bg-orange-50 focus:text-orange-900">Entregado</SelectItem>
              <SelectItem value="devuelto" className="focus:bg-orange-50 focus:text-orange-900">Devuelto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={onCityFilterChange}>
            <SelectTrigger className="w-[180px] border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-xl bg-white">
              <SelectItem value="all" className="focus:bg-orange-50 focus:text-orange-900">Todas las ciudades</SelectItem>
              <SelectItem value="bogota" className="focus:bg-orange-50 focus:text-orange-900">Bogotá</SelectItem>
              <SelectItem value="medellin" className="focus:bg-orange-50 focus:text-orange-900">Medellín</SelectItem>
              <SelectItem value="cali" className="focus:bg-orange-50 focus:text-orange-900">Cali</SelectItem>
              <SelectItem value="barranquilla" className="focus:bg-orange-50 focus:text-orange-900">Barranquilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
