import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useDeliveries } from '@/hooks/delivery/useDeliverys';
import type { DeliverReceipFilters as DeliveryFiltersType } from '@/types/api';

export type DeliveryFilterState = DeliveryFiltersType;

interface DeliveryFiltersProps {
  filters: DeliveryFilterState;
  onFiltersChange: (filters: DeliveryFilterState) => void;
  resultCount?: number;
}

const DELIVERY_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En transito', label: 'En tránsito' },
  { value: 'Entregado', label: 'Entregado' },
  { value: 'Fallida', label: 'Fallida' },
];

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({ filters, onFiltersChange, resultCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deliveries: deliveryList } = useDeliveries({ page: 1, per_page: 100 });
  const zones = Array.from(new Set((deliveryList || []).map(d => d.client?.home_address?.split(',')?.[1]?.trim()).filter(Boolean)));

  const activeFiltersCount = [
    !!filters.search?.trim(),
    filters.status && filters.status !== 'all',
    filters.zone && filters.zone.length > 0,
    !!filters.deliver_date_from,
    !!filters.deliver_date_to,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<DeliveryFilterState>) => onFiltersChange({ ...filters, ...patch });
  const handleReset = () => onFiltersChange({ search: '', page: 1, per_page: 20 } as DeliveryFilterState);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
          {activeFiltersCount > 0 && <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><h4 className="font-semibold text-sm">Filtros de entregas</h4></div>
          </div>
          <p className="text-xs text-muted-foreground">Filtra entregas por búsqueda, estado, zona y rango de fechas</p>
        </div>
        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {resultCount !== undefined && (<div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> entregas</p></div>)}
          <div className="space-y-2"><Label className="text-xs font-medium">Buscar</Label><div className="relative"><input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Buscar por ID, orden o cliente..." value={filters.search} onChange={(e) => handleChange({ search: e.target.value })} /></div></div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Estado</Label>
              <Select value={filters.status ?? 'all'} onValueChange={(v) => handleChange({ status: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>{DELIVERY_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Zona</Label>
              <Select value={filters.zone ?? 'all'} onValueChange={(v) => handleChange({ zone: v === 'all' ? undefined : v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent><SelectItem value={'all'}>Todas</SelectItem>{zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          {activeFiltersCount > 0 && (<div className="space-y-2"><Label className="text-xs font-medium">Filtros activos</Label><div className="flex flex-wrap gap-1.5">{filters.status && filters.status !== 'all' && <Badge variant="secondary" className="gap-1 text-xs">{filters.status}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ status: 'all' })}><X className="h-3 w-3" /></button></Badge>}{filters.zone && <Badge variant="secondary" className="gap-1 text-xs">Zona: {filters.zone}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ zone: undefined })}><X className="h-3 w-3" /></button></Badge>}{filters.deliver_date_from && <Badge variant="secondary" className="gap-1 text-xs">Desde {filters.deliver_date_from}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ deliver_date_from: '' })}><X className="h-3 w-3" /></button></Badge>}{filters.deliver_date_to && <Badge variant="secondary" className="gap-1 text-xs">Hasta {filters.deliver_date_to}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ deliver_date_to: '' })}><X className="h-3 w-3" /></button></Badge>}</div></div>)}
          <div className="grid grid-cols-1 gap-3"><div><Label className="text-xs font-medium">Fecha de entrega</Label><div className="flex gap-2"><Input type="date" className="w-1/2" value={filters.deliver_date_from ?? ''} onChange={(e) => handleChange({ deliver_date_from: e.target.value })} /><Input type="date" className="w-1/2" value={filters.deliver_date_to ?? ''} onChange={(e) => handleChange({ deliver_date_to: e.target.value })} /></div></div></div>
        </div>
        <div className="flex gap-2 p-3 border-t bg-muted/20"><Button variant="outline" onClick={handleReset} disabled={activeFiltersCount === 0} className="flex-1 h-9 text-sm">Limpiar</Button><Button onClick={() => setIsOpen(false)} className="flex-1 h-9 text-sm">Aplicar</Button></div>
      </PopoverContent>
    </Popover>
  );
}

export default DeliveryFilters;
