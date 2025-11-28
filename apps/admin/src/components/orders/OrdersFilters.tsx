import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
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
  resultCount?: number;
}

export default function OrdersFilters({
  searchTerm= "",
  filters = { search: '', status: 'all', pay_status: 'all', sales_manager: undefined, date_from: '', date_to: '' },
  onSearchChange,
  onFiltersChange = () => {},
}: OrdersFiltersProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por ID, cliente, email o manager..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200  shadow-sm"
            />
          </div>
        </div>
        <OrderFilters filters={filters} onFiltersChange={(newFilters) => { onFiltersChange?.(newFilters); }} resultCount={undefined} />
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-5 w-5" />
          Agregar Pedido
        </Button>
      </div>

      {/* TODO: Active filter summary is shown inside OrderFilters popover */}

      <CreateOrderDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
}
