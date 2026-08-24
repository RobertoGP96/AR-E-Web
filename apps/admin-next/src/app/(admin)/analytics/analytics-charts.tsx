'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MonthlyRow {
  month: string;
  month_short: string;
  revenue: number;
  system_profit: number;
  agent_profits: number;
  product_expenses: number;
  delivery_expenses: number;
}

interface NamedValue {
  name: string;
  value: number;
}

interface ShopRow {
  name: string;
  products: number;
  cost: number;
}

// Series colors come from the theme's chart scale (globals.css).
const SERIES = [
  { key: 'revenue', label: 'Ingresos', color: 'var(--chart-1)' },
  { key: 'system_profit', label: 'Ganancia Sistema', color: 'var(--chart-2)' },
  { key: 'agent_profits', label: 'Ganancia Agentes', color: 'var(--chart-3)' },
  {
    key: 'product_expenses',
    label: 'Gastos Productos',
    color: 'var(--chart-4)',
  },
  {
    key: 'delivery_expenses',
    label: 'Gastos Entrega',
    color: 'var(--chart-5)',
  },
] as const;

// Categorical cycle for the pies — the same theme scale, in order.
const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

// Shared Recharts tooltip surface, aligned with the overlay tokens.
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--overlay)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--foreground)',
} as const;

const AXIS_TICK = { fill: 'var(--muted)', fontSize: 12 } as const;

const RANGES = [
  { value: '12m', label: '12 meses', slice: 12 },
  { value: '6m', label: '6 meses', slice: 6 },
  { value: '3m', label: '3 meses', slice: 3 },
] as const;

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`surface-card transition-shadow duration-300 hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex flex-col gap-2 border-b border-separator px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="px-2 pb-4 pt-4 sm:px-4">{children}</div>
    </div>
  );
}

export function AnalyticsCharts({
  monthly,
  statusData,
  shopData,
  expenseData,
}: {
  monthly: MonthlyRow[];
  statusData: NamedValue[];
  shopData: ShopRow[];
  expenseData: NamedValue[];
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('12m');
  const slice = RANGES.find((r) => r.value === range)?.slice ?? 12;
  const data = monthly.slice(-slice);

  return (
    <div className="space-y-6">
      <Card
        className="animate-in fade-in slide-in-from-bottom-2 duration-500"
        title="Vista General de Reportes Financieros"
        subtitle="Evolución completa de ingresos, costos y ganancias"
        action={
          <div
            role="group"
            aria-label="Seleccionar período"
            className="flex items-center gap-1.5"
          >
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? 'primary' : 'outline'}
                aria-pressed={range === r.value}
                onPress={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        }
      >
        <div className="h-[250px] w-full md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <defs>
                {SERIES.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`fill-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--separator)"
              />
              <XAxis
                dataKey="month_short"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={AXIS_TICK}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={AXIS_TICK}
                tickFormatter={(v: number) => formatUSD(v)}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(v) => `Mes: ${v}`}
                formatter={(value: number | string, name: string) => [
                  formatUSD(Number(value)),
                  SERIES.find((s) => s.key === name)?.label ?? name,
                ]}
              />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                />
              ))}
              <Legend
                formatter={(value: string) =>
                  SERIES.find((s) => s.key === value)?.label ?? value
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="stagger-children grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Órdenes por estado">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  stroke="var(--surface)"
                  strokeWidth={5}
                  paddingAngle={2}
                  label
                >
                  {statusData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top tiendas por costo de productos">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--separator)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="cost"
                  name="Costo"
                  fill="var(--chart-1)"
                  radius={4}
                />
                <Bar
                  dataKey="products"
                  name="Productos"
                  fill="var(--chart-4)"
                  radius={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Gastos por categoría">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  stroke="var(--surface)"
                  strokeWidth={5}
                  paddingAngle={2}
                  label
                >
                  {expenseData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
