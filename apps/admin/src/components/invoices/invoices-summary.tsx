import { DollarSign } from 'lucide-react';

interface InvoiceSummaryProps {
  fieldsLength: number;
  calculatedTotal: number;
}

export function InvoiceSummary({ fieldsLength, calculatedTotal }: InvoiceSummaryProps) {
  return (
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
              <DollarSign className='h-6 w-6' />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Resumen de la Factura</h3>
              <p className="text-sm text-gray-600">
                {fieldsLength} Concepto{fieldsLength !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total </p>
            <div className="text-2xl font-bold text-orange-400">
              ${calculatedTotal.toFixed(2)}
            </div>
          </div>
        </div>
  );
}