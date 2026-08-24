'use client';

import { useState } from 'react';
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

// Series colors ported verbatim from the Vite Analytics chart config.
const SERIES = [
  { key: 'revenue', label: 'Ingresos', color: 'hsl(33 100% 50%)' },
  {
    key: 'system_profit',
    label: 'Ganancia Sistema',
    color: 'hsl(25 95% 53%)',
  },
  {
    key: 'agent_profits',
    label: 'Ganancia Agentes',
    color: 'hsl(39 100% 57%)',
  },
  {
    key: 'product_expenses',
    label: 'Gastos Productos',
    color: 'hsl(16 90% 48%)',
  },
  {
    key: 'delivery_expenses',
    label: 'Gastos Entrega',
    color: 'hsl(27 87% 67%)',
  },
] as const;

// All-orange cycle from the Vite DashboardCharts palette.
const PIE_COLORS = [
  'hsl(25, 88%, 55%)',
  'hsl(36, 100%, 50%)',
  'hsl(24, 94%, 50%)',
  'hsl(20, 85%, 45%)',
  'hsl(28, 95%, 48%)',
  'hsl(16, 100%, 50%)',
  'hsl(39, 100%, 50%)',
  'hsl(22, 90%, 52%)',
];

const RANGES = [
  { value: '12m', label: 'Últimos 12 meses', slice: 12 },
  { value: '6m', label: 'Últimos 6 meses', slice: 6 },
  { value: '3m', label: 'Últimos 3 meses', slice: 3 },
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
      className={`rounded-xl border-2 border-border bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg ${className ?? ''}`}
    >
      <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
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
        title="Vista General de Reportes Financieros"
        subtitle="Evolución completa de ingresos, costos y ganancias"
        action={
          <select
            value={range}
            aria-label="Seleccionar período"
            onChange={(e) =>
              setRange(e.target.value as (typeof RANGES)[number]['value'])
            }
            className="w-[160px] rounded-lg border border-input bg-white px-3 py-1.5 text-sm"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month_short"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(v: number) => formatUSD(v)}
              />
              <Tooltip
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top tiendas por costo de productos">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="cost"
                  name="Costo"
                  fill="hsl(25 95% 53%)"
                  radius={4}
                />
                <Bar
                  dataKey="products"
                  name="Productos"
                  fill="hsl(39 100% 57%)"
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
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
