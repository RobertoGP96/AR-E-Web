'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Undo2,
  Receipt,
  CreditCard,
  ShoppingBag,
  PackageSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip, Chip, Spinner } from '@heroui/react';
import {
  addBuyedProductAction,
  removeBuyedProductAction,
  refundBuyedProductAction,
} from '../actions';
import { formatCurrency } from '@/lib/format';
import { PurchasePayBadge } from '@/components/status-badges';
import {
  AppModal,
  ConfirmModal,
  Field,
  NativeSelect,
  TextInput,
  TextArea,
  StatCard,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';

interface BuyedProduct {
  id: string;
  productName: string;
  amountBuyed: number;
  quantityRefuned: number;
  isRefunded: boolean;
  refundAmount: number;
}

interface Candidate {
  id: string;
  name: string;
  pending: number;
}

interface PurchaseDetailClientProps {
  purchaseId: string;
  header: {
    shopName: string;
    accountName: string;
    status: string;
    totalCostOfPurchase: number;
  };
  buyedProducts: BuyedProduct[];
  candidates: Candidate[];
}

export function PurchaseDetailClient({
  purchaseId,
  header,
  buyedProducts,
  candidates,
}: PurchaseDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(1);
  const [refundTarget, setRefundTarget] = useState<BuyedProduct | null>(null);
  const [removeTarget, setRemoveTarget] = useState<BuyedProduct | null>(null);

  const boughtUnits = buyedProducts.reduce((s, bp) => s + bp.amountBuyed, 0);
  const refundedUnits = buyedProducts.reduce(
    (s, bp) => s + bp.quantityRefuned,
    0
  );
  const totalRefunded = buyedProducts.reduce(
    (s, bp) => s + bp.refundAmount,
    0
  );

  function handleAdd() {
    if (!productId) {
      toast.error('Selecciona un producto');
      return;
    }
    startTransition(async () => {
      const result = await addBuyedProductAction(purchaseId, productId, amount);
      if (result.ok) {
        toast.success('Producto añadido a la compra');
        setProductId('');
        setAmount(1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const productActions = (bp: BuyedProduct) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Reembolsar ${bp.productName}`}
          onPress={() => setRefundTarget(bp)}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Registrar reembolso</Tooltip.Content>
      </Tooltip>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Quitar ${bp.productName}`}
          onPress={() => setRemoveTarget(bp)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Quitar</Tooltip.Content>
      </Tooltip>
    </>
  );

  const refundChip = (bp: BuyedProduct) =>
    bp.quantityRefuned > 0 ? (
      <Chip
        color={bp.isRefunded ? 'danger' : 'warning'}
        variant="soft"
        size="sm"
        className="whitespace-nowrap"
      >
        <Chip.Label>
          {bp.isRefunded ? 'Reembolsado' : 'Reembolso parcial'}
        </Chip.Label>
      </Chip>
    ) : undefined;

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a compras
        </Link>
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {header.shopName}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              {header.accountName}
            </p>
          </div>
          <PurchasePayBadge status={header.status} />
        </div>

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Receipt}
            label="Total de la compra"
            value={formatCurrency(header.totalCostOfPurchase)}
            tone="accent"
          />
          <StatCard
            icon={PackageSearch}
            label="Productos"
            value={buyedProducts.length}
            tone="default"
          />
          <StatCard
            icon={ShoppingBag}
            label="Unidades compradas"
            value={boughtUnits}
            tone="success"
          />
          <StatCard
            icon={Undo2}
            label="Reembolsado"
            value={formatCurrency(totalRefunded)}
            hint={refundedUnits > 0 ? `${refundedUnits} unidad(es)` : undefined}
            tone={totalRefunded > 0 ? 'danger' : 'default'}
          />
        </div>
      </header>

      <section className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Añadir producto comprado
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted">
            No hay productos disponibles de esta tienda.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Producto" className="flex-1">
              <NativeSelect
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">— Selecciona —</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.pending > 0 ? ` (${c.pending} pendientes)` : ''}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Cantidad" className="sm:w-28">
              <TextInput
                type="number"
                min={1}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                }
              />
            </Field>
            <Button
              variant="primary"
              onPress={handleAdd}
              isDisabled={isPending || !productId}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Añadir
            </Button>
          </div>
        )}
      </section>

      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Productos comprados
      </h2>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Comprado</th>
                <th>Reembolsado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buyedProducts.length === 0 ? (
                <TableEmpty
                  colSpan={4}
                  icon={PackageSearch}
                  message="Aún no hay productos comprados en esta compra."
                />
              ) : (
                buyedProducts.map((bp) => (
                  <tr key={bp.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {bp.productName}
                        </span>
                        {refundChip(bp)}
                      </div>
                    </td>
                    <td className="tabular-nums">{bp.amountBuyed}</td>
                    <td>
                      {bp.quantityRefuned > 0 ? (
                        <span className="font-medium tabular-nums text-danger">
                          {bp.quantityRefuned} (
                          {formatCurrency(bp.refundAmount)})
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {productActions(bp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          buyedProducts.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              Aún no hay productos comprados en esta compra.
            </div>
          ) : (
            buyedProducts.map((bp) => (
              <MobileCard
                key={bp.id}
                title={bp.productName}
                badges={refundChip(bp)}
                rows={[
                  { label: 'Comprado', value: bp.amountBuyed },
                  {
                    label: 'Reembolsado',
                    value:
                      bp.quantityRefuned > 0 ? (
                        <span className="font-medium text-danger">
                          {bp.quantityRefuned} (
                          {formatCurrency(bp.refundAmount)})
                        </span>
                      ) : (
                        '—'
                      ),
                  },
                ]}
                actions={productActions(bp)}
              />
            ))
          )
        }
      />

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Quitar producto?"
        description={
          removeTarget ? (
            <>
              Se quitará{' '}
              <strong className="text-foreground">
                {removeTarget.productName}
              </strong>{' '}
              ({removeTarget.amountBuyed} unidad(es)) de esta compra. La
              cantidad comprada del producto original se recalculará.
            </>
          ) : null
        }
        confirmLabel="Quitar"
        onConfirm={async () => {
          if (!removeTarget) {
            return { ok: false, error: 'Producto no encontrado' };
          }
          const result = await removeBuyedProductAction(
            purchaseId,
            removeTarget.id
          );
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Producto quitado');
            router.refresh();
          }
          return result;
        }}
      />

      <RefundDialog
        purchaseId={purchaseId}
        row={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          toast.success('Reembolso registrado');
          router.refresh();
        }}
      />
    </div>
  );
}

function RefundDialog({
  purchaseId,
  row,
  onClose,
  onSuccess,
}: {
  purchaseId: string;
  row: BuyedProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  // Refunds accumulate server-side; this dialog records an ADDITIONAL
  // refund, so it starts at 1/0 and caps at what is left to refund.
  const refundable = row
    ? Math.max(0, row.amountBuyed - row.quantityRefuned)
    : 0;
  const [quantity, setQuantity] = useState(Math.min(1, refundable));
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const signature = row?.id ?? 'none';
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setQuantity(
      Math.min(1, row ? Math.max(0, row.amountBuyed - row.quantityRefuned) : 0)
    );
    setAmount(0);
    setNotes('');
  }

  function submit() {
    if (!row) return;
    startTransition(async () => {
      const result = await refundBuyedProductAction(
        purchaseId,
        row.id,
        quantity,
        amount,
        notes
      );
      if (result.ok) onSuccess();
      else toast.error(result.error);
    });
  }

  return (
    <AppModal
      isOpen={row !== null}
      onClose={onClose}
      title="Registrar reembolso"
      description={
        row
          ? `${row.productName} — ${row.amountBuyed} comprado(s)${
              row.quantityRefuned > 0
                ? `, ${row.quantityRefuned} ya reembolsado(s)`
                : ''
            }.`
          : undefined
      }
      icon={<Undo2 className="h-5 w-5" aria-hidden />}
      size="sm"
    >
      <div key={row?.id ?? 'none'} className="space-y-4">
        <Field
          label="Cantidad a reembolsar"
          hint={`Máximo ${refundable}`}
          required
        >
          <TextInput
            type="number"
            min={1}
            max={refundable}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(refundable, Math.floor(Number(e.target.value) || 1))
                )
              )
            }
          />
        </Field>

        <Field label="Monto del reembolso">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <TextInput
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="pl-7"
            />
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <TextArea
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="rounded-xl border border-danger/25 bg-danger-soft/40 p-3 text-sm">
          <div className="flex items-center justify-between font-semibold text-danger-soft-foreground">
            <span>Se reembolsarán {quantity} unidad(es)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            El reembolso reduce la cantidad comprada del producto y puede
            cambiar su estado.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="tertiary" onPress={onClose} isDisabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onPress={submit}
            isDisabled={isPending || refundable === 0}
          >
            {isPending ? (
              <>
                <Spinner size="sm" aria-hidden />
                Guardando…
              </>
            ) : (
              'Registrar reembolso'
            )}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
