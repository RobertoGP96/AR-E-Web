'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Scale, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Spinner } from '@heroui/react';
import {
  createBalanceAction,
  updateBalanceAction,
  calculateBalanceRangeAction,
  type ActionResult,
} from './actions';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  AppModal,
  Field,
  TextInput,
  TextArea,
  SubmitButton,
} from '@/components/ui';
import type { BalanceRow, BalanceRangeData } from './schema';

interface BalanceDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  balance?: BalanceRow;
  onClose: () => void;
  onSuccess: () => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

interface FormValues {
  startDate: string;
  endDate: string;
  systemWeight: string;
  registeredWeight: string;
  revenues: string;
  buysCosts: string;
  costs: string;
  expenses: string;
  notes: string;
}

function initialValues(balance?: BalanceRow): FormValues {
  return {
    startDate: isoToDateInput(balance?.startDate),
    endDate: isoToDateInput(balance?.endDate),
    systemWeight: balance?.systemWeight.toString() ?? '0',
    registeredWeight: balance?.registeredWeight.toString() ?? '0',
    revenues: balance?.revenues.toString() ?? '0',
    buysCosts: balance?.buysCosts.toString() ?? '0',
    costs: balance?.costs.toString() ?? '0',
    expenses: balance?.expenses.toString() ?? '0',
    notes: balance?.notes ?? '',
  };
}

/** Campo numérico con prefijo $ (mantiene el input nativo para FormData). */
function MoneyInput({
  name,
  value,
  onChange,
  invalid,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        $
      </span>
      <TextInput
        name={name}
        type="number"
        step="0.01"
        min="0"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={invalid}
        className="pl-7"
      />
    </div>
  );
}

/** Tarjeta de métrica del desglose, espejo del MetricCard del reporte Vite. */
function MetricTile({
  label,
  detail,
  value,
  tone,
}: {
  label: string;
  detail?: string;
  value: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const tones = {
    success: 'border-success/30 bg-success-soft text-success-soft-foreground',
    warning: 'border-warning/30 bg-warning-soft text-warning-soft-foreground',
    danger: 'border-danger/30 bg-danger-soft text-danger',
  } as const;
  return (
    <div className={`rounded-lg border p-2.5 ${tones[tone]}`}>
      <div className="text-[11px] font-medium text-muted">
        {label}
        {detail ? <span className="text-muted/70"> · {detail}</span> : null}
      </div>
      <div className="mt-0.5 text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function SectionHeader({
  dotClass,
  children,
}: {
  dotClass: string;
  children: ReactNode;
}) {
  return (
    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
        aria-hidden
      />
      {children}
    </h4>
  );
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger';
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
        tone === 'success' ? 'border-success/30' : 'border-danger/30'
      }`}
    >
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          tone === 'success' ? 'text-success-soft-foreground' : 'text-danger'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** Desglose del período calculado por calculateBalanceRangeAction,
 * con la misma estructura del Resumen Financiero del admin Vite:
 * Ingresos (órdenes/entregas + total), Costos - Gastos (+ pasivo total)
 * y Ganancia Neta con margen. */
function RangeSummary({ range }: { range: BalanceRangeData }) {
  const b = range.breakdown;
  const ordersRevenue = b.paidOrdersRevenue + b.outOfDateRevenue;
  const totalCosts = range.buysCosts + range.costs + range.expenses;
  const profit = range.revenues - totalCosts;
  const margin = range.revenues > 0 ? (profit / range.revenues) * 100 : 0;

  const ordersDetail =
    b.outOfDateCount > 0
      ? `${b.paidOrdersCount} pagadas + ${b.outOfDateCount} fuera de fecha`
      : `${b.paidOrdersCount} pagadas`;
  const purchasesDetail =
    b.purchasesRefunded > 0
      ? `${b.purchasesCount} · −${formatCurrency(b.purchasesRefunded)} reemb.`
      : `${b.purchasesCount}`;

  return (
    <div className="animate-in fade-in slide-in-from-top-1 space-y-4 rounded-lg border border-accent/30 bg-accent-soft/40 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-accent-soft-foreground">
        Resumen del período
      </div>

      <section className="space-y-2">
        <SectionHeader dotClass="bg-success">Ingresos totales</SectionHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MetricTile
            label="Órdenes"
            detail={ordersDetail}
            value={formatCurrency(ordersRevenue)}
            tone="success"
          />
          <MetricTile
            label="Entregas"
            detail={`${b.deliveriesCount}`}
            value={formatCurrency(b.deliveriesRevenue)}
            tone="success"
          />
        </div>
        <TotalRow
          label="Ingreso total"
          value={formatCurrency(range.revenues)}
          tone="success"
        />
      </section>

      <section className="space-y-2">
        <SectionHeader dotClass="bg-danger">Costos - Gastos</SectionHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <MetricTile
            label="Compras"
            detail={purchasesDetail}
            value={formatCurrency(range.buysCosts)}
            tone="warning"
          />
          <MetricTile
            label="Facturas"
            detail={`${b.invoicesCount}`}
            value={formatCurrency(range.costs)}
            tone="danger"
          />
          <MetricTile
            label="Gastos"
            detail={`${b.expensesCount}`}
            value={formatCurrency(range.expenses)}
            tone="danger"
          />
        </div>
        <TotalRow
          label="Pasivo total"
          value={formatCurrency(totalCosts)}
          tone="danger"
        />
      </section>

      <div
        className={`rounded-lg border-2 p-3 ${
          profit >= 0
            ? 'border-success/40 bg-success-soft'
            : 'border-danger/40 bg-danger-soft'
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-muted">Ganancia neta</span>
          <span className="text-[11px] text-muted">
            {margin.toFixed(1)}% margen
          </span>
        </div>
        <div
          className={`mt-0.5 text-2xl font-bold tabular-nums ${
            profit >= 0 ? 'text-success-soft-foreground' : 'text-danger'
          }`}
        >
          {formatCurrency(profit)}
        </div>
      </div>

      <p className="text-[11px] leading-snug text-muted">
        Peso entregas {range.systemWeight.toFixed(2)} lb · peso facturas{' '}
        {range.registeredWeight.toFixed(2)} lb. Los valores se aplicaron al
        formulario y puedes ajustarlos antes de guardar.
      </p>
    </div>
  );
}

export function BalanceDialog({
  open,
  mode,
  balance,
  onClose,
  onSuccess,
}: BalanceDialogProps) {
  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo balance' : 'Editar balance'}
      description={
        mode === 'create'
          ? 'Elige el período y calcula sus datos, o escríbelos manualmente.'
          : balance
            ? `Período ${formatDate(balance.startDate)} → ${formatDate(balance.endDate)}`
            : undefined
      }
      icon={<Scale className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      {/* Remount per open/target so all form state starts fresh. */}
      <BalanceForm
        key={`${mode}-${balance?.id ?? 'new'}-${open}`}
        mode={mode}
        balance={balance}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </AppModal>
  );
}

function BalanceForm({
  mode,
  balance,
  onClose,
  onSuccess,
}: Omit<BalanceDialogProps, 'open'>) {
  const action = mode === 'create' ? createBalanceAction : updateBalanceAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);

  const [values, setValues] = useState<FormValues>(() =>
    initialValues(balance),
  );
  const [range, setRange] = useState<BalanceRangeData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess();
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const setField = (name: keyof FormValues) => (value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const handleCalculate = async () => {
    if (!values.startDate || !values.endDate) {
      toast.error('Selecciona las fechas del período');
      return;
    }
    if (Date.parse(values.endDate) < Date.parse(values.startDate)) {
      toast.error('La fecha fin debe ser posterior a la fecha inicio');
      return;
    }
    setIsCalculating(true);
    try {
      const result = await calculateBalanceRangeAction(
        values.startDate,
        values.endDate,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { data } = result;
      setRange(data);
      setValues((v) => ({
        ...v,
        systemWeight: data.systemWeight.toString(),
        registeredWeight: data.registeredWeight.toString(),
        revenues: data.revenues.toString(),
        buysCosts: data.buysCosts.toString(),
        costs: data.costs.toString(),
        expenses: data.expenses.toString(),
        notes:
          v.notes.trim().length > 0
            ? v.notes
            : `Balance generado automáticamente para el período ${v.startDate} - ${v.endDate}`,
      }));
    } catch {
      toast.error('No se pudo calcular el período');
    } finally {
      setIsCalculating(false);
    }
  };

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      {mode === 'edit' && balance ? (
        <input type="hidden" name="id" value={balance.id} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha inicio" required error={errors['startDate']}>
          <TextInput
            name="startDate"
            type="date"
            required
            value={values.startDate}
            onChange={(e) => setField('startDate')(e.target.value)}
            invalid={!!errors['startDate']}
          />
        </Field>
        <Field label="Fecha fin" required error={errors['endDate']}>
          <TextInput
            name="endDate"
            type="date"
            required
            value={values.endDate}
            onChange={(e) => setField('endDate')(e.target.value)}
            invalid={!!errors['endDate']}
          />
        </Field>
      </div>

      <Button
        variant="outline"
        onPress={handleCalculate}
        isDisabled={isCalculating || isPending}
        className="w-full"
      >
        {isCalculating ? (
          <>
            <Spinner size="sm" aria-hidden />
            Calculando período…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            Calcular datos del período
          </>
        )}
      </Button>

      {range ? <RangeSummary range={range} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Peso del sistema" required error={errors['systemWeight']}>
          <TextInput
            name="systemWeight"
            type="number"
            step="0.01"
            min="0"
            required
            value={values.systemWeight}
            onChange={(e) => setField('systemWeight')(e.target.value)}
            invalid={!!errors['systemWeight']}
          />
        </Field>
        <Field
          label="Peso registrado"
          required
          error={errors['registeredWeight']}
        >
          <TextInput
            name="registeredWeight"
            type="number"
            step="0.01"
            min="0"
            required
            value={values.registeredWeight}
            onChange={(e) => setField('registeredWeight')(e.target.value)}
            invalid={!!errors['registeredWeight']}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Ingresos" required error={errors['revenues']}>
          <MoneyInput
            name="revenues"
            value={values.revenues}
            onChange={setField('revenues')}
            invalid={!!errors['revenues']}
          />
        </Field>
        <Field label="Costos de compras" required error={errors['buysCosts']}>
          <MoneyInput
            name="buysCosts"
            value={values.buysCosts}
            onChange={setField('buysCosts')}
            invalid={!!errors['buysCosts']}
          />
        </Field>
        <Field label="Costos" required error={errors['costs']}>
          <MoneyInput
            name="costs"
            value={values.costs}
            onChange={setField('costs')}
            invalid={!!errors['costs']}
          />
        </Field>
        <Field label="Gastos" required error={errors['expenses']}>
          <MoneyInput
            name="expenses"
            value={values.expenses}
            onChange={setField('expenses')}
            invalid={!!errors['expenses']}
          />
        </Field>
      </div>

      <Field label="Notas (opcional)" error={errors['notes']}>
        <TextArea
          name="notes"
          rows={3}
          maxLength={2000}
          value={values.notes}
          onChange={(e) => setField('notes')(e.target.value)}
          invalid={!!errors['notes']}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="tertiary" onPress={onClose}>
          Cancelar
        </Button>
        <SubmitButton isPending={isPending}>Guardar</SubmitButton>
      </div>
    </form>
  );
}
