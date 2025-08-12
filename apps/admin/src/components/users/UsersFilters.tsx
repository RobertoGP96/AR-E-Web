import { Filter, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';

interface UsersFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  roleFilter?: string;
  onRoleFilterChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

export default function UsersFilters({
  searchTerm,
  onSearchChange,
}: UsersFiltersProps) {
  return (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200 shadow-sm"
              />
            </div>
          </div>
          <Button variant="secondary" className="h-10">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            Agregar usuario
          </Button>
        </div>
  );
}
