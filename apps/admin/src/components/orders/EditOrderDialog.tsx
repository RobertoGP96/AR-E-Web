import { useState, useEffect, useMemo } from 'react';
import { useUpdateOrder } from '@/hooks/order';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Truck, XCircle, User, CircleAlert } from 'lucide-react';
import type { Order, OrderStatus, PayStatus, CustomUser } from '@/types';

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export default function EditOrderDialog({ open, onOpenChange, order }: EditOrderDialogProps) {
  const updateOrderMutation = useUpdateOrder();
  
  // Obtener usuarios (clientes y agentes)
  const { data: clientsData } = useUsers({ role: 'client' });
  const { data: agentsData } = useUsers({ role: 'agent' });
  
  const agents = agentsData?.results || [];

  // Estado del formulario
  const [formData, setFormData] = useState({
    client_id: 0,
    sales_manager_id: 0,
    observations: '',
    pay_status: 'No pagado' as PayStatus,
    status: 'Encargado' as OrderStatus,
  });

  // Filtrar clientes según el agente seleccionado
  const filteredClients = useMemo(() => {
    const allClients = clientsData?.results || [];
    
    if (!formData.sales_manager_id || formData.sales_manager_id === 0) {
      // Si no hay agente seleccionado, mostrar todos los clientes
      return allClients;
    }
    // Filtrar clientes que tienen asignado el agente seleccionado
    return allClients.filter(client => {
      if (!client.assigned_agent) return false;
      
      const assignedAgentId = typeof client.assigned_agent === 'object' 
        ? (client.assigned_agent as CustomUser).id 
        : client.assigned_agent;
      return assignedAgentId === formData.sales_manager_id;
    });
  }, [clientsData?.results, formData.sales_manager_id]);

  // Actualizar el formulario cuando cambie la orden
  useEffect(() => {
    if (order) {
      setFormData({
        client_id: typeof order.client === 'object' ? order.client.id : 0,
        sales_manager_id: typeof order.sales_manager === 'object' ? order.sales_manager.id : 0,
        observations: order.observations || '',
        pay_status: order.pay_status || 'No pagado',
        status: order.status || 'Encargado',
      });
    }
  }, [order]);

  // Funciones para obtener estilos según el estado
  const getOrderStatusStyles = (status: string) => {
    const styles = {
      'Encargado': 'bg-blue-50 border-blue-300 text-blue-800',
      'Procesando': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'Comprado': 'bg-indigo-50 border-indigo-300 text-indigo-800',
      'Recibido': 'bg-purple-50 border-purple-300 text-purple-800',
      'En transito': 'bg-orange-50 border-orange-300 text-orange-800',
      'Entregado': 'bg-green-50 border-green-300 text-green-800',
      'Cancelado': 'bg-red-50 border-red-300 text-red-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const getPayStatusStyles = (status: string) => {
    const styles = {
      'No pagado': 'bg-red-50 border-red-300 text-red-800',
      'Parcial': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'Pagado': 'bg-green-50 border-green-300 text-green-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) {
      toast.error('No se ha seleccionado un pedido');
      return;
    }

    // Validación básica
    if (!formData.client_id) {
      toast.error('El cliente es obligatorio');
      return;
    }

    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        data: {
          client_id: formData.client_id,
          sales_manager_id: formData.sales_manager_id || undefined,
          observations: formData.observations || undefined,
          pay_status: formData.pay_status,
          status: formData.status,
        },
      });

      toast.success(`Pedido #${order.id} actualizado exitosamente`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('No se pudo actualizar el pedido. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido #{order?.id}</DialogTitle>
          <DialogDescription>
            Modifica los datos del pedido. Los campos con (*) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Manager de Ventas - Primero para filtrar clientes */}
            <div className="grid gap-2">
              <Label htmlFor="sales_manager_id">Manager de Ventas</Label>
              <Select
                value={formData.sales_manager_id?.toString() || ""}
                onValueChange={(value) => {
                  const newAgentId = parseInt(value);
                  setFormData(prev => ({
                    ...prev,
                    sales_manager_id: newAgentId,
                    // Limpiar el cliente seleccionado si no está en la lista filtrada
                    client_id: prev.client_id && filteredClients.find(c => c.id === prev.client_id)
                      ? prev.client_id
                      : 0
                  }));
                }}
              >
                <SelectTrigger id="sales_manager_id" className="border-gray-200 focus:border-orange-300">
                  <SelectValue placeholder="Selecciona un agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-500">Todos los clientes</span>
                    </div>
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{agent.full_name || `${agent.name} ${agent.last_name}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
            </div>

            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="client_id">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_id?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: parseInt(value) }))}
              >
                <SelectTrigger id="client_id" className="border-gray-200 focus:border-orange-300">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{client.full_name || `${client.name} ${client.last_name}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      {formData.sales_manager_id !== 0
                        ? 'No hay clientes asignados a este agente'
                        : 'No hay clientes disponibles'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Estado del Pedido */}
            <div className="grid gap-2">
              <Label htmlFor="status">Estado del Pedido</Label>
              <Select
                value={formData.status}
                onValueChange={(value: OrderStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger
                  id="status"
                  className={`${getOrderStatusStyles(formData.status)} font-medium`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Encargado">
                    <div className="flex items-center gap-2">
                      <CircleAlert size={16} className="text-blue-600" />
                      <span>Encargado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Procesando">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="text-yellow-600" />
                      <span>Procesando</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Comprado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-indigo-600" />
                      <span>Comprado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Recibido">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-purple-600" />
                      <span>Recibido</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="En transito">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-orange-600" />
                      <span>En tránsito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Entregado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Entregado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Cancelado">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-red-600" />
                      <span>Cancelado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado de Pago */}
            <div className="grid gap-2">
              <Label htmlFor="pay_status">Estado de Pago</Label>
              <Select
                value={formData.pay_status}
                onValueChange={(value: PayStatus) => setFormData(prev => ({ ...prev, pay_status: value }))}
              >
                <SelectTrigger
                  id="pay_status"
                  className={`${getPayStatusStyles(formData.pay_status)} font-medium`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No pagado">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-red-600" />
                      <span>No Pagado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Pagado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Pagado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Parcial">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="text-yellow-600" />
                      <span>Pago Parcial</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observaciones */}
            <div className="grid col-span-2 gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                placeholder="Ingresa cualquier observación o nota adicional..."
                value={formData.observations}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, observations: e.target.value }))
                }
                className="min-h-[100px] border-gray-200 focus:border-orange-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={updateOrderMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending ? (
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
