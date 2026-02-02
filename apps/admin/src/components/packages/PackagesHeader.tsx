import { Package } from "lucide-react";

export default function PackagesHeader() {
  
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
      
    </div>
  );
}
