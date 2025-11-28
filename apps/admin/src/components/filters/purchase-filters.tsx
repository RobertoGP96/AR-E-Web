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
import { useShops } from '@/hooks/shop/useShops';
import type { Shop } from '@/types/models/shop';
import type { BuyingAccount } from '@/types/models/buying-account';
import { buyingAccountService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import type { ShoppingReceipFilters as PurchaseFiltersType } from '@/types/api';

export type PurchaseFilterState = PurchaseFiltersType;

interface PurchaseFiltersProps {
  filters: PurchaseFilterState;
  onFiltersChange: (filters: PurchaseFilterState) => void;
  resultCount?: number;
}

const PURCHASE_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'No pagado', label: 'No pagado' },
  { value: 'Pagado', label: 'Pagado' },
  { value: 'Parcial', label: 'Parcial' },
];

export const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({ filters, onFiltersChange, resultCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { shops: shopsList } = useShops();
  const shops: Shop[] = shopsList || [];

  const { data: accountsData } = useQuery({
    queryKey: ['buying-accounts'],
    queryFn: () => buyingAccountService.getBuyingAccounts(),
  });
  const accounts = accountsData?.results || [];

  const activeFiltersCount = [
    filters.search?.trim() !== '',
    filters.status_of_shopping && filters.status_of_shopping !== 'all',
    typeof filters.shopping_account === 'number' || typeof filters.shopping_account_id === 'number',
    typeof filters.shop_of_buy === 'number' || typeof filters.shop_of_buy_id === 'number',
    !!filters.buy_date_from,
    !!filters.buy_date_to,
  ].filter(Boolean).length;

  const handleChange = (patch: Partial<PurchaseFilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const handleReset = () => onFiltersChange({ search: '', page: 1, per_page: 20 } as PurchaseFilterState);

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
              <h4 className="font-semibold text-sm">Filtros de compras</h4>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Filtra compras por búsqueda, estado, tienda, cuenta y rango de fechas</p>
        </div>

        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {resultCount !== undefined && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Mostrando <span className="font-semibold text-foreground">{resultCount}</span> compras</p>
            </div>
          )}

          

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Estado</Label>
              <Select value={filters.status_of_shopping || 'all'} onValueChange={(v) => handleChange({ status_of_shopping: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  {PURCHASE_STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Tienda</Label>
              <Select value={String(filters.shop_of_buy || 'all')} onValueChange={(v) => handleChange({ shop_of_buy_id: v === 'all' ? undefined : Number(v) as unknown as number })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={'all'}>Todas</SelectItem>
                  {shops.map((s: Shop) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Cuenta de compra</Label>
            <Select value={String(filters.shopping_account || 'all')} onValueChange={v => handleChange({ shopping_account_id: v === 'all' ? undefined : Number(v) as unknown as number })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={'all'}>Todas</SelectItem>
                {accounts.map((a: BuyingAccount) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Filtros activos</Label>
              <div className="flex flex-wrap gap-1.5">
                {filters.status_of_shopping && filters.status_of_shopping !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {filters.status_of_shopping}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ status_of_shopping: 'all' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {((filters.shop_of_buy ?? filters.shop_of_buy_id) !== undefined) && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Tienda: {shops.find((s: Shop) => s.id === ((filters.shop_of_buy ?? filters.shop_of_buy_id) as number))?.name || 'Tienda'}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ shop_of_buy_id: undefined, shop_of_buy: undefined } as Partial<PurchaseFilterState>)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {((filters.shopping_account ?? filters.shopping_account_id) !== undefined) && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Cuenta: {accounts.find((a: BuyingAccount) => a.id === ((filters.shopping_account ?? filters.shopping_account_id) as number))?.account_name || 'Cuenta'}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ shopping_account_id: undefined, shopping_account: undefined } as Partial<PurchaseFilterState>)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.buy_date_from && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Desde {filters.buy_date_from}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ buy_date_from: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.buy_date_to && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Hasta {filters.buy_date_to}
                    <button className="ml-0.5 hover:bg-muted rounded-full" onClick={() => handleChange({ buy_date_to: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs font-medium">Fecha de compra</Label>
              <div className="flex gap-2">
                <Input type="date" className="w-1/2" value={filters.buy_date_from ?? ''} onChange={(e) => handleChange({ buy_date_from: e.target.value })} />
                <Input type="date" className="w-1/2" value={filters.buy_date_to ?? ''} onChange={(e) => handleChange({ buy_date_to: e.target.value })} />
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

export default PurchaseFilters;
