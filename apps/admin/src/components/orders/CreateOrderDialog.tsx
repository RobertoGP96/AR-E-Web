import { useState } from 'react';
import { useCreateOrder } from '@/hooks/order';
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
import { Loader2 } from 'lucide-react';
import type { CustomUser } from '@/types';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const createOrderMutation = useCreateOrder();
  
  // Obtener usuarios (clientes y agentes)
  const { data: clientsData } = useUsers({ role: 'client' });
  const { data: agentsData } = useUsers({ role: 'agent' });
  
  const clients = clientsData?.results || [];
  const agents = agentsData?.results || [];

  // Estado del formulario
  const [formData, setFormData] = useState({
    client_email: '',
    sales_manager_email: '',
    observations: '',
    pay_status: 'No pagado',
    status: 'Encargado',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_email) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        client_email: formData.client_email,
        observations: formData.observations || undefined,
        pay_status: formData.pay_status,
        status: formData.status,
      });

      toast.success('Pedido creado exitosamente');

      // Resetear formulario y cerrar diálogo
      setFormData({
        client_email: '',
        sales_manager_email: '',
        observations: '',
        pay_status: 'No pagado',
        status: 'Encargado',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('No se pudo crear el pedido. Por favor intenta de nuevo.');
    }
  };

  const handleClientChange = (value: string) => {
    setFormData((prev) => ({ ...prev, client_email: value }));
  };

  const handleAgentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, sales_manager_email: value }));
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
          <div className="grid gap-4 py-4">
            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="client">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_email}
                onValueChange={handleClientChange}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: CustomUser) => (
                    <SelectItem key={client.id} value={client.email}>
                      {client.full_name} ({client.email})
                    </SelectItem>
                  ))}
                  {clients.length === 0 && (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      No hay clientes disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Agente (Opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="agent">Agente de Ventas</Label>
              <Select
                value={formData.sales_manager_email}
                onValueChange={handleAgentChange}
              >
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Selecciona un agente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent: CustomUser) => (
                    <SelectItem key={agent.id} value={agent.email}>
                      {agent.full_name} ({agent.email})
                    </SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      No hay agentes disponibles
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
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Encargado">Encargado</SelectItem>
                  <SelectItem value="Procesando">Procesando</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
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
                <SelectTrigger id="pay_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No pagado">No pagado</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Pago parcial">Pago parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observaciones */}
            <div className="grid gap-2">
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

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={createOrderMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createOrderMutation.isPending}>
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
