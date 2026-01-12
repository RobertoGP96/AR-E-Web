import { ShoppingBag } from 'lucide-react';

interface PurshasesHeaderProps {
  title?: string;
  description?: string;
  onAddProduct?: () => void;
}

export default function PurshasesHeader({ 
  title = "Compras", 
  description = "Gestiona las compras",
}: PurshasesHeaderProps) {


  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-orange-500" />
          {title}
        </h1>
        <p className="text-gray-600 mt-2">
          {description}
        </p>
      </div>
    </div>
  );
}
