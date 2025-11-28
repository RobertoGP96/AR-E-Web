import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import CreatePackageDialog from './CreatePackageDialog';
import PackageFilters, { type PackageFilterState } from '@/components/filters/package-filters';

interface PackagesFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  cityFilter?: string;
  onCityFilterChange?: (value: string) => void;
  filters?: PackageFilterState;
  onFiltersChange?: (f: PackageFilterState) => void;
}

export default function PackagesFilters({
  searchTerm,
  onSearchChange,
  filters = { search: '', status_of_processing: 'all' },
  onFiltersChange = () => {},
}: PackagesFiltersProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
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
        <PackageFilters filters={filters} onFiltersChange={(newFilters) => onFiltersChange(newFilters)} resultCount={undefined} />
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Agregar Paquete
        </Button>
      </div>

      <CreatePackageDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
