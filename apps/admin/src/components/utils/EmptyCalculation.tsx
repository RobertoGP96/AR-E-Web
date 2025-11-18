import { AlertCircle, Calendar } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
};

export default function EmptyCalculation({
  title = 'No hay datos para calcular',
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
      <h4 className="text-sm font-semibold">{title}</h4>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Elige un rango de fechas para comenzar</span>
      </div>
    </div>
  );
}
