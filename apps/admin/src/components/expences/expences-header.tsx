import {  ReceiptText } from 'lucide-react';



export default function ExpencesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ReceiptText className="h-8 w-8 text-orange-400" />
          Gastos
        </h1>
        <p className="text-gray-600 mt-2 flex items-center gap-3">
          Gestiona los gastos del sistema.
        </p>
      </div>
    </div>
  );
}