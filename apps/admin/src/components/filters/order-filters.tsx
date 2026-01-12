import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useUsers } from '@/hooks/user';
import { ORDER_STATUS_OPTIONS, PAY_STATUS_OPTIONS } from '@/types/utils';
import type { OrderFilters as OrderFiltersType } from '@/types/api';
export type OrderFilterState = OrderFiltersType;

interface OrderFiltersProps {
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  resultCount?: number;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: agentsData } = useUsers({ role: 'agent' });
  const agents = agentsData?.results || [];

  const activeFiltersCount = [
    !!filters.search?.trim(),
    !!filters.status,
    !!filters.pay_status,
    typeof filters.sales_manager === 'number',
    !!filters.date_from,
    !!filters.date_to,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<OrderFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: undefined,
      pay_status: undefined,
      sales_manager: undefined,
      date_from: '',
      date_to: ''
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[520px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h4 className="font-semibold text-sm">Filtros de ordenes</h4>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Filtra ordenes por búsqueda, estado, tipo de pago, manager y rango de fechas</p>
        </div>

        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {resultCount !== undefined && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> ordenes</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">Buscar</Label>
            <div className="relative">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Buscar por ID, cliente, email o manager..."
                value={filters.search}
                onChange={(e) => handleChange({ search: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Estado</Label>
              <Select value={filters.status || 'all'} onValueChange={(v) => handleChange({ status: v === 'all' ? undefined : v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ORDER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">T. Pago</Label>
              <Select value={filters.pay_status || 'all'} onValueChange={(v) => handleChange({ pay_status: v === 'all' ? undefined : v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PAY_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />

          {/* Active filter badges */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Filtros activos</Label>
              <div className="flex flex-wrap gap-1.5">
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {filters.status}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ status: 'all' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.pay_status && filters.pay_status !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {filters.pay_status}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ pay_status: 'all' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {typeof filters.sales_manager === 'number' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {
                      (() => {
                        const agent = agents.find(a => a.id === filters.sales_manager);
                        return agent ? (agent.full_name || `${agent.name} ${agent.last_name}`) : 'Agente';
                      })()
                    }
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ sales_manager: undefined })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.date_from && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Desde {filters.date_from}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ date_from: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.date_to && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Hasta {filters.date_to}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ date_to: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs font-medium">Agente</Label>
              <Select value={typeof filters.sales_manager === 'number' ? String(filters.sales_manager) : 'all'} onValueChange={(v) => handleChange({ sales_manager: v === 'all' ? undefined : Number(v) })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.full_name || `${a.name} ${a.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Fecha</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Desde"
                  className="w-1/2"
                  value={filters.date_from ?? ''}
                  onChange={(e) => handleChange({ date_from: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  className="w-1/2"
                  value={filters.date_to ?? ''}
                  onChange={(e) => handleChange({ date_to: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-3 border-t bg-muted/20">
          <Button variant="outline" onClick={handleReset} disabled={activeFiltersCount === 0} className="flex-1 h-9 text-sm">Limpiar</Button>
          <Button onClick={() => setIsOpen(false)} className="flex-1 h-9 text-sm">Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrderFilters;
