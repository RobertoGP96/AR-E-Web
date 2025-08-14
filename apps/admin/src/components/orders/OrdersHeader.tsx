import { ShoppingCart } from 'lucide-react';

interface OrdersHeaderProps {
  title?: string;
  description?: string;
}

export default function OrdersHeader({ 
  title = "Órdenes", 
  description = "Gestión de todas las órdenes del sistema" 
}: OrdersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-orange-500" />
          {title}
        </h1>
        <p className="text-gray-600 mt-2">
          {description}
        </p>
      </div>
      <div className="flex gap-3">
      </div>
    </div>
  );
}
