import { useState } from 'react';
import { useCreateDelivery } from '@/hooks/delivery/useCreateDelivery';
import { toast } from 'sonner';
import type { CreateDeliverReceipData } from '@/types/models/delivery';
import type { DeliveryStatus } from '@/types/models/base';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck, Package, Clock } from 'lucide-react';
import { useOrders } from '@/hooks/order/useOrders';

interface CreateDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateDeliveryDialog({ open, onOpenChange }: CreateDeliveryDialogProps) {
  const createDeliveryMutation = useCreateDelivery();
  const { orders, isLoading: ordersLoading } = useOrders();

  // Estado del formulario
  const [formData, setFormData] = useState<{
    order_id: string;
    weight: string;
    status: DeliveryStatus;
    deliver_date: string;
    weight_cost: string;
    manager_profit: string;
  }>({
    order_id: '', // Ahora opcional
    weight: '',
    status: 'Pendiente',
    deliver_date: '',
    weight_cost: '',
    manager_profit: '',
  });

  // Funciones para obtener estilos según el estado
  const getDeliveryStatusStyles = (status: string) => {
    const styles = {
      'Pendiente': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'En transito': 'bg-blue-50 border-blue-300 text-blue-800',
      'Entregado': 'bg-green-50 border-green-300 text-green-800',
      'Fallida': 'bg-red-50 border-red-300 text-red-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica - ahora el peso es el único campo obligatorio
    if (!formData.weight.trim()) {
      toast.error('Por favor ingresa el peso del delivery');
      return;
    }

    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('El peso debe ser un número positivo');
      return;
    }

    try {
      const deliveryData: Partial<CreateDeliverReceipData> = {
        weight,
        status: formData.status,
        ...(formData.order_id && { order: parseInt(formData.order_id) }),
        ...(formData.deliver_date && { deliver_date: formData.deliver_date }),
        ...(formData.weight_cost && { weight_cost: parseFloat(formData.weight_cost) }),
        ...(formData.manager_profit && { manager_profit: parseFloat(formData.manager_profit) }),
      };

      await createDeliveryMutation.mutateAsync(deliveryData as CreateDeliverReceipData);

      toast.success('Delivery creado exitosamente');

      // Resetear formulario y cerrar diálogo
      setFormData({
        order_id: '',
        weight: '',
        status: 'Pendiente',
        deliver_date: '',
        weight_cost: '',
        manager_profit: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('No se pudo crear el delivery. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Delivery</DialogTitle>
          <DialogDescription>
            Complete los datos del delivery. Solo el peso es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Orden */}
            <div className="grid gap-2">
              <Label htmlFor="order_id">
                Orden (Opcional)
              </Label>
              <Select
                value={formData.order_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, order_id: value }))
                }
                disabled={ordersLoading}
              >
                <SelectTrigger
                  id="order_id"
                  className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                >
                  <SelectValue placeholder="Selecciona una orden" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Package size={16} />
                        <span>#{order.id} - {order.client?.full_name || 'Sin cliente'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Peso */}
            <div className="grid gap-2">
              <Label htmlFor="weight">
                Peso (Lb) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="Ej: 2.5"
                value={formData.weight}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            {/* Fecha de Entrega */}
            <div className="grid gap-2">
              <Label htmlFor="deliver_date">
                Fecha de Entrega
              </Label>
              <Input
                id="deliver_date"
                type="date"
                value={formData.deliver_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliver_date: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            {/* Estado del Delivery */}
            <div className="grid gap-2">
              <Label htmlFor="status">Estado del Delivery</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as DeliveryStatus }))
                }
              >
                <SelectTrigger
                  id="status"
                  className={`${getDeliveryStatusStyles(formData.status)} font-medium`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Pendiente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="En transito">
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span>En tránsito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Entregado">
                    <div className="flex items-center gap-2">
                      <Package size={16} />
                      <span>Entregado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Costo por Peso */}
            <div className="grid gap-2">
              <Label htmlFor="weight_cost">
                Costo por Peso
              </Label>
              <Input
                id="weight_cost"
                type="number"
                step="0.01"
                placeholder="Ej: 5.00"
                value={formData.weight_cost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight_cost: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            {/* Ganancia del Manager */}
            <div className="grid gap-2">
              <Label htmlFor="manager_profit">
                Ganancia del Manager
              </Label>
              <Input
                id="manager_profit"
                type="number"
                step="0.01"
                placeholder="Ej: 2.00"
                value={formData.manager_profit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manager_profit: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={createDeliveryMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createDeliveryMutation.isPending}>
              {createDeliveryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Delivery'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}