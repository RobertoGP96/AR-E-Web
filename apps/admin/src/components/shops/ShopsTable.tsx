import { useState } from 'react';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ShopsList from './ShopsList';
import AccountsList from './AccountsList';
import DeleteDialog from './DeleteDialog';
import type { Shop } from '@/types/models/shop';
import type { BuyingAccount } from '@/types/models/buying-account';

interface ShopsTableProps {
  shops: Shop[];
  selectedShop: Shop | null;
  isLoading?: boolean;
  onShopSelect: (shop: Shop) => void;
  onShopUpdate: (shop: Shop) => void;
  onShopDelete: (id: number) => Promise<void>;
  onAccountAdded: () => void;
  onAccountUpdate: (account: BuyingAccount) => void;
  onAccountDelete: (accountId: number) => Promise<void>;
}

export default function ShopsTable({
  shops,
  selectedShop,
  isLoading = false,
  onShopSelect,
  onShopUpdate,
  onShopDelete,
  onAccountAdded,
  onAccountUpdate,
  onAccountDelete
}: ShopsTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'shop' | 'account' | null;
    item: Shop | BuyingAccount | null;
  }>({
    open: false,
    type: null,
    item: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers para tiendas
  const handleShopDeleteClick = (shop: Shop) => {
    setDeleteDialog({
      open: true,
      type: 'shop',
      item: shop
    });
  };

  const handleShopDeleteConfirm = async () => {
    const shop = deleteDialog.item as Shop;
    setIsDeleting(true);

    try {
      await onShopDelete(shop.id);
      setDeleteDialog({ open: false, type: null, item: null });
    } catch (error) {
      console.error('Error al eliminar tienda:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers para cuentas
  const handleAccountDeleteClick = (account: BuyingAccount) => {
    setDeleteDialog({
      open: true,
      type: 'account',
      item: account
    });
  };

  const handleAccountDeleteConfirm = async () => {
    const account = deleteDialog.item as BuyingAccount;
    setIsDeleting(true);

    try {
      await onAccountDelete(account.id);
      setDeleteDialog({ open: false, type: null, item: null });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Estados de carga
  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded"></div>
                ))}
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado vacío
  if (!shops || shops.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tiendas</h3>
              <p className="text-gray-500">Comienza agregando una tienda desde el botón "Agregar Tienda".</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el dialog de eliminación
  const deleteDialogProps = deleteDialog.type === 'shop' 
    ? {
        title: `¿Eliminar ${(deleteDialog.item as Shop)?.name}?`,
        description: 'Esta acción no se puede deshacer. Se eliminará la tienda de forma permanente.',
        warningMessage: (deleteDialog.item as Shop)?.buying_accounts?.length 
          ? `También se eliminarán ${(deleteDialog.item as Shop).buying_accounts!.length} cuenta(s) asociada(s).`
          : undefined
      }
    : {
        title: `¿Eliminar cuenta ${(deleteDialog.item as BuyingAccount)?.account_name}?`,
        description: 'Esta acción no se puede deshacer. Se eliminará la cuenta de forma permanente.',
        warningMessage: undefined
      };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <ShopsList
          shops={shops}
          selectedShop={selectedShop}
          onShopSelect={onShopSelect}
          onShopUpdate={onShopUpdate}
          onShopDelete={handleShopDeleteClick}
          onAccountAdded={onAccountAdded}
        />
        
        <AccountsList
          shop={selectedShop}
          onAccountUpdate={onAccountUpdate}
          onAccountDelete={handleAccountDeleteClick}
        />
      </section>

      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, item: null })}
        title={deleteDialogProps.title}
        description={deleteDialogProps.description}
        warningMessage={deleteDialogProps.warningMessage}
        onConfirm={deleteDialog.type === 'shop' ? handleShopDeleteConfirm : handleAccountDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}
