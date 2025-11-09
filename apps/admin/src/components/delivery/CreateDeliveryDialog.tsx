import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Truck, Package, Clock, User, Tag } from 'lucide-react';
import { useUsers } from '@/hooks/user';
import { useCategories } from '@/hooks/category/useCategory';

interface CreateDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateDeliveryDialog({ open, onOpenChange }: CreateDeliveryDialogProps) {
  const createDeliveryMutation = useCreateDelivery();
  const { data: usersData, isLoading: usersLoading } = useUsers({ role: 'client' });
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const clients = useMemo(() => usersData?.results || [], [usersData?.results]);
  const categories = useMemo(() => categoriesData?.results || [], [categoriesData?.results]);

  // Estado del formulario
  const [formData, setFormData] = useState<{
    client_id: string;
    category_id: string;
    order_id: string;
    weight: string;
    status: DeliveryStatus;
    deliver_date: string;
    weight_cost: string;
    manager_profit: string;
  }>({
    client_id: '',
    category_id: '',
    order_id: '',
    weight: '',
    status: 'Pendiente',
    deliver_date: '',
    weight_cost: '',
    manager_profit: '',
  });


  // Efecto para calcular automáticamente el costo por peso
  useEffect(() => {
    if (formData.category_id && formData.weight) {
      const selectedCategory = categories.find(c => c.id.toString() === formData.category_id);
      const weight = parseFloat(formData.weight);
      
      if (selectedCategory && !isNaN(weight) && weight > 0) {
        const calculatedCost = selectedCategory.client_shipping_charge * weight;
        setFormData(prev => ({ ...prev, weight_cost: calculatedCost.toFixed(2) }));
      }
    } else if (!formData.category_id || !formData.weight) {
      // Limpiar el costo si no hay categoría o peso
      setFormData(prev => ({ ...prev, weight_cost: '' }));
    }
  }, [formData.category_id, formData.weight, categories]);


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

    // Validación - cliente y peso son obligatorios
    if (!formData.client_id.trim()) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

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
      const deliveryData: CreateDeliverReceipData = {
        client_id: parseInt(formData.client_id),
        weight,
        status: formData.status,
        ...(formData.category_id && { category_id: parseInt(formData.category_id) }),
        ...(formData.deliver_date && { deliver_date: formData.deliver_date }),
        ...(formData.weight_cost && { weight_cost: parseFloat(formData.weight_cost) }),
        ...(formData.manager_profit && { manager_profit: parseFloat(formData.manager_profit) }),
      };

      await createDeliveryMutation.mutateAsync(deliveryData);

      toast.success('Delivery creado exitosamente');

      // Resetear formulario y cerrar diálogo
      setFormData({
        client_id: '',
        category_id: '',
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
            Selecciona un cliente para ver sus órdenes disponibles con productos pendientes de entrega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="client_id">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, client_id: value, order_id: '' })) // Limpiar orden al cambiar cliente
                }
                disabled={usersLoading}
              >
                <SelectTrigger
                  id="client_id"
                  className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                >
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{user.full_name || `${user.name} ${user.last_name}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="grid gap-2">
              <Label htmlFor="category_id">
                Categoría (Opcional)
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value }))
                }
                disabled={categoriesLoading}
              >
                <SelectTrigger
                  id="category_id"
                  className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          ${category.client_shipping_charge}/lb
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.category_id && (
                <p className="text-xs text-gray-500">
                  El costo de entrega se calculará automáticamente: peso × $
                  {categories.find(c => c.id.toString() === formData.category_id)?.client_shipping_charge || 0}/lb
                </p>
              )}
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
                Costo por Peso (Calculado automáticamente)
              </Label>
              <Input
                id="weight_cost"
                type="number"
                step="0.01"
                placeholder="Selecciona categoría y peso"
                value={formData.weight_cost}
                readOnly
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 bg-gray-50"
              />
              {formData.category_id && formData.weight && (
                <p className="text-xs text-gray-500">
                  Cálculo: {formData.weight} lb × $
                  {categories.find(c => c.id.toString() === formData.category_id)?.client_shipping_charge || 0}/lb = $
                  {formData.weight_cost || '0.00'}
                </p>
              )}
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