import { Truck } from 'lucide-react';


export default function DeliveryHeader() {
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
      </div>
    </div>
  );
}
