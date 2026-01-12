import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { debounce } from 'lodash';
import OrderFilters, { type OrderFilterState } from '@/components/filters/order-filters';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import CreateOrderDialog from './CreateOrderDialog';

interface OrdersFiltersProps {
  searchTerm: string;
  searchValue?: string;
  filters: OrderFilterState;
  onSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: OrderFilterState) => void;
  onRefresh?: () => void;
  resultCount?: number;
  isRefreshing?: boolean;
}

export default function OrdersFilters({
  searchTerm= "",
  filters = { search: '', status: 'all', pay_status: 'all', sales_manager: undefined, date_from: '', date_to: '' },
  onSearchChange,
  onFiltersChange = () => {},
  onRefresh,
  isRefreshing = false,
}: OrdersFiltersProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Update local state when searchTerm prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Create debounced search handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearchChange?.(value);
    }, 300), // 300ms debounce delay
    [onSearchChange]
  );

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por ID, cliente, email o manager..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 shadow-sm"
            />
          </div>
        </div>
        <OrderFilters filters={filters} onFiltersChange={(newFilters) => { onFiltersChange?.(newFilters); }} resultCount={undefined} />
        <div className="flex gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar lista"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Pedido
          </Button>
        </div>
      </div>

      {/* TODO: Active filter summary is shown inside OrderFilters popover */}

      <CreateOrderDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
}
