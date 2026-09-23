import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ROLES } from '@/lib/roles';
import { parseId } from '@/lib/action-helpers';
import { loadClientStatementData } from '@/lib/client-statement-data';
import {
  STATEMENT_TITLES,
  buildHistory,
  buildLedger,
  buildOrdersInvoice,
  buildPendingInvoice,
  isIsoDay,
  isStatementMode,
  parseCsvParam,
  type StatementMode,
} from '@/lib/client-statement';
import { PrintToolbar } from '../../../print-toolbar';
import { StatementDocument, type StatementBody } from './statement-document';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    mode?: string;
    items?: string;
    orders?: string;
    from?: string;
    to?: string;
  }>;
}

function resolveMode(raw: string | undefined): StatementMode {
  return isStatementMode(raw) ? raw : 'pending';
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { mode } = await searchParams;
  return { title: STATEMENT_TITLES[resolveMode(mode)] };
}

/**
 * /users/[id]/statement?mode=pending|history|orders
 *   pending: &items=o12,d7   (claves de pendingKey; sin items = todo lo pendiente)
 *   history: &from=YYYY-MM-DD&to=YYYY-MM-DD (ambos opcionales)
 *   orders:  &orders=12,15
 *
 * Documento imprimible al cliente. Se abre desde el diálogo "Generar
 * factura" de /users?tab=balances. Solo lectura; nada se persiste.
 */
export default async function ClientStatementPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!(ROLES.finance as readonly string[]).includes(session?.user.role ?? '')) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  const clientId = parseId(id);
  if (!clientId) notFound();

  const data = await loadClientStatementData(clientId);
  if (!data) notFound();

  const sp = await searchParams;
  const mode = resolveMode(sp.mode);
  const issuedAt = new Date();
  const ledger = buildLedger(data.orders, data.deliveries);
  const currentBalance = ledger.at(-1)?.balance ?? 0;

  let body: StatementBody;
  if (mode === 'history') {
    body = {
      mode,
      statement: buildHistory(data.orders, data.deliveries, {
        from: isIsoDay(sp.from) ? sp.from : undefined,
        to: isIsoDay(sp.to) ? sp.to : undefined,
      }),
    };
  } else if (mode === 'orders') {
    body = {
      mode,
      invoice: buildOrdersInvoice(data.orders, parseCsvParam(sp.orders)),
    };
  } else {
    body = {
      mode,
      invoice: buildPendingInvoice(
        data.orders,
        data.deliveries,
        sp.items === undefined ? undefined : parseCsvParam(sp.items)
      ),
    };
  }

  return (
    <>
      <PrintToolbar
        backHref="/users?tab=balances"
        backLabel="Balances"
        title={`${STATEMENT_TITLES[mode]} · ${data.client.name}`}
      />
      <main className="px-4 pb-10 sm:px-6">
        <StatementDocument
          client={data.client}
          currentBalance={currentBalance}
          issuedAt={issuedAt}
          body={body}
        />
      </main>
    </>
  );
}
