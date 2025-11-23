import {  ReceiptText } from 'lucide-react';

interface Props {
  view?: 'gastos' | 'costos';
}

export default function CostAndExpHeader({ view = 'gastos' }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ReceiptText className="h-8 w-8 text-orange-400" />
          Costos y Gastos
        </h1>
        <p className="text-gray-600 mt-2 flex items-center gap-3">
          Gestiona los costos y gastos del sistema.
          <span className="ml-2 px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
            {view === 'gastos' ? 'Gastos' : 'Costos'}
          </span>
        </p>
      </div>
    </div>
  );
}