'use client';

import { useMemo, useState } from 'react';
import { Button, Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import {
  ChartColumn,
  CircleAlert,
  CircleCheck,
  CircleDot,
  CircleHelp,
  ClipboardList,
  CreditCard,
  DollarSign,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  Store,
  Table2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Weight,
} from 'lucide-react';
import { ChartCard, KpiCard } from '@/components/ui';
import { ShopAvatar } from '@/components/shop-avatar';
import {
  CategoryBars,
  DonutList,
  ExpenseStack,
  FinancialTrend,
  PipelineFunnel,
  StatusShareBar,
  WeightTrend,
  fmtInt,
  fmtLbs,
  fmtMoney,
  type StatusBarItem,
} from './charts';
import { RankList } from './rankings';
import type { AnalyticsData, MonthBucket, SliceRow } from './types';

const round2 = (n: number): number => Math.round(n * 100) / 100;

const RANGES = [
  { id: '3m', label: '3 meses', n: 3 },
  { id: '6m', label: '6 meses', n: 6 },
  { id: '12m', label: '12 meses', n: 12 },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

// Asignación fija estado → color (nunca por posición, para que el
// filtro de rango no repinte los estados que sobreviven).
const ORDER_STATUS_META: { key: string; color: string }[] = [
  { key: 'Encargado', color: 'var(--chart-3)' },
  { key: 'Procesando', color: 'var(--chart-1)' },
  { key: 'Completado', color: 'var(--chart-5)' },
  { key: 'Cancelado', color: 'var(--chart-4)' },
];

// Estado de pago = semántica buena/mala real → tokens de estado.
const PAY_STATUS_META = [
  { key: 'Pagado', color: 'var(--success)', icon: CircleCheck },
  { key: 'Parcial', color: 'var(--warning)', icon: CircleDot },
  { key: 'No pagado', color: 'var(--danger)', icon: CircleAlert },
] as const;

const egresosOf = (b: MonthBucket): number =>
  b.compras + b.gastos + b.envio + b.gananciaAgentes;
const gananciaOf = (b: MonthBucket): number => b.ingresos - egresosOf(b);

function deltaPct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

/** Suma filas nominales del rango visible: clave → {value, count}. */
function sumSlices(
  rows: SliceRow[],
  minM: number
): Map<string, { value: number; count: number }> {
  const out = new Map<string, { value: number; count: number }>();
  for (const r of rows) {
    if (r.m < minM) continue;
    const acc = out.get(r.key) ?? { value: 0, count: 0 };
    acc.value += r.value;
    acc.count += r.count ?? 0;
    out.set(r.key, acc);
  }
  return out;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-accent pl-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
        {label}
      </h3>
    </div>
  );
}

function BalanceChip({ balance }: { balance: number }) {
  if (balance === 0) return null;
  const debt = balance < 0;
  return (
    <Chip
      color={debt ? 'danger' : 'success'}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
    >
      <Chip.Label>
        {debt ? `Debe ${fmtMoney(Math.abs(balance))}` : `A favor ${fmtMoney(balance)}`}
      </Chip.Label>
    </Chip>
  );
}

/**
 * Vista de análisis: KPIs del mes, filtro de período que gobierna
 * todos los gráficos de abajo, resultado financiero con vista de
 * tabla, composición de egresos, estados, funnel y rankings.
 */
export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const [range, setRange] = useState<RangeId>('12m');
  const [mainView, setMainView] = useState<'chart' | 'table'>('chart');
  const n = RANGES.find((r) => r.id === range)?.n ?? 12;
  const minM = data.months.length - n;

  // KPIs: mes en curso vs mes anterior (independientes del rango).
  const kpis = useMemo(() => {
    const m = data.months;
    const last = m[m.length - 1];
    const prev = m[m.length - 2];
    const ganancia = gananciaOf(last);
    const margen = last.ingresos > 0 ? (ganancia / last.ingresos) * 100 : null;
    return {
      ingresos: last.ingresos,
      dIngresos: prev ? deltaPct(last.ingresos, prev.ingresos) : null,
      sIngresos: m.map((b) => b.ingresos),
      ganancia,
      dGanancia: prev ? deltaPct(ganancia, gananciaOf(prev)) : null,
      sGanancia: m.map(gananciaOf),
      margen,
      egresos: egresosOf(last),
      dEgresos: prev ? deltaPct(egresosOf(last), egresosOf(prev)) : null,
      sEgresos: m.map(egresosOf),
      peso: last.peso,
      dPeso: prev ? deltaPct(last.peso, prev.peso) : null,
      sPeso: m.map((b) => b.peso),
      ordenes: last.ordenes,
      dOrdenes: prev ? deltaPct(last.ordenes, prev.ordenes) : null,
      sOrdenes: m.map((b) => b.ordenes),
      clientesNuevos: last.clientesNuevos,
    };
  }, [data.months]);

  const view = useMemo(() => {
    const visible = data.months.slice(minM);

    const trend = visible.map((b) => ({
      label: b.label,
      ingresos: b.ingresos,
      egresos: round2(egresosOf(b)),
      ganancia: round2(gananciaOf(b)),
    }));

    const stack = visible.map((b) => ({
      label: b.label,
      compras: b.compras,
      gastos: b.gastos,
      envio: b.envio,
      agentes: b.gananciaAgentes,
    }));

    const weight = visible.map((b) => ({
      label: b.label,
      peso: b.peso,
      entregas: b.entregas,
    }));

    // Órdenes por estado: orden y color fijos; desconocidos al final.
    const statusMap = sumSlices(data.statusRows, minM);
    const statusItems = ORDER_STATUS_META.filter((s) =>
      statusMap.has(s.key)
    ).map((s) => ({
      name: s.key,
      value: statusMap.get(s.key)!.value,
      color: s.color,
    }));
    for (const key of [...statusMap.keys()].sort()) {
      if (!ORDER_STATUS_META.some((s) => s.key === key)) {
        statusItems.push({
          name: key,
          value: statusMap.get(key)!.value,
          color: 'var(--chart-2)',
        });
      }
    }

    const payMap = sumSlices(data.payRows, minM);
    const payItems: StatusBarItem[] = PAY_STATUS_META.map((s) => ({
      label: s.key,
      count: payMap.get(s.key)?.value ?? 0,
      color: s.color,
      icon: s.icon,
    }));
    for (const key of [...payMap.keys()].sort()) {
      if (!PAY_STATUS_META.some((s) => s.key === key)) {
        payItems.push({
          label: key,
          count: payMap.get(key)!.value,
          color: 'var(--muted)',
          icon: CircleHelp,
        });
      }
    }

    // Gastos por categoría: top 6 y cola plegada en "Otros".
    const catSorted = [...sumSlices(data.catRows, minM).entries()]
      .map(([name, v]) => ({ name, value: round2(v.value) }))
      .sort((a, b) => b.value - a.value);
    const catItems = catSorted.slice(0, 6);
    const rest = catSorted.slice(6).reduce((sum, c) => sum + c.value, 0);
    if (rest > 0) catItems.push({ name: 'Otros', value: round2(rest) });

    const shopItems = [...sumSlices(data.shopRows, minM).entries()]
      .map(([name, v]) => ({ name, value: round2(v.value), count: v.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const clientAcc = new Map<
      string,
      { name: string; ingresos: number; ordenes: number; entregas: number }
    >();
    for (const r of data.clientRows) {
      if (r.m < minM) continue;
      const acc = clientAcc.get(r.id);
      if (acc) {
        acc.ingresos += r.ingresos;
        acc.ordenes += r.ordenes;
        acc.entregas += r.entregas;
      } else {
        clientAcc.set(r.id, {
          name: r.name,
          ingresos: r.ingresos,
          ordenes: r.ordenes,
          entregas: r.entregas,
        });
      }
    }
    const clientItems = [...clientAcc.entries()]
      .map(([id, c]) => ({ id, ...c, ingresos: round2(c.ingresos) }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 8);

    const agentAcc = new Map<
      string,
      { name: string; ganancia: number; entregas: number; peso: number }
    >();
    for (const r of data.agentRows) {
      if (r.m < minM) continue;
      const acc = agentAcc.get(r.id);
      if (acc) {
        acc.ganancia += r.ganancia;
        acc.entregas += r.entregas;
        acc.peso += r.peso;
      } else {
        agentAcc.set(r.id, {
          name: r.name,
          ganancia: r.ganancia,
          entregas: r.entregas,
          peso: r.peso,
        });
      }
    }
    const agentItems = [...agentAcc.entries()]
      .map(([id, a]) => ({
        id,
        ...a,
        ganancia: round2(a.ganancia),
        peso: round2(a.peso),
      }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 8);

    const pipeline = visible.reduce(
      (acc, b) => {
        acc.encargado += b.encargado;
        acc.comprado += b.comprado;
        acc.recibido += b.recibido;
        acc.entregado += b.entregado;
        return acc;
      },
      { encargado: 0, comprado: 0, recibido: 0, entregado: 0 }
    );

    const totals = trend.reduce(
      (acc, r) => {
        acc.ingresos += r.ingresos;
        acc.egresos += r.egresos;
        acc.ganancia += r.ganancia;
        return acc;
      },
      { ingresos: 0, egresos: 0, ganancia: 0 }
    );

    return {
      visible,
      trend,
      stack,
      weight,
      statusItems,
      payItems,
      catItems,
      shopItems,
      clientItems,
      agentItems,
      pipeline,
      totals,
    };
  }, [data, minM]);

  const rangeCaption =
    view.visible.length > 0
      ? `${view.visible[0].label} — ${view.visible[view.visible.length - 1].label}`
      : '';
  const porCobrar = round2(
    data.current.porCobrarOrdenes + data.current.porCobrarEntregas
  );

  return (
    <div className="animate-in space-y-6 fade-in duration-500">
      {/* KPIs del mes en curso */}
      <div className="space-y-3">
        <SectionLabel label="Mes en curso" />
        <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            icon={DollarSign}
            label="Ingresos"
            value={fmtMoney(kpis.ingresos)}
            delta={{ pct: kpis.dIngresos, label: 'vs mes anterior' }}
            spark={kpis.sIngresos}
            tone="accent"
          />
          <KpiCard
            icon={TrendingUp}
            label="Ganancia del sistema"
            value={fmtMoney(kpis.ganancia)}
            delta={{ pct: kpis.dGanancia, label: 'vs mes anterior' }}
            spark={kpis.sGanancia}
            hint={
              kpis.margen != null
                ? `Margen ${kpis.margen.toFixed(1)}%`
                : undefined
            }
            tone={kpis.ganancia >= 0 ? 'success' : 'danger'}
          />
          <KpiCard
            icon={TrendingDown}
            label="Egresos"
            value={fmtMoney(kpis.egresos)}
            delta={{
              pct: kpis.dEgresos,
              label: 'vs mes anterior',
              upIsGood: false,
            }}
            spark={kpis.sEgresos}
            tone="default"
          />
          <KpiCard
            icon={Weight}
            label="Peso entregado"
            value={fmtLbs(kpis.peso)}
            delta={{ pct: kpis.dPeso, label: 'vs mes anterior' }}
            spark={kpis.sPeso}
            tone="accent"
          />
          <KpiCard
            icon={ShoppingBag}
            label="Órdenes"
            value={fmtInt(kpis.ordenes)}
            delta={{ pct: kpis.dOrdenes, label: 'vs mes anterior' }}
            spark={kpis.sOrdenes}
            hint={`${fmtInt(kpis.clientesNuevos)} clientes nuevos`}
            tone="accent"
          />
          <KpiCard
            icon={CreditCard}
            label="Por cobrar (hoy)"
            value={fmtMoney(porCobrar)}
            hint={`${fmtInt(
              data.current.nOrdenesSinPagar + data.current.nEntregasSinPagar
            )} órdenes y entregas pendientes`}
            tone="warning"
          />
        </div>
      </div>

      {/* Filtro de período: gobierna todo lo que sigue */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <SectionLabel label="Período" />
          <ToggleButtonGroup
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[range]}
            onSelectionChange={(keys) => {
              const key = [...keys][0];
              if (key) setRange(key as RangeId);
            }}
            aria-label="Período de análisis"
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.id} id={r.id} className="whitespace-nowrap">
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <p className="text-xs text-muted">{rangeCaption}</p>
      </div>

      {/* Resultado financiero */}
      <ChartCard
        icon={ChartColumn}
        title="Resultado financiero"
        subtitle="Ingresos cobrados, egresos y ganancia del sistema por mes"
        action={
          <div
            role="group"
            aria-label="Cambiar entre gráfico y tabla"
            className="flex items-center gap-1.5"
          >
            <Button
              size="sm"
              variant={mainView === 'chart' ? 'primary' : 'outline'}
              aria-pressed={mainView === 'chart'}
              onPress={() => setMainView('chart')}
            >
              <ChartColumn className="h-4 w-4" aria-hidden />
              Gráfico
            </Button>
            <Button
              size="sm"
              variant={mainView === 'table' ? 'primary' : 'outline'}
              aria-pressed={mainView === 'table'}
              onPress={() => setMainView('table')}
            >
              <Table2 className="h-4 w-4" aria-hidden />
              Tabla
            </Button>
          </div>
        }
      >
        {mainView === 'chart' ? (
          <FinancialTrend data={view.trend} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="text-right">Ingresos</th>
                  <th className="text-right">Egresos</th>
                  <th className="text-right">Ganancia</th>
                  <th className="text-right">Margen</th>
                </tr>
              </thead>
              <tbody>
                {view.trend.map((r) => (
                  <tr key={r.label}>
                    <td className="font-medium">{r.label}</td>
                    <td className="text-right tabular-nums">
                      {fmtMoney(r.ingresos)}
                    </td>
                    <td className="text-right tabular-nums">
                      {fmtMoney(r.egresos)}
                    </td>
                    <td
                      className={`text-right font-semibold tabular-nums ${
                        r.ganancia < 0 ? 'text-danger' : 'text-foreground'
                      }`}
                    >
                      {fmtMoney(r.ganancia)}
                    </td>
                    <td className="text-right tabular-nums text-muted">
                      {r.ingresos > 0
                        ? `${((r.ganancia / r.ingresos) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-semibold">Total</td>
                  <td className="text-right font-semibold tabular-nums">
                    {fmtMoney(round2(view.totals.ingresos))}
                  </td>
                  <td className="text-right font-semibold tabular-nums">
                    {fmtMoney(round2(view.totals.egresos))}
                  </td>
                  <td
                    className={`text-right font-semibold tabular-nums ${
                      view.totals.ganancia < 0 ? 'text-danger' : ''
                    }`}
                  >
                    {fmtMoney(round2(view.totals.ganancia))}
                  </td>
                  <td className="text-right tabular-nums text-muted">
                    {view.totals.ingresos > 0
                      ? `${(
                          (view.totals.ganancia / view.totals.ingresos) *
                          100
                        ).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ChartCard>

      {/* Egresos y logística */}
      <div className="stagger-children grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          icon={ReceiptText}
          title="Composición de egresos"
          subtitle="Compras, gastos, envío y ganancia de agentes por mes"
        >
          <ExpenseStack data={view.stack} />
        </ChartCard>
        <ChartCard
          icon={Weight}
          title="Peso entregado"
          subtitle="Libras entregadas por mes (entregas en el tooltip)"
        >
          <WeightTrend data={view.weight} />
        </ChartCard>
      </div>

      {/* Estados y gastos */}
      <div className="stagger-children grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          icon={ClipboardList}
          title="Órdenes por estado"
          subtitle="Órdenes creadas en el período"
        >
          <DonutList
            items={view.statusItems}
            centerLabel="órdenes"
            emptyMessage="Sin órdenes en el período"
          />
        </ChartCard>
        <ChartCard
          icon={CreditCard}
          title="Cobro de órdenes"
          subtitle="Estado de pago de las órdenes del período"
        >
          <StatusShareBar
            items={view.payItems}
            emptyMessage="Sin órdenes en el período"
          />
        </ChartCard>
        <ChartCard
          icon={ReceiptText}
          title="Gastos por categoría"
          subtitle="Top de categorías del período"
        >
          <CategoryBars
            items={view.catItems}
            emptyMessage="Sin gastos en el período"
          />
        </ChartCard>
      </div>

      {/* Flujo operativo de productos */}
      <ChartCard
        icon={PackageSearch}
        title="Flujo de productos"
        subtitle="Unidades pedidas en el período y su avance por el ciclo"
      >
        <PipelineFunnel
          steps={[
            { label: 'Encargado', value: view.pipeline.encargado },
            { label: 'Comprado', value: view.pipeline.comprado },
            { label: 'Recibido', value: view.pipeline.recibido },
            { label: 'Entregado', value: view.pipeline.entregado },
          ]}
          emptyMessage="Sin productos encargados en el período"
        />
      </ChartCard>

      {/* Rankings */}
      <div className="space-y-3">
        <SectionLabel label="Rankings del período" />
        <div className="stagger-children grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            icon={Users}
            title="Top clientes"
            subtitle="Por ingresos cobrados"
          >
            <RankList
              emptyMessage="Sin actividad de clientes en el período"
              items={view.clientItems.map((c) => ({
                id: c.id,
                title: c.name,
                sub: `${fmtInt(c.ordenes)} órdenes · ${fmtInt(c.entregas)} entregas`,
                value: fmtMoney(c.ingresos),
                extra: (
                  <BalanceChip balance={data.clientBalances[c.id] ?? 0} />
                ),
              }))}
            />
          </ChartCard>
          <ChartCard
            icon={UserCheck}
            title="Top agentes"
            subtitle="Por ganancia generada en entregas"
          >
            <RankList
              emptyMessage="Sin entregas en el período"
              items={view.agentItems.map((a) => ({
                id: a.id,
                title: a.name,
                sub: `${fmtInt(a.entregas)} entregas · ${fmtLbs(a.peso)}`,
                value: fmtMoney(a.ganancia),
              }))}
            />
          </ChartCard>
          <ChartCard
            icon={Store}
            title="Top tiendas"
            subtitle="Por monto comprado"
          >
            <RankList
              emptyMessage="Sin compras en el período"
              items={view.shopItems.map((s) => ({
                id: s.name,
                title: s.name,
                sub: `${fmtInt(s.count)} compras`,
                value: fmtMoney(s.value),
                media: <ShopAvatar name={s.name} size="sm" />,
              }))}
            />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
