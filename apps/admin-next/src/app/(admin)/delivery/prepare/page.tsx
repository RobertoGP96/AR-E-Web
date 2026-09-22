import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ROLES, parseId } from '@/lib/action-helpers';
import { PrepareDeliveryClient } from './prepare-client';
import {
  loadArrivalCandidates,
  loadCategoryChoices,
  loadReceptions,
} from '../../packages/queries';
import type {
  LooseProduct,
  OpenBag,
  PrepareClientGroup,
  ReviewPackage,
  WeighedDelivery,
} from './types';

interface PageProps {
  searchParams: Promise<{ package?: string }>;
}

/**
 * Mesa de trabajo del logístico, calcada del proceso físico: (1) revisar
 * los paquetes uno a uno marcando qué productos llegaron en cada bulto —
 * al marcar, cada unidad cae sola en la bolsa abierta (entrega
 * «Pendiente» con peso 0) de su cliente+categoría —, y (2) la mesa de
 * bolsas: ajustar su contenido, embolsar recibidos sueltos y pesar cada
 * bolsa, lo que la cierra y fija su costo. Un agente solo ve las bolsas
 * y mercancía de sus clientes asignados.
 */
export default async function PrepareDeliveryPage({ searchParams }: PageProps) {
  const { package: packageParam } = await searchParams;
  const session = await auth();
  const role = session?.user?.role ?? '';
  const canWrite = (ROLES.delivery as readonly string[]).includes(role);
  const canWritePackages = (ROLES.packages as readonly string[]).includes(
    role
  );
  const agentId =
    role === 'agent' ? parseId(session?.user?.id ?? '') : null;

  // Paquetes primero: sus recepciones se buscan por id en la misma pasada.
  // Un agente solo ve los paquetes con recepciones de sus clientes.
  const packages = await prisma.package.findMany({
    where:
      agentId !== null
        ? {
            packageProducts: {
              some: {
                originalProduct: {
                  order: { client: { assignedAgentId: agentId } },
                },
              },
            },
          }
        : undefined,
    select: {
      id: true,
      agencyName: true,
      numberOfTracking: true,
      statusOfProcessing: true,
      arrivalDate: true,
      packagePicture: true,
    },
    orderBy: [{ arrivalDate: 'desc' }, { id: 'desc' }],
    take: 150,
  });

  const [receptionsByPackage, arrivals, categories, looseProducts, openBags, weighed] =
    await Promise.all([
      loadReceptions(packages.map((p) => p.id)),
      loadArrivalCandidates({ agentId }),
      loadCategoryChoices(),
      // Mesa de bolsas: recibidos con unidades sin entregar (sueltos).
      prisma.product.findMany({
        where: {
          amountReceived: { gt: 0 },
          ...(agentId !== null && {
            order: { client: { assignedAgentId: agentId } },
          }),
        },
        select: {
          id: true,
          name: true,
          amountRequested: true,
          amountPurchased: true,
          amountReceived: true,
          amountDelivered: true,
          categoryId: true,
          category: { select: { name: true } },
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
      // Bolsas abiertas: entregas Pendiente con peso 0 que se llenan solas.
      prisma.deliverReceip.findMany({
        where: {
          status: 'Pendiente',
          weight: 0,
          ...(agentId !== null && {
            client: { assignedAgentId: agentId },
          }),
        },
        select: {
          id: true,
          clientId: true,
          categoryId: true,
          category: {
            select: { name: true, clientShippingCharge: true },
          },
          client: {
            select: {
              name: true,
              lastName: true,
              phoneNumber: true,
              assignedAgent: { select: { agentProfit: true } },
            },
          },
          deliveredProducts: {
            select: {
              id: true,
              amountDelivered: true,
              originalProduct: { select: { id: true, name: true } },
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { id: 'asc' },
      }),
      // Entregas ya pesadas sin completar, como contexto del cliente.
      prisma.deliverReceip.findMany({
        where: {
          status: { in: ['Pendiente', 'En transito'] },
          weight: { gt: 0 },
          ...(agentId !== null && {
            client: { assignedAgentId: agentId },
          }),
        },
        select: {
          id: true,
          clientId: true,
          status: true,
          deliverDate: true,
          weight: true,
          weightCost: true,
          category: { select: { name: true } },
          _count: { select: { deliveredProducts: true } },
        },
        orderBy: { deliverDate: 'desc' },
      }),
    ]);

  // -------- Fase 1: paquetes con sus llegadas marcadas --------
  const reviewPackages: ReviewPackage[] = packages.map((p) => {
    const rows = receptionsByPackage.get(p.id.toString()) ?? [];
    return {
      id: p.id.toString(),
      agency: p.agencyName,
      tracking: p.numberOfTracking,
      status: p.statusOfProcessing,
      arrivalDate: p.arrivalDate.toISOString(),
      packagePicture: p.packagePicture,
      receptions: rows,
      unitsMarked: rows.reduce((sum, r) => sum + r.amount, 0),
    };
  });

  const candidates = arrivals.candidates;

  // Unidades en camino por cliente (todas sus compras sin recibir),
  // para avisar en la mesa de bolsas que aún falta mercancía.
  const incomingByClient = new Map<string, number>();
  for (const c of candidates) {
    incomingByClient.set(
      c.clientId,
      (incomingByClient.get(c.clientId) ?? 0) + c.pendingArrival
    );
  }

  // -------- Fase 2: bolsas y sueltos por cliente --------
  const groupsByClient = new Map<string, PrepareClientGroup>();
  const groupFor = (
    clientId: string,
    info: { clientName: string; phoneNumber: string; agentProfit: number }
  ): PrepareClientGroup => {
    let group = groupsByClient.get(clientId);
    if (!group) {
      group = {
        clientId,
        clientName: info.clientName,
        phoneNumber: info.phoneNumber,
        agentProfit: info.agentProfit,
        bags: [],
        loose: [],
        weighed: [],
        unitsInBags: 0,
        unitsLoose: 0,
        totalIncoming: incomingByClient.get(clientId) ?? 0,
      };
      groupsByClient.set(clientId, group);
    }
    return group;
  };

  for (const bag of openBags) {
    const group = groupFor(bag.clientId.toString(), {
      clientName: `${bag.client.name} ${bag.client.lastName}`.trim(),
      phoneNumber: bag.client.phoneNumber,
      agentProfit: bag.client.assignedAgent?.agentProfit ?? 0,
    });
    const items = bag.deliveredProducts.map((row) => ({
      id: row.id.toString(),
      productId: row.originalProduct.id,
      name: row.originalProduct.name,
      units: row.amountDelivered,
    }));
    const view: OpenBag = {
      id: bag.id.toString(),
      categoryId: bag.categoryId ? bag.categoryId.toString() : null,
      categoryName: bag.category?.name ?? null,
      chargePerLb: bag.category?.clientShippingCharge ?? 0,
      items,
      units: items.reduce((sum, i) => sum + i.units, 0),
    };
    group.bags.push(view);
    group.unitsInBags += view.units;
  }

  for (const p of looseProducts) {
    const loose = p.amountReceived - p.amountDelivered;
    if (loose <= 0) continue;

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

    const group = groupFor(p.order.clientId.toString(), {
      clientName: `${p.order.client.name} ${p.order.client.lastName}`.trim(),
      phoneNumber: p.order.client.phoneNumber,
      agentProfit: p.order.client.assignedAgent?.agentProfit ?? 0,
    });
    const row: LooseProduct = {
      id: p.id,
      name: p.name,
      orderId: p.order.id.toString(),
      categoryId: p.categoryId ? p.categoryId.toString() : null,
      categoryName: p.category?.name ?? null,
      requested: p.amountRequested,
      received: p.amountReceived,
      loose,
      incoming: Math.max(0, p.amountPurchased - p.amountReceived),
      packages: [...perPackage.values()],
    };
    group.loose.push(row);
    group.unitsLoose += loose;
  }

  // Entregas pesadas: solo como contexto de clientes que tienen trabajo.
  for (const dlv of weighed) {
    const group = groupsByClient.get(dlv.clientId.toString());
    if (!group) continue;
    const view: WeighedDelivery = {
      id: dlv.id.toString(),
      status: dlv.status,
      categoryName: dlv.category?.name ?? null,
      weight: dlv.weight,
      weightCost: dlv.weightCost,
      deliverDate: dlv.deliverDate.toISOString(),
      productCount: dlv._count.deliveredProducts,
    };
    group.weighed.push(view);
  }

  for (const group of groupsByClient.values()) {
    group.bags.sort((a, b) =>
      (a.categoryName ?? '').localeCompare(b.categoryName ?? '')
    );
    group.loose.sort(
      (a, b) =>
        (a.categoryName ?? '').localeCompare(b.categoryName ?? '') ||
        a.name.localeCompare(b.name)
    );
  }

  const groups = [...groupsByClient.values()].sort(
    (a, b) =>
      b.unitsInBags + b.unitsLoose - (a.unitsInBags + a.unitsLoose) ||
      a.clientName.localeCompare(b.clientName)
  );

  const initialPackageId =
    packageParam && /^\d+$/.test(packageParam) ? packageParam : null;

  return (
    <PrepareDeliveryClient
      reviewPackages={reviewPackages}
      candidates={candidates}
      truncated={arrivals.truncated}
      categories={categories}
      groups={groups}
      role={role}
      canWrite={canWrite}
      canWritePackages={canWritePackages}
      initialPackageId={initialPackageId}
    />
  );
}
