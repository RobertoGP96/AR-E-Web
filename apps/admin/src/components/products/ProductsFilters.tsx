import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import ProductsColumnsSelector from './ProductsColumnsSelector';
import type { VisibleColumn } from './ProductsColumnsSelector';


interface ProductsFiltersProps {
  searchValue?: string;
  categoryFilter?: string;
  statusFilter?: string;
  onSearchChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  visibleColumns?: VisibleColumn[];
  onVisibleColumnsChange?: (cols: VisibleColumn[]) => void;
}


export default function ProductsFilters({
  searchValue = "",

  onSearchChange,
  visibleColumns = ['name','category','status','total_cost','actions', 'shop'] as VisibleColumn[],
  onVisibleColumnsChange,
}: ProductsFiltersProps) {

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar productos..."
            className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ProductsColumnsSelector value={visibleColumns} onChange={onVisibleColumnsChange || (() => {})} />

        <Button variant="secondary" onClick={() => { /* opcional: abrir modal avanzado */ }}>
          <Filter className="h-5 w-5 mr-2" />
          Filtros
        </Button>

      </div>
    </div>
  );
}
