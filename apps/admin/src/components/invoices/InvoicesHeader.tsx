import { FileText } from 'lucide-react';

export default function InvoicesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-500" />
          Facturas
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las facturas y registros contables del sistema
        </p>
      </div>
    </div>
  );
}