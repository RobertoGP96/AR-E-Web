import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/action-helpers';
import { PrepareDeliveryClient } from './prepare-client';
import type { CategoryOption } from '../schema';
import type {
  ArrivalCandidate,
  PackageReception,
  PendingDeliverySummary,
  PrepareClientGroup,
  ReviewPackage,
} from './types';

/**
 * Mesa de trabajo del logístico en dos fases, calcada del proceso real:
 * (1) revisar los paquetes uno a uno marcando qué productos llegaron en
 * cada bulto — un paquete puede venir incompleto y un producto puede
 * llegar repartido en varios paquetes/envíos —, y (2) armar las
 * entregas por cliente con lo verificado hasta el momento (recibido >
 * entregado), mostrando lo que sigue en camino para decidir entregas
 * parciales que se van creando poco a poco.
 */
export default async function PrepareDeliveryPage() {
  const session = await auth();
  const role = session?.user?.role ?? '';
  const canWrite = (ROLES.delivery as readonly string[]).includes(role);
  const canWritePackages = (ROLES.packages as readonly string[]).includes(
    role
  );

  // Paquetes primero: sus recepciones se buscan por id en la misma pasada.
  const packages = await prisma.package.findMany({
    select: {
      id: true,
      agencyName: true,
      numberOfTracking: true,
      statusOfProcessing: true,
      arrivalDate: true,
    },
    orderBy: [{ arrivalDate: 'desc' }, { id: 'desc' }],
    take: 150,
  });

  const [receptions, candidateProducts, products, categories, pendingDeliveries] =
    await Promise.all([
      prisma.productReceived.findMany({
        where: { packageId: { in: packages.map((p) => p.id) } },
        select: {
          id: true,
          packageId: true,
          amountReceived: true,
          observation: true,
          originalProduct: {
            select: {
              id: true,
              name: true,
              order: {
                select: {
                  client: { select: { name: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      // Candidatos de llegada: comprados con unidades sin recibir aún.
      prisma.product.findMany({
        where: { amountPurchased: { gt: 0 } },
        select: {
          id: true,
          name: true,
          amountRequested: true,
          amountPurchased: true,
          amountReceived: true,
          order: {
            select: {
              id: true,
              clientId: true,
              client: { select: { name: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      }),
      // Fase de entregas: recibidos con unidades sin entregar.
      prisma.product.findMany({
        where: { amountReceived: { gt: 0 } },
        select: {
          id: true,
          name: true,
          amountRequested: true,
          amountPurchased: true,
          amountReceived: true,
          amountDelivered: true,
          order: {
            select: {
              id: true,
              clientId: true,
              client: {
                select: {
                  name: true,
                  lastName: true,
                  phoneNumber: true,
                  assignedAgent: { select: { agentProfit: true } },
                },
              },
            },
          },
          receiveds: {
            select: {
              amountReceived: true,
              package: {
                select: { id: true, agencyName: true, numberOfTracking: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      }),
      prisma.category.findMany({
        select: { id: true, name: true, clientShippingCharge: true },
        orderBy: { name: 'asc' },
      }),
      prisma.deliverReceip.findMany({
        where: { status: { in: ['Pendiente', 'En transito'] } },
        select: { id: true, clientId: true, status: true, deliverDate: true },
        orderBy: { deliverDate: 'desc' },
      }),
    ]);

  // -------- Fase 1: paquetes con sus llegadas marcadas --------
  const receptionsByPackage = new Map<string, PackageReception[]>();
  for (const r of receptions) {
    if (r.packageId === null) continue;
    const key = r.packageId.toString();
    const list = receptionsByPackage.get(key) ?? [];
    list.push({
      id: r.id.toString(),
      productId: r.originalProduct.id,
      productName: r.originalProduct.name,
      clientName:
        `${r.originalProduct.order.client.name} ${r.originalProduct.order.client.lastName}`.trim(),
      amount: r.amountReceived,
      observation: r.observation,
    });
    receptionsByPackage.set(key, list);
  }

  const reviewPackages: ReviewPackage[] = packages.map((p) => {
    const rows = receptionsByPackage.get(p.id.toString()) ?? [];
    return {
      id: p.id.toString(),
      agency: p.agencyName,
      tracking: p.numberOfTracking,
      status: p.statusOfProcessing,
      arrivalDate: p.arrivalDate.toISOString(),
      receptions: rows,
      unitsMarked: rows.reduce((sum, r) => sum + r.amount, 0),
    };
  });

  const candidates: ArrivalCandidate[] = candidateProducts
    .map((p) => ({
      id: p.id,
      name: p.name,
      orderId: p.order.id.toString(),
      clientId: p.order.clientId.toString(),
      clientName:
        `${p.order.client.name} ${p.order.client.lastName}`.trim(),
      requested: p.amountRequested,
      purchased: p.amountPurchased,
      received: p.amountReceived,
      pendingArrival: p.amountPurchased - p.amountReceived,
    }))
    .filter((p) => p.pendingArrival > 0)
    .sort(
      (a, b) =>
        a.clientName.localeCompare(b.clientName) ||
        a.name.localeCompare(b.name)
    );

  // Unidades en camino por cliente (todas sus compras sin recibir),
  // para avisar en la fase de entregas que aún falta mercancía.
  const incomingByClient = new Map<string, number>();
  for (const c of candidates) {
    incomingByClient.set(
      c.clientId,
      (incomingByClient.get(c.clientId) ?? 0) + c.pendingArrival
    );
  }

  // -------- Fase 2: grupos por cliente --------
  const pendingByClient = new Map<string, PendingDeliverySummary[]>();
  for (const dlv of pendingDeliveries) {
    const key = dlv.clientId.toString();
    const list = pendingByClient.get(key) ?? [];
    list.push({
      id: dlv.id.toString(),
      status: dlv.status,
      deliverDate: dlv.deliverDate.toISOString(),
    });
    pendingByClient.set(key, list);
  }

  const groupsByClient = new Map<string, PrepareClientGroup>();
  for (const p of products) {
    const ready = p.amountReceived - p.amountDelivered;
    if (ready <= 0) continue;

    // Procedencia: unidades recibidas por paquete (varias recepciones
    // del mismo paquete se agregan).
    const perPackage = new Map<
      string,
      { id: string; agency: string; tracking: string; amount: number }
    >();
    for (const r of p.receiveds) {
      if (!r.package) continue;
      const key = r.package.id.toString();
      const entry = perPackage.get(key);
      if (entry) {
        entry.amount += r.amountReceived;
      } else {
        perPackage.set(key, {
          id: key,
          agency: r.package.agencyName,
          tracking: r.package.numberOfTracking,
          amount: r.amountReceived,
        });
      }
    }

    const clientId = p.order.clientId.toString();
    let group = groupsByClient.get(clientId);
    if (!group) {
      group = {
        clientId,
        clientName:
          `${p.order.client.name} ${p.order.client.lastName}`.trim(),
        phoneNumber: p.order.client.phoneNumber,
        agentProfit: p.order.client.assignedAgent?.agentProfit ?? 0,
        products: [],
        totalReady: 0,
        totalIncoming: incomingByClient.get(clientId) ?? 0,
        pending: pendingByClient.get(clientId) ?? [],
      };
      groupsByClient.set(clientId, group);
    }
    group.products.push({
      id: p.id,
      name: p.name,
      orderId: p.order.id.toString(),
      requested: p.amountRequested,
      purchased: p.amountPurchased,
      received: p.amountReceived,
      delivered: p.amountDelivered,
      ready,
      incoming: Math.max(0, p.amountPurchased - p.amountReceived),
      packages: [...perPackage.values()],
    });
    group.totalReady += ready;
  }

  const groups = [...groupsByClient.values()].sort(
    (a, b) =>
      b.totalReady - a.totalReady || a.clientName.localeCompare(b.clientName)
  );

  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id.toString(),
    label: c.name,
    clientShippingCharge: c.clientShippingCharge,
  }));

  return (
    <PrepareDeliveryClient
      reviewPackages={reviewPackages}
      candidates={candidates}
      groups={groups}
      categoryOptions={categoryOptions}
      canWrite={canWrite}
      canWritePackages={canWritePackages}
    />
  );
}
