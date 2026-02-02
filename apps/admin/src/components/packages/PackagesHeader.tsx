import { Package, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PackagesHeader() {
  const navigate = useNavigate();
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
      <button
        onClick={() => navigate("/packages/new")}
        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
      >
        <Plus className="h-5 w-5" />
        Nuevo Paquete
      </button>
    </div>
  );
}
