/**
 * Utilidad de desarrollo: parsea un libro de embarque AR&E y muestra el
 * resultado del mapeador sin tocar la base de datos.
 *
 *   npx tsx scripts/inspect-import.ts "C:\ruta\AR&E Shipps #238.xlsx"
 */
import path from 'node:path';
import ExcelJS from 'exceljs';

import { parseWorkbook } from '../src/lib/excel-import/parse';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Uso: npx tsx scripts/inspect-import.ts <archivo.xlsx>');
    process.exit(1);
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const parsed = parseWorkbook(wb, path.basename(file));

  console.log('=== RESUMEN ===');
  console.log('Archivo:', parsed.fileName, '| tag:', parsed.shipmentTag);
  console.log('Tiendas:', parsed.shops.join(', '));
  console.log(
    'Agentes:',
    parsed.agents.map((a) => `${a.name}($${a.ratePerPound ?? '?'} /lb)`).join(', ')
  );
  console.log('Clientes:', parsed.clients.length, '| en registro:',
    parsed.clients.filter((c) => c.inRegistry).length);
  console.log('Cuentas:', parsed.accounts.map((a) => `${a.name}@${a.store}`).join(', '));
  console.log('Items:', parsed.items.length, '| Recibos:', parsed.receipts.length,
    '| Gastos:', parsed.expenses.length, '| Omitidas:', parsed.skipped.length);

  console.log('\n=== ITEMS ===');
  for (const it of parsed.items) {
    const flags = it.issues.map((i) => `[${i.level}] ${i.message}`).join(' ');
    console.log(
      `${it.uid.padEnd(14)} ${String(it.client).padEnd(24)} x${it.quantity} $${it.unitValue ?? '—'}`.padEnd(60),
      `${it.storeName ?? '?'} grupo=${it.groupKey ?? '—'} pkg=${it.packageLabel ?? '—'} track=${it.tracking ? it.tracking.slice(0, 18) : '—'} ${flags}`
    );
  }

  console.log('\n=== RECIBOS (pedidos reales) ===');
  for (const g of parsed.receipts) {
    console.log(
      `${g.key.padEnd(26)} cuenta=${g.account ?? '—'} items=${g.itemCount ?? '—'} valor=${g.declaredValue ?? '—'} costeReal=${g.realCost ?? '—'}`
    );
  }

  console.log('\n=== OMITIDAS ===');
  for (const s of parsed.skipped) {
    console.log(`${s.sheet} r${s.rowNumber}: ${s.reason} — ${s.preview}`);
  }

  console.log('\n=== AVISOS GLOBALES ===');
  for (const i of parsed.globalIssues) console.log(`[${i.level}] ${i.message}`);

  console.log('\n=== GASTOS ===');
  for (const e of parsed.expenses) console.log(`${e.label}: $${e.amount} (${e.category})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
