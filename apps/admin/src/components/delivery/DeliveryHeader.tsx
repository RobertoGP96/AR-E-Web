import { Plus, Truck, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryHeaderProps {
  onAddRoute?: () => void;
  onOptimizeRoutes?: () => void;
}

export default function DeliveryHeader({ onAddRoute, onOptimizeRoutes }: DeliveryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Truck className="h-8 w-8 text-orange-500" />
          Entrega
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las rutas de entrega y conductores
        </p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline"
          onClick={onOptimizeRoutes}
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
        >
          <Route className="h-5 w-5" />
          Optimizar Rutas
        </Button>
        <Button 
          onClick={onAddRoute}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
        >
          <Plus className="h-5 w-5" />
          Nueva Ruta
        </Button>
      </div>
    </div>
  );
}
