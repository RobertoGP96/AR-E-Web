import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type Order } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchClientBalancesReport } from "@/services/reports/reports";
import { User2Icon } from "lucide-react";

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

const ESTADOS = [
  {
    value: "no_pagado",
    label: "No Pagado",
    color: "text-gray-600 bg-gray-100 border-gray-300",
  },
  {
    value: "pendiente",
    label: "Pendiente",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  {
    value: "parcial",
    label: "Parcial",
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    value: "pagado",
    label: "Pagado",
    color: "text-green-600 bg-green-50 border-green-200",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    color: "text-red-600 bg-red-50 border-red-200",
  },
];

export function ConfirmPaymentDialog({
  order,
  open,
  onClose,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [estadoSelect, setEstadoSelect] = useState("auto"); // "auto" or "pagado"
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client balances to show surplus
  const { data: clientBalances } = useQuery({
    queryKey: ["clientBalances"],
    queryFn: fetchClientBalancesReport,
    enabled: !!order?.client?.id,
  });

  const clientInfo = clientBalances?.find((c) => c.id === order?.client?.id);
  const saldoCliente = clientInfo?.surplus_balance || 0;

  useEffect(() => {
    if (open) {
      setFechaPago(new Date().toISOString().split("T")[0]);
      setMontoPagado("");
      setUsarSaldo(false);
      setEstadoSelect("auto");
    }
  }, [open]);

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const costoPedido = order
    ? Math.max(0, order.total_cost - order.received_value_of_client)
    : 0;
  const nombreCliente = order?.client
    ? `${order.client.name} ${order.client.last_name || ""}`.trim()
    : "Cliente";

  const monto = parseFloat(montoPagado) || 0;
  const saldoAplicado = usarSaldo ? Math.min(saldoCliente, costoPedido) : 0;
  const totalCubierto = monto + saldoAplicado;
  const diferencia = totalCubierto - costoPedido;
  const pendiente = Math.max(0, costoPedido - totalCubierto);

  // Si el cliente paga de más, el excedente se suma al saldo restante
  const excedente = diferencia > 0 ? diferencia : 0;
  const saldoDeshabilitado = saldoCliente <= 0 || monto >= costoPedido;
  const saldoBase = usarSaldo
    ? Math.max(0, saldoCliente - saldoAplicado)
    : saldoCliente;

  // Si paga de más: excedente suma al saldo. Si paga de menos: el pendiente descuenta del saldo (si no usa saldo).
  const saldoRestante =
    saldoBase + excedente - (pendiente > 0 && !usarSaldo ? pendiente : 0);

  const estadoCalculado = () => {
    if (estadoSelect === "pagado") return "pagado";
    if (monto === 0 && !usarSaldo) return "no_pagado";
    if (totalCubierto <= 0) return "no_pagado";
    if (totalCubierto >= costoPedido) return "pagado";
    return "parcial";
  };

  const estadoActual = estadoCalculado();
  const estadoInfo =
    ESTADOS.find((e) => e.value === estadoActual) || ESTADOS[0];
  const porcentaje =
    costoPedido > 0 ? Math.min(100, (totalCubierto / costoPedido) * 100) : 0;

  useEffect(() => {
    if (saldoDeshabilitado && usarSaldo) setUsarSaldo(false);
  }, [monto, usarSaldo, saldoDeshabilitado]);

  if (!order) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (totalCubierto <= 0 && estadoSelect !== "pagado") {
      return;
    }

    setIsSubmitting(true);
    try {
      const [year, month, day] = fechaPago.split("-").map(Number);
      const paymentDate = new Date(year, month - 1, day);

      const isPaid = estadoActual === "pagado";
      const payStatus = isPaid ? "Pagado" : "Pendiente";

      await onConfirm(order.id!, totalCubierto || 0, paymentDate, payStatus);
    } catch {
      // Errors should be handled by the parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-transparent sm:rounded-[2rem]">
        <DialogTitle className="sr-only">Panel de Pago</DialogTitle>
        <div className="w-full bg-white sm:rounded-[2rem] overflow-hidden shadow-xl shadow-orange-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-b from-orange-50 to-white pt-6 pb-5 px-6 text-center border-b border-orange-50 relative">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Registro de pago
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <User2Icon className="text-orange-500" size={16} />
              <span className="text-orange-500 font-bold text-base">
                {nombreCliente}
              </span>
            </div>
          </div>

          {/* Costo + Saldo (Fixed at top) */}
          <div className="grid grid-cols-2 divide-x divide-orange-100 border-b border-orange-100 shrink-0">
            <div className="p-4 text-center bg-white">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Costo del Pedido
              </p>
              <p className="text-2xl font-black text-gray-900">
                ${costoPedido.toFixed(2)}
              </p>
              <p className="text-[10px] text-orange-400 mt-0.5 font-semibold">
                USD
              </p>
            </div>
            <div className="p-4 text-center bg-orange-50/50">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Saldo Disponible
              </p>
              <p className="text-2xl font-black text-orange-500">
                ${saldoCliente.toFixed(2)}
              </p>
              <p className="text-[10px] text-orange-400 mt-0.5 font-semibold">
                USD
              </p>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
            {/* Monto pagado */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                Monto que paga el cliente
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-black text-lg">
                  $
                </span>
                <input
                  type="number"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-900 font-bold text-lg focus:outline-none focus:border-orange-400 focus:bg-white transition-all placeholder-gray-300"
                />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                Fecha de pago
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
            </div>

            {/* Usar saldo */}
            <button
              onClick={() => !saldoDeshabilitado && setUsarSaldo(!usarSaldo)}
              disabled={saldoDeshabilitado}
              type="button"
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 transition-all font-semibold ${
                saldoDeshabilitado
                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"
                  : usarSaldo
                    ? "border-orange-400 bg-orange-50 text-orange-600 shadow-sm shadow-orange-100"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200 hover:bg-orange-50/50"
              }`}
            >
              <span className="flex items-center gap-3 text-[13px]">
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${usarSaldo ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}
                >
                  {usarSaldo && (
                    <span className="text-white text-[10px] font-black">✓</span>
                  )}
                </span>
                Aplicar saldo del cliente al pago
              </span>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors ${usarSaldo ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}
              >
                ${saldoCliente.toFixed(2)}
              </span>
            </button>

            {/* Estado */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                Estado de pago
              </label>
              <div className="relative">
                <select
                  value={estadoSelect}
                  onChange={(e) => setEstadoSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-700 font-semibold text-[13px] focus:outline-none focus:border-orange-400 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="auto">Automático ({estadoInfo.label})</option>
                  <option value="pagado">
                    ✓ Marcar manualmente como Pagado
                  </option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                  ▼
                </span>
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-xl text-white overflow-hidden shadow-lg mt-2 relative border border-orange-200">
              <div className="px-4 py-2.5 bg-orange-400 flex items-center justify-between border-b border-gray-200">
                <span className="text-sm font-bold text-gray-900">Resumen</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${estadoInfo?.color}`}
                >
                  {estadoInfo?.label}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="px-4 pt-3.5">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  <span className="text-orange-400">
                    {Math.round(porcentaje)}%
                  </span>
                </div>
                <div className="h-1.5 bg-orange-400 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              <div className="px-4 py-3.5 space-y-2.5 text-sm ">
                <Row
                  label="Costo del pedido"
                  value={`$${costoPedido.toFixed(2)}`}
                />
                <Row
                  label="Pago del cliente"
                  value={`$${monto.toFixed(2)}`}
                  highlight={monto > 0}
                />

                {usarSaldo && (
                  <Row
                    label="Saldo aplicado"
                    value={`-$${saldoAplicado.toFixed(2)}`}
                    highlight
                    accent="text-orange-400"
                  />
                )}

                <div className="border-t border-orange-400 pt-2.5 mt-1">
                  <Row
                    label="Total cubierto"
                    value={`$${totalCubierto.toFixed(2)}`}
                    bold
                  />
                </div>

                {pendiente > 0 && (
                  <div className="flex justify-between text-red-400 font-bold text-xs pt-1">
                    <span>Faltará abonar</span>
                    <span>${pendiente.toFixed(2)}</span>
                  </div>
                )}

                {excedente > 0 && (
                  <div className="flex justify-between text-green-400 font-semibold text-xs pt-1">
                    <span>Excedente al saldo</span>
                    <span>+${excedente.toFixed(2)}</span>
                  </div>
                )}

                <Row
                  label="Saldo resultante cliente"
                  value={`$${saldoRestante.toFixed(2)}`}
                  accent={
                    saldoRestante < 0
                      ? "text-red-400 font-bold"
                      : "text-gray-300"
                  }
                />

                {(clientInfo?.total_balance ?? 0) < 0 &&
                  !usarSaldo &&
                  monto === 0 && (
                    <div className="text-[10px] text-red-400/80 font-medium leading-tight pt-1">
                      Nota: El cliente ya posee una deuda previa de $
                      {Math.abs(clientInfo!.total_balance).toFixed(2)} sumada a
                      todos sus pedidos.
                    </div>
                  )}
              </div>

              {totalCubierto >= costoPedido && costoPedido > 0 && (
                <div className="mx-3 mb-3 mt-1 bg-green-500/10 border border-orange-500/20 rounded-lg py-2 text-center text-green-400 font-black text-[11px] uppercase tracking-wider">
                  ✅ Pedido completamente pagado
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm bg-white hover:bg-gray-50 hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (totalCubierto <= 0 && estadoSelect !== "pagado")
              }
              className="flex-[2] py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? "Procesando..." : "Confirmar Pago"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  highlight,
  bold,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-black text-sm" : "font-medium"}`}
    >
      <span className="text-gray-800">{label}</span>
      <span
        className={accent || (highlight ? "text-orange-400" : "text-gray-800")}
      >
        {value}
      </span>
    </div>
  );
}
