import { prisma } from '@/lib/prisma';

/**
 * Registro de entidades exportables (Configuración → Datos). Cada
 * entidad produce filas planas con encabezados en español, listas para
 * volcarse a JSON (salva completa), Excel (hoja por entidad) o CSV.
 *
 * Por seguridad nunca se exportan contraseñas ni secretos de
 * verificación de los usuarios.
 */

export type ExportValue = string | number | boolean | null;
export type ExportRow = Record<string, ExportValue>;

export interface ExportEntity {
  /** Clave estable usada en la URL de descarga y en la salva JSON. */
  key: string;
  /** Nombre humano: hoja de Excel / sección de la salva. */
  label: string;
  description: string;
  headers: string[];
  load: () => Promise<ExportRow[]>;
}

const ts = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;
const day = (d: Date | null | undefined): string | null =>
  d ? d.toISOString().slice(0, 10) : null;
const num = (v: unknown): number => Number(v ?? 0);
const person = (
  u: { name: string; lastName: string } | null | undefined
): string | null => (u ? `${u.name} ${u.lastName}`.trim() : null);

export const EXPORT_ENTITIES: readonly ExportEntity[] = [
  {
    key: 'users',
    label: 'Usuarios',
    description: 'Clientes y personal, sin contraseñas ni secretos.',
    headers: [
      'ID',
      'Nombre',
      'Apellidos',
      'Teléfono',
      'Email',
      'Rol',
      'Dirección',
      'Agente asignado',
      'Ganancia de agente',
      'Balance',
      'Activo',
      'Verificado',
      'Fecha de registro',
    ],
    async load() {
      const rows = await prisma.customUser.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          lastName: true,
          phoneNumber: true,
          email: true,
          role: true,
          homeAddress: true,
          agentProfit: true,
          balance: true,
          isActive: true,
          isVerified: true,
          dateJoined: true,
          assignedAgent: { select: { name: true, lastName: true } },
        },
      });
      return rows.map((u) => ({
        ID: Number(u.id),
        Nombre: u.name,
        Apellidos: u.lastName,
        'Teléfono': u.phoneNumber,
        Email: u.email,
        Rol: u.role,
        'Dirección': u.homeAddress,
        'Agente asignado': person(u.assignedAgent),
        'Ganancia de agente': u.agentProfit,
        Balance: u.balance,
        Activo: u.isActive,
        Verificado: u.isVerified,
        'Fecha de registro': ts(u.dateJoined),
      }));
    },
  },
  {
    key: 'shops',
    label: 'Tiendas',
    description: 'Tiendas y su porcentaje de impuesto.',
    headers: ['ID', 'Nombre', 'Enlace', 'Impuesto (%)', 'Activa', 'Creada'],
    async load() {
      const rows = await prisma.shop.findMany({ orderBy: { id: 'asc' } });
      return rows.map((s) => ({
        ID: Number(s.id),
        Nombre: s.name,
        Enlace: s.link,
        'Impuesto (%)': s.taxRate,
        Activa: s.isActive,
        Creada: ts(s.createdAt),
      }));
    },
  },
  {
    key: 'categories',
    label: 'Categorías',
    description: 'Categorías con costo y cobro de envío por libra.',
    headers: [
      'ID',
      'Nombre',
      'Costo de envío por libra',
      'Cobro al cliente por libra',
      'Creada',
    ],
    async load() {
      const rows = await prisma.category.findMany({ orderBy: { id: 'asc' } });
      return rows.map((c) => ({
        ID: Number(c.id),
        Nombre: c.name,
        'Costo de envío por libra': c.shippingCostPerPound,
        'Cobro al cliente por libra': c.clientShippingCharge,
        Creada: ts(c.createdAt),
      }));
    },
  },
  {
    key: 'accounts',
    label: 'Cuentas de compra',
    description: 'Cuentas usadas para comprar en cada tienda.',
    headers: ['ID', 'Cuenta', 'Tienda', 'Creada'],
    async load() {
      const rows = await prisma.buyingAccounts.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          accountName: true,
          createdAt: true,
          shop: { select: { name: true } },
        },
      });
      return rows.map((a) => ({
        ID: Number(a.id),
        Cuenta: a.accountName,
        Tienda: a.shop?.name ?? null,
        Creada: ts(a.createdAt),
      }));
    },
  },
  {
    key: 'orders',
    label: 'Órdenes',
    description: 'Órdenes con cliente, agente, estado y totales.',
    headers: [
      'ID',
      'Cliente',
      'Agente',
      'Estado',
      'Estado de pago',
      'Costo total',
      'Recibido del cliente',
      'Balance aplicado',
      'Fecha de pago',
      'Observaciones',
      'Creada',
    ],
    async load() {
      const rows = await prisma.order.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          status: true,
          payStatus: true,
          totalCosts: true,
          receivedValueOfClient: true,
          balanceApplied: true,
          paymentDate: true,
          observations: true,
          createdAt: true,
          client: { select: { name: true, lastName: true } },
          salesManager: { select: { name: true, lastName: true } },
        },
      });
      return rows.map((o) => ({
        ID: Number(o.id),
        Cliente: person(o.client),
        Agente: person(o.salesManager),
        Estado: o.status,
        'Estado de pago': o.payStatus,
        'Costo total': o.totalCosts,
        'Recibido del cliente': o.receivedValueOfClient,
        'Balance aplicado': o.balanceApplied,
        'Fecha de pago': ts(o.paymentDate),
        Observaciones: o.observations,
        Creada: ts(o.createdAt),
      }));
    },
  },
  {
    key: 'products',
    label: 'Productos',
    description: 'Productos de las órdenes con cantidades y costos.',
    headers: [
      'ID',
      'SKU',
      'Nombre',
      'Tienda',
      'Categoría',
      'Orden',
      'Estado',
      'Solicitados',
      'Comprados',
      'Recibidos',
      'Entregados',
      'Costo en tienda',
      'Envío de tienda',
      'Costo total',
      'Creado',
    ],
    async load() {
      const rows = await prisma.product.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          sku: true,
          name: true,
          status: true,
          amountRequested: true,
          amountPurchased: true,
          amountReceived: true,
          amountDelivered: true,
          shopCost: true,
          shopDeliveryCost: true,
          totalCost: true,
          orderId: true,
          createdAt: true,
          shop: { select: { name: true } },
          category: { select: { name: true } },
        },
      });
      return rows.map((p) => ({
        ID: p.id,
        SKU: p.sku,
        Nombre: p.name,
        Tienda: p.shop.name,
        'Categoría': p.category?.name ?? null,
        Orden: Number(p.orderId),
        Estado: p.status,
        Solicitados: p.amountRequested,
        Comprados: p.amountPurchased,
        Recibidos: p.amountReceived,
        Entregados: p.amountDelivered,
        'Costo en tienda': p.shopCost,
        'Envío de tienda': p.shopDeliveryCost,
        'Costo total': p.totalCost,
        Creado: ts(p.createdAt),
      }));
    },
  },
  {
    key: 'purchases',
    label: 'Compras',
    description: 'Compras reales en tiendas (recibos de compra).',
    headers: [
      'ID',
      'Tienda',
      'Cuenta',
      'Estado',
      'Fecha de compra',
      'Costo total pagado',
      'Productos',
    ],
    async load() {
      const rows = await prisma.shoppingReceip.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          statusOfShopping: true,
          buyDate: true,
          totalCostOfPurchase: true,
          shopOfBuy: { select: { name: true } },
          shoppingAccount: { select: { accountName: true } },
          _count: { select: { buyedProducts: true } },
        },
      });
      return rows.map((r) => ({
        ID: Number(r.id),
        Tienda: r.shopOfBuy.name,
        Cuenta: r.shoppingAccount.accountName,
        Estado: r.statusOfShopping,
        'Fecha de compra': ts(r.buyDate),
        'Costo total pagado': r.totalCostOfPurchase,
        Productos: r._count.buyedProducts,
      }));
    },
  },
  {
    key: 'packages',
    label: 'Paquetes',
    description: 'Paquetes con tracking y estado de procesamiento.',
    headers: [
      'ID',
      'Agencia',
      'Tracking',
      'Estado',
      'Fecha de llegada',
      'Productos',
    ],
    async load() {
      const rows = await prisma.package.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          agencyName: true,
          numberOfTracking: true,
          statusOfProcessing: true,
          arrivalDate: true,
          _count: { select: { packageProducts: true } },
        },
      });
      return rows.map((p) => ({
        ID: Number(p.id),
        Agencia: p.agencyName,
        Tracking: p.numberOfTracking,
        Estado: p.statusOfProcessing,
        'Fecha de llegada': ts(p.arrivalDate),
        Productos: p._count.packageProducts,
      }));
    },
  },
  {
    key: 'deliveries',
    label: 'Entregas',
    description: 'Recibos de entrega con peso, cobro y estado de pago.',
    headers: [
      'ID',
      'Cliente',
      'Categoría',
      'Peso (lb)',
      'Estado',
      'Estado de pago',
      'Monto pagado',
      'Balance aplicado',
      'Costo por peso',
      'Ganancia del gestor',
      'Fecha de entrega',
    ],
    async load() {
      const rows = await prisma.deliverReceip.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          weight: true,
          status: true,
          paymentStatus: true,
          paymentAmount: true,
          balanceApplied: true,
          weightCost: true,
          managerProfit: true,
          deliverDate: true,
          client: { select: { name: true, lastName: true } },
          category: { select: { name: true } },
        },
      });
      return rows.map((d) => ({
        ID: Number(d.id),
        Cliente: person(d.client),
        'Categoría': d.category?.name ?? null,
        'Peso (lb)': d.weight,
        Estado: d.status,
        'Estado de pago': d.paymentStatus,
        'Monto pagado': d.paymentAmount,
        'Balance aplicado': d.balanceApplied,
        'Costo por peso': d.weightCost,
        'Ganancia del gestor': d.managerProfit,
        'Fecha de entrega': ts(d.deliverDate),
      }));
    },
  },
  {
    key: 'expenses',
    label: 'Gastos',
    description: 'Registro de gastos operativos.',
    headers: ['ID', 'Fecha', 'Monto', 'Categoría', 'Descripción', 'Creado por'],
    async load() {
      const rows = await prisma.expense.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          date: true,
          amount: true,
          category: true,
          description: true,
          createdBy: { select: { name: true, lastName: true } },
        },
      });
      return rows.map((e) => ({
        ID: Number(e.id),
        Fecha: ts(e.date),
        Monto: e.amount,
        'Categoría': e.category,
        'Descripción': e.description,
        'Creado por': person(e.createdBy),
      }));
    },
  },
  {
    key: 'invoices',
    label: 'Costos de envío',
    description: 'Facturas de costos de envío con sus renglones.',
    headers: ['ID', 'Fecha', 'Total', 'Renglones', 'Tipos'],
    async load() {
      const rows = await prisma.invoice.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          date: true,
          total: true,
          tags: { select: { type: true } },
        },
      });
      return rows.map((i) => ({
        ID: Number(i.id),
        Fecha: ts(i.date),
        Total: num(i.total),
        Renglones: i.tags.length,
        Tipos: i.tags.map((t) => t.type).join(', ') || null,
      }));
    },
  },
  {
    key: 'balances',
    label: 'Balances',
    description: 'Balances generales por período.',
    headers: [
      'ID',
      'Inicio',
      'Fin',
      'Peso del sistema',
      'Peso registrado',
      'Ingresos',
      'Costos de compras',
      'Costos',
      'Gastos',
      'Notas',
    ],
    async load() {
      const rows = await prisma.balance.findMany({ orderBy: { id: 'asc' } });
      return rows.map((b) => ({
        ID: Number(b.id),
        Inicio: day(b.startDate),
        Fin: day(b.endDate),
        'Peso del sistema': num(b.systemWeight),
        'Peso registrado': num(b.registeredWeight),
        Ingresos: num(b.revenues),
        'Costos de compras': num(b.buysCosts),
        Costos: num(b.costs),
        Gastos: num(b.expenses),
        Notas: b.notes,
      }));
    },
  },
];

export function findExportEntity(key: string): ExportEntity | undefined {
  return EXPORT_ENTITIES.find((e) => e.key === key);
}
