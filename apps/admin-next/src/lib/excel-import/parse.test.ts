import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { normName, parseWorkbook } from './parse';

const ITEM_HEADERS = [
  'ID Pedido',
  'Cuenta',
  'Nro. Rastreo',
  'ID Paquete',
  'F. Compra',
  'F. Llegada',
  'Agente',
  'Cliente',
  'SKU',
  'Descripción',
  'Cantidad',
  'Valor Art.',
  'Coste',
  'Tienda',
] as const;

type Header = (typeof ITEM_HEADERS)[number];
type Cell = string | number | Date | null;

/** Libro mínimo con las hojas que espera el parser. */
function workbook(sheets: Record<string, Cell[][]>): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    for (const r of rows) ws.addRow(r);
  }
  return wb;
}

/** Fila de artículo con las 14 columnas en el orden de ITEM_HEADERS. */
function item(over: Partial<Record<Header, Cell>>): Cell[] {
  return ITEM_HEADERS.map((h) => over[h] ?? null);
}

const HEADERS: Cell[] = [...ITEM_HEADERS];
const BUY = new Date(Date.UTC(2026, 7, 3));

describe('normName', () => {
  it('normaliza acentos, mayúsculas y espacios', () => {
    expect(normName('  José   PÉREZ ')).toBe('jose perez');
  });
});

describe('parseWorkbook', () => {
  it('agrupa Shein por ID de pedido y toma el coste real de la fila Factura', () => {
    const wb = workbook({
      Shein: [
        HEADERS,
        item({
          'ID Pedido': 'S1',
          Cuenta: 'RS',
          Cliente: 'Factura',
          Descripción: 2,
          'Valor Art.': 30,
          Coste: 27.5,
          'F. Compra': BUY,
        }),
        item({
          'ID Pedido': 'S1',
          Agente: 'Ana',
          Cliente: 'Luis',
          SKU: 'A1',
          Descripción: 'Camisa',
          Cantidad: 1,
          'Valor Art.': 10,
        }),
        item({
          'ID Pedido': 'S1',
          Agente: 'Ana',
          Cliente: 'Luis',
          SKU: 'A2',
          Descripción: 'Pantalón',
          Cantidad: 2,
          'Valor Art.': 10,
        }),
        item({ Cliente: 'Venta', Descripción: 'interno', 'Valor Art.': 5 }),
      ],
    });
    const parsed = parseWorkbook(wb, 'AR&E Shipps #238.xlsx');

    expect(parsed.shipmentTag).toBe('#238');
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items.map((i) => i.groupKey)).toEqual([
      'Shein:S1',
      'Shein:S1',
    ]);
    expect(parsed.items[1].quantity).toBe(2);
    expect(parsed.receipts).toHaveLength(1);
    expect(parsed.receipts[0]).toMatchObject({
      origin: 'factura',
      storeName: 'Shein',
      storeOrderId: 'S1',
      account: 'RS',
      itemCount: 2,
      declaredValue: 30,
      realCost: 27.5,
      buyDate: BUY.toISOString(),
    });
    // La fila "Venta" es interna y se omite.
    expect(parsed.skipped.map((s) => s.reason)).toContain(
      'Fila interna "Venta"'
    );
    // Shein/Amazon/Temu siempre entran al catálogo de tiendas.
    expect(parsed.shops).toEqual(
      expect.arrayContaining(['Shein', 'Amazon', 'Temu'])
    );
    // La cuenta de compra se detecta con su tienda.
    expect(parsed.accounts).toEqual([{ name: 'RS', store: 'Shein' }]);
  });

  it('agrupa Temu secuencialmente bajo la Factura previa y cierra el grupo en filas vacías', () => {
    const wb = workbook({
      Temu: [
        HEADERS,
        item({
          Cuenta: 'TAD',
          Cliente: 'Factura',
          Descripción: 1,
          'Valor Art.': 20,
          Coste: 18,
        }),
        item({ Cliente: 'Marta', Descripción: 'Taza', Cantidad: 1, 'Valor Art.': 20 }),
        item({}), // separador: cierra el grupo
        item({ Cliente: 'Pedro', Descripción: 'Plato', Cantidad: 1, 'Valor Art.': 8 }),
      ],
    });
    const parsed = parseWorkbook(wb, 'x.xlsx');
    const [marta, pedro] = parsed.items;
    expect(marta.groupKey).toBe('Temu:r2');
    // Pedro no tiene Factura previa → aviso + compra automática.
    expect(pedro.groupKey).toBe('auto:Temu:temu:sin-cuenta:sin-fecha');
    expect(pedro.issues.map((i) => i.message)).toContain(
      'Sin fila Factura previa: se agrupará en una compra por tienda, cuenta y fecha.'
    );
    expect(parsed.receipts.map((r) => r.origin).sort()).toEqual([
      'auto',
      'factura',
    ]);
  });

  it('en Amazon la Factura es un agregado y los artículos se agrupan por tienda+cuenta+fecha', () => {
    const wb = workbook({
      Amazon: [
        HEADERS,
        item({ Cliente: 'Factura', 'Valor Art.': 99 }),
        item({
          Cuenta: 'iCloud',
          'F. Compra': BUY,
          Cliente: 'Eva',
          Descripción: 'Libro',
          Cantidad: 2,
          'Valor Art.': 12,
          Coste: 25,
        }),
        item({
          Cuenta: 'iCloud',
          'F. Compra': BUY,
          Cliente: 'Eva',
          Descripción: 'Cable',
          Cantidad: 1,
          'Valor Art.': 5,
        }),
        item({
          Cuenta: 'Otra',
          'F. Compra': BUY,
          Cliente: 'Eva',
          Descripción: 'Funda',
          'Valor Art.': 7,
        }),
      ],
    });
    const parsed = parseWorkbook(wb, 'x.xlsx');
    expect(parsed.skipped[0].reason).toBe('Fila de agregado global (derivada)');
    expect(parsed.receipts).toHaveLength(2);
    const icloud = parsed.receipts.find((r) => r.account === 'iCloud');
    expect(icloud).toMatchObject({
      origin: 'auto',
      storeName: 'Amazon',
      itemCount: 3, // 2 + 1
      declaredValue: 29, // 12×2 + 5
      realCost: 25,
    });
    // Sin cantidad → se asume 1 con aviso.
    const funda = parsed.items[2];
    expect(funda.quantity).toBe(1);
    expect(funda.issues.map((i) => i.message)).toContain(
      'Sin cantidad; se asume 1.'
    );
  });

  it('exige columna Tienda en "Otras 5%" y omite filas sin datos de artículo', () => {
    const wb = workbook({
      'Otras 5%': [
        HEADERS,
        item({ Cliente: 'Ana', Descripción: 'Reloj', 'Valor Art.': 40, Tienda: 'eBay' }),
        item({ Cliente: 'Ana', Descripción: 'Sin tienda', 'Valor Art.': 4 }),
        item({ Cliente: 'Ana' }),
      ],
    });
    const parsed = parseWorkbook(wb, 'x.xlsx');
    expect(parsed.items[0].storeName).toBe('eBay');
    expect(parsed.shops).toContain('eBay');
    expect(parsed.items[1].issues).toContainEqual({
      level: 'error',
      message: 'Sin tienda: no se puede crear el producto.',
    });
    expect(parsed.skipped.map((s) => s.reason)).toContain(
      'Fila sin datos de artículo'
    );
  });

  it('lee agentes, clientes, tarifas, tiendas y gastos de las hojas de catálogo', () => {
    const wb = workbook({
      Shein: [
        HEADERS,
        item({
          'ID Pedido': 'S9',
          Agente: 'Ana',
          Cliente: 'Nuevo Cliente',
          Descripción: 'X',
          'Valor Art.': 1,
        }),
      ],
      'Agente-Cliente': [
        ['Ana', 'Beto', 'Otros', 'Columna4'],
        ['Luis', 'Marta', 'Venta', null],
        ['Pedro', 'Luis', null, null], // Luis repetido bajo Beto → aviso
      ],
      ConfiguracionAG: [
        [null, 'Agente', 'Tarifa'],
        [null, 'Ana', 2.5],
        [null, 'Carla', 3], // no está en el registro → se añade
        [null, 'Otros', 9],
      ],
      Tiendas: [
        [null, 'Nombre de tienda'],
        [null, 'Shein'],
        [null, 'Walmart'],
      ],
      General: [
        [null, 'Gastos', 'Monto'],
        [null, 'Encabezado', null],
        [null, 'Libras pagadas', 120],
        [null, 'Transporte', 30],
        [null, 'Pago Juan', 50],
        [null, 'Total de Gastos', 200],
      ],
    });
    const parsed = parseWorkbook(wb, 'x.xlsx');

    expect(parsed.agents).toEqual([
      { name: 'Ana', ratePerPound: 2.5 },
      { name: 'Beto', ratePerPound: null },
      { name: 'Carla', ratePerPound: 3 },
    ]);
    expect(parsed.clients).toEqual([
      { name: 'Luis', agent: 'Ana', inRegistry: true },
      { name: 'Marta', agent: 'Beto', inRegistry: true },
      { name: 'Pedro', agent: 'Ana', inRegistry: true },
      { name: 'Nuevo Cliente', agent: 'Ana', inRegistry: false },
    ]);
    const messages = parsed.globalIssues.map((i) => i.message);
    expect(messages).toContain(
      'Cliente "Luis" aparece bajo dos agentes (Ana y Beto); se usará Ana.'
    );
    expect(messages).toContain(
      'Cliente "Nuevo Cliente" (Shein fila 2) no está en la hoja Agente-Cliente.'
    );
    expect(parsed.shops).toEqual(['Shein', 'Walmart', 'Amazon', 'Temu']);
    expect(parsed.expenses).toEqual([
      { uid: 'General:r3', label: 'Libras pagadas', amount: 120, category: 'Envio' },
      { uid: 'General:r4', label: 'Transporte', amount: 30, category: 'Operativo' },
      { uid: 'General:r5', label: 'Pago Juan', amount: 50, category: 'Sueldo' },
    ]);
  });

  it('marca error si no hay hoja de artículos o faltan las columnas Cliente/Valor', () => {
    const empty = parseWorkbook(workbook({ Otra: [['a']] }), 'x.xlsx');
    expect(empty.globalIssues.some((i) => i.level === 'error')).toBe(true);
    expect(empty.items).toHaveLength(0);

    const noCols = parseWorkbook(
      workbook({ Shein: [['Cliente', 'Nada']] }),
      'x.xlsx'
    );
    expect(noCols.globalIssues.map((i) => i.message)).toContain(
      'Hoja "Shein": no se encontraron las columnas Cliente/Valor; se omite la hoja completa.'
    );
  });
});
