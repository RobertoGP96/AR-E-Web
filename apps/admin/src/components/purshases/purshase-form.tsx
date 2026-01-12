import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { shoppingReceipService } from '@/services/api';
import type { CreateProductBuyedData, Product, ShoppingReceip } from '@/types/models';
import { SHOPPING_STATUSES } from '@/types/models/base';
import SelectedProductsForPurchase from '../products/selected-products-for-purchase';
import { DatePicker } from '@/components/utils/DatePicker';
import ProductBuyedShopping from '../products/buyed/product-buyed-shopping';
import { useShops } from '@/hooks/useShops';

// Schema de validación
const createShoppingReceipSchema = z.object({
  shop_of_buy_id: z.number().min(1, 'Debes seleccionar una tienda'),
  shopping_account_id: z.number().min(1, 'Debes seleccionar una cuenta de compra').optional(),
  status_of_shopping: z.enum(['No pagado', 'Pagado', 'Parcial']).optional(),
  buy_date: z.string().optional(),
  total_cost_of_purchase: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
});

type CreateShoppingReceipFormData = z.infer<typeof createShoppingReceipSchema>;

interface PurchaseFormProps {
  purchase?: ShoppingReceip;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<CreateProductBuyedData[]>([]);

  // Función para convertir Product a CreateProductBuyedData
  const convertProductToCreateProductBuyed = (product: Product): CreateProductBuyedData => {
    return {
      original_product: product.id,
      amount_buyed: product.amount_requested || 1,
    };
  };

  // Función para manejar la confirmación de selección de productos
  const handleProductsConfirmed = (products: Product[]) => {
    const newProductBuyedList = products.map(product =>
      convertProductToCreateProductBuyed(product)
    );
    setSelectedProducts(prevProducts => [...prevProducts, ...newProductBuyedList]);
  };
  const { shops, isLoading: isLoadingShops } = useShops();

  const form = useForm<CreateShoppingReceipFormData>({
    resolver: zodResolver(createShoppingReceipSchema),
    defaultValues: {
      shop_of_buy_id: undefined,
      shopping_account_id: undefined,
      status_of_shopping: undefined,
      buy_date: undefined,
      total_cost_of_purchase: undefined,
    },
  });

  // Cargar cuentas de compra cuando se selecciona una tienda
  const selectedShopId = form.watch('shop_of_buy_id');
  const selectedShop = shops.find(shop => shop.id === selectedShopId);
  const buyingAccounts = selectedShop?.buying_accounts || [];


  const onSubmit = async (data: CreateShoppingReceipFormData) => {
    setIsSubmitting(true);
    try {
      // Encontrar los nombres de la cuenta y tienda seleccionadas
      const selectedShop = shops.find(shop => shop.id === data.shop_of_buy_id);
      const selectedAccount = selectedShop?.buying_accounts?.find(account => account.id === data.shopping_account_id);

      if (!selectedAccount || !selectedShop) {
        toast.error('Cuenta de compra o tienda no encontrada');
        return;
      }

      const payload = {
        shopping_account: data.shopping_account_id, // Send the ID instead of the name
        shop_of_buy: selectedShop.name,
        status_of_shopping: data.status_of_shopping,
        buy_date: data.buy_date,
        total_cost_of_purchase: data.total_cost_of_purchase || 0,
        buyed_products: selectedProducts,
      };

      await shoppingReceipService.createShoppingReceipt(payload as Partial<unknown>);

      toast.success('Recibo de compra creado exitosamente');
      form.reset();
      setSelectedProducts([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating shopping receipt:', error);
      toast.error('Error al crear el recibo de compra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className='grid grid-cols-2 gap-2'>

          {/* Seleccionar tienda */}
          <FormField
            control={form.control}
            name="shop_of_buy_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tienda</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={isLoadingShops}
                >
                  <FormControl>
                    <SelectTrigger className='min-w-[200px]'>
                      {isLoadingShops ? (
                        <div className="flex items-center">
                          <span>Cargando tiendas...</span>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        </div>
                      ) : (
                        <SelectValue className="truncate" placeholder="Selecciona una tienda" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seleccionar cuenta de compra */}
          <FormField
            control={form.control}
            name="shopping_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta de Compra</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={!selectedShopId || buyingAccounts.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        className='min-w-[150px] truncate'
                        placeholder={
                          !selectedShopId
                            ? "Selecciona una tienda primero"
                            : buyingAccounts.length === 0
                              ? "No hay cuentas disponibles"
                              : "Selecciona una cuenta"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {buyingAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado de compra */}
          <FormField
            control={form.control}
            name="status_of_shopping"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Compra (Opcional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="truncate" placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(SHOPPING_STATUSES).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de compra */}
          <FormField
            control={form.control}
            name="buy_date"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker
                    label="Fecha de Compra (Opcional)"
                    placeholder="Selecciona la fecha"
                    selected={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='w-full'>
          <div className='w-full flex flex-row nowrap  items-center justify-between'>

            <h2 className="text-lg font-medium mt-6 mb-4">Productos Seleccionados para la Compra</h2>
            <div className={selectedShopId ? '' : 'pointer-events-none opacity-50'}>
              <SelectedProductsForPurchase
                filters={{ status: 'Encargado' }}
                orderId={0} // No se requiere en este contexto
                shoppingReceiptId={0} // No se requiere en este contexto
                shopId={selectedShopId}
                selectionMode={true}
                onProductsConfirmed={handleProductsConfirmed}
                onProductBuyedCreated={(productBuyed) => {
                  console.log('Producto comprado creado:', productBuyed);
                }}
              />
            </div>
          </div>

          <div className='p-4 bg-gray-300/30 rounded-sm max-h-96 overflow-y-auto'>
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500">No hay productos seleccionados para la compra.</p>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((productB) => (
                  <div key={productB.original_product} className="bg-white p-3 rounded-md shadow-sm">
                    <ProductBuyedShopping productB={productB} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>


        {/* Costo total de la compra */}
        <div className="">
          <FormField
            control={form.control}
            name="total_cost_of_purchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Real de Compra:</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ingresa el costo real pagado"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Recibo de Compra'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
