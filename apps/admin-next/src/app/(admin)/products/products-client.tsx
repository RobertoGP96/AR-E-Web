'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package2,
  PackageSearch,
  ExternalLink,
  Columns3,
  ChevronDown,
  ClipboardList,
  ShoppingBag,
  PackageCheck,
  Truck,
  DollarSign,
} from 'lucide-react';
import { Button, Checkbox, Label, Popover, Tooltip } from '@heroui/react';
import { formatCurrency } from '@/lib/format';
import { ProductStatusBadge } from '@/components/status-badges';
import { QRLink } from '@/components/qr-link';
import { FilterPopover } from '@/components/filter-popover';
import {
  PageHeader,
  SearchInput,
  Field,
  Select,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';

const PRODUCT_STATUSES = [
  'Encargado',
  'Comprado',
  'Recibido',
  'Entregado',
] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  shopName: string;
  orderId: string;
  clientName: string;
  status: ProductStatus;
  amountRequested: number;
  amountPurchased: number;
  amountReceived: number;
  amountDelivered: number;
  totalCost: number;
  link: string | null;
}

interface SelectOption {
  id: string;
  label: string;
}

interface ProductsClientProps {
  initialRows: ProductRow[];
  shopOptions: SelectOption[];
  initialFilters: {
    q: string;
    status: ProductStatus | null;
    shop: string | null;
  };
}

// Toggleable columns, like the Vite admin's ProductsColumnsSelector.
const COLUMNS = [
  { key: 'client', label: 'Cliente' },
  { key: 'shop', label: 'Tienda' },
  { key: 'status', label: 'Estado' },
  { key: 'amounts', label: 'Cantidades' },
  { key: 'cost', label: 'Costo total' },
  { key: 'order', label: 'Orden' },
] as const;
type ColumnKey = (typeof COLUMNS)[number]['key'];

const DEFAULT_VISIBLE: ColumnKey[] = [
  'client',
  'shop',
  'status',
  'amounts',
  'cost',
  'order',
];
const STORAGE_KEY = 'admin-next:products:columns';

/** Column visibility selector (persisted preference), as a HeroUI popover. */
function ColumnsSelector({
  visible,
  onChange,
}: {
  visible: Set<ColumnKey>;
  onChange: (next: Set<ColumnKey>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" aria-label="Seleccionar columnas visibles">
        <Columns3 className="h-4 w-4" aria-hidden />
        Columnas
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Popover.Content
        placement="bottom end"
        className="w-[min(260px,calc(100vw-2rem))]"
      >
        <Popover.Dialog className="p-4">
          <Popover.Heading className="text-sm font-semibold text-foreground">
            Columnas visibles
          </Popover.Heading>
          <p className="mt-0.5 text-xs text-muted">
            Elige qué columnas mostrar en la tabla
          </p>
          <ul className="mt-3 space-y-2">
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <Checkbox
                  isSelected={visible.has(col.key)}
                  onChange={(checked) => {
                    const next = new Set(visible);
                    if (checked) next.add(col.key);
                    else next.delete(col.key);
                    onChange(next);
                  }}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label className="text-sm text-foreground">
                      {col.label}
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between gap-2 border-t border-separator pt-3">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onChange(new Set(DEFAULT_VISIBLE))}
            >
              Por defecto
            </Button>
            <Button variant="primary" size="sm" onPress={() => setOpen(false)}>
              Listo
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/** Mini progress bar + "x/y" figure for one pipeline stage. */
function AmountBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-default">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="tabular-nums">
        {value}/{total}
      </span>
    </span>
  );
}

/**
 * Compact per-stage progress for the table cell: three mini-bars
 * (Comprado / Recibido / Entregado) over the requested amount.
 */
function AmountsProgress({ row }: { row: ProductRow }) {
  const stages = [
    { short: 'C', label: 'Comprado', value: row.amountPurchased },
    { short: 'R', label: 'Recibido', value: row.amountReceived },
    { short: 'E', label: 'Entregado', value: row.amountDelivered },
  ];
  return (
    <div className="flex items-center justify-end gap-3">
      {stages.map((stage) => {
        const pct =
          row.amountRequested > 0
            ? Math.min(
                100,
                Math.round((stage.value / row.amountRequested) * 100)
              )
            : 0;
        return (
          <div
            key={stage.short}
            className="w-14"
            title={`${stage.label}: ${stage.value} de ${row.amountRequested} pedidos`}
          >
            <div className="flex items-center justify-between text-[10px] leading-4">
              <span className="font-medium text-muted">{stage.short}</span>
              <span className="tabular-nums text-foreground">
                {stage.value}/{row.amountRequested}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-default">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductsClient({
  initialRows,
  shopOptions,
  initialFilters,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState<Set<ColumnKey>>(
    () => new Set(DEFAULT_VISIBLE)
  );

  // Restore/persist the column selection (client-only preference).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const keys = COLUMNS.map((c) => c.key) as string[];
          const next = new Set(
            parsed.filter((k): k is ColumnKey => keys.includes(String(k)))
          );
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setVisible(next);
        }
      }
    } catch {
      // corrupted preference — keep defaults
    }
  }, []);

  function updateColumns(next: Set<ColumnKey>) {
    setVisible(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // storage unavailable — selection just won't persist
    }
  }

  const show = (key: ColumnKey) => visible.has(key);
  const colCount = 1 + COLUMNS.filter((c) => visible.has(c.key)).length;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/products?${params.toString()}`);
    });
  }

  const activeShopLabel = initialFilters.shop
    ? (shopOptions.find((s) => s.id === initialFilters.shop)?.label ??
      initialFilters.shop)
    : null;

  const rowActions = (row: ProductRow) => (
    <>
      <QRLink url={row.link} name={row.name} />
      {row.link ? (
        <Tooltip delay={500}>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Abrir enlace del producto"
            onPress={() =>
              window.open(row.link ?? undefined, '_blank', 'noopener,noreferrer')
            }
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
          <Tooltip.Content>Abrir enlace</Tooltip.Content>
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Package2}
        title="Productos"
        subtitle="Catálogo global de productos del sistema"
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialFilters.q}
          placeholder="Buscar por nombre, SKU o cliente…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de productos"
          subtitle="Filtra productos por estado y tienda"
          activeFilters={[
            ...(initialFilters.status
              ? [
                  {
                    key: 'status',
                    label: initialFilters.status,
                    onRemove: () => setParam('status', null),
                  },
                ]
              : []),
            ...(activeShopLabel
              ? [
                  {
                    key: 'shop',
                    label: activeShopLabel,
                    onRemove: () => setParam('shop', null),
                  },
                ]
              : []),
          ]}
          onClear={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('status');
            params.delete('shop');
            params.delete('page');
            startTransition(() => {
              router.replace(`/products?${params.toString()}`);
            });
          }}
        >
          <Field label="Estado">
            <Select
              value={initialFilters.status ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos los estados</option>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tienda">
            <Select
              value={initialFilters.shop ?? ''}
              onChange={(e) => setParam('shop', e.target.value || null)}
            >
              <option value="">Todas las tiendas</option>
              {shopOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </FilterPopover>
        <div className="hidden md:block">
          <ColumnsSelector visible={visible} onChange={updateColumns} />
        </div>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                {show('client') ? <th>Cliente</th> : null}
                {show('shop') ? <th>Tienda</th> : null}
                {show('status') ? <th>Estado</th> : null}
                {show('amounts') ? (
                  <th className="text-right">Cantidades</th>
                ) : null}
                {show('cost') ? <th className="text-right">Costo</th> : null}
                {show('order') ? <th className="text-right">Orden</th> : null}
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={colCount}
                  icon={PackageSearch}
                  message={isPending ? 'Cargando…' : 'No hay productos.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td className="max-w-[260px]">
                      <div className="flex items-center gap-1">
                        <span className="truncate font-medium capitalize text-foreground">
                          {row.name}
                        </span>
                        <QRLink url={row.link} name={row.name} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        {row.sku ? (
                          <span className="truncate">{row.sku}</span>
                        ) : null}
                        {row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-0.5 transition-colors hover:text-accent"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            enlace
                          </a>
                        ) : null}
                      </div>
                    </td>
                    {show('client') ? (
                      <td className="text-muted">{row.clientName}</td>
                    ) : null}
                    {show('shop') ? (
                      <td className="text-muted">{row.shopName}</td>
                    ) : null}
                    {show('status') ? (
                      <td>
                        <ProductStatusBadge status={row.status} />
                      </td>
                    ) : null}
                    {show('amounts') ? (
                      <td>
                        <AmountsProgress row={row} />
                      </td>
                    ) : null}
                    {show('cost') ? (
                      <td className="text-right font-semibold tabular-nums">
                        {formatCurrency(row.totalCost)}
                      </td>
                    ) : null}
                    {show('order') ? (
                      <td className="text-right">
                        <Link
                          href={`/orders/${row.orderId}`}
                          className="font-medium text-foreground transition-colors hover:text-accent"
                        >
                          #{row.orderId}
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          initialRows.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              {isPending ? 'Cargando…' : 'No hay productos.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={<span className="capitalize">{row.name}</span>}
                subtitle={
                  row.sku
                    ? `${row.clientName} · ${row.shopName} · ${row.sku}`
                    : `${row.clientName} · ${row.shopName}`
                }
                badges={<ProductStatusBadge status={row.status} />}
                rows={[
                  {
                    icon: ClipboardList,
                    label: 'Pedido',
                    value: row.amountRequested,
                  },
                  {
                    icon: ShoppingBag,
                    label: 'Comprado',
                    value: (
                      <AmountBar
                        value={row.amountPurchased}
                        total={row.amountRequested}
                      />
                    ),
                  },
                  {
                    icon: PackageCheck,
                    label: 'Recibido',
                    value: (
                      <AmountBar
                        value={row.amountReceived}
                        total={row.amountRequested}
                      />
                    ),
                  },
                  {
                    icon: Truck,
                    label: 'Entregado',
                    value: (
                      <AmountBar
                        value={row.amountDelivered}
                        total={row.amountRequested}
                      />
                    ),
                  },
                  {
                    icon: DollarSign,
                    label: 'Costo',
                    value: (
                      <span className="font-semibold">
                        {formatCurrency(row.totalCost)}
                      </span>
                    ),
                  },
                ]}
                actions={rowActions(row)}
                onClick={() => router.push(`/orders/${row.orderId}`)}
              />
            ))
          )
        }
      />
    </div>
  );
}
