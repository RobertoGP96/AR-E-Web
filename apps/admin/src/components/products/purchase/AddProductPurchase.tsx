import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useCreateProductBuyed } from '@/hooks/product/useCreateProductBuyed';
import { shoppingReceipService } from '@/services/api';
import type { ShoppingReceip } from '@/types/models';
import { DatePicker } from '@/components/utils/DatePicker';

// Schema de validación
const addProductPurchaseSchema = z.object({
  shoping_receip: z.number().min(1, 'Debes seleccionar un recibo de compra'),
  amount_buyed: z.number().min(1, 'La cantidad debe ser al menos 1'),
  actual_cost_of_product: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
  shop_discount: z.number().min(0, 'El descuento debe ser mayor o igual a 0').optional(),
  offer_discount: z.number().min(0, 'El descuento debe ser mayor o igual a 0').optional(),
  buy_date: z.string().optional(),
  observation: z.string().optional(),
});

type AddProductPurchaseFormData = z.infer<typeof addProductPurchaseSchema>;

interface AddProductPurchaseProps {
  productId: number;
  orderId: number;
  onPurchaseAdded?: () => void;
}

const AddProductPurchase: React.FC<AddProductPurchaseProps> = ({
  productId,
  orderId,
  onPurchaseAdded,
}) => {
  const [shoppingReceipts, setShoppingReceipts] = useState<ShoppingReceip[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const { createProductBuyed, isCreating } = useCreateProductBuyed();

  const form = useForm<AddProductPurchaseFormData>({
    resolver: zodResolver(addProductPurchaseSchema),
    defaultValues: {
      shoping_receip: undefined,
      amount_buyed: 1,
      actual_cost_of_product: 0,
      shop_discount: 0,
      offer_discount: 0,
      buy_date: new Date().toISOString(),
      observation: '',
    },
  });

  // Cargar recibos de compra
  useEffect(() => {
    loadShoppingReceipts();
  }, []);

  const loadShoppingReceipts = async () => {
    setIsLoadingReceipts(true);
    try {
      const response = await shoppingReceipService.getShoppingReceipts({
        per_page: 100,
      });
      setShoppingReceipts(response.results || []);
    } catch (error) {
      console.error('Error loading shopping receipts:', error);
      toast.error('Error al cargar los recibos de compra');
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const onSubmit = async (data: AddProductPurchaseFormData) => {
    try {
      const actualCost = data.actual_cost_of_product || 0;
      const shopDiscount = data.shop_discount || 0;
      const offerDiscount = data.offer_discount || 0;
      const realCost = actualCost - shopDiscount - offerDiscount;

      const payload = {
        original_product: productId.toString(),
        order: orderId,
        actual_cost_of_product: actualCost,
        shop_discount: shopDiscount,
        offer_discount: offerDiscount,
        buy_date: data.buy_date || new Date().toISOString(),
        shoping_receip: data.shoping_receip,
        amount_buyed: data.amount_buyed,
        observation: data.observation || '',
        real_cost_of_product: realCost,
      };

      await createProductBuyed(payload);
      toast.success('Compra agregada exitosamente');
      form.reset();
      onPurchaseAdded?.();
    } catch (error) {
      console.error('Error creating product purchase:', error);
      toast.error('Error al agregar la compra');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recibo de Compra */}
          <FormField
            control={form.control}
            name="shoping_receip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recibo de Compra *</FormLabel>
                <Select
                  disabled={isLoadingReceipts}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un recibo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingReceipts ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      shoppingReceipts.map((receipt) => (
                        <SelectItem key={receipt.id} value={receipt.id.toString()}>
                          #{receipt.id} - {receipt.shop_of_buy} ({new Date(receipt.buy_date || '').toLocaleDateString()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cantidad Comprada */}
          <FormField
            control={form.control}
            name="amount_buyed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad Comprada *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Costo Actual */}
          <FormField
            control={form.control}
            name="actual_cost_of_product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Actual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descuento de Tienda */}
          <FormField
            control={form.control}
            name="shop_discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descuento de Tienda</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descuento de Oferta */}
          <FormField
            control={form.control}
            name="offer_discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descuento de Oferta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de Compra */}
          <FormField
            control={form.control}
            name="buy_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Compra</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observación */}
        <FormField
          control={form.control}
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observación</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales sobre la compra..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Agregar Compra
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddProductPurchase;
