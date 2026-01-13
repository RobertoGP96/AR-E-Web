import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CreateProductBuyedData } from '@/types/models/product-buyed';

// Esquema de validación con Zod
const createProductBuyedSchema = z.object({
  original_product: z.string().min(1, 'Selecciona un producto'),
  order: z.number().min(1, 'El ID de orden es requerido'),
  shoping_receip: z.number().min(1, 'El ID del recibo de compra es requerido'),
  actual_cost_of_product: z.number().min(0, 'El costo actual debe ser mayor o igual a 0'),
  amount_buyed: z.number().min(1, 'La cantidad debe ser al menos 1'),
  shop_discount: z.number().min(0).optional(),
  offer_discount: z.number().min(0).optional(),
  buy_date: z.string().optional(),
  observation: z.string().optional(),
});

type CreateProductBuyedFormData = z.infer<typeof createProductBuyedSchema>;

interface ProductBuyedFormProps {
  onSubmit: (data: CreateProductBuyedData) => void;
  isLoading?: boolean;
  // Aquí puedes agregar props para la lista de productos si es necesario
  products?: Array<{ id: string; name: string }>;
}

export function ProductBuyedForm({ onSubmit, isLoading = false, products = [] }: ProductBuyedFormProps) {
  const form = useForm<CreateProductBuyedFormData>({
    resolver: zodResolver(createProductBuyedSchema),
    defaultValues: {
      original_product: '',
      order: 0,
      shoping_receip: 0,
      actual_cost_of_product: 0,
      amount_buyed: 1,
      shop_discount: 0,
      offer_discount: 0,
      buy_date: '',
      observation: '',
    },
  });

  const handleSubmit = (data: CreateProductBuyedFormData) => {
    const submitData: CreateProductBuyedData = {
      ...data,
      // Convertir order y shoping_receip a number si vienen como string
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Selector de producto */}
        <FormField
          control={form.control}
          name="original_product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID de Orden */}
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de Orden</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ingresa el ID de la orden"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID del Recibo de Compra */}
        <FormField
          control={form.control}
          name="shoping_receip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID del Recibo de Compra</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ingresa el ID del recibo"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Costo Actual del Producto */}
        <FormField
          control={form.control}
          name="actual_cost_of_product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo Actual del Producto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
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
              <FormLabel>Cantidad Comprada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
              <FormLabel>Descuento de Tienda (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
              <FormLabel>Descuento de Oferta (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
              <FormLabel>Fecha de Compra (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Observación */}
        <FormField
          control={form.control}
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observación (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agrega una observación..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Producto Comprado'}
        </Button>
      </form>
    </Form>
  );
}
