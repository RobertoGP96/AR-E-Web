import { ShopsHeader, ShopsTable } from '@/components/shops';
import { useShops } from '@/hooks/useShops';
import { buyingAccountService } from '@/services/api';
import { toast } from 'sonner';
import type { Shop } from '@/types/models/shop';

export default function Shops() {
  const {
    shops,
    selectedShop,
    isLoading,
    addShop,
    deleteShop,
    selectShop,
    updateShopAccounts,
    fetchShops
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
  // Nota: La tienda ya fue actualizada en ShopFormPopover y se invalidó la query de React Query
  // Solo recargamos el estado local del hook useShops para mantener sincronización
  // No mostramos toast aquí porque ya se mostró en ShopFormPopover
  const handleShopUpdate = async (_shop: Shop) => {
    // Recargar las tiendas para actualizar el estado local
    // Esto no mostrará toast porque el hook tiene onSuccess configurado pero
    // solo se llama en deleteShop, no en fetchShops
    await fetchShops();
  };

  // Handler para actualizar cuenta
  const handleAccountUpdate = async () => {
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
