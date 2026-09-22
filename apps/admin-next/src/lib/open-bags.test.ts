import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import {
  addUnitsToOpenBag,
  countUnitsInOpenBags,
  deleteBagIfEmpty,
  describeBags,
  pullUnitsFromOpenBags,
} from './open-bags';

/**
 * Doble en memoria del subconjunto de Prisma que usa open-bags.ts:
 * dos tablas (entregas y filas producto→entrega) con los filtros
 * exactos que hacen las funciones. Permite probar la lógica de bolsas
 * sin base de datos.
 */
interface Bag {
  id: bigint;
  clientId: bigint;
  categoryId: bigint | null;
  status: string;
  weight: number;
  paymentAmount: number;
  balanceApplied: number;
}
interface Row {
  id: bigint;
  deliverReceipId: bigint | null;
  originalProductId: string;
  amountDelivered: number;
}

function fakeDb(seed: { bags?: Bag[]; rows?: Row[] } = {}) {
  const bags: Bag[] = [...(seed.bags ?? [])];
  const rows: Row[] = [...(seed.rows ?? [])];
  let nextId = BigInt(100);

  const bagMatches = (b: Bag, where: Record<string, unknown>) =>
    Object.entries(where).every(([k, v]) => b[k as keyof Bag] === v);
  const rowMatches = (r: Row, where: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(where)) {
      if (k === 'deliverReceip') {
        const bag = bags.find((b) => b.id === r.deliverReceipId);
        if (!bag || !bagMatches(bag, v as Record<string, unknown>)) {
          return false;
        }
      } else if (r[k as keyof Row] !== v) {
        return false;
      }
    }
    return true;
  };
  const byIdDesc = <T extends { id: bigint }>(a: T, b: T) =>
    a.id < b.id ? 1 : a.id > b.id ? -1 : 0;

  const db = {
    async $executeRaw() {
      return 0;
    },
    deliverReceip: {
      async findFirst(args: { where: Record<string, unknown> }) {
        const hits = bags.filter((b) => bagMatches(b, args.where));
        hits.sort(byIdDesc);
        return hits[0] ? { id: hits[0].id } : null;
      },
      async create(args: { data: Partial<Bag> }) {
        const bag: Bag = {
          id: nextId++,
          clientId: args.data.clientId!,
          categoryId: args.data.categoryId ?? null,
          status: args.data.status!,
          weight: args.data.weight ?? 0,
          paymentAmount: args.data.paymentAmount ?? 0,
          balanceApplied: args.data.balanceApplied ?? 0,
        };
        bags.push(bag);
        return { id: bag.id };
      },
      async findUnique(args: { where: { id: bigint } }) {
        return bags.find((b) => b.id === args.where.id) ?? null;
      },
      async delete(args: { where: { id: bigint } }) {
        const i = bags.findIndex((b) => b.id === args.where.id);
        if (i >= 0) bags.splice(i, 1);
      },
    },
    productDelivery: {
      async findFirst(args: { where: Record<string, unknown> }) {
        return rows.find((r) => rowMatches(r, args.where)) ?? null;
      },
      async findMany(args: { where: Record<string, unknown> }) {
        return rows.filter((r) => rowMatches(r, args.where)).sort(byIdDesc);
      },
      async create(args: { data: Omit<Row, 'id'> }) {
        rows.push({ id: nextId++, ...args.data });
      },
      async update(args: {
        where: { id: bigint };
        data: { amountDelivered: number };
      }) {
        const r = rows.find((x) => x.id === args.where.id)!;
        r.amountDelivered = args.data.amountDelivered;
      },
      async delete(args: { where: { id: bigint } }) {
        const i = rows.findIndex((r) => r.id === args.where.id);
        if (i >= 0) rows.splice(i, 1);
      },
      async count(args: { where: Record<string, unknown> }) {
        return rows.filter((r) => rowMatches(r, args.where)).length;
      },
      async aggregate(args: { where: Record<string, unknown> }) {
        const sum = rows
          .filter((r) => rowMatches(r, args.where))
          .reduce((a, r) => a + r.amountDelivered, 0);
        return { _sum: { amountDelivered: sum } };
      },
    },
  };
  return {
    db: db as unknown as Prisma.TransactionClient,
    bags,
    rows,
  };
}

const CLIENT = BigInt(7);
const CAT = BigInt(3);

function bag(over: Partial<Bag> = {}): Bag {
  return {
    id: BigInt(1),
    clientId: CLIENT,
    categoryId: CAT,
    status: 'Pendiente',
    weight: 0,
    paymentAmount: 0,
    balanceApplied: 0,
    ...over,
  };
}

function row(
  id: bigint,
  deliverReceipId: bigint,
  originalProductId: string,
  amountDelivered: number
): Row {
  return { id, deliverReceipId, originalProductId, amountDelivered };
}

describe('addUnitsToOpenBag', () => {
  it('crea la bolsa (Pendiente, peso 0) si el cliente+categoría no tiene una', async () => {
    const { db, bags, rows } = fakeDb();
    const res = await addUnitsToOpenBag(db, {
      productId: 'p1',
      clientId: CLIENT,
      categoryId: CAT,
      amount: 2,
    });
    expect(res.created).toBe(true);
    expect(bags).toHaveLength(1);
    expect(bags[0]).toMatchObject({ status: 'Pendiente', weight: 0 });
    expect(rows).toEqual([
      expect.objectContaining({
        deliverReceipId: bags[0].id,
        originalProductId: 'p1',
        amountDelivered: 2,
      }),
    ]);
  });

  it('acumula en la misma fila si el producto ya está en la bolsa', async () => {
    const { db, rows } = fakeDb();
    const input = { productId: 'p1', clientId: CLIENT, categoryId: CAT };
    await addUnitsToOpenBag(db, { ...input, amount: 2 });
    const res = await addUnitsToOpenBag(db, { ...input, amount: 3 });
    expect(res.created).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0].amountDelivered).toBe(5);
  });

  it('ignora las bolsas cerradas (peso > 0) y abre otra', async () => {
    const closed = bag({ weight: 4.5 });
    const { db, bags } = fakeDb({ bags: [closed] });
    const res = await addUnitsToOpenBag(db, {
      productId: 'p1',
      clientId: CLIENT,
      categoryId: CAT,
      amount: 1,
    });
    expect(res.created).toBe(true);
    expect(res.bagId).not.toBe(closed.id);
    expect(bags).toHaveLength(2);
  });
});

describe('countUnitsInOpenBags / pullUnitsFromOpenBags', () => {
  function seeded() {
    return fakeDb({
      bags: [
        bag({ id: BigInt(1) }),
        bag({ id: BigInt(2) }),
        bag({ id: BigInt(3), weight: 2 }),
      ],
      rows: [
        row(BigInt(10), BigInt(1), 'p1', 3),
        row(BigInt(11), BigInt(2), 'p1', 2),
        row(BigInt(12), BigInt(3), 'p1', 5), // entrega ya pesada
        row(BigInt(13), BigInt(2), 'p2', 1),
      ],
    });
  }

  it('cuenta solo las unidades en bolsas abiertas', async () => {
    const { db } = seeded();
    const n = await countUnitsInOpenBags(db, {
      productId: 'p1',
      clientId: CLIENT,
      categoryId: CAT,
    });
    expect(n).toBe(5); // 3 + 2, sin las 5 de la entrega pesada
  });

  it('retira de las bolsas más nuevas primero y no toca entregas pesadas', async () => {
    const { db, rows } = seeded();
    const pulled = await pullUnitsFromOpenBags(db, {
      productId: 'p1',
      clientId: CLIENT,
      categoryId: CAT,
      amount: 4,
    });
    expect(pulled).toBe(4);
    // Bolsa 2 (más nueva): 2 → 0 (fila borrada); bolsa 1: 3 → 1.
    expect(rows.find((r) => r.id === BigInt(11))).toBeUndefined();
    expect(rows.find((r) => r.id === BigInt(10))?.amountDelivered).toBe(1);
    expect(rows.find((r) => r.id === BigInt(12))?.amountDelivered).toBe(5);
  });

  it('devuelve lo que pudo retirar cuando no alcanza y borra bolsas vacías', async () => {
    const { db, bags, rows } = seeded();
    // Sin p2, la bolsa 2 queda vacía tras retirar p1.
    rows.splice(
      rows.findIndex((r) => r.id === BigInt(13)),
      1
    );
    const pulled = await pullUnitsFromOpenBags(db, {
      productId: 'p1',
      clientId: CLIENT,
      categoryId: CAT,
      amount: 9,
    });
    expect(pulled).toBe(5);
    expect(bags.map((b) => b.id)).toEqual([BigInt(3)]);
  });
});

describe('deleteBagIfEmpty', () => {
  it('borra una bolsa abierta sin filas ni pagos', async () => {
    const { db, bags } = fakeDb({ bags: [bag()] });
    expect(await deleteBagIfEmpty(db, BigInt(1))).toBe(true);
    expect(bags).toHaveLength(0);
  });

  it('no borra si tiene filas, pagos o ya está pesada', async () => {
    const withRows = fakeDb({ bags: [bag()], rows: [row(BigInt(9), BigInt(1), 'p', 1)] });
    expect(await deleteBagIfEmpty(withRows.db, BigInt(1))).toBe(false);

    const paid = fakeDb({ bags: [bag({ paymentAmount: 10 })] });
    expect(await deleteBagIfEmpty(paid.db, BigInt(1))).toBe(false);

    const weighed = fakeDb({ bags: [bag({ weight: 1.2 })] });
    expect(await deleteBagIfEmpty(weighed.db, BigInt(1))).toBe(false);
    expect(weighed.bags).toHaveLength(1);
  });
});

describe('describeBags', () => {
  it('formatea el resumen para el toast', () => {
    expect(describeBags(undefined)).toBe('');
    expect(
      describeBags([
        {
          deliveryId: '1',
          clientName: 'Ana',
          categoryName: 'Ropa',
          units: 2,
          created: true,
        },
        {
          deliveryId: '2',
          clientName: 'Luis',
          categoryName: '',
          units: 1,
          created: false,
        },
      ])
    ).toBe('2 u. → Ropa · Ana (bolsa nueva) · 1 u. → Sin categoría · Luis');
  });
});
