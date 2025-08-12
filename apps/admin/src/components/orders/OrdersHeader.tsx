import { Package } from 'lucide-react';

interface OrdersHeaderProps {
  title?: string;
  description?: string;
}

export default function OrdersHeader({ 
  title = "Órdenes", 
  description = "Gestión de todas las órdenes del sistema" 
}: OrdersHeaderProps) {
  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-500" />
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {description}
        </p>
      </div>
    </div>
  );
}
