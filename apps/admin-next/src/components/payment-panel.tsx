'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Split, User, Wallet } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { formatCurrency } from '@/lib/format';
import { AppModal } from '@/components/ui/app-modal';
import { Field, TextInput, Select, FormError } from '@/components/ui';
import { planSurplusDistribution, type PendingTarget } from '@/lib/surplus';

export interface PaymentSubmitResult {
  ok: boolean;
  error?: string;
  /** RN-023: excedente repartido entre pendientes del cliente. */
  redistributed?: { moved: number; count: number; remaining: number };
}

/**
 * "Registro de pago" modal, shared by orders and deliveries: cash
 * amount + optional client-balance application with a live summary of
 * coverage, remainder, and resulting balance.
 *
 * RN-023: si el monto supera el pendiente y el cliente tiene otras
 * órdenes o entregas por pagar (`loadPendingTargets`), el excedente se
 * reparte entre ellas (activado por defecto; el contador puede dejarlo
 * como saldo a favor desactivando la opción).
 */
export function PaymentPanel({
  clientName,
  clientBalance,
  pendingCost,
  loadPendingTargets,
  onSubmit,
  onSuccess,
  onClose,
}: {
  clientName: string;
  clientBalance: number;
  pendingCost: number;
  /** Pendientes del cliente sin esta partida (para repartir el excedente). */
  loadPendingTargets?: () => Promise<PendingTarget[]>;
  onSubmit: (
    amount: number,
    appliedBalance: number,
    markPaidManually: boolean,
    distributeSurplus: boolean
  ) => Promise<PaymentSubmitResult>;
  onSuccess: (amount: number, result: PaymentSubmitResult) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [amountStr, setAmountStr] = useState('');
  const [applyBalance, setApplyBalance] = useState(false);
  const [manualPaid, setManualPaid] = useState(false);
  const [distribute, setDistribute] = useState(true);
  // null = cargando; sin cargador no hay pendientes que consultar.
  const [targets, setTargets] = useState<PendingTarget[] | null>(() =>
    loadPendingTargets ? null : []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadPendingTargets) return;
    let cancelled = false;
    loadPendingTargets()
      .then((t) => {
        if (!cancelled) setTargets(t);
      })
      .catch(() => {
        if (!cancelled) setTargets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPendingTargets]);

  const available = Math.max(0, clientBalance);
  const amount = Math.max(0, Number(amountStr) || 0);

  const applied = useMemo(() => {
    if (!applyBalance) return 0;
    return Math.min(available, Math.max(0, pendingCost - amount));
  }, [applyBalance, available, pendingCost, amount]);

  const covered = amount + applied;
  const remaining = Math.max(0, pendingCost - covered);
  // Solo el efectivo que excede el pendiente puede repartirse (RN-023).
  const surplus = Math.max(0, Math.min(amount, covered - pendingCost));
  const hasTargets = (targets?.length ?? 0) > 0;
  const plan = useMemo(
    () =>
      surplus > 0 && hasTargets && distribute
        ? planSurplusDistribution(surplus, targets ?? [])
        : null,
    [surplus, hasTargets, distribute, targets]
  );
  const toBalance = plan ? plan.remaining : surplus;
  const resultingBalance = clientBalance - applied + toBalance;
  const progress =
    pendingCost > 0 ? Math.min(100, (covered / pendingCost) * 100) : 100;
  const fullyPaid = manualPaid || (remaining === 0 && pendingCost > 0);

  const balanceToggleDisabled = available <= 0 || amount >= pendingCost;
  const labelOf = (kind: string, id: string) =>
    targets?.find((t) => t.kind === kind && t.id === id)?.label ??
    (kind === 'order' ? `Pedido #${id}` : `Entrega #${id}`);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(
        amount,
        applied,
        manualPaid,
        surplus > 0 && hasTargets && distribute
      );
      if (result.ok) {
        onSuccess(amount, result);
      } else {
        setError(result.error ?? 'No se pudo registrar el pago');
      }
    });
  }

  return (
    <AppModal
      isOpen
      onClose={() => {
        if (!isPending) onClose();
      }}
      title="Registro de pago"
      description={
        <span className="inline-flex items-center gap-1.5">
          <User className="h-4 w-4" aria-hidden />
          {clientName}
        </span>
      }
      size="md"
      footer={
        <>
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onPress={submit}
            isDisabled={
              isPending || (amount === 0 && applied === 0 && !manualPaid)
            }
          >
            {isPending ? (
              <>
                <Spinner size="sm" aria-hidden />
                Procesando…
              </>
            ) : (
              'Confirmar Pago'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Costo pendiente
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatCurrency(pendingCost)}
            </p>
            <p className="text-[10px] text-muted">USD</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Saldo Disponible
            </p>
            <p className="text-xl font-bold tabular-nums text-success-soft-foreground">
              {formatCurrency(available)}
            </p>
            <p className="text-[10px] text-muted">USD</p>
          </div>
        </div>

        <Field label="Monto que paga el cliente">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={amountStr}
              placeholder="0.00"
              onChange={(e) => setAmountStr(e.target.value)}
              className="pl-7"
            />
          </div>
        </Field>

        <button
          type="button"
          disabled={balanceToggleDisabled}
          onClick={() => setApplyBalance((v) => !v)}
          aria-pressed={applyBalance}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all duration-150 ${
            applyBalance
              ? 'border-accent/50 bg-accent-soft text-accent-soft-foreground shadow-sm'
              : 'border-border bg-surface text-muted hover:bg-surface-hover'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="flex items-center gap-2 font-medium">
            <Wallet className="h-4 w-4" aria-hidden />
            Aplicar saldo del cliente al pago
          </span>
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success-soft-foreground">
            {formatCurrency(available)}
          </span>
        </button>

        {surplus > 0 && hasTargets ? (
          <div
            className="animate-in fade-in slide-in-from-top-1 space-y-2 rounded-lg border border-warning/40 bg-warning-soft/40 p-3"
            data-testid="surplus-distribution"
          >
            <button
              type="button"
              onClick={() => setDistribute((v) => !v)}
              aria-pressed={distribute}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                distribute
                  ? 'border-accent/50 bg-accent-soft text-accent-soft-foreground shadow-sm'
                  : 'border-border bg-surface text-muted hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <Split className="h-4 w-4" aria-hidden />
                Repartir el excedente entre sus pendientes
              </span>
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning-soft-foreground">
                {formatCurrency(surplus)}
              </span>
            </button>
            <p className="text-xs text-muted">
              El cliente paga {formatCurrency(surplus)} más que el pendiente de esta
              partida y tiene {targets?.length} partida{targets?.length === 1 ? '' : 's'}{' '}
              por pagar. {distribute
                ? 'El excedente cubrirá, de la más antigua a la más reciente:'
                : 'Si no se reparte, el excedente queda como saldo a favor.'}
            </p>
            {plan ? (
              <ul className="space-y-1 text-xs">
                {plan.allocations.map((a) => (
                  <li
                    key={`${a.kind}-${a.id}`}
                    className="flex items-center justify-between rounded-md bg-background px-2 py-1"
                  >
                    <span className="text-foreground">{labelOf(a.kind, a.id)}</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatCurrency(a.amount)}
                    </span>
                  </li>
                ))}
                {plan.remaining > 0 ? (
                  <li className="flex items-center justify-between px-2 py-1 text-muted">
                    <span>Resto a saldo a favor</span>
                    <span className="tabular-nums">{formatCurrency(plan.remaining)}</span>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Field label="Estado de pago">
          <Select
            value={manualPaid ? 'manual' : 'auto'}
            onChange={(e) => setManualPaid(e.target.value === 'manual')}
          >
            <option value="auto">
              Automático (
              {remaining === 0 && covered > 0
                ? 'Pagado'
                : covered > 0
                  ? 'Parcial'
                  : 'Sin cambios'}
              )
            </option>
            <option value="manual">✓ Marcar manualmente como Pagado</option>
          </Select>
        </Field>

        <div className="space-y-2 rounded-lg border border-border bg-background p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Resumen</span>
            <span className="tabular-nums text-xs text-muted">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-default">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-warning transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <dl className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">Costo pendiente</dt>
              <dd className="tabular-nums">{formatCurrency(pendingCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Pago del cliente</dt>
              <dd className="tabular-nums">{formatCurrency(amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Saldo aplicado</dt>
              <dd className="tabular-nums">
                {applied > 0
                  ? `− ${formatCurrency(applied)}`
                  : formatCurrency(0)}
              </dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt className="text-foreground">Total cubierto</dt>
              <dd className="tabular-nums">{formatCurrency(covered)}</dd>
            </div>
            {remaining > 0 ? (
              <div className="flex justify-between font-medium text-danger">
                <dt>Faltará abonar</dt>
                <dd className="tabular-nums">{formatCurrency(remaining)}</dd>
              </div>
            ) : null}
            {plan && plan.allocations.length > 0 ? (
              <div className="flex justify-between font-medium text-accent-soft-foreground">
                <dt>Repartido a pendientes</dt>
                <dd className="tabular-nums">
                  {formatCurrency(surplus - plan.remaining)}
                </dd>
              </div>
            ) : null}
            {toBalance > 0 ? (
              <div className="flex justify-between font-medium text-success-soft-foreground">
                <dt>Excedente al saldo</dt>
                <dd className="tabular-nums">+ {formatCurrency(toBalance)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-separator pt-1">
              <dt className="text-muted">Saldo resultante cliente</dt>
              <dd
                className={`tabular-nums font-medium ${
                  resultingBalance < 0
                    ? 'text-danger'
                    : 'text-success-soft-foreground'
                }`}
              >
                {formatCurrency(resultingBalance)}
              </dd>
            </div>
          </dl>
          {fullyPaid ? (
            <div className="animate-in fade-in zoom-in-95 rounded-md bg-success-soft px-2 py-1.5 text-xs font-medium text-success-soft-foreground">
              ✅ Completamente pagado
            </div>
          ) : null}
        </div>

        <FormError message={error} />
      </div>
    </AppModal>
  );
}
