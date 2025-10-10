import { ShopsHeader, ShopsTable } from '@/components/shops';
import { useShops } from '@/hooks/useShops';
import { buyingAccountService } from '@/services/api';
import { toast } from 'sonner';
import type { Shop } from '@/types/models/shop';
import type { BuyingAccount } from '@/types/models/buying-account';

export default function Shops() {
  const {
    shops,
    selectedShop,
    isLoading,
    addShop,
    updateShop,
    deleteShop,
    selectShop,
    updateShopAccounts
  } = useShops({
    onError: (error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
    onSuccess: (message) => {
      toast.success('Éxito', {
        description: message,
      });
    }
  });

  // Handler para actualizar tienda
  const handleShopUpdate = async (shop: Shop) => {
    try {
      await updateShop(shop.id, {
        name: shop.name,
        link: shop.link,
        is_active: shop.is_active
      });
    } catch (error) {
      toast.error('Error al actualizar tienda', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // Handler para actualizar cuenta
  const handleAccountUpdate = async (_account: BuyingAccount) => {
    // Simplemente recargar las tiendas para actualizar las cuentas
    // El toast ya se muestra en BuyingAccountFormPopover
    updateShopAccounts();
  };

  // Handler para eliminar cuenta
  const handleAccountDelete = async (accountId: number) => {
    if (!selectedShop) return;

    try {
      await buyingAccountService.deleteBuyingAccount(accountId);

      toast.success('Cuenta eliminada', {
        description: 'La cuenta ha sido eliminada exitosamente'
      });

      // Recargar las tiendas para actualizar las cuentas
      updateShopAccounts();
    } catch (error) {
      toast.error('Error al eliminar cuenta', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error; // Propagar el error para que el dialog lo maneje
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <ShopsHeader onShopCreated={addShop} />

      <div className="flex-1 min-h-0">
        <ShopsTable
          shops={shops}
          selectedShop={selectedShop}
          isLoading={isLoading}
          onShopSelect={selectShop}
          onShopUpdate={handleShopUpdate}
          onShopDelete={deleteShop}
          onAccountAdded={updateShopAccounts}
          onAccountUpdate={handleAccountUpdate}
          onAccountDelete={handleAccountDelete}
        />
      </div>
    </div>
  );
}
