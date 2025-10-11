import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';

interface CategoriesFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAdd?: () => void;
}

export default function CategoriesFilters({
  searchValue = '',
  onSearchChange,
  onAdd,
}: CategoriesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar categorías..."
            className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 rounded-xl shadow-sm"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>


      <Button className="flex items-center gap-2" onClick={onAdd}>
        <Plus className="h-5 w-5" />
        Nueva Categoría
      </Button>
    </div>
  );
}
