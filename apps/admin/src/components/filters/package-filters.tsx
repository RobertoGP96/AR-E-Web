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
import { usePackages } from '@/hooks/package/usePackages';
import type { PackageFilters as PackageFiltersType } from '@/types/api';

export type PackageFilterState = PackageFiltersType;

interface PackageFiltersProps {
  filters: PackageFilterState;
  onFiltersChange: (filters: PackageFilterState) => void;
  resultCount?: number;
}

const PACKAGE_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Enviado', label: 'Enviado' },
  { value: 'En tránsito', label: 'En tránsito' },
  { value: 'Entregado', label: 'Entregado' },
];

export const PackageFilters: React.FC<PackageFiltersProps> = ({ filters, onFiltersChange, resultCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { packages: pkgsList } = usePackages({ page: 1, per_page: 100 });
  const agencies = Array.from(new Set(pkgsList.map(p => p.agency_name).filter(Boolean)));

  const activeFiltersCount = [
    !!filters.search?.trim(),
    filters.status_of_processing && filters.status_of_processing !== 'all',
    filters.agency_name && filters.agency_name !== 'all',
    !!filters.arrival_date_from,
    !!filters.arrival_date_to,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<PackageFilterState>) => onFiltersChange({ ...filters, ...patch });
  const handleReset = () => onFiltersChange({ search: '', page: 1, per_page: 20 } as PackageFilterState);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[520px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h4 className="font-semibold text-sm">Filtros de paquetes</h4>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Filtra paquetes por búsqueda, estado, agencia y rango de fechas</p>
        </div>

        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {resultCount !== undefined && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> paquetes</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">Buscar</Label>
            <div className="relative">
              <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Buscar por ID, tracking o destinatario..." value={filters.search} onChange={(e) => handleChange({ search: e.target.value })} />
            </div>
          </div>

          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Estado</Label>
              <Select value={filters.status_of_processing ?? 'all'} onValueChange={(v) => handleChange({ status_of_processing: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  {PACKAGE_STATUS_OPTIONS.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Agencia</Label>
              <Select value={filters.agency_name ?? 'all'} onValueChange={(v) => handleChange({ agency_name: v === 'all' ? undefined : v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={'all'}>Todas</SelectItem>
                  {agencies.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Filtros activos</Label>
              <div className="flex flex-wrap gap-1.5">
                {filters.status_of_processing && filters.status_of_processing !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">{filters.status_of_processing}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ status_of_processing: 'all' })}><X className="h-3 w-3" /></button></Badge>
                )}
                {filters.agency_name && (
                  <Badge variant="secondary" className="gap-1 text-xs">{filters.agency_name}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ agency_name: undefined })}><X className="h-3 w-3" /></button></Badge>
                )}
                {filters.arrival_date_from && (
                  <Badge variant="secondary" className="gap-1 text-xs">Desde {filters.arrival_date_from}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ arrival_date_from: '' })}><X className="h-3 w-3" /></button></Badge>
                )}
                {filters.arrival_date_to && (
                  <Badge variant="secondary" className="gap-1 text-xs">Hasta {filters.arrival_date_to}<button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ arrival_date_to: '' })}><X className="h-3 w-3" /></button></Badge>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs font-medium">Fecha de llegada</Label>
              <div className="flex gap-2">
                <Input type="date" className="w-1/2" value={filters.arrival_date_from ?? ''} onChange={(e) => handleChange({ arrival_date_from: e.target.value })} />
                <Input type="date" className="w-1/2" value={filters.arrival_date_to ?? ''} onChange={(e) => handleChange({ arrival_date_to: e.target.value })} />
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
  )
}

export default PackageFilters;
