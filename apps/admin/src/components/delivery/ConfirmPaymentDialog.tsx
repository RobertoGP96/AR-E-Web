import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  X,
  CheckCircle2,
  User,
  Coins,
  Info,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import { formatCurrency, type DeliverReceip } from "@/types";
import { DatePicker } from "../utils/DatePicker";
import { useQuery } from "@tanstack/react-query";
import { fetchClientBalancesReport } from "@/services/reports/reports";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfirmPaymentDialogProps {
  delivery: DeliverReceip | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (
    deliveryId: number,
    amountReceived: number,
    paymentDate: Date | undefined,
    paymentStatus?: string,
  ) => Promise<void>;
}

export function ConfirmPaymentDialog({
  delivery,
  open,
  onClose,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [useCredit, setUseCredit] = useState(false);

  // Fetch client balances to show surplus
  const { data: clientBalances } = useQuery({
    queryKey: ["clientBalances"],
    queryFn: fetchClientBalancesReport,
    enabled: !!delivery?.client?.id,
  });

  const clientInfo = clientBalances?.find((c) => c.id === delivery?.client?.id);
  const hasSurplus = (clientInfo?.surplus_balance || 0) > 0;

  // Handle Switch for credit
  useEffect(() => {
    if (useCredit && hasSurplus) {
      setAmountReceived(clientInfo!.surplus_balance.toString());
      setError("");
    } else if (
      !useCredit &&
      amountReceived === clientInfo?.surplus_balance.toString()
    ) {
      setAmountReceived("");
    }
  }, [useCredit, hasSurplus, clientInfo, amountReceived]);

  const handleClose = () => {
    if (!isSubmitting) {
      setAmountReceived("");
      setError("");
      setMarkAsPaid(false);
      setUseCredit(false);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delivery) {
      setError("No se pudo identificar la entrega.");
      return;
    }

    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || (amount <= 0 && !markAsPaid)) {
      setError("Por favor ingresa una cantidad válida mayor a 0");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payStatus = markAsPaid ? "Pagado" : undefined;
      await onConfirm(delivery.id!, amount || 0, paymentDate, payStatus);
      handleClose();
    } catch {
      setError("Error al confirmar el pago. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!delivery) return null;

  const currentPending = delivery.weight_cost - delivery.payment_amount;
  const amount = parseFloat(amountReceived) || 0;
  const newBalance = Math.max(0, currentPending - amount);
  const change = Math.max(0, amount - currentPending);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <DialogTitle className="sr-only">Registrar Pago</DialogTitle>

        {/* Header Custom */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-slate-900 text-lg font-bold tracking-tight">
            Registar Pago Entrega
          </h2>
          <div className="w-10"></div>
        </div>

        {/* Delivery Total Section */}
        <div className="p-6 text-center bg-orange-50/50">
          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            Total Pendiente Entrega
          </p>
          <h1 className="text-orange-400  tracking-tight text-[38px] font-bold leading-none">
            {formatCurrency(currentPending)}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto max-h-[70vh]"
        >
          <div className="p-5 space-y-5">
            {/* Customer Info Card */}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-orange-100">
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                  Información del Cliente
                </p>
                <p className="text-slate-900 text-base font-bold leading-tight">
                  {delivery.client?.name + " " + delivery.client?.last_name ||
                    "Sin Nombre"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {clientInfo && clientInfo.total_balance < 0 ? (
                    <>
                      <AlertTriangle className="text-red-500 h-3.5 w-3.5" />
                      <p className="text-red-500 text-xs font-semibold">
                        Saldo: {formatCurrency(clientInfo.total_balance)}
                      </p>
                    </>
                  ) : (
                    <>
                      <Landmark className="text-emerald-500 h-3.5 w-3.5" />
                      <p className="text-emerald-500 text-xs font-semibold">
                        Al día
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100  flex items-center justify-center overflow-hidden border border-slate-200">
                <User className="h-6 w-6 text-slate-400" />
              </div>
            </div>

            {/* Credit Toggle */}
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 justify-between">
              <div className="flex items-center gap-3">
                <div className="text-orange-400 flex items-center justify-center rounded-lg bg-orange-50 shrink-0 h-10 w-10">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-slate-700  text-sm font-semibold">
                    Usar saldo a favor
                  </p>
                  {hasSurplus && (
                    <p className="text-emerald-600 text-[10px] font-medium">
                      Disponible: {formatCurrency(clientInfo!.surplus_balance)}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={useCredit}
                onCheckedChange={setUseCredit}
                disabled={!hasSurplus || isSubmitting}
              />
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Cantidad a Pagar
                </Label>
                {error && (
                  <span className="text-[10px] text-red-500 font-bold uppercase">
                    {error}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-2xl font-bold">
                  $
                </span>

                <Input
                  className="w-full bg-white border-2 border-slate-100 rounded-xl py-7 pl-10 pr-4 text-3xl font-bold text-slate-900  focus-visible:border-orange-400 focus-visible:ring-0 transition-all text-center"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    setError("");
                    if (useCredit) setUseCredit(false);
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Date Picker Section */}
            <div className="space-y-2">
              <Label className="text-slate-500  text-[10px] font-bold uppercase tracking-widest px-1">
                Fecha del Pago
              </Label>
              <DatePicker
                label=" "
                selected={paymentDate}
                onDateChange={setPaymentDate}
              />
            </div>

            {/* Real-time Calculation Area */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-slate-500  text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
                  Saldo Final
                </p>
                <p className="text-orange-500 text-lg font-bold leading-tight">
                  {formatCurrency(newBalance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500  text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
                  Vuelto
                </p>
                <p className="text-slate-900  text-lg font-bold leading-tight">
                  {formatCurrency(change)}
                </p>
              </div>
            </div>

            {/* Manual Status Selector */}
            <div className="space-y-2">
              <Label className="text-slate-500  text-[10px] font-bold uppercase tracking-widest px-1">
                Estado del Pago
              </Label>
              <Select
                value={markAsPaid ? "Pagado" : "Pendiente"}
                onValueChange={(val) => setMarkAsPaid(val === "Pagado")}
              >
                <SelectTrigger className="w-full bg-white border-orange-200  rounded-xl h-12 text-orange-700  font-medium">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente / Parcial</SelectItem>
                  <SelectItem value="Pagado">
                    Completado (Marcado Manual)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-2 px-1">
              <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-tight">
                El monto se sumará al total recibido de la entrega. El estado se
                actualizará automáticamente según el monto total.
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-5 mt-auto border-t border-blue-100 bg-white">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold h-14 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmar Pago
                </>
              )}
            </Button>
            <p className="text-center text-orange-400 text-[9px] mt-4 uppercase tracking-[0.2em] font-bold">
              ID ENTREGA: #{delivery.id}
            </p>
          </div>
        </form>

        {/* Bottom Safe Area Notch (Simulated) */}
        <div className="h-5 w-full flex justify-center items-end pb-2 bg-white ">
          <div className="h-1 w-20 bg-orange-200  rounded-full"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
