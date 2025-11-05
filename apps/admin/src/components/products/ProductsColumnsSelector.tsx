import * as React from 'react';
import { ChevronDown, Columns3Cog } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type VisibleColumn =
  | 'index'
  | 'name'
  | 'category'
  | 'status'
  | 'total_cost'
  | 'actions'
  | 'shop'
  | 'sku'
  | 'amount_requested'
  | 'amount_purchased'
  | 'amount_delivered'
  | 'pending_purchase'
  | 'pending_delivery'
  | 'link';

interface ColumnOption {
  key: VisibleColumn;
  label: string;
  defaultVisible?: boolean;
}

interface Props {
  value: VisibleColumn[]; // lista de claves visibles
  onChange: (cols: VisibleColumn[]) => void;
}

const OPTIONS: ColumnOption[] = [
  { key: 'name', label: 'Nombre', defaultVisible: true },
  { key: 'category', label: 'Categoría', defaultVisible: true },
  { key: 'status', label: 'Estado', defaultVisible: true },
  { key: 'total_cost', label: 'Costo', defaultVisible: true },
  { key: 'actions', label: 'Acciones', defaultVisible: true },
  { key: 'shop', label: 'Tienda', defaultVisible: true },

  // columnas adicionales
  { key: 'sku', label: 'SKU' },
  { key: 'amount_requested', label: 'Solicitado' },
  { key: 'amount_purchased', label: 'Comprado' },
  { key: 'amount_delivered', label: 'Entregado' },
  { key: 'pending_purchase', label: 'Pendiente compra' },
  { key: 'pending_delivery', label: 'Pendiente entrega' },
  { key: 'link', label: 'Link' },
];

export default function ProductsColumnsSelector({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const toggle = (key: VisibleColumn) => {
    const next = value.includes(key) ? value.filter(k => k !== key) : ([...value, key] as VisibleColumn[]);
    onChange(next);
  };

  const resetDefaults = () => {
    const defaults = OPTIONS.filter(o => o.defaultVisible).map(o => o.key) as VisibleColumn[];
    onChange(defaults);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Columns3Cog className=" h-4 w-4" />
          Columnas
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-2">
          {OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center gap-2">
              <Checkbox
                checked={value.includes(opt.key)}
                onCheckedChange={() => toggle(opt.key)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cerrar</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults}>Por defecto</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
