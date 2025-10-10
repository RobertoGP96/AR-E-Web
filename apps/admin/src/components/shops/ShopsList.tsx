import { ExternalLink, Edit, User, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ShopFormPopover from './form/ShopFormPopover';
import BuyingAccountFormPopover from './form/BuyingAccountFormPopover';
import { getShopLogo } from '@/constants/shop-logos';
import { cn } from '@/lib/utils';
import type { Shop } from '@/types/models/shop';

interface ShopsListProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onShopSelect: (shop: Shop) => void;
  onShopUpdate: (shop: Shop) => void;
  onShopDelete: (shop: Shop) => void;
  onAccountAdded: (shop: Shop) => void;
}

export default function ShopsList({
  shops,
  selectedShop,
  onShopSelect,
  onShopUpdate,
  onShopDelete,
  onAccountAdded
}: ShopsListProps) {
  return (
    <article className="flex flex-col h-full overflow-hidden rounded-lg border border-muted bg-background shadow-md">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Tiendas Disponibles</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Cuentas</TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableBody>
            {shops.map((shop) => (
            <TableRow
              key={shop.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selectedShop?.id === shop.id
                  ? "bg-gray-50 border-l-4 border-l-gray-700 hover:bg-gray-100"
                  : "hover:bg-gray-50 border-l-4 border-l-transparent"
              )}
              onClick={() => onShopSelect(shop)}
            >
              <TableCell className="py-4 px-6">
                <div className="flex flex-row gap-4 items-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-md">
                    <img
                      src={getShopLogo(shop.name)}
                      alt={`${shop.name} logo`}
                      className="w-12 h-12 object-contain filter drop-shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-base">
                        {shop.name}
                      </span>
                      {/* Indicador de estado activo */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        shop.is_active 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {shop.is_active ? '● Activa' : '○ Inactiva'}
                      </span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <a
                        href={shop.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visitar
                      </a>
                    </Badge>
                  </div>
                </div>
              </TableCell>

              <TableCell className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">
                    {shop.buying_accounts?.length || 0}
                  </span>
                </div>
              </TableCell>

              <TableCell className="p-4">
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Botón Agregar Cuenta */}
                  <BuyingAccountFormPopover
                    shopId={shop.id}
                    shopName={shop.name}
                    onSuccess={() => onAccountAdded(shop)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-green-600 hover:bg-green-50 hover:text-green-700 border border-green-200 shadow-sm transition-all duration-200"
                        aria-label="Agregar Cuenta"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Cuenta</span>
                      </Button>
                    }
                  />

                  {/* Botón Editar Tienda */}
                  <ShopFormPopover
                    shop={shop}
                    mode="edit"
                    onSuccess={onShopUpdate}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 flex items-center justify-center border border-blue-200 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                        aria-label="Editar Tienda"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />

                  {/* Botón Eliminar Tienda */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 flex items-center justify-center border border-red-200 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    aria-label="Eliminar Tienda"
                    onClick={() => onShopDelete(shop)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </article>
  );
}
