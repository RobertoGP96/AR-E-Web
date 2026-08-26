'use server';

import { prisma } from '@/lib/prisma';
import { requireStaff, parseId } from '@/lib/action-helpers';
import { canAccessPath } from '@/lib/route-roles';
import { formatCurrency, formatDate } from '@/lib/format';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  href: string;
}

export type SearchEntity =
  | 'orders'
  | 'products'
  | 'users'
  | 'delivery'
  | 'packages'
  | 'purchases'
  | 'shops'
  | 'categories'
  | 'expenses';

export interface SearchGroup {
  entity: SearchEntity;
  items: SearchResultItem[];
}

const TAKE = 5;
const MIN_QUERY = 2;

/**
 * Global entity search for the command palette in the admin header.
 * Each entity is gated with the same page-level RBAC that proxy.ts
 * enforces (canAccessPath), so results never link to a page the
 * session cannot open. Detail pages get direct links; list-only
 * entities link to their page pre-filtered via ?q=.
 */
export async function globalSearchAction(
  query: string
): Promise<{ groups: SearchGroup[] } | { error: string }> {
  const { denied, user } = await requireStaff();
  if (denied) return { error: denied.error };

  const q = query.trim();
  if (q.length < MIN_QUERY) return { groups: [] };

  const role = user.role;
  const idNum = parseId(q);
  const text = { contains: q, mode: 'insensitive' as const };
  const clientMatch = {
    OR: [{ name: text }, { lastName: text }, { phoneNumber: text }],
  };
  const fullName = (u: { name: string; lastName: string }) =>
    `${u.name} ${u.lastName}`.trim();

  const searchers: Array<{
    entity: SearchEntity;
    path: string;
    run: () => Promise<SearchResultItem[]>;
  }> = [
    {
      entity: 'orders',
      path: '/orders',
      run: async () => {
        const rows = await prisma.order.findMany({
          where:
            idNum != null
              ? { OR: [{ id: idNum }, { client: clientMatch }] }
              : { client: clientMatch },
          select: {
            id: true,
            status: true,
            totalCosts: true,
            client: { select: { name: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: TAKE,
        });
        return rows.map((o) => ({
          id: o.id.toString(),
          title: `Orden #${o.id} — ${fullName(o.client)}`,
          subtitle: formatCurrency(o.totalCosts),
          badge: o.status,
          href: `/orders/${o.id}`,
        }));
      },
    },
    {
      entity: 'products',
      path: '/products',
      run: async () => {
        const rows = await prisma.product.findMany({
          where: {
            OR: [
              { name: text },
              { sku: text },
              { order: { client: { OR: [{ name: text }, { lastName: text }] } } },
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
            status: true,
            orderId: true,
            shop: { select: { name: true } },
            order: {
              select: { client: { select: { name: true, lastName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: TAKE,
        });
        const canOpenOrders = canAccessPath(role, '/orders');
        return rows.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `${p.shop.name} · ${fullName(p.order.client)}`,
          badge: p.status,
          href: canOpenOrders
            ? `/orders/${p.orderId}`
            : `/products?q=${encodeURIComponent(p.sku ?? p.name)}`,
        }));
      },
    },
    {
      entity: 'users',
      path: '/users',
      run: async () => {
        const rows = await prisma.customUser.findMany({
          where: {
            OR: [
              { name: text },
              { lastName: text },
              { email: text },
              { phoneNumber: text },
            ],
          },
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
          orderBy: { dateJoined: 'desc' },
          take: TAKE,
        });
        return rows.map((u) => ({
          id: u.id.toString(),
          title: fullName(u),
          subtitle: u.email ?? u.phoneNumber,
          badge: u.role,
          // The users list also searches by phone, which is unique —
          // this lands on the list filtered down to exactly this user.
          href: `/users?q=${encodeURIComponent(u.phoneNumber)}`,
        }));
      },
    },
    {
      entity: 'delivery',
      path: '/delivery',
      run: async () => {
        const rows = await prisma.deliverReceip.findMany({
          where:
            idNum != null
              ? { OR: [{ id: idNum }, { client: clientMatch }] }
              : { client: clientMatch },
          select: {
            id: true,
            status: true,
            weight: true,
            deliverDate: true,
            client: { select: { name: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: TAKE,
        });
        return rows.map((d) => ({
          id: d.id.toString(),
          title: `Entrega #${d.id} — ${fullName(d.client)}`,
          subtitle: `${formatDate(d.deliverDate)} · ${d.weight} lb`,
          badge: d.status,
          href: `/delivery/${d.id}`,
        }));
      },
    },
    {
      entity: 'packages',
      path: '/packages',
      run: async () => {
        const rows = await prisma.package.findMany({
          where: { OR: [{ numberOfTracking: text }, { agencyName: text }] },
          select: {
            id: true,
            agencyName: true,
            numberOfTracking: true,
            statusOfProcessing: true,
            arrivalDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: TAKE,
        });
        return rows.map((p) => ({
          id: p.id.toString(),
          title: p.numberOfTracking,
          subtitle: `${p.agencyName} · ${formatDate(p.arrivalDate)}`,
          badge: p.statusOfProcessing,
          href: `/packages/${p.id}`,
        }));
      },
    },
    {
      entity: 'purchases',
      path: '/purchases',
      run: async () => {
        const rows = await prisma.shoppingReceip.findMany({
          where: {
            OR: [
              ...(idNum != null ? [{ id: idNum }] : []),
              { shopOfBuy: { name: text } },
              { shoppingAccount: { accountName: text } },
            ],
          },
          select: {
            id: true,
            statusOfShopping: true,
            totalCostOfPurchase: true,
            buyDate: true,
            shopOfBuy: { select: { name: true } },
            shoppingAccount: { select: { accountName: true } },
          },
          orderBy: { buyDate: 'desc' },
          take: TAKE,
        });
        return rows.map((r) => ({
          id: r.id.toString(),
          title: `Compra #${r.id} — ${r.shopOfBuy.name}`,
          subtitle: `${r.shoppingAccount.accountName} · ${formatDate(r.buyDate)} · ${formatCurrency(r.totalCostOfPurchase)}`,
          badge: r.statusOfShopping,
          href: `/purchases/${r.id}`,
        }));
      },
    },
    {
      entity: 'shops',
      path: '/shops',
      run: async () => {
        const rows = await prisma.shop.findMany({
          where: { OR: [{ name: text }, { link: text }] },
          select: { id: true, name: true, link: true, isActive: true },
          orderBy: { name: 'asc' },
          take: TAKE,
        });
        return rows.map((s) => ({
          id: s.id.toString(),
          title: s.name,
          subtitle: s.link,
          badge: s.isActive ? undefined : 'Inactiva',
          href: `/shops?q=${encodeURIComponent(s.name)}`,
        }));
      },
    },
    {
      entity: 'categories',
      path: '/categories',
      run: async () => {
        const rows = await prisma.category.findMany({
          where: { name: text },
          select: { id: true, name: true, clientShippingCharge: true },
          orderBy: { name: 'asc' },
          take: TAKE,
        });
        return rows.map((c) => ({
          id: c.id.toString(),
          title: c.name,
          subtitle: `${formatCurrency(c.clientShippingCharge)}/lb al cliente`,
          href: `/categories?q=${encodeURIComponent(c.name)}`,
        }));
      },
    },
    {
      entity: 'expenses',
      path: '/expenses',
      run: async () => {
        const rows = await prisma.expense.findMany({
          where: { description: text },
          select: {
            id: true,
            description: true,
            category: true,
            amount: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: TAKE,
        });
        return rows.map((e) => ({
          id: e.id.toString(),
          title: e.description ?? e.category,
          subtitle: `${formatDate(e.date)} · ${formatCurrency(e.amount)}`,
          badge: e.category,
          // The expenses list searches descriptions — reuse the query.
          href: `/expenses?q=${encodeURIComponent(q)}`,
        }));
      },
    },
  ];

  const allowed = searchers.filter((s) => canAccessPath(role, s.path));
  const results = await Promise.all(allowed.map((s) => s.run()));
  const groups = allowed
    .map((s, i) => ({ entity: s.entity, items: results[i] }))
    .filter((g) => g.items.length > 0);

  return { groups };
}
