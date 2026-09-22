'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ShoppingBag,
  Store,
  Wand2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { estimateBuyedCost, round2 } from '@/lib/order-cost';
import {
  pickedItems,
  pruneSelection,
  summarize,
  type ChecklistGroup,
  type ChecklistSelection,
} from '@/lib/product-checklist';
import { ProductChecklist } from '@/components/product-checklist';
import { ChecklistSubmitBar } from '@/components/checklist-submit-bar';
import { Field, PageHeader, Select, TextInput } from '@/components/ui';
import { createPurchaseWithProductsAction } from '../actions';
import {
  PAY_STATUSES,
  type PayStatus,
  type PendingCandidates,
  type PendingProduct,
  type ShopWithAccounts,
} from '../schema';

interface NewPurchaseClientProps {
  shopOptions: ShopWithAccounts[];
  shopId: string | null;
  candidates: PendingCandidates | null;
  orderContext: {
    orderId: string;
    shops: { shopId: string; shopName: string; products: number; units: number }[];
  } | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewPurchaseClient({
  shopOptions,
  shopId,
  candidates,
  orderContext,
}: NewPurchaseClientProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [isPending, startTransition] = useTransition();

  const shop = shopOptions.find((s) => s.id === shopId) ?? null;
  const accounts = shop?.accounts ?? [];

  // Productos de la tienda indexados para estimar costos.
  const productsById = useMemo(() => {
    const map = new Map<string, PendingProduct>();
    for (const g of candidates?.groups ?? []) {
      for (const p of g.products) map.set(p.id, p);
    }
    return map;
  }, [candidates]);

  const groups: ChecklistGroup[] = useMemo(
    () =>
      (candidates?.groups ?? []).map((g) => ({
        id: g.clientId,
        label: g.clientName,
        hint: g.phoneNumber,
        items: g.products.map((p) => ({
          id: p.id,
          name: p.name,
          max: p.pending,
          subtitle: `Orden #${p.orderId}${p.sku ? ` · ${p.sku}` : ''}`,
          href: `/orders/${p.orderId}`,
          meta: `Pendientes ${p.pending} de ${p.amountRequested} pedidas`,
        })),
      })),
    [candidates]
  );

  // Selección inicial: si venimos de una orden, sus productos marcados.
  const initialSelection = useMemo(() => {
    const sel: ChecklistSelection = {};
    if (orderContext) {
      for (const p of productsById.values()) {
        if (p.orderId === orderContext.orderId) sel[p.id] = p.pending;
      }
    }
    return sel;
  }, [orderContext, productsById]);

  const [rawSelection, setSelection] = useState<ChecklistSelection>(initialSelection);
  const selection = useMemo(
    () => pruneSelection(rawSelection, groups),
    [rawSelection, groups]
  );
  const summary = useMemo(() => summarize(groups, selection), [groups, selection]);

  const [accountId, setAccountId] = useState(
    accounts.length === 1 ? accounts[0].id : ''
  );
  const [status, setStatus] = useState<PayStatus>('No pagado');
  const [buyDate, setBuyDate] = useState(today());
  const [cardId, setCardId] = useState('');
  const [totalMode, setTotalMode] = useState<'auto' | 'manual'>('auto');
  const [manualTotal, setManualTotal] = useState('');

  const estimateOf = (productId: string, qty: number) => {
    const p = productsById.get(productId);
    return p ? estimateBuyedCost(p.cost, qty) : 0;
  };
  const estimatedTotal = round2(
    Object.entries(selection).reduce(
      (sum, [id, qty]) => sum + estimateOf(id, qty),
      0
    )
  );
  const totalValue =
    totalMode === 'auto' ? estimatedTotal : Number(manualTotal) || 0;

  function changeShop(nextShopId: string) {
    const params = new URLSearchParams();
    if (nextShopId) params.set('shop', nextShopId);
    if (orderContext) params.set('order', orderContext.orderId);
    setSelection({});
    setAccountId('');
    startNavigation(() => {
      router.replace(`/purchases/new?${params.toString()}`, { scroll: false });
    });
  }

  function submit() {
    if (!shop) return;
    const items = pickedItems(selection);
    if (items.length === 0) {
      toast.error('Sin productos marcados', {
        description: 'Marca al menos un producto pendiente para crear la compra.',
      });
      return;
    }
    if (!accountId) {
      toast.error('Falta la cuenta de compra', {
        description: 'Elige con qué cuenta se hizo la compra.',
      });
      return;
    }
    startTransition(async () => {
      const result = await createPurchaseWithProductsAction({
        shopOfBuyId: shop.id,
        shoppingAccountId: accountId,
        statusOfShopping: status,
        buyDate,
        cardId,
        totalCostOfPurchase: totalValue,
        items,
      });
      if (result.ok && result.id) {
        toast.success('Compra creada', {
          description: `${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'} · ${formatCurrency(totalValue)}.`,
        });
        const params = new URLSearchParams({ created: '1' });
        if (orderContext) params.set('order', orderContext.orderId);
        router.push(`/purchases/${result.id}?${params.toString()}`);
      } else if (!result.ok) {
        toast.error('No se pudo crear la compra', { description: result.error });
        // Los pendientes pueden haber cambiado desde otra sesión.
        router.refresh();
      }
    });
  }

  const shopsWithPending = shopOptions.filter((s) => (s.pendingProducts ?? 0) > 0);

  return (
    <div className="space-y-5">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href={orderContext ? `/orders/${orderContext.orderId}` : '/purchases'}
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {orderContext ? `Volver a la orden #${orderContext.orderId}` : 'Volver a compras'}
        </Link>
      </div>

      <PageHeader
        icon={ShoppingBag}
        title="Nueva compra"
        subtitle="Elige la tienda, marca qué productos pendientes compraste y registra los datos de la compra"
      />

      {/* -------- 1. Tienda y cuenta -------- */}
      <section className="surface-card space-y-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Store className="h-4 w-4 text-accent" aria-hidden />
          1 · Tienda y cuenta de compra
        </h2>
        {orderContext && orderContext.shops.length > 1 ? (
          <p className="text-xs text-muted">
            La orden #{orderContext.orderId} tiene pendientes en varias tiendas:{' '}
            {orderContext.shops.map((s) => (
              <button
                key={s.shopId}
                type="button"
                onClick={() => changeShop(s.shopId)}
                className={`mr-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium transition-colors ${
                  s.shopId === shopId
                    ? 'bg-accent text-white'
                    : 'bg-accent-soft text-accent hover:bg-accent/20'
                }`}
              >
                {s.shopName} · {s.units} u.
              </button>
            ))}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tienda" required>
            <Select
              value={shopId ?? ''}
              onChange={(e) => changeShop(e.target.value)}
              disabled={isNavigating}
            >
              <option value="">— Selecciona una tienda —</option>
              {shopOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                  {s.pendingProducts
                    ? ` · ${s.pendingProducts} pendiente${s.pendingProducts === 1 ? '' : 's'}`
                    : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Cuenta de compra"
            required
            hint={
              shop && accounts.length === 0
                ? 'Esta tienda no tiene cuentas de compra: créala en Tiendas.'
                : undefined
            }
          >
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={!shop || accounts.length === 0}
            >
              <option value="">
                {shop ? '— Selecciona una cuenta —' : 'Selecciona primero una tienda'}
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {shop && accounts.length === 0 ? (
          <Link
            href="/shops"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Crear una cuenta de compra en Tiendas
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </section>

      {/* -------- 2. Productos pendientes -------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShoppingBag className="h-4 w-4 text-accent" aria-hidden />
          2 · ¿Qué compraste?
          {shop ? (
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {shop.label}
            </span>
          ) : null}
        </h2>

        {!shop ? (
          <div className="surface-card p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              Elige una tienda para ver sus productos pendientes
            </p>
            {shopsWithPending.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {shopsWithPending.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => changeShop(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    <Store className="h-4 w-4 text-muted" aria-hidden />
                    {s.label}
                    <span className="rounded-full bg-accent-soft px-1.5 text-xs font-bold tabular-nums text-accent">
                      {s.pendingUnits}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                No hay productos encargados pendientes de comprar en ninguna tienda.
              </p>
            )}
          </div>
        ) : isNavigating ? (
          <p className="surface-card p-4 text-sm text-muted">Cargando productos…</p>
        ) : (
          <>
            {candidates?.truncated ? (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                Se muestran los 500 primeros productos pendientes; usa el buscador
                de Productos para el resto.
              </p>
            ) : null}
            <ProductChecklist
              key={shop.id}
              groups={groups}
              value={selection}
              onChange={setSelection}
              emptyMessage={`No hay productos encargados pendientes de comprar en ${shop.label}.`}
              searchPlaceholder="Buscar producto, orden o cliente…"
              renderItemExtra={(item, qty) => (
                <span className="text-xs text-muted">
                  Estimado:{' '}
                  <b className="tabular-nums text-foreground">
                    {formatCurrency(estimateOf(item.id, qty))}
                  </b>
                </span>
              )}
              renderGroupExtra={(group, selected) =>
                selected.units > 0 ? (
                  <span className="text-xs tabular-nums text-muted">
                    Est.{' '}
                    <b className="text-foreground">
                      {formatCurrency(
                        round2(
                          group.items.reduce(
                            (s, i) => s + estimateOf(i.id, selection[i.id] ?? 0),
                            0
                          )
                        )
                      )}
                    </b>
                  </span>
                ) : null
              }
            />
          </>
        )}
      </section>

      {/* -------- 3. Datos de la compra -------- */}
      {shop ? (
        <section className="surface-card space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">
            3 · Datos de la compra
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fecha de compra" required>
              <TextInput
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Estado de pago">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as PayStatus)}
              >
                {PAY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tarjeta / ID (opcional)">
              <TextInput
                value={cardId}
                maxLength={50}
                onChange={(e) => setCardId(e.target.value)}
              />
            </Field>
            <Field
              label="Costo total pagado"
              hint={
                totalMode === 'auto'
                  ? 'Estimado a partir de los productos marcados; ajústalo al importe real.'
                  : `Estimado: ${formatCurrency(estimatedTotal)}`
              }
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    $
                  </span>
                  <TextInput
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={
                      totalMode === 'auto' ? estimatedTotal.toFixed(2) : manualTotal
                    }
                    onChange={(e) => {
                      setTotalMode('manual');
                      setManualTotal(e.target.value);
                    }}
                    className="pl-7"
                  />
                </div>
                {totalMode === 'manual' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setTotalMode('auto')}
                    aria-label="Usar el costo estimado"
                  >
                    <Wand2 className="h-4 w-4" aria-hidden />
                    Usar estimado
                  </Button>
                ) : null}
              </div>
            </Field>
          </div>
        </section>
      ) : null}

      {shop ? (
        <ChecklistSubmitBar
          title="Compra"
          summary={`${summary.items} producto${summary.items === 1 ? '' : 's'} · ${summary.units} unidad${summary.units === 1 ? '' : 'es'} · ${formatCurrency(totalValue)}`}
          hints={
            <span>
              Los productos marcados pasarán a «Comprado» cuando su cantidad
              pedida quede cubierta. Después registra el paquete cuando llegue.
            </span>
          }
          label="Crear compra"
          icon={ShoppingBag}
          isPending={isPending}
          disabled={summary.units === 0 || !accountId}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}
