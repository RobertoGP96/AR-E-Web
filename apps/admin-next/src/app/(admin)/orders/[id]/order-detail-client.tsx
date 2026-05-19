'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductDialog } from './product-dialog';
import { ProductDeleteDialog } from './product-delete-dialog';
import { formatCurrency } from '@/lib/format';
import type { ProductRow, SelectOption } from '../schema';

interface OrderHeader {
  clientName: string;
  clientPhone: string;
  salesManagerName: string | null;
  status: string;
  payStatus: string;
  totalCosts: number;
  receivedValueOfClient: number;
  balanceApplied: number;
  observations: string | null;
}

interface OrderDetailClientProps {
  orderId: string;
  header: OrderHeader;
  products: ProductRow[];
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
}

export function OrderDetailClient({
  orderId,
  header,
  products,
  shopOptions,
  categoryOptions,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const paid = header.receivedValueOfClient + header.balanceApplied;
  const outstanding = Math.max(0, header.totalCosts - paid);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to orders
        </Link>
      </div>

      <header className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {header.clientName}
            </h1>
            <p className="text-sm text-zinc-500">{header.clientPhone}</p>
            {header.salesManagerName ? (
              <p className="mt-1 text-xs text-zinc-500">
                Manager: {header.salesManagerName}
              </p>
            ) : null}
            {header.observations ? (
              <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
                {header.observations}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {header.status}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {header.payStatus}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={formatCurrency(header.totalCosts)} />
          <Stat
            label="Received"
            value={formatCurrency(header.receivedValueOfClient)}
          />
          <Stat
            label="Balance applied"
            value={formatCurrency(header.balanceApplied)}
          />
          <Stat
            label="Outstanding"
            value={formatCurrency(outstanding)}
            highlight={outstanding > 0}
          />
        </dl>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Products</h2>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add product
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total cost</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    No products yet. Add the first one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      {p.categoryName ? (
                        <div className="text-xs text-zinc-500">
                          {p.categoryName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{p.shopName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {p.amountRequested}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrency(p.shopCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(p)}
                          aria-label={`Edit ${p.name}`}
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.name}`}
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {products.length > 0 ? (
              <tfoot>
                <tr className="border-t border-zinc-200 font-medium dark:border-zinc-800">
                  <td colSpan={5} className="px-4 py-3 text-right text-zinc-500">
                    Order total
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(header.totalCosts)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      <ProductDialog
        open={createOpen}
        mode="create"
        orderId={orderId}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Product added');
          router.refresh();
        }}
      />

      <ProductDialog
        open={editTarget !== null}
        mode="edit"
        orderId={orderId}
        product={editTarget ?? undefined}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Product updated');
          router.refresh();
        }}
      />

      <ProductDeleteDialog
        orderId={orderId}
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Product deleted');
          router.refresh();
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={`text-lg font-semibold tabular-nums ${
          highlight ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
