'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Package,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Store,
  Upload,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Alert, Button, Checkbox, Chip, Spinner } from '@heroui/react';

import {
  FormError,
  PageHeader,
  Select,
  StatCard,
  SubmitButton,
  TextInput,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type {
  ClientEntry,
  ImportAnalysis,
  ImportSummary,
  ItemEntry,
} from '@/lib/excel-import/types';
import { analyzeExcelAction, runImportAction } from './actions';
import type { ImportPayload } from './schema';

/** Clave de comparación de nombres (igual que normName del parser). */
function keyOf(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function StatusChip({ status }: { status: 'new' | 'existing' }) {
  return status === 'new' ? (
    <Chip color="accent" variant="soft" size="sm">
      <Chip.Label>Nuevo</Chip.Label>
    </Chip>
  ) : (
    <Chip color="success" variant="soft" size="sm">
      <Chip.Label>Existente</Chip.Label>
    </Chip>
  );
}

function IssueBadge({ item }: { item: ItemEntry }) {
  if (item.issues.length === 0) return null;
  const text = item.issues.map((i) => i.message).join(' ');
  const isError = item.hasError;
  return (
    <span
      title={text}
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isError ? 'text-danger' : 'text-warning-soft-foreground'
      }`}
    >
      {isError ? (
        <XCircle className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      )}
      {item.issues.length}
    </span>
  );
}

function RowCheckbox({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <Checkbox
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
      aria-label={label}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Content>
    </Checkbox>
  );
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

const SHEET_ORDER = ['Shein', 'Amazon', 'Temu', 'Otras 5%'] as const;

export function ImportClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, startAnalyze] = useTransition();
  const [isImporting, startImport] = useTransition();

  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Selecciones del paso de revisión.
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [excludedClients, setExcludedClients] = useState<Set<string>>(
    new Set()
  );
  const [excludedExpenses, setExcludedExpenses] = useState<Set<string>>(
    new Set()
  );
  /** normKey del cliente → '' (crear nuevo) o id de usuario existente. */
  const [clientChoices, setClientChoices] = useState<Record<string, string>>(
    {}
  );
  const [clientFilter, setClientFilter] = useState('');
  const [clientView, setClientView] = useState<'items' | 'all' | 'new'>(
    'items'
  );
  const [showSkipped, setShowSkipped] = useState(false);

  function resetAll() {
    setAnalysis(null);
    setSummary(null);
    setError(null);
    setSelectedFileName(null);
    setExcludedItems(new Set());
    setExcludedClients(new Set());
    setExcludedExpenses(new Set());
    setClientChoices({});
    setClientFilter('');
    setClientView('items');
    setShowSkipped(false);
  }

  function handleAnalyze(formData: FormData) {
    setError(null);
    startAnalyze(async () => {
      const res = await analyzeExcelAction(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAnalysis(res.analysis);
      setExcludedItems(new Set());
      setExcludedClients(new Set());
      setExcludedExpenses(new Set());
      setClientChoices({});
    });
  }

  // ---- derivados del análisis ----
  const derived = useMemo(() => {
    if (!analysis) return null;
    const clientIncluded = (c: ClientEntry) =>
      !excludedClients.has(keyOf(c.name));
    const includedClientKeys = new Set(
      analysis.clients.filter(clientIncluded).map((c) => keyOf(c.name))
    );
    const itemSelectable = (it: ItemEntry) =>
      !it.hasError && includedClientKeys.has(keyOf(it.client));
    const selectedItems = analysis.items.filter(
      (it) => itemSelectable(it) && !excludedItems.has(it.uid)
    );
    const usedGroups = new Set(
      selectedItems.map((i) => i.groupKey).filter(Boolean)
    );
    const warnings =
      analysis.globalIssues.filter((i) => i.level === 'warning').length +
      analysis.items.reduce(
        (acc, it) =>
          acc + it.issues.filter((i) => i.level === 'warning').length,
        0
      );
    const errors =
      analysis.globalIssues.filter((i) => i.level === 'error').length +
      analysis.items.filter((it) => it.hasError).length;
    const newClients = analysis.clients.filter(
      (c) =>
        clientIncluded(c) &&
        c.status === 'new' &&
        !clientChoices[keyOf(c.name)]
    ).length;
    const totalCost = selectedItems.reduce(
      (acc, it) => acc + it.computed.totalCost,
      0
    );
    return {
      includedClientKeys,
      itemSelectable,
      selectedItems,
      usedGroups,
      warnings,
      errors,
      newClients,
      totalCost,
    };
  }, [analysis, excludedItems, excludedClients, clientChoices]);

  function toggleClient(name: string, include: boolean) {
    const key = keyOf(name);
    setExcludedClients((prev) => {
      const next = new Set(prev);
      if (include) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleItem(uid: string, include: boolean) {
    setExcludedItems((prev) => {
      const next = new Set(prev);
      if (include) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function toggleSheet(sheet: string, include: boolean) {
    if (!analysis || !derived) return;
    setExcludedItems((prev) => {
      const next = new Set(prev);
      for (const it of analysis.items) {
        if (it.sheet !== sheet || !derived.itemSelectable(it)) continue;
        if (include) next.delete(it.uid);
        else next.add(it.uid);
      }
      return next;
    });
  }

  function buildPayload(): ImportPayload | null {
    if (!analysis || !derived) return null;
    const clients = analysis.clients
      .filter((c) => !excludedClients.has(keyOf(c.name)))
      .map((c) => {
        const choice = clientChoices[keyOf(c.name)] ?? '';
        const existingId = choice || c.existingId;
        return {
          name: c.name,
          agent: c.agent,
          mode: existingId ? ('existing' as const) : ('new' as const),
          existingId: existingId || null,
        };
      });
    const items = derived.selectedItems.map((it) => ({
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
    }));
    return {
      fileName: analysis.fileName,
      shipmentTag: analysis.shipmentTag,
      agents: analysis.agents.map((a) => ({
        name: a.name,
        ratePerPound: a.ratePerPound,
      })),
      clients,
      items,
      receipts: analysis.receipts,
      expenses: analysis.expenses.filter(
        (e) => !excludedExpenses.has(e.uid)
      ),
    };
  }

  function handleImport() {
    const payload = buildPayload();
    if (!payload) return;
    if (
      payload.items.length === 0 &&
      payload.clients.length === 0 &&
      payload.expenses.length === 0
    ) {
      toast.error('Nada seleccionado para importar', {
        description:
          'Marca al menos un producto, cliente o gasto antes de ejecutar la importación.',
      });
      return;
    }
    startImport(async () => {
      const res = await runImportAction(payload);
      if (!res.ok) {
        toast.error('La importación falló', {
          description: res.error,
        });
        return;
      }
      setSummary(res.summary);
      toast.success('Importación completada', {
        description: `Se crearon ${res.summary.ordersCreated} órdenes y ${res.summary.productsCreated} productos. Revisa el resumen para ver el detalle.`,
      });
      router.refresh();
    });
  }

  // ------------------------------------------------------------------
  // Paso 3: resultado
  // ------------------------------------------------------------------
  if (summary) {
    const stats: { label: string; value: number }[] = [
      { label: 'Clientes creados', value: summary.clientsCreated },
      { label: 'Clientes reutilizados', value: summary.clientsReused },
      { label: 'Agentes creados', value: summary.agentsCreated },
      { label: 'Órdenes', value: summary.ordersCreated },
      { label: 'Productos', value: summary.productsCreated },
      { label: 'Compras', value: summary.receiptsCreated },
      { label: 'Paquetes', value: summary.packagesCreated },
      { label: 'Recepciones', value: summary.receptionsCreated },
      { label: 'Tiendas', value: summary.shopsCreated },
      { label: 'Cuentas', value: summary.accountsCreated },
      { label: 'Gastos', value: summary.expensesCreated },
    ];
    return (
      <div className="space-y-5">
        <PageHeader
          icon={FileSpreadsheet}
          title="Importar Excel"
          subtitle="Importación completada"
        />
        <div className="surface-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Datos incorporados correctamente
              </p>
              <p className="text-sm text-muted">
                {selectedFileName ?? 'Archivo importado'}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            {stats
              .filter((s) => s.value > 0)
              .map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between gap-2 rounded-lg bg-default/40 px-3 py-2 text-sm"
                >
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="font-bold tabular-nums text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-separator pt-4">
            <Button variant="primary" onPress={() => router.push('/orders')}>
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Ver órdenes
            </Button>
            <Button variant="ghost" onPress={() => router.push('/users')}>
              <Users className="h-4 w-4" aria-hidden />
              Ver usuarios
            </Button>
            <Button variant="ghost" onPress={resetAll}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Importar otro archivo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Paso 1: subir archivo
  // ------------------------------------------------------------------
  if (!analysis || !derived) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={FileSpreadsheet}
          title="Importar Excel"
          subtitle="Incorpora los datos de un libro de embarque AR&E Shipps"
        />
        <form
          action={handleAnalyze}
          className="surface-card mx-auto max-w-2xl space-y-4 p-6"
        >
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft/20 px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent-soft/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Upload className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">
              {selectedFileName ?? 'Selecciona el archivo .xlsx del embarque'}
            </span>
            <span className="text-xs text-muted">
              Ej: &quot;AR&amp;E Shipps #238.xlsx&quot; — máx. 8 MB. El archivo
              solo se analiza; nada se guarda hasta que confirmes.
            </span>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".xlsx"
              required
              className="sr-only"
              onChange={(e) =>
                setSelectedFileName(e.target.files?.[0]?.name ?? null)
              }
            />
          </label>
          <FormError message={error} />
          <div className="flex justify-end">
            <SubmitButton
              isPending={isAnalyzing}
              pendingText="Analizando archivo…"
            >
              Analizar archivo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </SubmitButton>
          </div>
        </form>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Paso 2: revisión
  // ------------------------------------------------------------------
  const itemsBySheet = SHEET_ORDER.map((sheet) => ({
    sheet,
    items: analysis.items.filter((i) => i.sheet === sheet),
  })).filter((g) => g.items.length > 0);

  const filteredClients = analysis.clients.filter((c) => {
    if (clientView === 'items' && c.itemCount === 0) return false;
    if (clientView === 'new' && c.status !== 'new') return false;
    if (clientFilter && !keyOf(c.name).includes(keyOf(clientFilter))) {
      return false;
    }
    return true;
  });

  const usedShops = analysis.shops.filter((s) => s.used);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        icon={FileSpreadsheet}
        title="Importar Excel"
        subtitle={`Revisa lo detectado en ${analysis.fileName}`}
        actions={
          <Button variant="ghost" onPress={resetAll}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Elegir otro archivo
          </Button>
        }
      />

      {analysis.alreadyImported ? (
        <Alert status="warning" role="alert" className="items-center gap-2.5">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              Este archivo parece haberse importado antes: ya existen órdenes
              con la nota &quot;Importado de {analysis.fileName}&quot;. Si
              continúas se crearán datos duplicados.
            </Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Package}
          label="Artículos"
          value={`${derived.selectedItems.length}/${analysis.items.length}`}
          hint={`Costo sistema: ${formatCurrency(derived.totalCost)}`}
        />
        <StatCard
          icon={UserRound}
          label="Clientes nuevos"
          value={derived.newClients}
          hint={`${analysis.clients.length} en total`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Compras"
          value={derived.usedGroups.size}
          hint={`${analysis.receipts.length} detectadas`}
          tone="default"
        />
        <StatCard
          icon={AlertTriangle}
          label="Advertencias"
          value={derived.warnings}
          tone={derived.warnings > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={XCircle}
          label="Errores"
          value={derived.errors}
          tone={derived.errors > 0 ? 'danger' : 'default'}
          hint={derived.errors > 0 ? 'Filas excluidas' : undefined}
        />
      </div>

      {analysis.globalIssues.length > 0 ? (
        <SectionCard
          title="Avisos del análisis"
          subtitle="No bloquean la importación, pero conviene revisarlos"
        >
          <ul className="max-h-44 space-y-1 overflow-y-auto text-sm">
            {analysis.globalIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2">
                {issue.level === 'error' ? (
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-danger"
                    aria-hidden
                  />
                ) : (
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning-soft-foreground"
                    aria-hidden
                  />
                )}
                <span className="text-muted">{issue.message}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Catálogos"
        subtitle="Tiendas, cuentas de compra y agentes detectados (solo se crean los marcados como nuevos)"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Store className="h-4 w-4 text-muted" aria-hidden />
            {usedShops.map((s) => (
              <Chip
                key={s.name}
                color={s.status === 'new' ? 'accent' : 'success'}
                variant="soft"
                size="sm"
              >
                <Chip.Label>
                  {s.name}
                  {s.status === 'new' ? ' (nueva)' : ''}
                </Chip.Label>
              </Chip>
            ))}
            {analysis.accounts.map((a) => (
              <Chip
                key={`${a.store}:${a.name}`}
                color={a.status === 'new' ? 'accent' : 'success'}
                variant="soft"
                size="sm"
              >
                <Chip.Label>
                  Cuenta {a.name} · {a.store}
                  {a.status === 'new' ? ' (nueva)' : ''}
                </Chip.Label>
              </Chip>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>$ / libra (Excel)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {analysis.agents.map((a) => (
                  <tr key={a.name}>
                    <td className="font-medium text-foreground">{a.name}</td>
                    <td className="tabular-nums">
                      {a.ratePerPound != null
                        ? formatCurrency(a.ratePerPound)
                        : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusChip status={a.status} />
                        {a.status === 'existing' &&
                        a.existingRole &&
                        !['agent', 'admin'].includes(a.existingRole) ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-warning-soft-foreground"
                            title={`El usuario existente tiene rol "${a.existingRole}", no agente.`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                            rol {a.existingRole}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            La tarifa por libra del Excel es informativa: el sistema cobra el
            envío por categoría (Categorías → cobro por libra), no por agente.
            Los agentes nuevos se crean sin contraseña utilizable.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title={`Clientes (${analysis.clients.length})`}
        subtitle="Desmarca los que no quieras importar; sus artículos se omiten. En los dudosos puedes elegir un usuario existente."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              placeholder="Filtrar por nombre…"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-44"
            />
            <Select
              aria-label="Ver clientes"
              value={clientView}
              onChange={(e) =>
                setClientView(e.target.value as typeof clientView)
              }
              triggerClassName="w-44"
            >
              <option value="items">Con artículos</option>
              <option value="new">Solo nuevos</option>
              <option value="all">Todos</option>
            </Select>
          </div>
        }
      >
        <div className="max-h-96 overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <span className="sr-only">Incluir</span>
                </th>
                <th>Cliente</th>
                <th>Agente</th>
                <th>Artículos</th>
                <th>Estado</th>
                <th>Resolución</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted">
                    Sin clientes con este filtro.
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => {
                  const key = keyOf(c.name);
                  const included = !excludedClients.has(key);
                  const choice = clientChoices[key] ?? '';
                  return (
                    <tr key={key} className={included ? '' : 'opacity-45'}>
                      <td>
                        <RowCheckbox
                          checked={included}
                          onChange={(v) => toggleClient(c.name, v)}
                          label={`Incluir cliente ${c.name}`}
                        />
                      </td>
                      <td className="font-medium text-foreground">
                        {c.name}
                        {!c.inRegistry ? (
                          <span
                            className="ml-1.5 text-xs text-warning-soft-foreground"
                            title="No está en la hoja Agente-Cliente; se tomó de una fila de artículo."
                          >
                            *
                          </span>
                        ) : null}
                      </td>
                      <td className="text-muted">{c.agent ?? '—'}</td>
                      <td className="tabular-nums">{c.itemCount || '—'}</td>
                      <td>
                        <StatusChip
                          status={choice ? 'existing' : c.status}
                        />
                      </td>
                      <td>
                        {c.status === 'new' && c.similar.length > 0 ? (
                          <Select
                            aria-label={`Resolución para ${c.name}`}
                            value={choice}
                            onChange={(e) =>
                              setClientChoices((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            triggerClassName="h-8 min-w-48 text-xs"
                          >
                            <option value="">Crear nuevo cliente</option>
                            {c.similar.map((s) => (
                              <option key={s.id} value={s.id}>
                                Usar existente: {s.fullName}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs text-muted">
                            {c.status === 'existing'
                              ? 'Se reutiliza'
                              : 'Se crea nuevo'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Los clientes nuevos se crean con un teléfono provisional
          (&quot;imp-…&quot;) porque el Excel no lo incluye — complétalo luego
          en Usuarios.
        </p>
      </SectionCard>

      {itemsBySheet.map(({ sheet, items }) => {
        const selectable = items.filter((it) => derived.itemSelectable(it));
        const selectedCount = selectable.filter(
          (it) => !excludedItems.has(it.uid)
        ).length;
        return (
          <SectionCard
            key={sheet}
            title={`Artículos · ${sheet} (${selectedCount}/${items.length})`}
            actions={
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => toggleSheet(sheet, true)}
                >
                  Marcar todo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => toggleSheet(sheet, false)}
                >
                  Desmarcar todo
                </Button>
              </div>
            }
          >
            <div className="max-h-[28rem] overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <span className="sr-only">Incluir</span>
                    </th>
                    <th>Fila</th>
                    <th>Cliente</th>
                    <th>Descripción / SKU</th>
                    <th>Cant.</th>
                    <th>Valor</th>
                    <th>Costo sistema</th>
                    <th>Paquete</th>
                    <th>Compra</th>
                    <th>Avisos</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const clientIncluded = derived.includedClientKeys.has(
                      keyOf(it.client)
                    );
                    const disabled = it.hasError || !clientIncluded;
                    const checked =
                      !disabled && !excludedItems.has(it.uid);
                    return (
                      <tr
                        key={it.uid}
                        className={disabled || !checked ? 'opacity-45' : ''}
                      >
                        <td>
                          <RowCheckbox
                            checked={checked}
                            disabled={disabled}
                            onChange={(v) => toggleItem(it.uid, v)}
                            label={`Incluir fila ${it.rowNumber} de ${sheet}`}
                          />
                        </td>
                        <td className="tabular-nums text-muted">
                          {it.rowNumber}
                        </td>
                        <td className="max-w-40 truncate font-medium text-foreground">
                          {it.client}
                          {!clientIncluded ? (
                            <span className="block text-[11px] font-normal text-muted">
                              cliente excluido
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-56">
                          <span className="block truncate">
                            {it.description ?? (
                              <span className="italic text-muted/70">
                                sin descripción
                              </span>
                            )}
                          </span>
                          {it.sku ? (
                            <span className="block truncate font-mono text-[11px] text-muted">
                              {it.sku}
                            </span>
                          ) : null}
                        </td>
                        <td className="tabular-nums">{it.quantity}</td>
                        <td className="tabular-nums">
                          {it.unitValue != null
                            ? formatCurrency(it.unitValue)
                            : '—'}
                        </td>
                        <td className="font-semibold tabular-nums">
                          {formatCurrency(it.computed.totalCost)}
                        </td>
                        <td className="text-muted">
                          <span className="block">
                            {it.packageLabel ?? '—'}
                          </span>
                          {it.tracking ? (
                            <span
                              className="block max-w-32 truncate font-mono text-[11px]"
                              title={it.tracking}
                            >
                              {it.tracking}
                            </span>
                          ) : null}
                          {it.arrivalDate ? (
                            <span className="block text-[11px]">
                              llegó {formatDate(it.arrivalDate)}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-36 truncate text-xs text-muted">
                          {it.groupKey
                            ? (it.storeOrderId ?? it.groupKey)
                            : '—'}
                        </td>
                        <td>
                          <IssueBadge item={it} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        );
      })}

      <SectionCard
        title={`Compras detectadas (${analysis.receipts.length})`}
        subtitle="Pedidos reales en tiendas (filas Factura). Solo se crean los que tengan artículos seleccionados."
      >
        <div className="max-h-72 overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Tienda</th>
                <th>Cuenta</th>
                <th>Fecha</th>
                <th>Artículos</th>
                <th>Valor declarado</th>
                <th>Coste real pagado</th>
                <th>Se crea</th>
              </tr>
            </thead>
            <tbody>
              {analysis.receipts.map((r) => {
                const willCreate =
                  derived.usedGroups.has(r.key) && r.account != null;
                return (
                  <tr key={r.key} className={willCreate ? '' : 'opacity-45'}>
                    <td className="max-w-44 truncate font-mono text-xs">
                      {r.storeOrderId ?? r.key}
                    </td>
                    <td>{r.storeName}</td>
                    <td>{r.account ?? '—'}</td>
                    <td className="text-muted">
                      {r.buyDate ? formatDate(r.buyDate) : '—'}
                    </td>
                    <td className="tabular-nums">{r.itemCount ?? '—'}</td>
                    <td className="tabular-nums">
                      {r.declaredValue != null
                        ? formatCurrency(r.declaredValue)
                        : '—'}
                    </td>
                    <td className="font-semibold tabular-nums">
                      {r.realCost != null ? formatCurrency(r.realCost) : '—'}
                    </td>
                    <td>
                      {willCreate ? (
                        <CheckCircle2
                          className="h-4 w-4 text-success-soft-foreground"
                          aria-hidden
                        />
                      ) : (
                        <span className="text-xs text-muted">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {analysis.expenses.length > 0 ? (
        <SectionCard
          title={`Gastos del período (${analysis.expenses.length})`}
          subtitle="Celdas de gastos de la hoja General"
        >
          <ul className="space-y-2">
            {analysis.expenses.map((e) => (
              <li key={e.uid} className="flex items-center gap-3 text-sm">
                <RowCheckbox
                  checked={!excludedExpenses.has(e.uid)}
                  onChange={(v) =>
                    setExcludedExpenses((prev) => {
                      const next = new Set(prev);
                      if (v) next.delete(e.uid);
                      else next.add(e.uid);
                      return next;
                    })
                  }
                  label={`Incluir gasto ${e.label}`}
                />
                <span className="font-medium text-foreground">{e.label}</span>
                <Chip color="default" variant="soft" size="sm">
                  <Chip.Label>{e.category}</Chip.Label>
                </Chip>
                <span className="ml-auto font-semibold tabular-nums">
                  {formatCurrency(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {analysis.skipped.length > 0 ? (
        <SectionCard
          title={`Filas omitidas automáticamente (${analysis.skipped.length})`}
          subtitle="Filas internas del Excel (Factura/Lost/Venta, agregados, filas sin datos)"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setShowSkipped((v) => !v)}
            >
              {showSkipped ? 'Ocultar' : 'Mostrar'}
            </Button>
          }
        >
          {showSkipped ? (
            <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-muted">
              {analysis.skipped.map((s, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">
                    {s.sheet} fila {s.rowNumber}:
                  </span>{' '}
                  {s.reason}
                  {s.preview ? ` — ${s.preview}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
      ) : null}

      {/* Barra de confirmación */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-background/95 px-4 py-3 backdrop-blur-sm md:left-64">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">
              {derived.selectedItems.length}
            </span>{' '}
            artículos ·{' '}
            <span className="font-semibold text-foreground">
              {analysis.clients.length - excludedClients.size}
            </span>{' '}
            clientes ·{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(derived.totalCost)}
            </span>{' '}
            costo total
          </p>
          <Button
            variant="primary"
            isDisabled={isImporting}
            onPress={handleImport}
          >
            {isImporting ? (
              <>
                <Spinner size="sm" aria-hidden />
                Importando…
              </>
            ) : (
              <>
                Importar seleccionados
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
