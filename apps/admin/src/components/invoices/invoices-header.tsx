import {  BaggageClaim } from 'lucide-react';



export default function ExpensesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BaggageClaim className="h-8 w-8 text-orange-400" />
          Costos de Envío
        </h1>
        <p className="text-gray-600 mt-2 flex items-center gap-3">
          Gestiona los costos de envío del sistema.
          
        </p>
      </div>
    </div>
  );
}