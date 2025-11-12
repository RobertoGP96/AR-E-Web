import { useState, useEffect, useMemo } from 'react';
import { useUpdateDelivery } from '@/hooks/delivery';
import { useCategories } from '@/hooks/category/useCategory';
import { useUsers } from '@/hooks/user';
import { toast } from 'sonner';
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
import { Loader2, Truck, Package, CheckCircle2, Weight } from 'lucide-react';
import type { DeliverReceip, DeliveryStatus } from '@/types';
import { DatePicker } from '../utils/DatePicker';

interface EditDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DeliverReceip | null;
}

export default function EditDeliveryDialog({ open, onOpenChange, delivery }: EditDeliveryDialogProps) {
  const updateDeliveryMutation = useUpdateDelivery();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: agentsData } = useUsers({ role: 'agent' });
  const categoryList = useMemo(() => categories?.results || [], [categories?.results]);
  const agents = useMemo(() => agentsData?.results || [], [agentsData?.results]);

  // Obtener el agente asignado al cliente del delivery
  const assignedAgent = useMemo(() => {
    if (!delivery?.client || typeof delivery.client !== 'object') return null;
    if (!delivery.client.assigned_agent) return null;
    return agents.find(a => a.id === delivery.client.assigned_agent);
  }, [delivery, agents]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    category_id: undefined as number | undefined,
    weight: 0,
    status: 'Pendiente' as DeliveryStatus,
    deliver_date: '',
    weight_cost: 0,
    manager_profit: 0,
  });

  // Actualizar el formulario cuando cambie el delivery
  useEffect(() => {
    if (delivery) {
      setFormData({
        category_id: delivery.category?.id,
        weight: delivery.weight || 0,
        status: delivery.status || 'Pendiente',
        deliver_date: delivery.deliver_date ? delivery.deliver_date.split('T')[0] : '',
        weight_cost: delivery.weight_cost || 0,
        manager_profit: delivery.manager_profit || 0,
      });
    }
  }, [delivery]);

  // Efecto para calcular automáticamente el costo por peso
  useEffect(() => {
    if (formData.category_id && formData.weight > 0) {
      const selectedCategory = categoryList.find(c => c.id === formData.category_id);

      if (selectedCategory) {
        const calculatedCost = selectedCategory.client_shipping_charge * formData.weight;
        setFormData(prev => ({ ...prev, weight_cost: parseFloat(calculatedCost.toFixed(2)) }));
      }
    }
  }, [formData.category_id, formData.weight, categoryList]);

  // Efecto para calcular automáticamente la ganancia del manager (peso × agent_profit del agente asignado)
  useEffect(() => {
    if (assignedAgent && formData.weight > 0) {
      const agentProfit = assignedAgent.agent_profit || 0;

      if (agentProfit > 0) {
        const calculatedProfit = formData.weight * agentProfit;
        setFormData(prev => ({ ...prev, manager_profit: parseFloat(calculatedProfit.toFixed(2)) }));
      }
    }
  }, [assignedAgent, formData.weight]);

  // Funciones para obtener estilos según el estado
  const getDeliveryStatusStyles = (status: string) => {
    const styles = {
      'Pendiente': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'En transito': 'bg-blue-50 border-blue-300 text-blue-800',
      'Entregado': 'bg-green-50 border-green-300 text-green-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delivery) {
      toast.error('No se ha seleccionado un delivery');
      return;
    }

    // Validación básica
    if (formData.weight <= 0) {
      toast.error('El peso debe ser mayor a 0');
      return;
    }

    if (!formData.deliver_date) {
      toast.error('La fecha de entrega es obligatoria');
      return;
    }

    if (!formData.category_id) {
      toast.error('La categoría es obligatoria');
      return;
    }

    try {
      await updateDeliveryMutation.mutateAsync({
        id: delivery.id,
        data: {
          id: delivery.id,
          category_id: formData.category_id,
          weight: formData.weight,
          status: formData.status,
          deliver_date: formData.deliver_date,
          weight_cost: formData.weight_cost,
          manager_profit: formData.manager_profit,
        },
      });

      toast.success(`Delivery #${delivery.id} actualizado exitosamente`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('No se pudo actualizar el delivery. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Delivery #{delivery?.id}</DialogTitle>
          <DialogDescription>
            Modifica los datos del delivery. Los campos con (*) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Cliente (solo lectura) */}
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                {delivery?.client && typeof delivery.client === 'object' ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {delivery.client.name?.[0]}{delivery.client.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{delivery.client.name} {delivery.client.last_name}</p>
                      <p className="text-xs text-gray-500">{delivery.client.email}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Sin cliente</span>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div className="grid gap-2">
              <Label htmlFor="category_id">
                Categoría <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category_id?.toString() || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category_id: value ? parseInt(value) : undefined }))
                }
                disabled={categoriesLoading}
              >
                <SelectTrigger
                  id="category_id"
                  className="border-gray-200 focus:border-orange-300"
                >
                  <SelectValue placeholder="Selecciona una categoría">
                    {formData.category_id && categoryList ? (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>
                          {categoryList.find(c => c.id === formData.category_id)?.name || 'Categoría desconocida'}
                        </span>
                        {categoryList.find(c => c.id === formData.category_id) && (
                          <span className="text-xs text-gray-500">
                            (${categoryList.find(c => c.id === formData.category_id)?.client_shipping_charge}/lb)
                          </span>
                        )}
                      </div>
                    ) : (
                      'Selecciona una categoría'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Cargando...</span>
                    </div>
                  ) : categoryList.length > 0 ? (
                    categoryList.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{category.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ${category.client_shipping_charge}/lb
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No hay categorías disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
              {formData.category_id && categoryList && (
                <p className="text-xs text-gray-500">
                  Cobro al cliente: ${categoryList.find(c => c.id === formData.category_id)?.client_shipping_charge || 0}/lb
                </p>
              )}
            </div>

            {/* Peso */}
            <div className="grid gap-2">
              <Label htmlFor="weight">
                Peso (Lb) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ej: 5.5"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))
                  }
                  className="pl-9 border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                />
              </div>
            </div>

            {/* Fecha de Entrega */}
            <div className="grid gap-2">
              <DatePicker
                value={formData.deliver_date ? new Date(formData.deliver_date) : undefined}
                onChange={(date: Date | undefined) => setFormData({ ...formData, deliver_date: date?.toISOString() || '' })}
              />

            </div>

            {/* Estado del Delivery */}
            <div className="grid gap-2">
              <Label htmlFor="status">Estado del Delivery</Label>
              <Select
                value={formData.status}
                onValueChange={(value: DeliveryStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
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
                      <Package size={16} className="text-yellow-600" />
                      <span>Pendiente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="En transito">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-blue-600" />
                      <span>En tránsito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Entregado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Entregado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Costos adicionales (colapsables) */}
            <details className="border border-gray-200 rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Costos Adicionales (Opcional)
              </summary>
              <div className="grid gap-3 mt-3">
                <div className="grid gap-2">
                  <Label htmlFor="weight_cost">
                    Costo por Peso (Calculado automáticamente)
                  </Label>
                  <Input
                    id="weight_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.weight_cost}
                    readOnly
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 bg-gray-50"
                  />
                  {formData.category_id && formData.weight > 0 && (
                    <p className="text-xs text-gray-500">
                      Cálculo: {formData.weight} lb × $
                      {categoryList.find(c => c.id === formData.category_id)?.client_shipping_charge || 0}/lb = $
                      {formData.weight_cost.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="manager_profit">Ganancia del Manager ($) - Editable</Label>
                  <Input
                    id="manager_profit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.manager_profit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, manager_profit: parseFloat(e.target.value) || 0 }))
                    }
                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                  />
                  {assignedAgent && formData.weight > 0 && (
                    <p className="text-xs text-gray-500">
                      Cálculo: {formData.weight} lb × ${assignedAgent.agent_profit || 0}/lb (profit del agente {assignedAgent.name}) = $
                      {formData.manager_profit.toFixed(2)}
                    </p>
                  )}
                  {delivery?.client && typeof delivery.client === 'object' && !assignedAgent && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Este cliente no tiene un agente asignado
                    </p>
                  )}
                </div>
              </div>
            </details>

            {/* Resumen de costos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Resumen de Costos</p>
              <div className="space-y-1 text-sm text-blue-800">
                {formData.category_id && categoryList && (
                  <div className="flex justify-between">
                    <span>Costo de entrega ({formData.weight} lb):</span>
                    <span className="font-medium">
                      ${((categoryList.find(c => c.id === formData.category_id)?.client_shipping_charge || 0) * formData.weight).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Ganancia manager:</span>
                  <span className="font-medium">${formData.manager_profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                  <span className="font-semibold">Total estimado:</span>
                  <span className="font-semibold">
                    ${(
                      ((categoryList.find(c => c.id === formData.category_id)?.client_shipping_charge || 0) * formData.weight) +
                      formData.manager_profit
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={updateDeliveryMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateDeliveryMutation.isPending}>
              {updateDeliveryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
