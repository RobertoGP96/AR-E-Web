'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Package,
  PackagePlus,
  PackageSearch,
  Pencil,
  Receipt,
  ShoppingBag,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Chip, Tooltip } from '@heroui/react';
import { removeBuyedProductAction } from '../actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { PurchasePayBadge } from '@/components/status-badges';
import {
  ConfirmModal,
  StatCard,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import { PurchaseDialog } from '../purchase-dialog';
import { AddProductsDialog } from './add-products-dialog';
import { RefundDialog } from './refund-dialog';
import type {
  PendingCandidates,
  PurchaseRow,
  ShopWithAccounts,
} from '../schema';

interface BuyedProduct {
  id: string;
  productName: string;
  orderId: string;
  clientName: string;
  amountBuyed: number;
  quantityRefuned: number;
  isRefunded: boolean;
  refundAmount: number;
  refundNotes: string | null;
  /** Unidades ya recibidas del producto (bloquean quitar/reembolsar). */
  receivedOfProduct: number;
  estimate: number;
}

interface PurchaseDetailClientProps {
  purchase: PurchaseRow;
  shopOptions: ShopWithAccounts[];
  buyedProducts: BuyedProduct[];
  candidates: PendingCandidates;
  justCreated: boolean;
  fromOrderId: string | null;
}

export function PurchaseDetailClient({
  purchase,
  shopOptions,
  buyedProducts,
  candidates,
  justCreated,
  fromOrderId,
}: PurchaseDetailClientProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(justCreated);
  const [refundTarget, setRefundTarget] = useState<BuyedProduct | null>(null);
  const [removeTarget, setRemoveTarget] = useState<BuyedProduct | null>(null);

  const boughtUnits = buyedProducts.reduce((s, bp) => s + bp.amountBuyed, 0);
  const refundedUnits = buyedProducts.reduce((s, bp) => s + bp.quantityRefuned, 0);
  const totalRefunded = buyedProducts.reduce((s, bp) => s + bp.refundAmount, 0);
  const estimatedTotal = buyedProducts.reduce((s, bp) => s + bp.estimate, 0);

  const productActions = (bp: BuyedProduct) => (
    <>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Reembolsar ${bp.productName}`}
          onPress={() => setRefundTarget(bp)}
          isDisabled={bp.amountBuyed - bp.quantityRefuned <= 0}
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
        <Tooltip.Content>
          {bp.receivedOfProduct > 0
            ? 'Quitar (bloqueado si deja recibido > comprado)'
            : 'Quitar'}
        </Tooltip.Content>
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
      <div className="animate-in fade-in slide-in-from-top-1 duration-300 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a compras
        </Link>
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          <Package className="h-4 w-4" aria-hidden />
          Registrar paquete
        </Link>
      </div>

      {bannerOpen ? (
        <div className="surface-card animate-in fade-in slide-in-from-top-2 flex flex-wrap items-start gap-3 border-success/30 bg-success-soft/40 p-4 duration-300">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Compra creada
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Cuando llegue la mercancía, regístrala como paquete y marca las
              llegadas en «Preparar entregas»: cada producto caerá en la
              bolsa de su cliente.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onPress={() => router.push('/packages')}
              >
                <Package className="h-4 w-4" aria-hidden />
                Registrar paquete
              </Button>
              {fromOrderId ? (
                <Link
                  href={`/orders/${fromOrderId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  Volver a la orden #{fromOrderId}
                </Link>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setBannerOpen(false)}
            className="rounded-md p-1 text-muted transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {purchase.shopName}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                {purchase.accountName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formatDate(purchase.buyDate)}
              </span>
              {purchase.cardId ? <span>Tarjeta {purchase.cardId}</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PurchasePayBadge status={purchase.statusOfShopping} />
            <Tooltip delay={500}>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label="Editar cabecera de la compra"
                onPress={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
              <Tooltip.Content>Editar cabecera</Tooltip.Content>
            </Tooltip>
          </div>
        </div>

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Receipt}
            label="Total pagado"
            value={formatCurrency(purchase.totalCostOfPurchase)}
            hint={`Estimado ${formatCurrency(estimatedTotal)}`}
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Productos comprados
        </h2>
        <Button
          variant="primary"
          onPress={() => setAddOpen(true)}
          isDisabled={candidates.totalProducts === 0}
          className="w-full sm:w-auto"
        >
          <PackagePlus className="h-4 w-4" aria-hidden />
          Añadir productos
          {candidates.totalProducts > 0 ? ` (${candidates.totalProducts} pendientes)` : ''}
        </Button>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cliente</th>
                <th>Comprado</th>
                <th>Estimado</th>
                <th>Reembolsado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buyedProducts.length === 0 ? (
                <TableEmpty
                  colSpan={6}
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
                    <td className="text-muted">
                      <span className="block">{bp.clientName}</span>
                      <Link
                        href={`/orders/${bp.orderId}`}
                        className="inline-flex items-center gap-0.5 text-xs transition-colors hover:text-accent"
                      >
                        Orden #{bp.orderId}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </td>
                    <td className="tabular-nums">
                      {bp.amountBuyed}
                      {bp.receivedOfProduct > 0 ? (
                        <span className="block text-xs text-muted">
                          {bp.receivedOfProduct} recibida
                          {bp.receivedOfProduct === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </td>
                    <td className="tabular-nums">{formatCurrency(bp.estimate)}</td>
                    <td>
                      {bp.quantityRefuned > 0 ? (
                        <span className="font-medium tabular-nums text-danger">
                          {bp.quantityRefuned} ({formatCurrency(bp.refundAmount)})
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">{productActions(bp)}</div>
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
                subtitle={`${bp.clientName} · Orden #${bp.orderId}`}
                badges={refundChip(bp)}
                rows={[
                  { label: 'Comprado', value: bp.amountBuyed },
                  { label: 'Estimado', value: formatCurrency(bp.estimate) },
                  {
                    label: 'Reembolsado',
                    value:
                      bp.quantityRefuned > 0 ? (
                        <span className="font-medium text-danger">
                          {bp.quantityRefuned} ({formatCurrency(bp.refundAmount)})
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

      <AddProductsDialog
        open={addOpen}
        purchaseId={purchase.id}
        shopName={purchase.shopName}
        candidates={candidates}
        onClose={() => setAddOpen(false)}
        onSuccess={() => setAddOpen(false)}
      />

      <PurchaseDialog
        open={editOpen}
        purchase={purchase}
        shopOptions={shopOptions}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          toast.success('Compra actualizada', {
            description: 'Los cambios de la cabecera se guardaron.',
          });
        }}
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
              ({removeTarget.amountBuyed} unidad(es)) de esta compra y se
              recalculará la cantidad comprada del producto.
              {removeTarget.receivedOfProduct > 0
                ? ' El producto ya tiene unidades recibidas: se bloqueará si quedaran más recibidas que compradas.'
                : ''}
            </>
          ) : null
        }
        confirmLabel="Quitar"
        onConfirm={async () => {
          if (!removeTarget) {
            return { ok: false, error: 'Producto no encontrado' };
          }
          const result = await removeBuyedProductAction(
            purchase.id,
            removeTarget.id
          );
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Producto quitado', {
              description: 'El producto se quitó de la compra.',
            });
          }
          return result;
        }}
      />

      <RefundDialog
        purchaseId={purchase.id}
        row={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          toast.success('Reembolso registrado', {
            description: 'El reembolso quedó registrado en la compra.',
          });
        }}
      />
    </div>
  );
}
