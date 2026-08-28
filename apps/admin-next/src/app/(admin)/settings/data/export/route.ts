import ExcelJS from 'exceljs';
import { auth } from '@/auth';
import { ROLES } from '@/lib/action-helpers';
import {
  EXPORT_ENTITIES,
  findExportEntity,
  type ExportEntity,
  type ExportValue,
} from '@/lib/data-export';

/**
 * GET /settings/data/export?format=json|xlsx|csv&entities=a,b,c
 *
 * Descargas de la vista Configuración → Datos:
 * - json: salva completa (todas las entidades pedidas, con metadatos).
 * - xlsx: un libro con una hoja por entidad.
 * - csv: una sola entidad (la primera de `entities`), separada por ";"
 *   para abrir directo en Excel en español.
 */

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Valor plano → celda legible (booleanos en español). */
function cell(v: ExportValue): string | number {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return v;
}

function csvField(v: ExportValue): string {
  const s = String(cell(v));
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function attachment(filename: string, type: string): HeadersInit {
  return {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  };
}

export async function GET(request: Request) {
  const session = await auth();
  const role = session?.user.role ?? '';
  if (!(ROLES.finance as readonly string[]).includes(role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'json';
  const requested = (url.searchParams.get('entities') ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const entities: ExportEntity[] =
    requested.length > 0
      ? requested
          .map(findExportEntity)
          .filter((e): e is ExportEntity => e !== undefined)
      : [...EXPORT_ENTITIES];
  if (entities.length === 0) {
    return new Response('Ninguna entidad válida', { status: 400 });
  }

  if (format === 'json') {
    const sections: Record<
      string,
      { label: string; count: number; rows: unknown[] }
    > = {};
    for (const entity of entities) {
      const rows = await entity.load();
      sections[entity.key] = { label: entity.label, count: rows.length, rows };
    }
    const payload = {
      app: 'AR&E Shipps — panel de administración',
      kind: 'salva-de-datos',
      generatedAt: new Date().toISOString(),
      entities: sections,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: attachment(
        `are-salva-${stamp()}.json`,
        'application/json; charset=utf-8'
      ),
    });
  }

  if (format === 'csv') {
    const entity = entities[0];
    const rows = await entity.load();
    const lines = [
      entity.headers.map(csvField).join(';'),
      ...rows.map((row) =>
        entity.headers.map((h) => csvField(row[h] ?? null)).join(';')
      ),
    ];
    // BOM para que Excel detecte UTF-8 (tildes, ñ).
    return new Response('\uFEFF' + lines.join('\r\n'), {
      headers: attachment(
        `are-${entity.key}-${stamp()}.csv`,
        'text/csv; charset=utf-8'
      ),
    });
  }

  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AR&E Shipps';
    wb.created = new Date();
    for (const entity of entities) {
      const rows = await entity.load();
      const ws = wb.addWorksheet(entity.label);
      const headerRow = ws.addRow(entity.headers);
      headerRow.font = { bold: true };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      for (const row of rows) {
        ws.addRow(entity.headers.map((h) => cell(row[h] ?? null)));
      }
      entity.headers.forEach((h, i) => {
        const column = ws.getColumn(i + 1);
        const widest = Math.max(
          h.length,
          ...rows
            .slice(0, 50)
            .map((row) => String(cell(row[h] ?? null)).length)
        );
        column.width = Math.min(Math.max(widest + 2, 10), 42);
      });
    }
    const out = (await wb.xlsx.writeBuffer()) as unknown as Uint8Array;
    return new Response(Buffer.from(out), {
      headers: attachment(
        `are-datos-${stamp()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ),
    });
  }

  return new Response('Formato no soportado', { status: 400 });
}
