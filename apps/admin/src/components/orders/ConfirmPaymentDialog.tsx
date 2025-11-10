import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatCurrency, type Order } from '@/types';

interface ConfirmPaymentDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (orderId: number, amountReceived: number) => Promise<void>;
}

export function ConfirmPaymentDialog({ order, open, onClose, onConfirm }: ConfirmPaymentDialogProps) {
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleClose = () => {
    if (!isSubmitting) {
      setAmountReceived('');
      setError('');
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) {
      console.error('[ConfirmPaymentDialog] Error: No hay orden seleccionada');
      setError('No se pudo identificar el pedido.');
      return;
    }

    if (!order.id) {
      console.error('[ConfirmPaymentDialog] Error: La orden no tiene ID', order);
      setError('El pedido no tiene un ID válido.');
      return;
    }

    // Validar que se ingresó una cantidad
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor ingresa una cantidad válida mayor a 0');
      return;
    }

    console.log(`[ConfirmPaymentDialog] Preparando confirmación de pago:`, {
      orderId: order.id,
      amount: amount,
      orderData: order
    });

    setIsSubmitting(true);
    setError('');

    try {
      console.log(`[ConfirmPaymentDialog] Confirmando pago - Order ID: ${order.id}, Amount: ${amount}`);
      await onConfirm(order.id, amount);
      handleClose();
    } catch (err) {
      setError('Error al confirmar el pago. Intenta nuevamente.');
      console.error('[ConfirmPaymentDialog] Error al confirmar pago:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular el nuevo total que se recibirá y el estado de pago resultante
  const calculateNewStatus = () => {
    if (!order || !amountReceived) return null;
    
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) return null;

    const newTotal = order.received_value_of_client + amount;
    const totalCost = order.total_cost;
    const remaining = totalCost - newTotal;

    let newStatus = 'No pagado';
    let statusColor = 'text-red-600';
    
    if (newTotal >= totalCost) {
      newStatus = 'Pagado';
      statusColor = 'text-green-600';
    } else if (newTotal > 0) {
      newStatus = 'Parcial';
      statusColor = 'text-yellow-600';
    }

    return { newTotal, remaining, newStatus, statusColor };
  };

  const newStatusInfo = calculateNewStatus();

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pago del Pedido</DialogTitle>
          <DialogDescription>
            Pedido #{order.id} - {order.client?.email || 'Sin cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Información del pedido */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo Total:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.total_cost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cantidad Recibida Actual:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.received_value_of_client)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Pendiente:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(order.total_cost - order.received_value_of_client)}
                </span>
              </div>
            </div>

            {/* Campo para ingresar cantidad recibida */}
            <div className="space-y-2">
              <Label htmlFor="amount-received">
                Cantidad Recibida <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    setError('');
                  }}
                  className="pl-7"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
              <p className="font-medium text-blue-700 mb-1">📝 Nota:</p>
              <p>
                Esta cantidad se sumará al monto ya recibido. El estado de pago se actualizará automáticamente.
              </p>
            </div>

            {/* Preview del nuevo estado si se ingresó una cantidad */}
            {newStatusInfo && (
              <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 space-y-2 border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                  📊 Vista previa del resultado
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Nuevo Total Recibido:</span>
                  <span className="font-bold text-indigo-900">
                    {formatCurrency(newStatusInfo.newTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Nuevo Estado:</span>
                  <span className={`font-bold ${newStatusInfo.statusColor}`}>
                    {newStatusInfo.newStatus}
                  </span>
                </div>
                {newStatusInfo.remaining > 0 ? (
                  <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                    <span className="text-sm text-gray-700">Aún Pendiente:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(newStatusInfo.remaining)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-200 text-green-700">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-semibold">Pedido completamente pagado</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
