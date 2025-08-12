import { Package } from 'lucide-react';

interface ProductsHeaderProps {
  title?: string;
  description?: string;
  onAddProduct?: () => void;
}

export default function ProductsHeader({ 
  title = "Productos", 
  description = "Gestiona el inventario y catálogo de productos",
}: ProductsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-orange-500" />
          {title}
        </h1>
        <p className="text-gray-600 mt-2">
          {description}
        </p>
      </div>
      
    </div>
  );
}
