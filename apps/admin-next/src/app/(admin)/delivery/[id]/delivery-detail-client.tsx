'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  DollarSign,
  ExternalLink,
  PackagePlus,
  PackageSearch,
  Pencil,
  Receipt,
  Scale,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import { removeDeliveredProductAction } from '../actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { DeliveryStatusBadge, PayStatusBadge } from '@/components/status-badges';
import {
  ConfirmModal,
  StatCard,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
  type StatTone,
} from '@/components/ui';
import { DetailPhotos } from '@/components/detail-photos';
import { DeliveryActionsBar } from '../delivery-actions-bar';
import { DeliveryDialog } from '../delivery-dialog';
import { ConfirmDeliveryPaymentDialog } from '../confirm-payment-dialog';
import { AddProductsDialog } from './add-products-dialog';
import type { DeliveryRow, ReceivedCandidate } from '../schema';

interface DeliveredProduct {
  id: string;
  productName: string;
  orderId: string;
  amountDelivered: number;
}

interface DeliveryDetailClientProps {
  role: string;
  delivery: DeliveryRow;
  deliveredProducts: DeliveredProduct[];
  candidates: ReceivedCandidate[];
}

function payTone(paymentStatus: string): StatTone {
  if (paymentStatus === 'Pagado') return 'success';
  if (paymentStatus === 'Parcial') return 'warning';
  return 'danger';
}

export function DeliveryDetailClient({
  role,
  delivery,
  deliveredProducts,
  candidates,
}: DeliveryDetailClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DeliveredProduct | null>(null);

  const canWrite = role === 'admin' || role === 'logistical';
  const editableProducts =
    canWrite &&
    (delivery.status === 'Pendiente' ||
      (delivery.status === 'En transito' && role === 'admin'));
  const units = deliveredProducts.reduce((s, dp) => s + dp.amountDelivered, 0);

  const removeAction = (dp: DeliveredProduct) =>
    editableProducts ? (
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={`Quitar ${dp.productName}`}
          onPress={() => setRemoveTarget(dp)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Quitar de la entrega</Tooltip.Content>
      </Tooltip>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/delivery"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a entregas
        </Link>
        {delivery.phase === 'En preparación' ? (
          <Link
            href="/delivery/prepare"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            <Scale className="h-4 w-4" aria-hidden />
            Ver en Preparar entregas
          </Link>
        ) : null}
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {delivery.clientName}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              <span>Entrega #{delivery.id}</span>
              <span className="inline-flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" aria-hidden />
                {delivery.weight.toFixed(2)} lb
                {delivery.categoryName ? ` · ${delivery.categoryName}` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formatDate(delivery.deliverDate)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DeliveryStatusBadge status={delivery.status} weight={delivery.weight} />
            <PayStatusBadge status={delivery.paymentStatus} />
            {canWrite ? (
              <Tooltip delay={500}>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Editar fecha o foto"
                  onPress={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Tooltip.Content>Editar fecha o foto</Tooltip.Content>
              </Tooltip>
            ) : null}
          </div>
        </div>

        <DetailPhotos
          className="mt-4"
          label="Foto de la entrega"
          photos={[{ url: delivery.deliverPicture, alt: `Foto de la entrega ${delivery.id}` }]}
        />

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Receipt}
            label="Costo por peso"
            value={formatCurrency(delivery.weightCost)}
            tone="accent"
          />
          <StatCard
            icon={TrendingUp}
            label="Ganancia del gestor"
            value={formatCurrency(delivery.managerProfit)}
            tone="success"
          />
          <StatCard
            icon={DollarSign}
            label="Pagado"
            value={formatCurrency(delivery.paymentAmount + delivery.balanceApplied)}
            hint={delivery.balanceApplied > 0 ? `${formatCurrency(delivery.balanceApplied)} de saldo` : undefined}
            tone="default"
          />
          <StatCard
            icon={CreditCard}
            label="Estado de pago"
            value={delivery.paymentStatus}
            tone={payTone(delivery.paymentStatus)}
          />
        </div>

        {canWrite ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
            <DeliveryActionsBar
              delivery={{
                id: delivery.id,
                clientName: delivery.clientName,
                categoryName: delivery.categoryName,
                status: delivery.status,
                weight: delivery.weight,
                productCount: deliveredProducts.length,
                chargePerLb: delivery.chargePerLb,
                agentProfit: delivery.agentProfit,
                deliverPicture: delivery.deliverPicture,
              }}
              role={role}
            />
            {delivery.phase !== 'En preparación' && delivery.paymentStatus !== 'Pagado' ? (
              <Button
                variant="tertiary"
                onPress={() => setPayOpen(true)}
                className="h-11 sm:ml-auto sm:h-auto"
              >
                <DollarSign className="h-4 w-4" aria-hidden />
                Cobrar
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Productos ({units} unidad{units === 1 ? '' : 'es'})
        </h2>
        {editableProducts ? (
          <Button
            variant="primary"
            onPress={() => setAddOpen(true)}
            isDisabled={candidates.length === 0}
            className="w-full sm:w-auto"
          >
            <PackagePlus className="h-4 w-4" aria-hidden />
            Añadir productos
            {candidates.length > 0 ? ` (${candidates.length} disponibles)` : ''}
          </Button>
        ) : null}
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Orden</th>
                <th>Unidades</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveredProducts.length === 0 ? (
                <TableEmpty
                  colSpan={4}
                  icon={PackageSearch}
                  message="Aún no hay productos en esta entrega."
                />
              ) : (
                deliveredProducts.map((dp) => (
                  <tr key={dp.id}>
                    <td className="font-medium text-foreground">{dp.productName}</td>
                    <td>
                      <Link
                        href={`/orders/${dp.orderId}`}
                        className="inline-flex items-center gap-0.5 text-xs text-muted transition-colors hover:text-accent"
                      >
                        Orden #{dp.orderId}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </td>
                    <td className="tabular-nums">{dp.amountDelivered}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">{removeAction(dp)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          deliveredProducts.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              Aún no hay productos en esta entrega.
            </div>
          ) : (
            deliveredProducts.map((dp) => (
              <MobileCard
                key={dp.id}
                title={dp.productName}
                subtitle={`Orden #${dp.orderId}`}
                rows={[{ icon: PackageSearch, label: 'Unidades', value: dp.amountDelivered }]}
                actions={removeAction(dp)}
              />
            ))
          )
        }
      />

      <AddProductsDialog
        open={addOpen}
        deliveryId={delivery.id}
        categoryName={delivery.categoryName}
        candidates={candidates}
        onClose={() => setAddOpen(false)}
      />

      <DeliveryDialog
        open={editOpen}
        delivery={delivery}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          toast.success('Entrega actualizada', {
            description: 'La fecha y la foto se guardaron.',
          });
        }}
      />

      {payOpen ? (
        <ConfirmDeliveryPaymentDialog delivery={delivery} onClose={() => setPayOpen(false)} />
      ) : null}

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="¿Quitar de la entrega?"
        description={
          removeTarget ? (
            <>
              <strong className="text-foreground">
                {removeTarget.amountDelivered} unidad{removeTarget.amountDelivered === 1 ? '' : 'es'}
              </strong>{' '}
              de <strong className="text-foreground">{removeTarget.productName}</strong>{' '}
              volverán a «recibido sin bolsa».
            </>
          ) : null
        }
        confirmLabel="Quitar"
        onConfirm={async () => {
          if (!removeTarget) return { ok: false, error: 'Producto no encontrado' };
          const result = await removeDeliveredProductAction(delivery.id, removeTarget.id);
          if (result.ok) {
            setRemoveTarget(null);
            toast.success('Producto quitado', {
              description: `${removeTarget.productName} volvió a «recibido sin bolsa».`,
            });
          }
          return result;
        }}
      />
    </div>
  );
}
