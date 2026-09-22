/**
 * Helpers puros del checklist de productos (compras por tienda, llegadas
 * de un paquete, armado de entregas). Sin React ni Prisma: la selección
 * es un mapa itemId → unidades (> 0) y todas las operaciones devuelven
 * un mapa nuevo, para que el componente sea un simple controlado.
 */

export interface ChecklistItem {
  /** Identificador estable (productId). */
  id: string;
  name: string;
  /** Tope de unidades marcables (pendiente de comprar / por llegar…). */
  max: number;
  /** Línea secundaria: "Orden #12 · SKU-1". */
  subtitle?: string;
  /** Línea de cantidades: "Pendientes 3 de 5 pedidas". */
  meta?: string;
  /** Enlace asociado (la orden); se abre sin alternar la marca. */
  href?: string;
  /** Si viene, la fila no es marcable y se muestra el motivo. */
  disabledReason?: string;
}

export interface ChecklistGroup {
  /** Identificador estable (clientId, categoryId…). */
  id: string;
  label: string;
  hint?: string;
  items: ChecklistItem[];
}

/** itemId → unidades marcadas (siempre > 0). */
export type ChecklistSelection = Record<string, number>;

export function clampQty(qty: number, max: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(max, Math.floor(qty)));
}

function markable(item: ChecklistItem): boolean {
  return item.max > 0 && !item.disabledReason;
}

/** Marca con el tope, o desmarca si ya estaba marcada. */
export function toggleItem(
  sel: ChecklistSelection,
  item: ChecklistItem
): ChecklistSelection {
  const next = { ...sel };
  if (next[item.id]) {
    delete next[item.id];
  } else if (markable(item)) {
    next[item.id] = item.max;
  }
  return next;
}

export function setItemQty(
  sel: ChecklistSelection,
  item: ChecklistItem,
  qty: number
): ChecklistSelection {
  if (!markable(item)) return sel;
  return { ...sel, [item.id]: clampQty(qty, item.max) };
}

export function setGroup(
  sel: ChecklistSelection,
  group: ChecklistGroup,
  mode: 'all' | 'none'
): ChecklistSelection {
  const next = { ...sel };
  for (const item of group.items) {
    if (mode === 'none') {
      delete next[item.id];
    } else if (markable(item) && !next[item.id]) {
      next[item.id] = item.max;
    }
  }
  return next;
}

export function groupState(
  group: ChecklistGroup,
  sel: ChecklistSelection
): 'none' | 'some' | 'all' {
  const candidates = group.items.filter(markable);
  if (candidates.length === 0) return 'none';
  const marked = candidates.filter((i) => (sel[i.id] ?? 0) > 0).length;
  if (marked === 0) return 'none';
  return marked === candidates.length ? 'all' : 'some';
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Filtra por nombre, subtítulo y etiqueta del grupo (sin acentos ni mayúsculas). */
export function filterGroups(
  groups: ChecklistGroup[],
  query: string
): ChecklistGroup[] {
  const q = normalize(query.trim());
  if (!q) return groups;
  const out: ChecklistGroup[] = [];
  for (const group of groups) {
    if (normalize(group.label).includes(q)) {
      out.push(group);
      continue;
    }
    const items = group.items.filter(
      (i) =>
        normalize(i.name).includes(q) ||
        (i.subtitle ? normalize(i.subtitle).includes(q) : false)
    );
    if (items.length > 0) out.push({ ...group, items });
  }
  return out;
}

export interface ChecklistSummary {
  items: number;
  units: number;
  perGroup: Record<string, { items: number; units: number }>;
}

export function summarize(
  groups: ChecklistGroup[],
  sel: ChecklistSelection
): ChecklistSummary {
  const summary: ChecklistSummary = { items: 0, units: 0, perGroup: {} };
  for (const group of groups) {
    let items = 0;
    let units = 0;
    for (const item of group.items) {
      const qty = sel[item.id] ?? 0;
      if (qty > 0) {
        items += 1;
        units += qty;
      }
    }
    summary.perGroup[group.id] = { items, units };
    summary.items += items;
    summary.units += units;
  }
  return summary;
}

/**
 * Tras un refresh los topes pueden bajar o desaparecer filas: quita los
 * ids ausentes y recorta cada cantidad a su tope actual.
 */
export function pruneSelection(
  sel: ChecklistSelection,
  groups: ChecklistGroup[]
): ChecklistSelection {
  const byId = new Map<string, ChecklistItem>();
  for (const group of groups) {
    for (const item of group.items) byId.set(item.id, item);
  }
  const next: ChecklistSelection = {};
  for (const [id, qty] of Object.entries(sel)) {
    const item = byId.get(id);
    if (!item || !markable(item)) continue;
    next[id] = clampQty(qty, item.max);
  }
  return next;
}

/** Selección como lista de ítems para enviar a una action. */
export function pickedItems(
  sel: ChecklistSelection
): { productId: string; amount: number }[] {
  return Object.entries(sel)
    .filter(([, qty]) => qty > 0)
    .map(([productId, amount]) => ({ productId, amount }));
}
