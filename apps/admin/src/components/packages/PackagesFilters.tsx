import { Filter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';

interface PackagesFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  cityFilter?: string;
  onCityFilterChange?: (value: string) => void;
  onAddPackage?: () => void;
}

export default function PackagesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  cityFilter,
  onCityFilterChange,
  onAddPackage
}: PackagesFiltersProps) {
  return (
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
      <Button
        onClick={onAddPackage}
        variant={"secondary"}
        className="flex items-center gap-2"
      >
        <Filter  className="h-5 w-5" />
        Filtrar
      </Button>
      <Button
        onClick={onAddPackage}
        className="flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Agregar Paquete
      </Button>
    </div>
  );
}
