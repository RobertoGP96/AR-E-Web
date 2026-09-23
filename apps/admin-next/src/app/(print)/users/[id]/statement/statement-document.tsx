import Image from 'next/image';
import type { ReactNode } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  BALANCE_STATUS_LABELS,
  STATEMENT_TITLES,
  balanceStatus,
  statementReference,
  type HistoryStatement,
  type OrdersInvoice,
  type PendingInvoice,
  type StatementMode,
} from '@/lib/client-statement';
import type { StatementClient } from '@/lib/client-statement-data';

export type StatementBody =
  | { mode: 'pending'; invoice: PendingInvoice }
  | { mode: 'history'; statement: HistoryStatement }
  | { mode: 'orders'; invoice: OrdersInvoice };

interface StatementDocumentProps {
  client: StatementClient;
  /** Balance en vivo del cliente (RN-021), independiente del documento. */
  currentBalance: number;
  issuedAt: Date;
  body: StatementBody;
}

function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function money(v: number): string {
  return formatCurrency(v);
}

function dash(v: number): string {
  return v > 0 ? money(v) : '—';
}

function balanceClass(v: number): string {
  if (v < 0) return 'text-danger';
  if (v > 0) return 'text-success-soft-foreground';
  return 'text-foreground';
}

function payStatusClass(status: string): string {
  if (status === 'Pagado') return 'bg-success-soft text-success-soft-foreground';
  if (status === 'Parcial') return 'bg-warning-soft text-warning-soft-foreground';
  return 'bg-danger-soft text-danger';
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${payStatusClass(status)}`}
    >
      {status}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
      {children}
    </h2>
  );
}

function SummaryTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'danger' | 'success' | 'accent';
}) {
  const tones = {
    neutral: 'border-border bg-background text-foreground',
    danger: 'border-danger/30 bg-danger-soft text-danger',
    success:
      'border-success/30 bg-success-soft text-success-soft-foreground',
    accent: 'border-accent/30 bg-accent-soft text-accent-soft-foreground',
  } as const;
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function TotalsBlock({
  rows,
  highlight,
}: {
  rows: { label: string; value: number; muted?: boolean }[];
  highlight: { label: string; value: number };
}) {
  return (
    <div className="ml-auto w-full max-w-xs break-inside-avoid">
      <dl className="space-y-1 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4">
            <dt className="text-muted">{r.label}</dt>
            <dd
              className={`tabular-nums ${r.muted ? 'text-muted' : 'text-foreground'}`}
            >
              {money(r.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex items-center justify-between gap-4 rounded-lg bg-foreground px-3 py-2 text-background print:bg-black print:text-white">
        <span className="text-xs font-semibold uppercase tracking-wider">
          {highlight.label}
        </span>
        <span className="text-lg font-bold tabular-nums">
          {money(highlight.value)}
        </span>
      </div>
    </div>
  );
}

const TABLE = 'w-full border-collapse text-[13px]';
const TH =
  'border-b border-foreground/80 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted';
const TD = 'border-b border-separator px-2 py-1.5 align-top';

function PendingBody({ invoice }: { invoice: PendingInvoice }) {
  const { lines, totals } = invoice;
  return (
    <>
      <section className="break-inside-avoid">
        <SectionTitle>Partidas pendientes de pago</SectionTitle>
        {lines.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No hay partidas pendientes seleccionadas.
          </p>
        ) : (
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Fecha</th>
                <th className={TH}>Concepto</th>
                <th className={TH}>Estado</th>
                <th className={`${TH} text-right`}>Costo</th>
                <th className={`${TH} text-right`}>Pagado</th>
                <th className={`${TH} text-right`}>Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.key} className="break-inside-avoid">
                  <td className={`${TD} whitespace-nowrap tabular-nums text-muted`}>
                    {formatDate(l.date)}
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-foreground">{l.description}</div>
                    <div className="text-xs text-muted">{l.detail}</div>
                  </td>
                  <td className={TD}>
                    <StatusPill status={l.payStatus} />
                  </td>
                  <td className={`${TD} text-right tabular-nums`}>{money(l.cost)}</td>
                  <td className={`${TD} text-right tabular-nums text-muted`}>
                    {dash(l.received + l.balanceApplied)}
                  </td>
                  <td className={`${TD} text-right font-semibold tabular-nums text-danger`}>
                    {money(l.pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <TotalsBlock
        rows={[
          { label: 'Costo de las partidas', value: totals.cost },
          { label: 'Efectivo recibido', value: totals.received, muted: true },
          { label: 'Saldo a favor aplicado', value: totals.balanceApplied, muted: true },
        ]}
        highlight={{ label: 'Total a pagar', value: totals.pending }}
      />
    </>
  );
}

function HistoryBody({ statement }: { statement: HistoryStatement }) {
  const { entries, openingBalance, closingBalance, totalDebits, totalCredits, totalApplied, range } = statement;
  const hasRange = Boolean(range.from || range.to);
  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label={hasRange ? 'Saldo inicial' : 'Saldo de apertura'} value={money(openingBalance)} />
        <SummaryTile label="Cargos (débitos)" value={money(totalDebits)} tone="danger" />
        <SummaryTile label="Pagos (créditos)" value={money(totalCredits)} tone="success" />
        <SummaryTile
          label="Saldo final"
          value={money(closingBalance)}
          tone={closingBalance < 0 ? 'danger' : closingBalance > 0 ? 'success' : 'accent'}
        />
      </section>

      <section>
        <SectionTitle>Movimientos</SectionTitle>
        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No hay movimientos en el período.
          </p>
        ) : (
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Fecha</th>
                <th className={TH}>Operación</th>
                <th className={TH}>Descripción</th>
                <th className={`${TH} text-right`}>Débito</th>
                <th className={`${TH} text-right`}>Crédito</th>
                <th className={`${TH} text-right`}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {hasRange ? (
                <tr className="bg-background">
                  <td className={`${TD} text-muted`} colSpan={5}>
                    Saldo anterior al {range.from ? formatDate(range.from) : 'inicio'}
                  </td>
                  <td className={`${TD} text-right font-semibold tabular-nums ${balanceClass(openingBalance)}`}>
                    {money(openingBalance)}
                  </td>
                </tr>
              ) : null}
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className={`break-inside-avoid ${e.informational ? 'text-muted' : ''}`}
                >
                  <td className={`${TD} whitespace-nowrap tabular-nums text-muted`}>
                    {formatDate(e.date)}
                  </td>
                  <td className={`${TD} whitespace-nowrap`}>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        e.informational
                          ? 'text-muted'
                          : e.credit > 0
                            ? 'text-success-soft-foreground'
                            : 'text-danger'
                      }`}
                    >
                      {e.label}
                    </span>
                  </td>
                  <td className={TD}>
                    {e.description}
                    {e.informational ? (
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-muted">
                        (no altera el saldo)
                      </span>
                    ) : null}
                  </td>
                  <td className={`${TD} text-right tabular-nums ${e.informational ? '' : 'text-danger'}`}>
                    {dash(e.debit)}
                  </td>
                  <td className={`${TD} text-right tabular-nums text-success-soft-foreground`}>
                    {dash(e.credit)}
                  </td>
                  <td className={`${TD} text-right font-semibold tabular-nums ${balanceClass(e.balance)}`}>
                    {money(e.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="break-inside-avoid">
                <td className={`${TD} border-t border-foreground/80 font-semibold`} colSpan={3}>
                  Totales del período
                </td>
                <td className={`${TD} border-t border-foreground/80 text-right font-semibold tabular-nums text-danger`}>
                  {money(totalDebits)}
                </td>
                <td className={`${TD} border-t border-foreground/80 text-right font-semibold tabular-nums text-success-soft-foreground`}>
                  {money(totalCredits)}
                </td>
                <td className={`${TD} border-t border-foreground/80 text-right font-bold tabular-nums ${balanceClass(closingBalance)}`}>
                  {money(closingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
        {totalApplied > 0 ? (
          <p className="mt-2 text-xs text-muted">
            Saldo a favor aplicado en el período: {money(totalApplied)}. Ese
            importe ya se contó como pago cuando entró; por eso no vuelve a
            mover el saldo (RN-021 / RN-022).
          </p>
        ) : null}
      </section>
    </>
  );
}

function OrdersBody({ invoice }: { invoice: OrdersInvoice }) {
  const { sections, totals } = invoice;
  return (
    <>
      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          No se seleccionó ningún pedido.
        </p>
      ) : (
        sections.map((s) => (
          <section key={s.order.id} className="break-inside-avoid">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-foreground/80 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  Pedido #{s.order.id}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(s.order.createdAt)} · {s.order.status}
                </span>
              </div>
              <StatusPill status={s.order.payStatus} />
            </div>
            {s.lines.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted">Pedido sin productos.</p>
            ) : (
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Producto</th>
                    <th className={TH}>Tienda</th>
                    <th className={`${TH} text-right`}>Cant.</th>
                    <th className={`${TH} text-right`}>P. unitario</th>
                    <th className={`${TH} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {s.lines.map((l) => (
                    <tr key={l.id} className="break-inside-avoid">
                      <td className={`${TD} font-medium text-foreground`}>{l.name}</td>
                      <td className={`${TD} text-muted`}>{l.shopName}</td>
                      <td className={`${TD} text-right tabular-nums`}>{l.quantity}</td>
                      <td className={`${TD} text-right tabular-nums text-muted`}>
                        {money(l.unitCost)}
                      </td>
                      <td className={`${TD} text-right tabular-nums`}>{money(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <dl className="mt-1.5 ml-auto grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <dt className="text-muted">Total del pedido</dt>
              <dd className="text-right font-semibold tabular-nums">{money(s.cost)}</dd>
              <dt className="text-muted">Pagado (efectivo + saldo)</dt>
              <dd className="text-right tabular-nums text-muted">
                {dash(s.received + s.balanceApplied)}
              </dd>
              <dt className="text-muted">Pendiente</dt>
              <dd className={`text-right font-semibold tabular-nums ${s.pending > 0 ? 'text-danger' : 'text-success-soft-foreground'}`}>
                {money(s.pending)}
              </dd>
            </dl>
          </section>
        ))
      )}
      {sections.length > 0 ? (
        <TotalsBlock
          rows={[
            { label: 'Total de los pedidos', value: totals.cost },
            { label: 'Efectivo recibido', value: totals.received, muted: true },
            { label: 'Saldo a favor aplicado', value: totals.balanceApplied, muted: true },
          ]}
          highlight={{ label: 'Pendiente de pago', value: totals.pending }}
        />
      ) : null}
    </>
  );
}

/**
 * Documento imprimible al cliente (A4). Componente de servidor, sin
 * estado: recibe el cuerpo ya calculado por src/lib/client-statement.ts.
 */
export function StatementDocument({
  client,
  currentBalance,
  issuedAt,
  body,
}: StatementDocumentProps) {
  const mode: StatementMode = body.mode;
  const title = STATEMENT_TITLES[mode];
  const reference = statementReference(mode, client.id, issuedAt);
  const status = balanceStatus(currentBalance);
  const period =
    body.mode === 'history' && (body.statement.range.from || body.statement.range.to)
      ? `${body.statement.range.from ? formatDate(body.statement.range.from) : 'Inicio'} — ${
          body.statement.range.to ? formatDate(body.statement.range.to) : formatDate(issuedAt)
        }`
      : null;

  return (
    <article className="print-sheet mx-auto my-6 max-w-[210mm] rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-10 print:my-0 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-foreground pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="AR&E Shipps"
            width={140}
            height={52}
            priority
            className="h-12 w-auto object-contain"
          />
          <div className="text-xs leading-tight text-muted">
            <div className="text-sm font-semibold text-foreground">AR&E Shipps</div>
            <div>Gestión de compras y envíos</div>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <dl className="mt-1 space-y-0.5 text-xs text-muted">
            <div className="flex justify-end gap-2">
              <dt>Referencia</dt>
              <dd className="font-mono font-semibold text-foreground">{reference}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt>Emitido</dt>
              <dd className="tabular-nums text-foreground">{formatDateTime(issuedAt)}</dd>
            </div>
            {period ? (
              <div className="flex justify-end gap-2">
                <dt>Período</dt>
                <dd className="tabular-nums text-foreground">{period}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      <section className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <SectionTitle>Cliente</SectionTitle>
          <div className="text-base font-semibold text-foreground">{client.name}</div>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-muted">
            <dt>Teléfono</dt>
            <dd className="text-foreground">{client.phoneNumber}</dd>
            {client.email ? (
              <>
                <dt>Correo</dt>
                <dd className="text-foreground">{client.email}</dd>
              </>
            ) : null}
            {client.homeAddress ? (
              <>
                <dt>Dirección</dt>
                <dd className="text-foreground">{client.homeAddress}</dd>
              </>
            ) : null}
            {client.agentName ? (
              <>
                <dt>Agente</dt>
                <dd className="text-foreground">{client.agentName}</dd>
              </>
            ) : null}
          </dl>
        </div>
        <div className="sm:min-w-44">
          <SectionTitle>Balance actual</SectionTitle>
          <div className={`text-2xl font-bold tabular-nums ${balanceClass(currentBalance)}`}>
            {money(currentBalance)}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">
            {BALANCE_STATUS_LABELS[status]}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {body.mode === 'pending' ? (
          <PendingBody invoice={body.invoice} />
        ) : body.mode === 'history' ? (
          <HistoryBody statement={body.statement} />
        ) : (
          <OrdersBody invoice={body.invoice} />
        )}
      </div>

      <footer className="mt-8 border-t border-separator pt-3 text-[11px] leading-relaxed text-muted">
        <p>
          Balance = efectivo recibido − costo de órdenes y entregas (RN-021).
          Un balance negativo es deuda del cliente; positivo, saldo a su favor.
        </p>
        <p>
          Documento informativo generado por el panel AR&E Shipps el{' '}
          {formatDateTime(issuedAt)}. No constituye comprobante fiscal.
        </p>
      </footer>
    </article>
  );
}
