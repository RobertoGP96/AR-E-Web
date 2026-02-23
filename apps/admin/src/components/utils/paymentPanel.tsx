import { useState, useEffect } from "react";

const ESTADOS = [
  { value: "no_pagado", label: "No Pagado", color: "text-gray-600 bg-gray-100 border-gray-300" },
  { value: "pendiente", label: "Pendiente", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "parcial", label: "Parcial", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "pagado", label: "Pagado", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "cancelado", label: "Cancelado", color: "text-red-600 bg-red-50 border-red-200" },
];

export default function PaymentPanel() {
  const [costoPedido] = useState(1250.00);
  const [saldoCliente] = useState(320.50);
  const nombreCliente = "María García"; // Reemplaza con el nombre real del cliente
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [estado, setEstado] = useState("no_pagado");
  const [usarSaldo, setUsarSaldo] = useState(false);

  const monto = parseFloat(montoPagado) || 0;
  const saldoAplicado = usarSaldo ? Math.min(saldoCliente, costoPedido) : 0;
  const totalCubierto = monto + saldoAplicado;
  const diferencia = totalCubierto - costoPedido;
  const pendiente = Math.max(0, costoPedido - totalCubierto);
  // Si el cliente paga de más, el excedente se suma al saldo restante
  const excedente = diferencia > 0 ? diferencia : 0;
  const saldoDeshabilitado = saldoCliente <= 0 || monto >= costoPedido;
  const saldoBase = usarSaldo ? Math.max(0, saldoCliente - saldoAplicado) : saldoCliente;
  // Si paga de más: excedente suma al saldo. Si paga de menos: el pendiente descuenta del saldo.
  const saldoRestante = saldoBase + excedente - (pendiente > 0 && !usarSaldo ? pendiente : 0);

  const estadoAuto = () => {
    if (monto === 0 && !usarSaldo) return "no_pagado";
    if (totalCubierto <= 0) return "no_pagado";
    if (totalCubierto >= costoPedido) return "pagado";
    return "parcial";
  };

  useEffect(() => {
    if (saldoDeshabilitado && usarSaldo) setUsarSaldo(false);
    setEstado(estadoAuto());
  }, [monto, usarSaldo, saldoDeshabilitado]);

  const estadoInfo = ESTADOS.find((e) => e.value === estado);
  const porcentaje = Math.min(100, (totalCubierto / costoPedido) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-3 shadow-lg shadow-orange-200">
            <span>🛒</span> Cobro de Pedido
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel de Pago</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gray-400 text-sm">👤</span>
            <span className="text-orange-500 font-bold text-lg">{nombreCliente}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100 border border-orange-100 overflow-hidden">

          {/* Costo + Saldo */}
          <div className="grid grid-cols-2 divide-x divide-orange-100">
            <div className="p-5 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Costo del Pedido</p>
              <p className="text-3xl font-black text-gray-900">${costoPedido.toFixed(2)}</p>
              <p className="text-xs text-orange-400 mt-1">MXN</p>
            </div>
            <div className="p-5 text-center bg-orange-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Saldo Disponible</p>
              <p className="text-3xl font-black text-orange-500">${saldoCliente.toFixed(2)}</p>
              <p className="text-xs text-orange-300 mt-1">A favor</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">

            {/* Monto pagado */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Monto que paga el cliente
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-black text-lg">$</span>
                <input
                  type="number"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 font-bold text-xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all placeholder-gray-300"
                />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Fecha de pago
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
            </div>

            {/* Usar saldo */}
            <button
              onClick={() => !saldoDeshabilitado && setUsarSaldo(!usarSaldo)}
              disabled={saldoDeshabilitado}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all font-semibold text-sm ${
                saldoDeshabilitado
                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"
                  : usarSaldo
                  ? "border-orange-400 bg-orange-50 text-orange-600"
                  : "border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${usarSaldo ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                  {usarSaldo && <span className="text-white text-xs font-black">✓</span>}
                </span>
                Aplicar saldo del cliente al pago
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${usarSaldo ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                ${saldoCliente.toFixed(2)}
              </span>
            </button>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Estado de pago
              </label>
              <div className="relative">
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="mx-6 mb-6 rounded-2xl bg-gray-200 text-white overflow-hidden right-1 ">
            <div className="px-5 py-3 bg-orange-500 flex items-center justify-between">
              <span className="text-sm font-black tracking-wide uppercase">Resumen Automático</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
            </div>

            {/* Barra de progreso */}
            <div className="px-5 pt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progreso del pago</span>
                <span className="font-bold text-orange-400">{Math.round(porcentaje)}%</span>
              </div>
              <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>

            <div className="px-5 py-4 space-y-2.5 text-sm">
              {nombreCliente && (
                <Row label="Cliente" value={nombreCliente} accent="text-white font-semibold" />
              )}
              <Row label="Costo del pedido" value={`$${costoPedido.toFixed(2)}`} />
              <Row label="Pago del cliente" value={`$${monto.toFixed(2)}`} highlight={monto > 0} />

              {usarSaldo && (
                <Row label="Saldo aplicado" value={`-$${saldoAplicado.toFixed(2)}`} highlight accent="text-orange-400" />
              )}

              <div className="border-t border-gray-700 pt-2.5">
                <Row label="Total cubierto" value={`$${totalCubierto.toFixed(2)}`} bold />
              </div>

              {pendiente > 0 && (
                <div className="flex justify-between text-red-400 font-bold">
                  <span>⚠ Saldo pendiente</span>
                  <span>${pendiente.toFixed(2)}</span>
                </div>
              )}

              {excedente > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>💚 Excedente sumado al saldo</span>
                  <span>+${excedente.toFixed(2)}</span>
                </div>
              )}

              <Row
                label="Saldo restante cliente"
                value={`$${saldoRestante.toFixed(2)}`}
                accent={saldoRestante < 0 ? "text-red-400 font-bold" : "text-orange-300"}
              />

              {fechaPago && (
                <Row label="Fecha de pago" value={new Date(fechaPago + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
              )}
            </div>

            {totalCubierto >= costoPedido && (
              <div className="mx-5 mb-5 mt-1 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 rounded-xl py-3 text-center text-green-400 font-black text-sm tracking-wide">
                ✅ Pedido completamente pagado
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">El resumen se actualiza automáticamente</p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, bold, accent }: { label: string; value: string; highlight?: boolean; bold?: boolean; accent?: string }) {
  return (
    <div className={`flex justify-between ${bold ? "font-black text-base" : "font-medium"}`}>
      <span className="text-gray-400">{label}</span>
      <span className={accent || (highlight ? "text-white" : "text-gray-300")}>{value}</span>
    </div>
  );
}