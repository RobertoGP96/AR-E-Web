import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PackagesHeaderProps {
  onAddPackage?: () => void;
}

export default function PackagesHeader({ onAddPackage }: PackagesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-orange-500" />
          Paquetes
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona todos los paquetes en tránsito y entregados
        </p>
      </div>
      <Button 
        onClick={onAddPackage}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
      >
        <Plus className="h-5 w-5" />
        Nuevo Paquete
      </Button>
    </div>
  );
}
