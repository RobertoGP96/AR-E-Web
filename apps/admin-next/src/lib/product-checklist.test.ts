import { describe, expect, it } from 'vitest';
import {
  clampQty,
  filterGroups,
  groupState,
  pickedItems,
  pruneSelection,
  setGroup,
  setItemQty,
  summarize,
  toggleItem,
  type ChecklistGroup,
} from './product-checklist';

const groups: ChecklistGroup[] = [
  {
    id: 'c1',
    label: 'Ana Pérez',
    items: [
      { id: 'p1', name: 'Zapatos', max: 3, subtitle: 'Orden #1' },
      { id: 'p2', name: 'Camisa', max: 1 },
      { id: 'p3', name: 'Sin cat', max: 2, disabledReason: 'Sin categoría' },
    ],
  },
  {
    id: 'c2',
    label: 'Luis Gómez',
    items: [{ id: 'p4', name: 'Bolso', max: 5 }],
  },
];

describe('product-checklist helpers', () => {
  it('clampQty keeps 1..max integers', () => {
    expect(clampQty(0, 3)).toBe(1);
    expect(clampQty(7, 3)).toBe(3);
    expect(clampQty(2.9, 3)).toBe(2);
    expect(clampQty(Number.NaN, 3)).toBe(1);
  });

  it('toggleItem marks with max and unmarks', () => {
    const a = toggleItem({}, groups[0].items[0]);
    expect(a).toEqual({ p1: 3 });
    expect(toggleItem(a, groups[0].items[0])).toEqual({});
  });

  it('toggleItem ignores disabled items', () => {
    expect(toggleItem({}, groups[0].items[2])).toEqual({});
  });

  it('setItemQty clamps to max', () => {
    expect(setItemQty({}, groups[0].items[0], 9)).toEqual({ p1: 3 });
    expect(setItemQty({}, groups[0].items[2], 1)).toEqual({});
  });

  it('setGroup all/none skips disabled and keeps other groups', () => {
    const all = setGroup({ p4: 2 }, groups[0], 'all');
    expect(all).toEqual({ p4: 2, p1: 3, p2: 1 });
    expect(groupState(groups[0], all)).toBe('all');
    expect(groupState(groups[0], { p1: 1 })).toBe('some');
    expect(setGroup(all, groups[0], 'none')).toEqual({ p4: 2 });
  });

  it('filterGroups matches name, subtitle and group label without accents', () => {
    expect(filterGroups(groups, 'perez')).toHaveLength(1);
    expect(filterGroups(groups, 'orden #1')[0].items.map((i) => i.id)).toEqual(['p1']);
    expect(filterGroups(groups, 'bolso')[0].id).toBe('c2');
    expect(filterGroups(groups, '')).toBe(groups);
  });

  it('summarize counts items and units per group', () => {
    const s = summarize(groups, { p1: 2, p4: 5 });
    expect(s.items).toBe(2);
    expect(s.units).toBe(7);
    expect(s.perGroup.c1).toEqual({ items: 1, units: 2 });
  });

  it('pruneSelection drops unknown ids and clamps', () => {
    expect(pruneSelection({ p1: 9, zz: 1, p3: 1 }, groups)).toEqual({ p1: 3 });
  });

  it('pickedItems converts to action payload', () => {
    expect(pickedItems({ p1: 2, p4: 1 })).toEqual([
      { productId: 'p1', amount: 2 },
      { productId: 'p4', amount: 1 },
    ]);
  });
});
