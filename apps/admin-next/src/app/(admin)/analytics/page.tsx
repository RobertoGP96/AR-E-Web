import { ChartColumn } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { round2 } from '@/lib/order-cost';
import { PageHeader } from '@/components/ui';
import { AnalyticsView } from './analytics-view';
import type {
  AgentRow,
  AnalyticsData,
  ClientRow,
  MonthBucket,
  SliceRow,
} from './types';

export const dynamic = 'force-dynamic';

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function fullName(u: { name: string; lastName: string }): string {
  return `${u.name} ${u.lastName}`.trim();
}

/**
 * /analytics — el servidor agrega los últimos 12 meses calendario en
 * cubetas mensuales serializables; AnalyticsView (cliente) rebana por
 * rango y dibuja. Las fórmulas replican las del dashboard contable:
 * ingresos = cobrado de órdenes + cobrado de entregas; ganancia del
 * sistema = ingresos − compras − gastos − envío − ganancia de agentes.
 */
export default async function AnalyticsPage() {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 11);
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const [
    orders,
    deliveries,
    purchases,
    expenses,
    products,
    newClients,
    common,
    unpaidOrdersAgg,
    unpaidDeliveriesAgg,
    debtClientsAgg,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        receivedValueOfClient: true,
        status: true,
        payStatus: true,
        clientId: true,
        client: { select: { name: true, lastName: true, balance: true } },
      },
    }),
    prisma.deliverReceip.findMany({
      where: { deliverDate: { gte: since } },
      select: {
        deliverDate: true,
        paymentAmount: true,
        weight: true,
        managerProfit: true,
        clientId: true,
        client: {
          select: {
            name: true,
            lastName: true,
            balance: true,
            assignedAgent: {
              select: { id: true, name: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.shoppingReceip.findMany({
      where: { buyDate: { gte: since } },
      select: {
        buyDate: true,
        totalCostOfPurchase: true,
        shopOfBuy: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: since } },
      select: { date: true, amount: true, category: true },
    }),
    prisma.product.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        amountRequested: true,
        amountPurchased: true,
        amountReceived: true,
        amountDelivered: true,
      },
    }),
    prisma.customUser.findMany({
      where: { role: 'client', dateJoined: { gte: since } },
      select: { dateJoined: true },
    }),
    prisma.commonInformation.findFirst({ orderBy: { id: 'asc' } }),
    prisma.order.aggregate({
      where: { payStatus: { not: 'Pagado' } },
      _count: { _all: true },
      _sum: {
        totalCosts: true,
        receivedValueOfClient: true,
        balanceApplied: true,
      },
    }),
    prisma.deliverReceip.aggregate({
      where: { paymentStatus: { not: 'Pagado' } },
      _count: { _all: true },
      _sum: { weightCost: true, paymentAmount: true },
    }),
    prisma.customUser.aggregate({
      where: { role: 'client', balance: { lt: 0 } },
      _sum: { balance: true },
      _count: { _all: true },
    }),
  ]);

  const costPerPound = common?.costPerPound ?? 0;

  // Cubetas mensuales: 12 meses calendario terminando en el actual.
  const months: MonthBucket[] = [];
  const idx = new Map<string, number>();
  const cursor = new Date(since);
  for (let i = 0; i < 12; i += 1) {
    const key = monthKey(cursor);
    const label = `${cursor.toLocaleDateString('es-ES', {
      month: 'short',
      timeZone: 'UTC',
    })} ${String(cursor.getUTCFullYear()).slice(2)}`;
    months.push({
      month: key,
      label,
      ingresos: 0,
      compras: 0,
      gastos: 0,
      envio: 0,
      gananciaAgentes: 0,
      peso: 0,
      entregas: 0,
      ordenes: 0,
      clientesNuevos: 0,
      encargado: 0,
      comprado: 0,
      recibido: 0,
      entregado: 0,
    });
    idx.set(key, i);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const monthOf = (d: Date): number | undefined => idx.get(monthKey(d));

  // Acumuladores de filas nominales por mes.
  const slices = {
    status: new Map<string, SliceRow>(),
    pay: new Map<string, SliceRow>(),
    cat: new Map<string, SliceRow>(),
    shop: new Map<string, SliceRow>(),
  };
  function addSlice(
    map: Map<string, SliceRow>,
    m: number,
    key: string,
    value: number,
    count = 1
  ) {
    const k = `${m}|${key}`;
    const row = map.get(k);
    if (row) {
      row.value += value;
      row.count = (row.count ?? 0) + count;
    } else {
      map.set(k, { m, key, value, count });
    }
  }

  const clientRowsMap = new Map<string, ClientRow>();
  const agentRowsMap = new Map<string, AgentRow>();
  const clientBalances: Record<string, number> = {};

  for (const o of orders) {
    const m = monthOf(o.createdAt);
    if (m === undefined) continue;
    months[m].ingresos += o.receivedValueOfClient;
    months[m].ordenes += 1;
    addSlice(slices.status, m, o.status, 1);
    addSlice(slices.pay, m, o.payStatus, 1);

    const id = o.clientId.toString();
    clientBalances[id] = o.client.balance;
    const ck = `${m}|${id}`;
    const row = clientRowsMap.get(ck);
    if (row) {
      row.ingresos += o.receivedValueOfClient;
      row.ordenes += 1;
    } else {
      clientRowsMap.set(ck, {
        m,
        id,
        name: fullName(o.client),
        ingresos: o.receivedValueOfClient,
        ordenes: 1,
        entregas: 0,
      });
    }
  }

  for (const d of deliveries) {
    const m = monthOf(d.deliverDate);
    if (m === undefined) continue;
    months[m].ingresos += d.paymentAmount;
    months[m].gananciaAgentes += d.managerProfit;
    months[m].envio += d.weight * costPerPound;
    months[m].peso += d.weight;
    months[m].entregas += 1;

    const id = d.clientId.toString();
    clientBalances[id] = d.client.balance;
    const ck = `${m}|${id}`;
    const row = clientRowsMap.get(ck);
    if (row) {
      row.ingresos += d.paymentAmount;
      row.entregas += 1;
    } else {
      clientRowsMap.set(ck, {
        m,
        id,
        name: fullName(d.client),
        ingresos: d.paymentAmount,
        ordenes: 0,
        entregas: 1,
      });
    }

    const agent = d.client.assignedAgent;
    const aid = agent ? agent.id.toString() : 'none';
    const ak = `${m}|${aid}`;
    const arow = agentRowsMap.get(ak);
    if (arow) {
      arow.ganancia += d.managerProfit;
      arow.entregas += 1;
      arow.peso += d.weight;
    } else {
      agentRowsMap.set(ak, {
        m,
        id: aid,
        name: agent ? fullName(agent) : 'Sin agente',
        ganancia: d.managerProfit,
        entregas: 1,
        peso: d.weight,
      });
    }
  }

  for (const p of purchases) {
    const m = monthOf(p.buyDate);
    if (m === undefined) continue;
    months[m].compras += p.totalCostOfPurchase;
    addSlice(slices.shop, m, p.shopOfBuy.name, p.totalCostOfPurchase);
  }

  for (const e of expenses) {
    const m = monthOf(e.date);
    if (m === undefined) continue;
    months[m].gastos += e.amount;
    addSlice(slices.cat, m, e.category, e.amount);
  }

  for (const p of products) {
    const m = monthOf(p.createdAt);
    if (m === undefined) continue;
    months[m].encargado += p.amountRequested;
    months[m].comprado += p.amountPurchased;
    months[m].recibido += p.amountReceived;
    months[m].entregado += p.amountDelivered;
  }

  for (const c of newClients) {
    const m = monthOf(c.dateJoined);
    if (m !== undefined) months[m].clientesNuevos += 1;
  }

  for (const row of months) {
    row.ingresos = round2(row.ingresos);
    row.compras = round2(row.compras);
    row.gastos = round2(row.gastos);
    row.envio = round2(row.envio);
    row.gananciaAgentes = round2(row.gananciaAgentes);
    row.peso = round2(row.peso);
  }

  const data: AnalyticsData = {
    months,
    statusRows: [...slices.status.values()],
    payRows: [...slices.pay.values()],
    catRows: [...slices.cat.values()],
    shopRows: [...slices.shop.values()],
    clientRows: [...clientRowsMap.values()],
    agentRows: [...agentRowsMap.values()],
    clientBalances,
    current: {
      porCobrarOrdenes: Math.max(
        0,
        round2(
          (unpaidOrdersAgg._sum.totalCosts ?? 0) -
            (unpaidOrdersAgg._sum.receivedValueOfClient ?? 0) -
            (unpaidOrdersAgg._sum.balanceApplied ?? 0)
        )
      ),
      nOrdenesSinPagar: unpaidOrdersAgg._count._all,
      porCobrarEntregas: Math.max(
        0,
        round2(
          (unpaidDeliveriesAgg._sum.weightCost ?? 0) -
            (unpaidDeliveriesAgg._sum.paymentAmount ?? 0)
        )
      ),
      nEntregasSinPagar: unpaidDeliveriesAgg._count._all,
      deudaClientes: round2(Math.abs(debtClientsAgg._sum.balance ?? 0)),
      nDeudores: debtClientsAgg._count._all,
    },
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        icon={ChartColumn}
        title="Análisis"
        subtitle="Resultados, tendencias y rankings del negocio por período"
      />
      <AnalyticsView data={data} />
    </div>
  );
}
