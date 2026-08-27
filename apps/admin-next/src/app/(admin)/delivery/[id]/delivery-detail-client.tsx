'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Scale,
  Receipt,
  TrendingUp,
  CreditCard,
  PackagePlus,
  PackageSearch,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui/react';
import {
  addDeliveredProductAction,
  removeDeliveredProductAction,
} from '../actions';
import { formatCurrency } from '@/lib/format';
import {
  DeliveryStatusBadge,
  PayStatusBadge,
} from '@/components/status-badges';
import {
  StatCard,
  Field,
  SearchSelect,
  TextInput,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
  type StatTone,
} from '@/components/ui';

interface DeliveredProduct {
  id: string;
  productName: string;
  amountDelivered: number;
}

interface Candidate {
  id: string;
  name: string;
  remaining: number;
}

interface DeliveryDetailClientProps {
  deliveryId: string;
  header: {
    clientName: string;
    categoryName: string | null;
    weight: number;
    status: string;
    paymentStatus: string;
    weightCost: number;
    managerProfit: number;
  };
  deliveredProducts: DeliveredProduct[];
  candidates: Candidate[];
}

function payTone(paymentStatus: string): StatTone {
  if (paymentStatus === 'Pagado') return 'success';
  if (paymentStatus === 'Parcial') return 'warning';
  return 'danger';
}

export function DeliveryDetailClient({
  deliveryId,
  header,
  deliveredProducts,
  candidates,
}: DeliveryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(1);

  const selected = candidates.find((c) => c.id === productId);
  const maxAmount = selected?.remaining ?? 0;

  function handleAdd() {
    if (!productId) {
      toast.error('Selecciona un producto');
      return;
    }
    startTransition(async () => {
      const result = await addDeliveredProductAction(
        deliveryId,
        productId,
        amount
      );
      if (result.ok) {
        toast.success('Producto añadido a la entrega');
        setProductId('');
        setAmount(1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(rowId: string) {
    startTransition(async () => {
      const result = await removeDeliveredProductAction(deliveryId, rowId);
      if (result.ok) {
        toast.success('Producto quitado');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const removeAction = (dp: DeliveredProduct) => (
    <Tooltip delay={500}>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Quitar ${dp.productName}`}
        onPress={() => handleRemove(dp.id)}
        isDisabled={isPending}
        className="hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
      <Tooltip.Content>Quitar de la entrega</Tooltip.Content>
    </Tooltip>
  );

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/delivery"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a entregas
        </Link>
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {header.clientName}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <Scale className="h-3.5 w-3.5" aria-hidden />
              {header.weight.toFixed(2)} lb
              {header.categoryName ? ` · ${header.categoryName}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <DeliveryStatusBadge status={header.status} />
            <PayStatusBadge status={header.paymentStatus} />
          </div>
        </div>

        <div className="stagger-children mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Receipt}
            label="Costo por peso"
            value={formatCurrency(header.weightCost)}
            tone="accent"
          />
          <StatCard
            icon={TrendingUp}
            label="Ganancia del gestor"
            value={formatCurrency(header.managerProfit)}
            tone="success"
          />
          <StatCard
            icon={CreditCard}
            label="Estado de pago"
            value={header.paymentStatus}
            tone={payTone(header.paymentStatus)}
          />
        </div>
      </header>

      <section className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackagePlus className="h-4 w-4 text-accent" aria-hidden />
          Añadir un producto recibido a esta entrega
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted">
            No hay productos recibidos pendientes de entregar para este cliente.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Producto" className="flex-1">
              <SearchSelect
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setAmount(1);
                }}
                placeholder="— Selecciona —"
                searchPlaceholder="Buscar producto…"
                emptyMessage="Sin productos recibidos pendientes"
                options={candidates.map((c) => ({
                  value: c.id,
                  label: c.name,
                  description: `${c.remaining} disponible${
                    c.remaining === 1 ? '' : 's'
                  }`,
                }))}
              />
            </Field>
            <Field label="Cantidad" className="sm:w-28">
              <TextInput
                type="number"
                min={1}
                max={maxAmount || 1}
                value={amount}
                onChange={(e) =>
                  setAmount(
                    Math.max(
                      1,
                      Math.min(
                        maxAmount || 1,
                        Math.floor(Number(e.target.value) || 1)
                      )
                    )
                  )
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

      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Productos entregados
        </h2>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Entregado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deliveredProducts.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={PackageSearch}
                  message="Aún no hay productos entregados en este recibo."
                />
              ) : (
                deliveredProducts.map((dp) => (
                  <tr key={dp.id}>
                    <td className="font-medium text-foreground">
                      {dp.productName}
                    </td>
                    <td className="tabular-nums">{dp.amountDelivered}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {removeAction(dp)}
                      </div>
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
              Aún no hay productos entregados en este recibo.
            </div>
          ) : (
            deliveredProducts.map((dp) => (
              <MobileCard
                key={dp.id}
                title={dp.productName}
                rows={[
                  {
                    icon: PackageSearch,
                    label: 'Entregado',
                    value: dp.amountDelivered,
                  },
                ]}
                actions={removeAction(dp)}
              />
            ))
          )
        }
      />
    </div>
  );
}
