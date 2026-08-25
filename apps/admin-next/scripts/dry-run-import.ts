/**
 * Dry-run del flujo completo de importación SIN escribir en la base de
 * datos: parsea el libro, lo contrasta con la BD (solo lecturas), arma
 * el payload como lo haría la vista (todo seleccionado) y lo valida con
 * el esquema Zod del servidor.
 *
 *   npx tsx scripts/dry-run-import.ts "C:\ruta\AR&E Shipps #238.xlsx"
 */
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  const [{ default: ExcelJS }, { parseWorkbook }, { analyzeWorkbook }, schema] =
    await Promise.all([
      import('exceljs'),
      import('../src/lib/excel-import/parse'),
      import('../src/lib/excel-import/analyze'),
      import('../src/app/(admin)/import/schema'),
    ]);

  const file = process.argv[2];
  if (!file) {
    console.error('Uso: npx tsx scripts/dry-run-import.ts <archivo.xlsx>');
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const parsed0 = parseWorkbook(wb, path.basename(file));

  let analysis;
  try {
    analysis = await analyzeWorkbook(parsed0);
  } catch {
    // Sin base de datos alcanzable (p.ej. .env.local con URL dummy):
    // análisis "offline" donde todo cuenta como nuevo, suficiente para
    // validar parser + payload + esquema.
    console.warn(
      '! BD no alcanzable: análisis offline (todo se considera nuevo).'
    );
    const { computeProductCost } = await import('../src/lib/order-cost');
    const { shopTaxesFor } = await import('../src/lib/excel-import/analyze');
    analysis = {
      fileName: parsed0.fileName,
      shipmentTag: parsed0.shipmentTag,
      shops: parsed0.shops.map((name) => ({
        name,
        status: 'new' as const,
        existingId: null,
        used: true,
      })),
      agents: parsed0.agents.map((a) => ({
        ...a,
        status: 'new' as const,
        existingId: null,
        existingRole: null,
      })),
      clients: parsed0.clients.map((c) => ({
        ...c,
        status: 'new' as const,
        existingId: null,
        similar: [],
        itemCount: 0,
      })),
      accounts: parsed0.accounts.map((a) => ({
        ...a,
        status: 'new' as const,
        existingId: null,
      })),
      items: parsed0.items.map((item) => {
        const shopTaxes = shopTaxesFor(item.sheet, item.storeName);
        const cost = computeProductCost({
          shopCost: item.unitValue ?? 0,
          amountRequested: item.quantity,
          shopDeliveryCost: 0,
          shopTaxes,
          chargeIva: true,
          addedTaxes: 0,
          ownTaxes: 0,
        });
        return {
          ...item,
          computed: { shopTaxes, totalCost: cost.totalCost },
          hasError: item.issues.some((i) => i.level === 'error'),
        };
      }),
      receipts: parsed0.receipts,
      expenses: parsed0.expenses,
      skipped: parsed0.skipped,
      globalIssues: parsed0.globalIssues,
      alreadyImported: false,
    };
  }

  console.log('=== ANÁLISIS (contra BD real, solo lectura) ===');
  console.log('Ya importado antes:', analysis.alreadyImported);
  console.log(
    'Tiendas usadas:',
    analysis.shops
      .filter((s) => s.used)
      .map((s) => `${s.name}[${s.status}]`)
      .join(', ')
  );
  console.log(
    'Cuentas:',
    analysis.accounts.map((a) => `${a.name}@${a.store}[${a.status}]`).join(', ')
  );
  console.log(
    'Agentes:',
    analysis.agents
      .map((a) => `${a.name}[${a.status}${a.existingRole ? ':' + a.existingRole : ''}]`)
      .join(', ')
  );
  const newClients = analysis.clients.filter((c) => c.status === 'new');
  const existing = analysis.clients.filter((c) => c.status === 'existing');
  const withSimilar = newClients.filter((c) => c.similar.length > 0);
  console.log(
    `Clientes: ${analysis.clients.length} (nuevos ${newClients.length}, existentes ${existing.length}, con similares ${withSimilar.length})`
  );
  for (const c of withSimilar.slice(0, 10)) {
    console.log(
      `  ~ "${c.name}" se parece a: ${c.similar.map((s) => s.fullName).join(' | ')}`
    );
  }
  const importable = analysis.items.filter((i) => !i.hasError);
  console.log(
    `Items importables: ${importable.length}/${analysis.items.length} · costo sistema total: $${importable
      .reduce((a, i) => a + i.computed.totalCost, 0)
      .toFixed(2)}`
  );

  // Payload como lo armaría la vista con todo seleccionado.
  const payload = {
    fileName: analysis.fileName,
    shipmentTag: analysis.shipmentTag,
    agents: analysis.agents.map((a) => ({
      name: a.name,
      ratePerPound: a.ratePerPound,
    })),
    clients: analysis.clients.map((c) => ({
      name: c.name,
      agent: c.agent,
      mode: (c.existingId ? 'existing' : 'new') as 'existing' | 'new',
      existingId: c.existingId,
    })),
    items: importable.map((it) => ({
      uid: it.uid,
      sheet: it.sheet,
      rowNumber: it.rowNumber,
      storeName: it.storeName ?? it.sheet,
      storeOrderId: it.storeOrderId,
      groupKey: it.groupKey,
      account: it.account,
      tracking: it.tracking,
      packageLabel: it.packageLabel,
      buyDate: it.buyDate,
      arrivalDate: it.arrivalDate,
      agent: it.agent,
      client: it.client,
      sku: it.sku,
      description: it.description,
      quantity: it.quantity,
      unitValue: it.unitValue,
    })),
    receipts: analysis.receipts,
    expenses: analysis.expenses,
  };

  const parsed = schema.importPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    console.error('✗ El payload NO pasa la validación Zod:');
    for (const issue of parsed.error.issues.slice(0, 20)) {
      console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  console.log('✓ Payload válido según el esquema del servidor.');
  console.log(
    `  Se crearían: ~${payload.items.length} productos, ${new Set(
      payload.items.map((i) => i.client.toLowerCase())
    ).size} órdenes, ${new Set(
      payload.items.map((i) => i.tracking).filter(Boolean)
    ).size} paquetes, ${new Set(
      payload.items.map((i) => i.groupKey).filter(Boolean)
    ).size} compras.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
