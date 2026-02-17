import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency, type Order } from "@/types";
import { calculatePaymentStatus } from "@/lib/payment-status-calculator";
import { DatePicker } from "../utils/DatePicker";
import { useQuery } from "@tanstack/react-query";
import { fetchClientBalancesReport } from "@/services/reports/reports";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, TrendingUp } from "lucide-react";

interface ConfirmPaymentDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (
    orderId: number,
    amountReceived: number,
    paymentDate: Date | undefined,
    payStatus?: string,
  ) => Promise<void>;
}

export function ConfirmPaymentDialog({
  order,
  open,
  onClose,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [markAsPaid, setMarkAsPaid] = useState(false);

  // Fetch client balances to show surplus
  const { data: clientBalances } = useQuery({
    queryKey: ["clientBalances"],
    queryFn: fetchClientBalancesReport,
    enabled: !!order?.client?.id,
  });

  const clientInfo = clientBalances?.find((c) => c.id === order?.client?.id);
  const hasSurplus = (clientInfo?.surplus_balance || 0) > 0;

  const handleClose = () => {
    if (!isSubmitting) {
      setAmountReceived("");
      setError("");
      setMarkAsPaid(false);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) {
      console.error("[ConfirmPaymentDialog] Error: No hay orden seleccionada");
      setError("No se pudo identificar el pedido.");
      return;
    }

    if (!order.id) {
      console.error(
        "[ConfirmPaymentDialog] Error: La orden no tiene ID",
        order,
      );
      setError("El pedido no tiene un ID válido.");
      return;
    }

    // Validar que se ingresó una cantidad
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) {
      setError("Por favor ingresa una cantidad válida mayor a 0");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payStatus = markAsPaid ? "Pagado" : undefined;
      await onConfirm(order.id, amount, paymentDate, payStatus);
      handleClose();
    } catch {
      setError("Error al confirmar el pago. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular el nuevo total que se recibirá y el estado de pago resultante
  // Usa la utilidad que coincide exactamente con la lógica del backend
  const calculateNewStatus = () => {
    if (!order || !amountReceived) return null;

    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) return null;

    return calculatePaymentStatus(
      order.received_value_of_client,
      amount,
      order.total_cost,
    );
  };

  const newStatusInfo = calculateNewStatus();

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pago del Pedido</DialogTitle>
          <DialogDescription>
            Pedido #{order.id} - {order.client?.email || "Sin cliente"}
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
                <span className="text-sm text-gray-600">
                  Cantidad Recibida Actual:
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.received_value_of_client)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Pendiente:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(
                    order.total_cost - order.received_value_of_client,
                  )}
                </span>
              </div>
            </div>

            {/* Campo para ingresar cantidad recibida */}
            <div className="space-y-2">
              <Label htmlFor="amount-received">
                Cantidad Recibida <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    setError("");
                  }}
                  className="pl-7"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Saldo a Favor del Cliente */}
            {clientInfo && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  hasSurplus
                    ? "bg-emerald-50 border-emerald-200 shadow-sm"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${hasSurplus ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {hasSurplus ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Saldo del Cliente:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        clientInfo.status === "DEUDA"
                          ? "text-red-600"
                          : clientInfo.status === "SALDO A FAVOR"
                            ? "text-emerald-600"
                            : "text-blue-600"
                      }`}
                    >
                      {formatCurrency(clientInfo.total_balance)}
                    </span>
                  </div>
                  {hasSurplus && (
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                      Este cliente tiene{" "}
                      <b>{formatCurrency(clientInfo.surplus_balance)}</b> de
                      saldo a favor que puedes tomar como pago.
                    </p>
                  )}
                  {clientInfo.status === "DEUDA" && (
                    <p className="text-xs text-red-600 leading-relaxed">
                      Este cliente tiene una deuda total de{" "}
                      {formatCurrency(Math.abs(clientInfo.total_balance))}.
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Establecer como pagado desde el cliente */}
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-xl transition-all hover:shadow-sm">
              <Checkbox
                id="mark-as-paid"
                checked={markAsPaid}
                onCheckedChange={(checked) => setMarkAsPaid(checked as boolean)}
                className="mt-1 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="mark-as-paid"
                  className="text-sm font-semibold text-orange-800 cursor-pointer select-none"
                >
                  Establecer pedido como PAGADO
                </label>
                <p className="text-xs text-orange-700/80 leading-relaxed">
                  Active esta opción si desea marcar el pedido como pagado
                  manualmente, independientemente de si el monto cubre el total.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <DatePicker
                label="Fecha de pago"
                selected={paymentDate}
                onDateChange={setPaymentDate}
              />
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <div className="text-blue-500 shrink-0 mt-0.5">
                <Info className="h-4 w-4" />
              </div>
              <p className="leading-relaxed">
                Esta cantidad se sumará al monto ya recibido. El sistema
                registrará la fecha seleccionada para el seguimiento del pago.
              </p>
            </div>

            {/* Preview del nuevo estado si se ingresó una cantidad */}
            {newStatusInfo && (
              <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 space-y-2 border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                  📊 Vista previa del resultado
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Nuevo Total Recibido:
                  </span>
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
                    <span className="text-sm text-gray-700">
                      Aún Pendiente:
                    </span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(newStatusInfo.remaining)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-200 text-green-700">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-semibold">
                      Pedido completamente pagado
                    </span>
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
                "Confirmar Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
