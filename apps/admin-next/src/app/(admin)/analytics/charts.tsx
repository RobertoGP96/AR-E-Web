'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ---------------------------------------------------------------------------
// Formato compartido de la vista de análisis
// ---------------------------------------------------------------------------

export function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Cifra compacta para ejes y etiquetas directas: $12.4k. */
export function fmtMoneyCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) {
    return `${n < 0 ? '-' : ''}$${(abs / 1000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}k`;
  }
  return `${n < 0 ? '-' : ''}$${abs.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function fmtLbs(n: number): string {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })} lb`;
}

// ---------------------------------------------------------------------------
// Piezas comunes: leyenda propia y tooltip temado
// ---------------------------------------------------------------------------

export interface LegendItem {
  label: string;
  color: string;
  shape?: 'rect' | 'line';
}

/** Leyenda propia (texto en tokens de texto, la marca lleva el color). */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-xs text-muted">
          {it.shape === 'line' ? (
            <span
              className="h-0.5 w-3.5 rounded-full"
              style={{ backgroundColor: it.color }}
              aria-hidden
            />
          ) : (
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: it.color }}
              aria-hidden
            />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

export interface TipSeries {
  label: string;
  color: string;
  fmt: (n: number) => string;
}

interface TipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown> & { fill?: string };
}

/**
 * Tooltip compartido de Recharts: el valor manda (semibold), la serie
 * acompaña en tono apagado con una llave de color fina.
 */
export function ChartTip({
  active,
  payload,
  label,
  series,
  extra,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  /** dataKey (o name en pies) → presentación de la serie. */
  series: Record<string, TipSeries>;
  /** Línea adicional bajo las series (p. ej. conteo de entregas). */
  extra?: (row: Record<string, unknown>) => ReactNode;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload ?? {};
  return (
    <div className="rounded-xl border border-separator bg-overlay px-3 py-2 shadow-lg">
      {label != null && label !== '' ? (
        <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const key = String(entry.dataKey ?? entry.name ?? i);
          const s = series[key] ?? series[String(entry.name ?? '')];
          const color =
            s?.color ?? entry.color ?? entry.payload?.fill ?? 'var(--muted)';
          const value = typeof entry.value === 'number' ? entry.value : 0;
          return (
            <p key={key} className="flex items-center gap-2 text-sm">
              <span
                className="h-3.5 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="font-semibold text-foreground">
                {s ? s.fmt(value) : fmtInt(value)}
              </span>
              <span className="text-xs text-muted">
                {s?.label ?? String(entry.name ?? key)}
              </span>
            </p>
          );
        })}
      </div>
      {extra ? (
        <div className="mt-1 border-t border-separator pt-1 text-xs text-muted">
          {extra(row)}
        </div>
      ) : null}
    </div>
  );
}

const AXIS_TICK = { fill: 'var(--muted)', fontSize: 11 } as const;
const CURSOR = { fill: 'var(--separator)', opacity: 0.35 } as const;

// ---------------------------------------------------------------------------
// Resultado financiero: barras ingresos/egresos + línea de ganancia
// ---------------------------------------------------------------------------

export interface TrendRow {
  label: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
}

const TREND_SERIES: Record<string, TipSeries> = {
  ingresos: { label: 'Ingresos', color: 'var(--chart-1)', fmt: fmtMoney },
  egresos: { label: 'Egresos', color: 'var(--chart-2)', fmt: fmtMoney },
  ganancia: {
    label: 'Ganancia del sistema',
    color: 'var(--foreground)',
    fmt: fmtMoney,
  },
};

export function FinancialTrend({ data }: { data: TrendRow[] }) {
  return (
    <div className="space-y-3">
      <ChartLegend
        items={[
          { label: 'Ingresos', color: 'var(--chart-1)' },
          { label: 'Egresos', color: 'var(--chart-2)' },
          { label: 'Ganancia del sistema', color: 'var(--foreground)', shape: 'line' },
        ]}
      />
      <div className="h-[280px] w-full md:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--separator)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={AXIS_TICK}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={AXIS_TICK}
              tickFormatter={fmtMoneyCompact}
              width={54}
            />
            <Tooltip
              cursor={CURSOR}
              content={<ChartTip series={TREND_SERIES} />}
            />
            <Bar
              dataKey="ingresos"
              fill="var(--chart-1)"
              maxBarSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="egresos"
              fill="var(--chart-2)"
              maxBarSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Line
              dataKey="ganancia"
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{
                r: 4,
                fill: 'var(--foreground)',
                stroke: 'var(--surface)',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composición de egresos: barras apiladas por mes
// ---------------------------------------------------------------------------

export interface ExpenseStackRow {
  label: string;
  compras: number;
  gastos: number;
  envio: number;
  agentes: number;
}

const STACK_SERIES: Record<string, TipSeries> = {
  compras: { label: 'Compras', color: 'var(--chart-2)', fmt: fmtMoney },
  gastos: { label: 'Gastos operativos', color: 'var(--chart-3)', fmt: fmtMoney },
  envio: { label: 'Costo de envío', color: 'var(--chart-4)', fmt: fmtMoney },
  agentes: { label: 'Ganancia de agentes', color: 'var(--chart-5)', fmt: fmtMoney },
};

export function ExpenseStack({ data }: { data: ExpenseStackRow[] }) {
  const keys = ['compras', 'gastos', 'envio', 'agentes'] as const;
  const totals = keys.map((k) => ({
    key: k,
    total: data.reduce((sum, row) => sum + row[k], 0),
  }));
  return (
    <div className="space-y-3">
      <ChartLegend
        items={keys.map((k) => ({
          label: STACK_SERIES[k].label,
          color: STACK_SERIES[k].color,
        }))}
      />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--separator)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={AXIS_TICK}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={AXIS_TICK}
              tickFormatter={fmtMoneyCompact}
              width={54}
            />
            <Tooltip
              cursor={CURSOR}
              content={<ChartTip series={STACK_SERIES} />}
            />
            {keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="egresos"
                fill={STACK_SERIES[k].color}
                stroke="var(--surface)"
                strokeWidth={2}
                maxBarSize={22}
                radius={i === keys.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Totales del período visibles (los tooltips solo complementan). */}
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-separator pt-2.5">
        {totals.map(({ key, total }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: STACK_SERIES[key].color }}
              aria-hidden
            />
            <dt className="text-muted">{STACK_SERIES[key].label}</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {fmtMoney(Math.round(total * 100) / 100)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peso entregado por mes (serie única, sin leyenda)
// ---------------------------------------------------------------------------

export interface WeightRow {
  label: string;
  peso: number;
  entregas: number;
}

const WEIGHT_SERIES: Record<string, TipSeries> = {
  peso: { label: 'Libras entregadas', color: 'var(--chart-1)', fmt: fmtLbs },
};

export function WeightTrend({ data }: { data: WeightRow[] }) {
  const maxIdx = data.reduce(
    (best, row, i) => (row.peso > (data[best]?.peso ?? 0) ? i : best),
    0
  );
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 18, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--separator)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={AXIS_TICK}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tick={AXIS_TICK}
            width={44}
          />
          <Tooltip
            cursor={CURSOR}
            content={
              <ChartTip
                series={WEIGHT_SERIES}
                extra={(row) => `${fmtInt(Number(row.entregas ?? 0))} entregas`}
              />
            }
          />
          <Bar
            dataKey="peso"
            fill="var(--chart-1)"
            maxBarSize={22}
            radius={[4, 4, 0, 0]}
          >
            {/* Etiqueta directa selectiva: solo el mes pico. */}
            <LabelList
              dataKey="peso"
              content={(props) => {
                const { x, y, width, index, value } = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  index?: number;
                  value?: number;
                };
                if (
                  index !== maxIdx ||
                  x == null ||
                  y == null ||
                  width == null ||
                  !value
                ) {
                  return null;
                }
                return (
                  <text
                    x={x + width / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {fmtLbs(value)}
                  </text>
                );
              }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dona + lista lateral (identidad nunca solo por color)
// ---------------------------------------------------------------------------

export interface DonutItem {
  name: string;
  value: number;
  color: string;
}

export function DonutList({
  items,
  centerLabel,
  fmt = fmtInt,
  emptyMessage,
}: {
  items: DonutItem[];
  centerLabel: string;
  fmt?: (n: number) => string;
  emptyMessage: string;
}) {
  const total = items.reduce((sum, it) => sum + it.value, 0);
  if (total <= 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }
  const series = Object.fromEntries(
    items.map((it) => [it.name, { label: it.name, color: it.color, fmt }])
  );
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="relative h-44 w-44 shrink-0">
        <PieChart width={176} height={176}>
          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={2}
            cornerRadius={4}
            stroke="var(--surface)"
            strokeWidth={2}
          >
            {items.map((it) => (
              <Cell key={it.name} fill={it.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip series={series} />} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-foreground">{fmt(total)}</p>
          <p className="text-[11px] text-muted">{centerLabel}</p>
        </div>
      </div>
      <ul className="w-full min-w-0 max-w-64 space-y-1.5">
        {items.map((it) => {
          const pct = (it.value / total) * 100;
          return (
            <li key={it.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: it.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-muted">
                {it.name}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {fmt(it.value)}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estado de pago: barra 100% apilada con tokens de estado + filas
// ---------------------------------------------------------------------------

export interface StatusBarItem {
  label: string;
  count: number;
  color: string;
  icon: LucideIcon;
}

export function StatusShareBar({
  items,
  emptyMessage,
}: {
  items: StatusBarItem[];
  emptyMessage: string;
}) {
  const total = items.reduce((sum, it) => sum + it.count, 0);
  if (total <= 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }
  return (
    <div className="space-y-4">
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        role="presentation"
      >
        {items
          .filter((it) => it.count > 0)
          .map((it) => (
            <span
              key={it.label}
              className="h-full min-w-1 rounded-sm first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(it.count / total) * 100}%`,
                backgroundColor: it.color,
              }}
              aria-hidden
            />
          ))}
      </div>
      <ul className="space-y-2">
        {items.map((it) => {
          const Icon = it.icon;
          const pct = (it.count / total) * 100;
          return (
            <li key={it.label} className="flex items-center gap-2 text-sm">
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: it.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-muted">
                {it.label}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {fmtInt(it.count)}
              </span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras horizontales de magnitud (una sola serie, categorías nominales)
// ---------------------------------------------------------------------------

export function CategoryBars({
  items,
  fmt = fmtMoney,
  emptyMessage,
}: {
  items: { name: string; value: number }[];
  fmt?: (n: number) => string;
  emptyMessage: string;
}) {
  const total = items.reduce((sum, it) => sum + it.value, 0);
  const max = items.reduce((m, it) => Math.max(m, it.value), 0);
  if (total <= 0 || max <= 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const share = (it.value / total) * 100;
        return (
          <li key={it.name}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {it.name}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {fmt(it.value)}
                <span className="ml-1.5 text-xs font-normal text-muted">
                  {share.toFixed(0)}%
                </span>
              </p>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default"
              role="presentation"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (it.value / max) * 100)}%`,
                  backgroundColor: 'var(--chart-1)',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Funnel del flujo de productos (rampa ordinal naranja)
// ---------------------------------------------------------------------------

export function PipelineFunnel({
  steps,
  emptyMessage,
}: {
  steps: { label: string; value: number }[];
  emptyMessage: string;
}) {
  const base = steps[0]?.value ?? 0;
  if (base <= 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }
  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv =
          prev != null ? (prev > 0 ? (step.value / prev) * 100 : 0) : null;
        return (
          <li
            key={step.label}
            className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[6.5rem_1fr]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {step.label}
              </p>
              {conv != null ? (
                <p className="text-[11px] tabular-nums text-muted">
                  {conv.toFixed(0)}% del paso previo
                </p>
              ) : (
                <p className="text-[11px] text-muted">unidades pedidas</p>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="h-6 shrink-0 rounded-r-md"
                style={{
                  width: `${Math.max(2, (step.value / base) * 100 * 0.82)}%`,
                  backgroundColor: `var(--chart-ord-${i + 1})`,
                }}
                aria-hidden
              />
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {fmtInt(step.value)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
