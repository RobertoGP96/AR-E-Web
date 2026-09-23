'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  CalendarRange,
  FileText,
  ListChecks,
  Receipt,
  ShoppingCart,
} from 'lucide-react';
import { Button, Checkbox, Chip, Label, Spinner, Tabs } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency, formatDate } from '@/lib/format';
import type { StatementMode } from '@/lib/client-statement';
import { AppModal, Field, TextInput } from '@/components/ui';
import {
  loadClientInvoiceOptionsAction,
  type ClientInvoiceOptions,
} from './invoice-actions';

export interface InvoiceTarget {
  id: string;
  name: string;
}

interface ClientInvoiceDialogProps {
  target: InvoiceTarget | null;
  onClose: () => void;
}

const MODE_META: Record<
  StatementMode,
  { label: string; hint: string }
> = {
  pending: {
    label: 'Pendientes',
    hint: 'Factura de lo que el cliente aún debe. Elige qué partidas incluir.',
  },
  history: {
    label: 'Estado de cuenta',
    hint: 'Historial tipo extracto bancario: cada cargo y cada pago con el saldo corriente. Puedes acotarlo por fechas.',
  },
  orders: {
    label: 'Por pedidos',
    hint: 'Factura de pedidos concretos con el detalle de sus productos, estén pagados o no.',
  },
};

function payStatusColor(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'Pagado') return 'success';
  if (status === 'Parcial') return 'warning';
  return 'danger';
}

function PayStatusChip({ status }: { status: string }) {
  return (
    <Chip color={payStatusColor(status)} variant="soft" size="sm">
      <Chip.Label>{status}</Chip.Label>
    </Chip>
  );
}

function isoDay(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Diálogo "Generar factura" de la pestaña Balances. Carga las opciones
 * del cliente (pendientes, pedidos, rango con movimientos), deja elegir
 * el tipo de documento y sus partidas, y abre el documento imprimible en
 * /users/[id]/statement en una pestaña nueva (desde ahí se imprime o se
 * guarda como PDF).
 */
export function ClientInvoiceDialog({ target, onClose }: ClientInvoiceDialogProps) {
  const [options, setOptions] = useState<ClientInvoiceOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<StatementMode>('pending');
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [orderIds, setOrderIds] = useState<Set<string>>(new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isLoading, startLoading] = useTransition();

  const targetId = target?.id ?? null;

  // Reset al cambiar de cliente durante el render (mismo patrón
  // adjust-state-in-render de users-tabs.tsx), no dentro de un efecto.
  const [lastTargetId, setLastTargetId] = useState<string | null>(null);
  if (targetId !== lastTargetId) {
    setLastTargetId(targetId);
    setOptions(null);
    setError(null);
    setMode('pending');
    setPendingKeys(new Set());
    setOrderIds(new Set());
    setFrom('');
    setTo('');
  }

  useEffect(() => {
    if (!targetId) return;
    startLoading(async () => {
      const result = await loadClientInvoiceOptionsAction(targetId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOptions(result.data);
      // Por defecto se factura todo lo pendiente; los pedidos se eligen a mano.
      setPendingKeys(new Set(result.data.pending.map((l) => l.key)));
      setOrderIds(new Set());
    });
  }, [targetId]);

  const pendingTotal = useMemo(() => {
    if (!options) return 0;
    return options.pending
      .filter((l) => pendingKeys.has(l.key))
      .reduce((s, l) => s + l.pending, 0);
  }, [options, pendingKeys]);

  const ordersTotal = useMemo(() => {
    if (!options) return { cost: 0, pending: 0 };
    const chosen = options.orders.filter((o) => orderIds.has(o.id));
    return {
      cost: chosen.reduce((s, o) => s + o.cost, 0),
      pending: chosen.reduce((s, o) => s + o.pending, 0),
    };
  }, [options, orderIds]);

  const rangeInvalid = Boolean(from && to && from > to);

  const canGenerate =
    !!options &&
    (mode === 'pending'
      ? pendingKeys.size > 0
      : mode === 'orders'
        ? orderIds.size > 0
        : !rangeInvalid);

  function toggle(
    set: Set<string>,
    key: string,
    on: boolean,
    apply: (next: Set<string>) => void
  ) {
    const next = new Set(set);
    if (on) next.add(key);
    else next.delete(key);
    apply(next);
  }

  function generate() {
    if (!options || !canGenerate) return;
    const params = new URLSearchParams({ mode });
    if (mode === 'pending') {
      params.set('items', [...pendingKeys].join(','));
    } else if (mode === 'orders') {
      params.set('orders', [...orderIds].join(','));
    } else {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    const url = `/users/${options.client.id}/statement?${params.toString()}`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) {
      toast.error('El navegador bloqueó la pestaña', {
        description: 'Permite ventanas emergentes para abrir el documento.',
      });
      return;
    }
    onClose();
  }

  return (
    <AppModal
      isOpen={target !== null}
      onClose={onClose}
      size="lg"
      icon={<Receipt className="h-5 w-5" aria-hidden />}
      title="Generar factura"
      description={
        target ? (
          <>
            Documento para <span className="font-medium text-foreground">{target.name}</span>.
            Se abre en una pestaña nueva listo para imprimir o guardar como PDF.
          </>
        ) : null
      }
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" isDisabled={!canGenerate} onPress={generate}>
            <FileText className="h-4 w-4" aria-hidden />
            Generar documento
          </Button>
        </>
      }
    >
      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : !options || isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" aria-label="Cargando datos del cliente…" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="text-muted">Balance actual</span>
            <span
              className={`font-semibold tabular-nums ${
                options.balance < 0
                  ? 'text-danger'
                  : options.balance > 0
                    ? 'text-success-soft-foreground'
                    : ''
              }`}
            >
              {formatCurrency(options.balance)}
            </span>
          </div>

          <Tabs
            selectedKey={mode}
            onSelectionChange={(key) => setMode(key as StatementMode)}
          >
            <Tabs.ListContainer className="w-fit max-w-full">
              <Tabs.List aria-label="Tipo de documento">
                <Tabs.Tab id="pending" className="gap-1.5 whitespace-nowrap">
                  <ListChecks className="h-4 w-4" aria-hidden />
                  {MODE_META.pending.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="history" className="gap-1.5 whitespace-nowrap">
                  <CalendarRange className="h-4 w-4" aria-hidden />
                  {MODE_META.history.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="orders" className="gap-1.5 whitespace-nowrap">
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  {MODE_META.orders.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="pending" className="space-y-3 p-0 pt-3">
              <p className="text-xs text-muted">{MODE_META.pending.hint}</p>
              {options.pending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                  Este cliente no tiene nada pendiente de pago.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {pendingKeys.size} de {options.pending.length} partidas
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          setPendingKeys(new Set(options.pending.map((l) => l.key)))
                        }
                      >
                        Todas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setPendingKeys(new Set())}
                      >
                        Ninguna
                      </Button>
                    </div>
                  </div>
                  <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {options.pending.map((line) => (
                      <li key={line.key}>
                        <Checkbox
                          isSelected={pendingKeys.has(line.key)}
                          onChange={(on) =>
                            toggle(pendingKeys, line.key, on, setPendingKeys)
                          }
                          className="w-full rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
                        >
                          <Checkbox.Content className="w-full">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Label className="flex w-full min-w-0 items-center justify-between gap-3 text-sm">
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  {line.description}
                                </span>
                                <span className="block truncate text-xs text-muted">
                                  {formatDate(line.date)} · {line.detail}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <PayStatusChip status={line.payStatus} />
                                <span className="font-semibold tabular-nums text-danger">
                                  {formatCurrency(line.pending)}
                                </span>
                              </span>
                            </Label>
                          </Checkbox.Content>
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between rounded-lg bg-accent-soft/50 px-3 py-2 text-sm">
                    <span className="font-medium">Total a facturar</span>
                    <span className="text-base font-bold tabular-nums">
                      {formatCurrency(pendingTotal)}
                    </span>
                  </div>
                </>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="history" className="space-y-3 p-0 pt-3">
              <p className="text-xs text-muted">{MODE_META.history.hint}</p>
              {options.operationCount === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                  Este cliente aún no tiene movimientos.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field
                      label="Desde"
                      hint={`Primer movimiento: ${formatDate(options.firstDate ?? '')}`}
                    >
                      <TextInput
                        type="date"
                        value={from}
                        min={isoDay(options.firstDate)}
                        max={isoDay(options.lastDate)}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Hasta"
                      error={rangeInvalid ? 'Debe ser posterior a "Desde"' : undefined}
                      hint={`Último movimiento: ${formatDate(options.lastDate ?? '')}`}
                    >
                      <TextInput
                        type="date"
                        value={to}
                        min={from || isoDay(options.firstDate)}
                        onChange={(e) => setTo(e.target.value)}
                        invalid={rangeInvalid}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-muted">
                    Sin fechas se incluye el historial completo ({options.operationCount}{' '}
                    movimientos). Con fechas, lo anterior se resume como saldo inicial.
                  </p>
                </>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="orders" className="space-y-3 p-0 pt-3">
              <p className="text-xs text-muted">{MODE_META.orders.hint}</p>
              {options.orders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                  Este cliente no tiene pedidos.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {orderIds.size} de {options.orders.length} pedidos
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          setOrderIds(new Set(options.orders.map((o) => o.id)))
                        }
                      >
                        Todos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setOrderIds(new Set())}
                      >
                        Ninguno
                      </Button>
                    </div>
                  </div>
                  <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {[...options.orders].reverse().map((o) => (
                      <li key={o.id}>
                        <Checkbox
                          isSelected={orderIds.has(o.id)}
                          onChange={(on) => toggle(orderIds, o.id, on, setOrderIds)}
                          className="w-full rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
                        >
                          <Checkbox.Content className="w-full">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Label className="flex w-full min-w-0 items-center justify-between gap-3 text-sm">
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  Pedido #{o.id}
                                </span>
                                <span className="block truncate text-xs text-muted">
                                  {formatDate(o.createdAt)} · {o.productCount} producto
                                  {o.productCount === 1 ? '' : 's'} · {o.status}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <PayStatusChip status={o.payStatus} />
                                <span className="font-semibold tabular-nums">
                                  {formatCurrency(o.cost)}
                                </span>
                              </span>
                            </Label>
                          </Checkbox.Content>
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-accent-soft/50 px-3 py-2 text-sm">
                    <span className="text-muted">Costo de los pedidos</span>
                    <span className="text-right font-semibold tabular-nums">
                      {formatCurrency(ordersTotal.cost)}
                    </span>
                    <span className="text-muted">Pendiente de pago</span>
                    <span className="text-right font-semibold tabular-nums text-danger">
                      {formatCurrency(ordersTotal.pending)}
                    </span>
                  </div>
                </>
              )}
            </Tabs.Panel>
          </Tabs>
        </div>
      )}
    </AppModal>
  );
}
