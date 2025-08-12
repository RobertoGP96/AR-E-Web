import { Search } from 'lucide-react';

interface OrdersFiltersProps {
  searchValue?: string;
  statusFilter?: string;
  dateFilter?: string;
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
}

export default function OrdersFilters({
  searchValue = "",
  statusFilter = "",
  dateFilter = "",
  onSearchChange,
  onStatusChange,
  onDateChange
}: OrdersFiltersProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Buscar órdenes..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
      
      <select 
        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        value={statusFilter}
        onChange={(e) => onStatusChange?.(e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="Completado">Completada</option>
        <option value="Encargado">Pendiente</option>
        <option value="Procesando">Procesando</option>
        <option value="Cancelado">Cancelada</option>
      </select>

      <input
        type="date"
        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        value={dateFilter}
        onChange={(e) => onDateChange?.(e.target.value)}
      />
    </div>
  );
}
