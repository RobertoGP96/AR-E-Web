'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Trash2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  addReceivedProductAction,
  removeReceivedProductAction,
} from '../actions';
import { formatDate } from '@/lib/format';

interface ReceivedProduct {
  id: string;
  productName: string;
  clientName: string;
  amountReceived: number;
  observation: string | null;
}

interface Candidate {
  id: string;
  name: string;
  clientName: string;
  remaining: number;
}

interface PackageDetailClientProps {
  packageId: string;
  header: {
    agencyName: string;
    numberOfTracking: string;
    status: string;
    arrivalDate: string;
    packagePicture: string | null;
  };
  receivedProducts: ReceivedProduct[];
  candidates: Candidate[];
}

export function PackageDetailClient({
  packageId,
  header,
  receivedProducts,
  candidates,
}: PackageDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(1);
  const [observation, setObservation] = useState('');

  const selected = candidates.find((c) => c.id === productId);
  const maxAmount = selected?.remaining ?? 0;

  function handleAdd() {
    if (!productId) {
      toast.error('Selecciona un producto');
      return;
    }
    startTransition(async () => {
      const result = await addReceivedProductAction(
        packageId,
        productId,
        amount,
        observation
      );
      if (result.ok) {
        toast.success('Producto marcado como recibido');
        setProductId('');
        setAmount(1);
        setObservation('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(rowId: string) {
    startTransition(async () => {
      const result = await removeReceivedProductAction(packageId, rowId);
      if (result.ok) {
        toast.success('Recepción eliminada');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/packages"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a paquetes
      </Link>

      <header className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {header.agencyName}
            </h1>
            <p className="break-all text-sm text-zinc-500">
              Tracking: {header.numberOfTracking}
            </p>
            <p className="text-sm text-zinc-500">
              Llegada: {formatDate(new Date(header.arrivalDate))}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {header.status}
          </span>
        </div>
        {header.packagePicture ? (
          <div className="mt-4">
            <Image
              src={header.packagePicture}
              alt="Foto del paquete"
              width={320}
              height={240}
              className="h-auto w-full max-w-xs rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
            />
          </div>
        ) : null}
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <PackageCheck className="h-4 w-4" aria-hidden />
          Registrar producto recibido en este paquete
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay productos comprados pendientes de recibir.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-1">
                <span className="text-xs text-zinc-500">Producto</span>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setAmount(1);
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">— Seleccionar —</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.clientName} ({c.remaining} pendiente
                      {c.remaining === 1 ? '' : 's'})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Cantidad</span>
                <input
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
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm sm:w-24 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-1">
                <span className="text-xs text-zinc-500">
                  Observación (opcional)
                </span>
                <input
                  type="text"
                  maxLength={200}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ej: caja dañada, falta accesorio…"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending || !productId}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Registrar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Recibido</th>
                <th className="px-4 py-3 font-medium">Observación</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {receivedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    Aún no hay productos recibidos en este paquete.
                  </td>
                </tr>
              ) : (
                receivedProducts.map((rp) => (
                  <tr key={rp.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 font-medium">{rp.productName}</td>
                    <td className="px-4 py-3">{rp.clientName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {rp.amountReceived}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-zinc-500">
                      {rp.observation ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(rp.id)}
                        disabled={isPending}
                        aria-label="Eliminar recepción"
                        className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
