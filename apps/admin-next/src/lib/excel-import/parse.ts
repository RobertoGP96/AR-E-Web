import type { Workbook, Worksheet, Row, CellValue } from 'exceljs';

import type {
  ImportSheet,
  ParsedAgent,
  ParsedClient,
  ParsedExpense,
  ParsedItemRow,
  ParsedReceiptGroup,
  ParsedWorkbook,
  RowIssue,
  SkippedRow,
} from './types';

/**
 * Parser puro del libro "AR&E Shipps #NNN.xlsx" — no toca la base de
 * datos. Extrae los datos de entrada manual y descarta lo derivado
 * (las columnas Cobro/Profit/CONT y las hojas de agregados se
 * recalculan en el sistema).
 *
 * Estructura esperada del libro:
 *  - Hojas de artículos: Shein, Amazon, Temu, "Otras 5%". Las filas con
 *    Cliente="Factura" son el pedido real en la tienda (coste pagado);
 *    Venta/Lost/Lost-R son pseudo-clientes internos y se omiten.
 *  - Agente-Cliente: columna por agente con sus clientes (registro maestro).
 *  - ConfiguracionAG: dólar por libra de cada agente.
 *  - Tiendas: catálogo de tiendas.
 *  - General: celdas de gastos del período.
 */

// --- helpers de celdas ------------------------------------------------------

type Primitive = string | number | boolean | Date | null;

function rawVal(v: CellValue): Primitive {
  if (v == null) return null;
  if (typeof v === 'object') {
    if (v instanceof Date) return v;
    if ('richText' in v) return v.richText.map((r) => r.text).join('');
    if ('hyperlink' in v) return typeof v.text === 'string' ? v.text : null;
    if ('error' in v) return null;
    if ('formula' in v || 'sharedFormula' in v) {
      const res = (v as { result?: unknown }).result;
      if (res == null) return null;
      if (res instanceof Date) return res;
      if (typeof res === 'object') return null; // {error: '#REF!'} y similares
      return res as string | number | boolean;
    }
    return null;
  }
  return v;
}

function str(row: Row, col: number): string | null {
  if (!col) return null;
  const v = rawVal(row.getCell(col).value);
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function num(row: Row, col: number): number | null {
  if (!col) return null;
  const v = rawVal(row.getCell(col).value);
  if (v == null || v instanceof Date) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function dateISO(row: Row, col: number): string | null {
  if (!col) return null;
  const v = rawVal(row.getCell(col).value);
  return v instanceof Date ? v.toISOString() : null;
}

/** Clave de comparación: minúsculas, sin acentos, espacios colapsados. */
export function normName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const PSEUDO_CLIENTS = new Set(['factura', 'venta', 'lost', 'lost-r', 'lost r']);

function isPseudo(name: string): boolean {
  return PSEUDO_CLIENTS.has(normName(name));
}

// --- localización de columnas por cabecera ---------------------------------

function headerKey(s: string): string {
  return normName(s).replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function headerMap(ws: Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const v = rawVal(cell.value);
    if (v == null) return;
    const key = headerKey(String(v));
    if (key && !map.has(key)) map.set(key, col);
  });
  return map;
}

function col(map: Map<string, number>, ...aliases: string[]): number {
  for (const a of aliases) {
    const idx = map.get(a);
    if (idx) return idx;
  }
  return 0;
}

// --- hojas de artículos -----------------------------------------------------

interface SheetSpec {
  sheet: ImportSheet;
  /** Tienda fija de la hoja; null → columna Tienda por fila. */
  store: string | null;
  /** Cómo se agrupan las filas en pedidos reales (recibos de compra). */
  grouping: 'orderId' | 'sequential' | 'none';
}

const SHEET_SPECS: SheetSpec[] = [
  { sheet: 'Shein', store: 'Shein', grouping: 'orderId' },
  { sheet: 'Temu', store: 'Temu', grouping: 'sequential' },
  { sheet: 'Amazon', store: 'Amazon', grouping: 'none' },
  { sheet: 'Otras 5%', store: null, grouping: 'none' },
];

interface SheetOutput {
  items: ParsedItemRow[];
  receipts: ParsedReceiptGroup[];
  skipped: SkippedRow[];
  issues: RowIssue[];
}

function parseItemsSheet(ws: Worksheet, spec: SheetSpec): SheetOutput {
  const h = headerMap(ws);
  const C = {
    orderId: col(h, 'id pedido'),
    account: col(h, 'cuenta'),
    tracking: col(h, 'nro rastreo', 'no rastreo', 'numero de rastreo'),
    pkg: col(h, 'id paquete'),
    buyDate: col(h, 'f compra', 'fecha compra'),
    arrival: col(h, 'f llegada', 'fecha llegada'),
    agent: col(h, 'agente'),
    client: col(h, 'cliente'),
    sku: col(h, 'sku'),
    desc: col(h, 'descripcion'),
    qty: col(h, 'cantidad'),
    value: col(h, 'valor art', 'valor articulo'),
    cost: col(h, 'coste', 'costo'),
    store: col(h, 'tienda'),
  };

  const out: SheetOutput = { items: [], receipts: [], skipped: [], issues: [] };

  if (!C.client || !C.value) {
    out.issues.push({
      level: 'error',
      message: `Hoja "${ws.name}": no se encontraron las columnas Cliente/Valor; se omite la hoja completa.`,
    });
    return out;
  }

  const groups = new Map<string, ParsedReceiptGroup>();
  let currentGroup: ParsedReceiptGroup | null = null;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const clientRaw = str(row, C.client);
    const account = str(row, C.account);
    const tracking = str(row, C.tracking);
    const desc = str(row, C.desc);
    const value = num(row, C.value);

    if (!clientRaw) {
      // Fila plantilla/separadora: cierra el grupo secuencial abierto.
      if (
        spec.grouping === 'sequential' &&
        !account &&
        !tracking &&
        !desc &&
        value == null
      ) {
        currentGroup = null;
      }
      continue;
    }

    if (normName(clientRaw) === 'factura') {
      // Pedido real en la tienda: su Coste es lo pagado de verdad.
      if (spec.grouping === 'orderId') {
        const orderId = str(row, C.orderId);
        if (!orderId) {
          out.skipped.push({
            sheet: spec.sheet,
            rowNumber: r,
            reason: 'Fila Factura sin ID de pedido',
            preview: `${desc ?? ''} ${value ?? ''}`.trim(),
          });
          continue;
        }
        const key = `${spec.sheet}:${orderId}`;
        const group: ParsedReceiptGroup = {
          key,
          sheet: spec.sheet,
          origin: 'factura',
          storeName: spec.store ?? spec.sheet,
          storeOrderId: orderId,
          account,
          buyDate: dateISO(row, C.buyDate),
          // En las filas Factura el conteo viaja en la columna Descripción.
          itemCount: num(row, C.desc),
          declaredValue: value,
          realCost: num(row, C.cost),
        };
        groups.set(key, group);
      } else if (spec.grouping === 'sequential') {
        const key = `${spec.sheet}:r${r}`;
        currentGroup = {
          key,
          sheet: spec.sheet,
          origin: 'factura',
          storeName: spec.store ?? spec.sheet,
          storeOrderId: null,
          account,
          buyDate: dateISO(row, C.buyDate),
          itemCount: num(row, C.desc),
          declaredValue: value,
          realCost: num(row, C.cost),
        };
        groups.set(key, currentGroup);
      } else {
        // Amazon/Otras: la fila Factura es un agregado derivado, no un pedido.
        out.skipped.push({
          sheet: spec.sheet,
          rowNumber: r,
          reason: 'Fila de agregado global (derivada)',
          preview: `Valor ${value ?? '—'}`,
        });
      }
      continue;
    }

    if (isPseudo(clientRaw)) {
      out.skipped.push({
        sheet: spec.sheet,
        rowNumber: r,
        reason: `Fila interna "${clientRaw}"`,
        preview: [desc, value].filter((x) => x != null).join(' · '),
      });
      continue;
    }

    // ------- fila de artículo real -------
    const sku = str(row, C.sku);
    const packageLabel = str(row, C.pkg);
    if (!desc && !sku && value == null && !packageLabel && !tracking) {
      // Fila de solo contador (cliente sin ningún dato de artículo).
      out.skipped.push({
        sheet: spec.sheet,
        rowNumber: r,
        reason: 'Fila sin datos de artículo',
        preview: clientRaw,
      });
      continue;
    }

    const issues: RowIssue[] = [];
    const qtyRaw = num(row, C.qty);
    const quantity = qtyRaw != null && qtyRaw >= 1 ? Math.round(qtyRaw) : 1;
    if (qtyRaw == null) {
      issues.push({ level: 'warning', message: 'Sin cantidad; se asume 1.' });
    }
    if (value == null) {
      issues.push({
        level: 'warning',
        message: 'Sin valor de artículo; se importará con costo 0.',
      });
    }
    if (!desc && !sku) {
      issues.push({ level: 'warning', message: 'Sin descripción ni SKU.' });
    }

    let storeName = spec.store;
    if (!storeName) {
      storeName = str(row, C.store);
      if (!storeName) {
        issues.push({
          level: 'error',
          message: 'Sin tienda: no se puede crear el producto.',
        });
      }
    }

    let groupKey: string | null = null;
    if (spec.grouping === 'orderId') {
      const orderId = str(row, C.orderId);
      if (orderId) {
        groupKey = `${spec.sheet}:${orderId}`;
        if (!groups.has(groupKey)) {
          // Pedido sin fila Factura: crear el grupo desde la propia fila.
          groups.set(groupKey, {
            key: groupKey,
            sheet: spec.sheet,
            origin: 'factura',
            storeName: storeName ?? spec.sheet,
            storeOrderId: orderId,
            account,
            buyDate: dateISO(row, C.buyDate),
            itemCount: null,
            declaredValue: null,
            realCost: null,
          });
        }
      } else {
        issues.push({
          level: 'warning',
          message:
            'Sin ID de pedido: se agrupará en una compra por tienda, cuenta y fecha.',
        });
      }
    } else if (spec.grouping === 'sequential') {
      if (currentGroup) {
        groupKey = currentGroup.key;
        if (!currentGroup.account && account) currentGroup.account = account;
        if (!currentGroup.buyDate) {
          currentGroup.buyDate = dateISO(row, C.buyDate);
        }
      } else {
        issues.push({
          level: 'warning',
          message:
            'Sin fila Factura previa: se agrupará en una compra por tienda, cuenta y fecha.',
        });
      }
    }

    const agentRaw = str(row, C.agent);
    const agent = agentRaw && normName(agentRaw) !== 'otros' ? agentRaw : null;

    out.items.push({
      uid: `${spec.sheet}:${r}`,
      sheet: spec.sheet,
      rowNumber: r,
      storeName,
      storeOrderId: str(row, C.orderId),
      groupKey,
      account,
      tracking,
      packageLabel,
      buyDate: dateISO(row, C.buyDate),
      arrivalDate: dateISO(row, C.arrival),
      agent,
      client: clientRaw,
      sku,
      description: desc,
      quantity,
      unitValue: value,
      rowCost: num(row, C.cost),
      issues,
    });
  }

  // Agrupación de respaldo: las filas sin pedido explícito (Amazon,
  // "Otras 5%" y filas sueltas de Shein/Temu) se agrupan en compras por
  // tienda + cuenta + fecha de compra, para que ningún producto quede
  // fuera del ciclo compra → paquete → entrega.
  for (const item of out.items) {
    if (item.groupKey || !item.storeName) continue;
    const storeKey = normName(item.storeName).slice(0, 40);
    const accountKey = item.account
      ? normName(item.account).slice(0, 40)
      : 'sin-cuenta';
    const dateKey = item.buyDate ? item.buyDate.slice(0, 10) : 'sin-fecha';
    const key = `auto:${spec.sheet}:${storeKey}:${accountKey}:${dateKey}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        sheet: spec.sheet,
        origin: 'auto',
        storeName: item.storeName,
        storeOrderId: null,
        account: item.account,
        buyDate: item.buyDate,
        itemCount: 0,
        declaredValue: null,
        realCost: null,
      };
      groups.set(key, group);
    }
    item.groupKey = key;
    group.itemCount = (group.itemCount ?? 0) + item.quantity;
    if (item.unitValue != null) {
      group.declaredValue =
        (group.declaredValue ?? 0) + item.unitValue * item.quantity;
    }
    if (item.rowCost != null) {
      group.realCost = (group.realCost ?? 0) + item.rowCost;
    }
  }

  out.receipts = [...groups.values()];
  return out;
}

// --- catálogos --------------------------------------------------------------

function parseAgentsAndClients(
  wb: Workbook,
  issues: RowIssue[]
): { agents: ParsedAgent[]; clients: ParsedClient[] } {
  const agents: ParsedAgent[] = [];
  const clients: ParsedClient[] = [];
  const clientSeen = new Map<string, ParsedClient>();

  const registry = wb.worksheets.find(
    (w) => normName(w.name) === 'agente-cliente'
  );
  if (!registry) {
    issues.push({
      level: 'warning',
      message:
        'No existe la hoja "Agente-Cliente": los clientes se tomarán solo de las filas de artículos.',
    });
  } else {
    const headerRow = registry.getRow(1);
    const agentCols: { col: number; name: string }[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const v = rawVal(cell.value);
      if (v == null) return;
      const name = String(v).trim();
      if (!name || /^columna\d*$/i.test(name)) return;
      if (normName(name) === 'otros') return; // pseudo-agente interno
      agentCols.push({ col: colNumber, name });
    });

    for (const a of agentCols) {
      agents.push({ name: a.name, ratePerPound: null });
    }

    for (let r = 2; r <= registry.rowCount; r++) {
      const row = registry.getRow(r);
      for (const a of agentCols) {
        const v = str(row, a.col);
        if (!v || v === '0' || isPseudo(v)) continue;
        const key = normName(v);
        const prev = clientSeen.get(key);
        if (prev) {
          if (prev.agent !== a.name) {
            issues.push({
              level: 'warning',
              message: `Cliente "${v}" aparece bajo dos agentes (${prev.agent} y ${a.name}); se usará ${prev.agent}.`,
            });
          }
          continue;
        }
        const entry: ParsedClient = { name: v, agent: a.name, inRegistry: true };
        clientSeen.set(key, entry);
        clients.push(entry);
      }
    }
  }

  // Tarifas por libra (ConfiguracionAG).
  const cfg = wb.worksheets.find(
    (w) => normName(w.name) === 'configuracionag'
  );
  if (cfg) {
    const byName = new Map(agents.map((a) => [normName(a.name), a]));
    for (let r = 2; r <= cfg.rowCount; r++) {
      const row = cfg.getRow(r);
      // La hoja usa las columnas B (agente) y C (tarifa).
      const name = str(row, 2);
      const rate = num(row, 3);
      if (!name || rate == null || rate <= 0) continue;
      if (/^columna\d*$/i.test(name) || normName(name) === 'otros') continue;
      const agent = byName.get(normName(name));
      if (agent) agent.ratePerPound = rate;
      else {
        agents.push({ name, ratePerPound: rate });
        byName.set(normName(name), agents[agents.length - 1]);
      }
    }
  }

  return { agents, clients };
}

function parseShops(wb: Workbook): string[] {
  const shops: string[] = [];
  const seen = new Set<string>();
  const push = (name: string | null) => {
    if (!name) return;
    const key = normName(name);
    if (!key || key === '0' || seen.has(key)) return;
    seen.add(key);
    shops.push(name);
  };

  const ws = wb.worksheets.find((w) => normName(w.name) === 'tiendas');
  if (ws) {
    for (let r = 2; r <= ws.rowCount; r++) {
      const v = str(ws.getRow(r), 2);
      if (v && normName(v) !== 'nombre de tienda') push(v);
    }
  }
  return shops;
}

/** Celdas de gastos manuales de la hoja General (columnas B/C). */
const EXPENSE_CATEGORY_BY_LABEL: [RegExp, string][] = [
  [/libras?\s+pagadas?/i, 'Envio'],
  [/transporte/i, 'Operativo'],
  [/^pago\s+/i, 'Sueldo'],
  [/materiales/i, 'Operativo'],
];

function parseExpenses(wb: Workbook): ParsedExpense[] {
  const ws = wb.worksheets.find((w) => normName(w.name) === 'general');
  if (!ws) return [];
  const out: ParsedExpense[] = [];
  for (let r = 3; r <= Math.min(ws.rowCount, 10); r++) {
    const row = ws.getRow(r);
    const label = str(row, 2);
    const amount = num(row, 3);
    if (!label || amount == null || amount <= 0) continue;
    if (/total/i.test(label)) continue; // "Total de Gastos" es fórmula
    const category =
      EXPENSE_CATEGORY_BY_LABEL.find(([re]) => re.test(label))?.[1] ?? 'Otro';
    out.push({ uid: `General:r${r}`, label, amount, category });
  }
  return out;
}

// --- entrada principal ------------------------------------------------------

export function parseWorkbook(wb: Workbook, fileName: string): ParsedWorkbook {
  const globalIssues: RowIssue[] = [];
  const items: ParsedItemRow[] = [];
  const receipts: ParsedReceiptGroup[] = [];
  const skipped: SkippedRow[] = [];

  let productSheets = 0;
  for (const spec of SHEET_SPECS) {
    const ws = wb.worksheets.find(
      (w) => normName(w.name) === normName(spec.sheet)
    );
    if (!ws) {
      globalIssues.push({
        level: 'warning',
        message: `El libro no tiene la hoja "${spec.sheet}".`,
      });
      continue;
    }
    productSheets++;
    const parsed = parseItemsSheet(ws, spec);
    items.push(...parsed.items);
    receipts.push(...parsed.receipts);
    skipped.push(...parsed.skipped);
    globalIssues.push(...parsed.issues);
  }

  if (productSheets === 0) {
    globalIssues.push({
      level: 'error',
      message:
        'El archivo no contiene ninguna hoja de artículos (Shein, Amazon, Temu, Otras 5%). ¿Es un libro de embarque AR&E?',
    });
  }

  const { agents, clients } = parseAgentsAndClients(wb, globalIssues);

  // Clientes que aparecen en filas pero no están en el registro maestro.
  const registered = new Set(clients.map((c) => normName(c.name)));
  for (const item of items) {
    const key = normName(item.client);
    if (registered.has(key)) continue;
    registered.add(key);
    clients.push({ name: item.client, agent: item.agent, inRegistry: false });
    globalIssues.push({
      level: 'warning',
      message: `Cliente "${item.client}" (${item.sheet} fila ${item.rowNumber}) no está en la hoja Agente-Cliente.`,
    });
  }

  // Tiendas: catálogo + las fijas de las hojas + las de "Otras 5%".
  const shops = parseShops(wb);
  const shopKeys = new Set(shops.map(normName));
  for (const name of ['Shein', 'Amazon', 'Temu']) {
    if (!shopKeys.has(normName(name))) {
      shops.push(name);
      shopKeys.add(normName(name));
    }
  }
  for (const item of items) {
    if (item.storeName && !shopKeys.has(normName(item.storeName))) {
      shops.push(item.storeName);
      shopKeys.add(normName(item.storeName));
    }
  }

  // Cuentas de compra con su tienda.
  const accountSeen = new Map<string, { name: string; store: string }>();
  const noteAccount = (name: string | null, store: string | null) => {
    if (!name || !store) return;
    const key = `${normName(store)}::${normName(name)}`;
    if (!accountSeen.has(key)) accountSeen.set(key, { name, store });
  };
  for (const g of receipts) noteAccount(g.account, g.storeName);
  for (const item of items) noteAccount(item.account, item.storeName);

  return {
    fileName,
    shipmentTag: fileName.match(/#\s*\d+/)?.[0]?.replace(/\s+/g, '') ?? null,
    shops,
    agents,
    clients,
    accounts: [...accountSeen.values()],
    items,
    receipts,
    expenses: parseExpenses(wb),
    skipped,
    globalIssues,
  };
}
