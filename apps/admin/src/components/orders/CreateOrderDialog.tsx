import { useState, useMemo, useEffect } from 'react';
import { useCreateOrder } from '@/hooks/order';
import { useUsersByRole } from '@/hooks/user';
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
import { Loader2, CheckCircle2, Truck, XCircle, LoaderIcon, CircleAlert, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth';
import { SALES_MANAGER_ROLES, pickGeneralAdmin, salesManagerLabel } from '@/lib/sales-manager';
import type { CustomUser } from '@/types';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const { user: currentUser } = useAuth();
  const isAgent = currentUser?.role === 'agent';
  const createOrderMutation = useCreateOrder();

  // ADR-0007: cualquier miembro del personal puede ser el gestor.
  const { data: clientsData } = useUsersByRole('client');
  const { data: adminsData } = useUsersByRole('admin');
  const { data: agentsData } = useUsersByRole('agent');
  const { data: accountantsData } = useUsersByRole('accountant');
  const { data: logisticalData } = useUsersByRole('logistical');

  const agents = useMemo(
    () =>
      [
        ...(adminsData?.results || []),
        ...(agentsData?.results || []),
        ...(accountantsData?.results || []),
        ...(logisticalData?.results || []),
      ].filter((u) => (SALES_MANAGER_ROLES as readonly string[]).includes(u.role) && u.is_active !== false),
    [adminsData?.results, agentsData?.results, accountantsData?.results, logisticalData?.results]
  );
  const generalAdminId = useMemo(() => pickGeneralAdmin(adminsData?.results || [])?.id ?? 0, [adminsData?.results]);
  const [managerTouched, setManagerTouched] = useState(false);

  // Estado del formulario — agents auto-set sales_manager_id to themselves
  const [formData, setFormData] = useState({
    client_id: undefined as number | undefined,
    sales_manager_id: isAgent && currentUser?.id ? currentUser.id : 0,
    observations: '',
    pay_status: 'No pagado',
    status: 'Encargado',
  });

  // ADR-0007: el gestor por defecto es el admin general (solo si el
  // usuario no lo ha cambiado a mano).
  useEffect(() => {
    if (isAgent || managerTouched || !generalAdminId) return;
    setFormData((prev) => (prev.sales_manager_id === 0 ? { ...prev, sales_manager_id: generalAdminId } : prev));
  }, [isAgent, managerTouched, generalAdminId]);

  // ADR-0007: el gestor ya no filtra los clientes; se listan todos
  // ordenados por nombre.
  const filteredClients = useMemo(() => {
    const allClients = clientsData?.results || [];
    return [...allClients].sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '')
    );
  }, [clientsData?.results]);

  // Funciones para obtener estilos según el estado
  const getOrderStatusStyles = (status: string) => {
    const styles = {
      'Encargado': 'bg-blue-50 border-blue-300 text-blue-800',
      'Procesando': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'Completado': 'bg-green-50 border-green-300 text-green-800',
      'Cancelado': 'bg-red-50 border-red-300 text-red-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const getPayStatusStyles = (status: string) => {
    const styles = {
      'No pagado': 'bg-red-50 border-red-300 text-red-800',
      'Pagado': 'bg-green-50 border-green-300 text-green-800',
      'Parcial': 'bg-yellow-50 border-yellow-300 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const handleSubmit = async (e: React.FormEvent, redirectToProducts: boolean = false) => {
    e.preventDefault();

    if (!formData.client_id) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    try {
      const newOrder = await createOrderMutation.mutateAsync({
        client_id: formData.client_id,
        sales_manager_id: formData.sales_manager_id || undefined,
        observations: formData.observations || undefined,
        pay_status: formData.pay_status,
        status: formData.status,
      });

      if (!newOrder || !newOrder.id) {
        throw new Error('No se pudo obtener el ID del pedido creado');
      }

      toast.success('Pedido creado exitosamente');

      // Resetear formulario — el agente conserva su id; el resto vuelve
      // al admin general (ADR-0007).
      setManagerTouched(false);
      setFormData({
        client_id: undefined,
        sales_manager_id: isAgent && currentUser?.id ? currentUser.id : generalAdminId,
        observations: '',
        pay_status: 'No pagado',
        status: 'Encargado',
      });

      if (redirectToProducts) {
        // Verificar nuevamente que tenemos el ID antes de redirigir
        if (!newOrder.id) {
          throw new Error('No se pudo obtener el ID del pedido para la redirección');
        }
        // Redirigir a la vista de agregar productos
        window.location.href = `/orders/${newOrder.id}/add-products`;
      } else {
        // Cerrar diálogo si no se redirige
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('No se pudo crear el pedido. Por favor intenta de nuevo.');
    }
  };

  const handleClientChange = (value: string) => {
    setFormData((prev) => ({ ...prev, client_id: parseInt(value) }));
  };

  const handleAgentChange = (value: string) => {
    setManagerTouched(true);
    setFormData((prev) => ({ ...prev, sales_manager_id: parseInt(value) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Complete los datos del pedido. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Gestor (ADR-0007) — fijado a sí mismo para el agente */}
            <div className="grid gap-2">
              <Label htmlFor="agent">Gestor</Label>
              {isAgent ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/50">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>{currentUser?.name} {currentUser?.last_name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Tú</Badge>
                </div>
              ) : (
              <Select
                value={formData.sales_manager_id.toString()}
                onValueChange={handleAgentChange}
              >
                <SelectTrigger id="agent" className="border-gray-200 focus:border-orange-300">
                  <SelectValue placeholder="Selecciona un gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <span className="text-muted-foreground">Sin gestor (se asigna al admin general)</span>
                  </SelectItem>
                  {agents.map((agent: CustomUser) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {salesManagerLabel(agent.full_name || `${agent.name} ${agent.last_name}`, agent.role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
            </div>

            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="client">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_id?.toString() || ""}
                onValueChange={handleClientChange}
              >
                <SelectTrigger id="client" className="border-gray-200 focus:border-orange-300">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client: CustomUser) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      No hay clientes disponibles
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
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
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
                      <Truck size={16} />
                      <span>Encargado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Procesando">
                    <div className="flex items-center gap-2">
                      <LoaderIcon size={16} />
                      <span>Procesando</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Completado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Completado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Cancelado">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} />
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
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, pay_status: value }))
                }
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
                      <CircleAlert size={16} />
                      <span>No pagado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Pagado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Pagado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Parcial">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} />
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
                  setFormData((prev) => ({
                    ...prev,
                    observations: e.target.value,
                  }))
                }
                className="min-h-[100px]"
              />
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={createOrderMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear y Agregar Productos'
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending}
              onClick={(e) => handleSubmit(e, false)}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Pedido'
              )}
            </Button>
            
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
