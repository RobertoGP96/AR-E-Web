import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

import type { Order, Product, CreateProductReceivedData } from '@/types';
import { getProductsByOrder } from '@/services/products/get-products';
import { createProductReceived } from '@/services/products/product-received';
import { updateProductStatus } from '@/services/products/update-product';
import { toast } from 'sonner';

interface AddProductsDialogProps {
  order?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (order: Order) => void;
}

interface ProductReception {
  product: Product;
  selected: boolean;
  amount: number;
  observation: string;
}

export default function AddProductsDialog({ order = null, open, onOpenChange }: AddProductsDialogProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productReceptions, setProductReceptions] = useState<ProductReception[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const loadAvailableProducts = useCallback(async () => {
    if (!order) return;

    try {
      const response = await getProductsByOrder(order.id);
      // Filtrar productos que no están completamente recibidos
      const available = response.results.filter(
        (product: Product) => product.amount_received < product.amount_requested
      );
      setAvailableProducts(available);

      // Inicializar el estado de recepciones
      const receptions: ProductReception[] = available.map(product => ({
        product,
        selected: false,
        amount: 0,
        observation: ''
      }));
      setProductReceptions(receptions);
    } catch (err: unknown) {
      let msg = 'Error cargando productos disponibles';
      if (err && typeof err === 'object' && 'message' in err) {
        const e = err as { message?: unknown };
        if (typeof e.message === 'string') msg = e.message;
      }
      setErrors(msg);
      toast.error(`Error cargando productos: ${msg}`);
    }
  }, [order]);

  useEffect(() => {
    if (!open) {
      setErrors(null);
      setProductReceptions([]);
    } else if (order) {
      loadAvailableProducts();
    }
  }, [open, order, loadAvailableProducts]);

  const handleProductSelection = (index: number, selected: boolean) => {
    const updated = [...productReceptions];
    updated[index].selected = selected;
    if (!selected) {
      updated[index].amount = 0;
      updated[index].observation = '';
    }
    setProductReceptions(updated);
  };

  const handleAmountChange = (index: number, amount: number) => {
    const updated = [...productReceptions];
    updated[index].amount = amount;
    setProductReceptions(updated);
  };

  const handleObservationChange = (index: number, observation: string) => {
    const updated = [...productReceptions];
    updated[index].observation = observation;
    setProductReceptions(updated);
  };

  const handleSubmit = async () => {
    if (!order) {
      setErrors('Orden no encontrada');
      return;
    }

    const selectedReceptions = productReceptions.filter(r => r.selected && r.amount > 0);
    if (selectedReceptions.length === 0) {
      setErrors('Selecciona al menos un producto y especifica la cantidad recibida');
      return;
    }

    // Validar que las cantidades no excedan lo pendiente
    for (const reception of selectedReceptions) {
      const pending = reception.product.amount_requested - reception.product.amount_received;
      if (reception.amount > pending) {
        setErrors(`La cantidad para ${reception.product.name} no puede exceder ${pending}`);
        return;
      }
    }

    setLoading(true);
    setErrors(null);

    try {
      // Crear recepciones para cada producto seleccionado
      for (const reception of selectedReceptions) {
        const data: CreateProductReceivedData = {
          original_product_id: reception.product.id,
          amount_received: reception.amount,
          observation: reception.observation || undefined
        };

        await createProductReceived(data);

        // Verificar si el producto está completamente recibido
        const newTotalReceived = reception.product.amount_received + reception.amount;
        if (newTotalReceived >= reception.product.amount_requested) {
          // Cambiar status a "Completado"
          await updateProductStatus(reception.product.id, 'Completado');
        }
      }

      toast.success('Productos recibidos registrados correctamente');
      onOpenChange(false);
      // Recargar productos disponibles
      await loadAvailableProducts();
    } catch (err: unknown) {
      let msg = 'Error registrando recepciones';
      if (err && typeof err === 'object' && 'message' in err) {
        const e = err as { message?: unknown };
        if (typeof e.message === 'string') msg = e.message;
      }
      setErrors(msg);
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-3/4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar recepción de productos - Pedido #{order ? order.id : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errors && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors}</div>
          )}

          {availableProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay productos disponibles para recepción en esta orden.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona los productos que has recibido e indica la cantidad de cada uno.
              </p>

              {productReceptions.map((reception, index) => {
                const pending = reception.product.amount_requested - reception.product.amount_received;
                return (
                  <div key={reception.product.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`product-${index}`}
                        checked={reception.selected}
                        onCheckedChange={(checked) => handleProductSelection(index, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`product-${index}`} className="font-medium cursor-pointer">
                          {reception.product.name}
                        </Label>
                        <div className="text-sm text-gray-600 mt-1">
                          SKU: {reception.product.sku} | Pendiente: {pending} | Recibido: {reception.product.amount_received}/{reception.product.amount_requested}
                        </div>
                      </div>
                    </div>

                    {reception.selected && (
                      <div className="ml-7 space-y-3">
                        <div>
                          <Label htmlFor={`amount-${index}`}>Cantidad recibida</Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            min="1"
                            max={pending}
                            value={reception.amount || ''}
                            onChange={(e) => handleAmountChange(index, parseInt(e.target.value) || 0)}
                            placeholder={`Máximo ${pending}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`observation-${index}`}>Observación (opcional)</Label>
                          <Textarea
                            id={`observation-${index}`}
                            value={reception.observation}
                            onChange={(e) => handleObservationChange(index, e.target.value)}
                            placeholder="Observaciones sobre la recepción..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar recepciones'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
