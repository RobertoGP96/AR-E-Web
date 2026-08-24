'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { confirmOrderPaymentAction } from './actions';
import { formatCurrency } from '@/lib/format';
import type { OrderRow } from './schema';

/**
 * "Registro de pago" panel, ported from the Vite admin's
 * ConfirmPaymentDialog: amount + optional client-balance application
 * with a live summary of coverage, remainder, and resulting balance.
 */
export function ConfirmPaymentDialog({
  order,
  onClose,
}: {
  order: OrderRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amountStr, setAmountStr] = useState('');
  const [applyBalance, setApplyBalance] = useState(false);
  const [manualPaid, setManualPaid] = useState(false);

  const pendingCost = Math.max(
    0,
    order.totalCosts - order.receivedValueOfClient - order.balanceApplied
  );
  const available = Math.max(0, order.clientBalance);
  const amount = Math.max(0, Number(amountStr) || 0);

  const applied = useMemo(() => {
    if (!applyBalance) return 0;
    return Math.min(available, Math.max(0, pendingCost - amount));
  }, [applyBalance, available, pendingCost, amount]);

  const covered = amount + applied;
  const remaining = Math.max(0, pendingCost - covered);
  const surplus = Math.max(0, covered - pendingCost);
  const resultingBalance = order.clientBalance - applied + surplus;
  const progress =
    order.totalCosts > 0
      ? Math.min(
          100,
          ((order.receivedValueOfClient + order.balanceApplied + covered) /
            order.totalCosts) *
            100
        )
      : 0;
  const fullyPaid = manualPaid || (remaining === 0 && pendingCost > 0);

  const balanceToggleDisabled = available <= 0 || amount >= pendingCost;

  function submit() {
    startTransition(async () => {
      const result = await confirmOrderPaymentAction(
        order.id,
        amount,
        applied,
        manualPaid
      );
      if (result.ok) {
        toast.success(`Pago confirmado para el pedido #${order.id}`, {
          description: `Se registró ${formatCurrency(amount)} como cantidad recibida.`,
        });
        router.refresh();
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Pago"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Registro de pago
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <User className="h-4 w-4" aria-hidden />
            {order.clientName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Costo del Pedido
            </p>
            <p className="text-xl font-bold tabular-nums text-gray-900">
              {formatCurrency(pendingCost)}
            </p>
            <p className="text-[10px] text-gray-400">USD</p>
          </div>
          <div className="rounded-lg border border-border bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Saldo Disponible
            </p>
            <p className="text-xl font-bold tabular-nums text-emerald-600">
              {formatCurrency(available)}
            </p>
            <p className="text-[10px] text-gray-400">USD</p>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-600">
            Monto que paga el cliente
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              $
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amountStr}
              placeholder="0.00"
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-md border border-input bg-white py-2 pl-7 pr-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </label>

        <button
          type="button"
          disabled={balanceToggleDisabled}
          onClick={() => setApplyBalance((v) => !v)}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
            applyBalance
              ? 'border-orange-300 bg-orange-50 text-orange-700'
              : 'border-border bg-white text-gray-600 hover:bg-gray-50'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" aria-hidden />
            Aplicar saldo del cliente al pago
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {formatCurrency(available)}
          </span>
        </button>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-600">
            Estado de pago
          </span>
          <select
            value={manualPaid ? 'manual' : 'auto'}
            onChange={(e) => setManualPaid(e.target.value === 'manual')}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="auto">
              Automático ({fullyPaid && !manualPaid ? 'Pagado' : remaining > 0 && covered > 0 ? 'Parcial' : covered > 0 ? 'Pagado' : 'Sin cambios'})
            </option>
            <option value="manual">✓ Marcar manualmente como Pagado</option>
          </select>
        </label>

        <div className="space-y-2 rounded-lg border border-border bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Resumen</span>
            <span className="tabular-nums text-xs text-gray-500">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <dl className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-gray-500">Costo del pedido</dt>
              <dd className="tabular-nums">{formatCurrency(pendingCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Pago del cliente</dt>
              <dd className="tabular-nums">{formatCurrency(amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Saldo aplicado</dt>
              <dd className="tabular-nums">
                {applied > 0 ? `− ${formatCurrency(applied)}` : formatCurrency(0)}
              </dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt className="text-gray-700">Total cubierto</dt>
              <dd className="tabular-nums">{formatCurrency(covered)}</dd>
            </div>
            {remaining > 0 ? (
              <div className="flex justify-between font-medium text-red-600">
                <dt>Faltará abonar</dt>
                <dd className="tabular-nums">{formatCurrency(remaining)}</dd>
              </div>
            ) : null}
            {surplus > 0 ? (
              <div className="flex justify-between font-medium text-emerald-600">
                <dt>Excedente al saldo</dt>
                <dd className="tabular-nums">+ {formatCurrency(surplus)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="text-gray-500">Saldo resultante cliente</dt>
              <dd
                className={`tabular-nums font-medium ${
                  resultingBalance < 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(resultingBalance)}
              </dd>
            </div>
          </dl>
          {fullyPaid ? (
            <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700">
              ✅ Pedido completamente pagado
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || (amount === 0 && applied === 0 && !manualPaid)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60"
          >
            {isPending ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
