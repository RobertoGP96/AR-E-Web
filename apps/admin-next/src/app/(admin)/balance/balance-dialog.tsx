'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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

/** Desglose del período calculado por calculateBalanceRangeAction. */
function RangeSummary({ range }: { range: BalanceRangeData }) {
  const b = range.breakdown;
  const profit =
    range.revenues - range.buysCosts - range.costs - range.expenses;

  const rows: Array<{ label: string; detail: string; amount: number }> = [
    {
      label: 'Órdenes pagadas',
      detail: `${b.paidOrdersCount}`,
      amount: b.paidOrdersRevenue,
    },
    {
      label: 'Pagos fuera de fecha',
      detail: `${b.outOfDateCount}`,
      amount: b.outOfDateRevenue,
    },
    {
      label: 'Entregas',
      detail: `${b.deliveriesCount}`,
      amount: b.deliveriesRevenue,
    },
    {
      label: 'Compras (neto de reembolsos)',
      detail: `${b.purchasesCount}`,
      amount: -range.buysCosts,
    },
    {
      label: 'Facturas courier',
      detail: `${b.invoicesCount}`,
      amount: -range.costs,
    },
    {
      label: 'Gastos',
      detail: `${b.expensesCount}`,
      amount: -range.expenses,
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-top-1 space-y-2 rounded-lg border border-accent/30 bg-accent-soft/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-soft-foreground">
          Resumen del período
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            profit >= 0 ? 'text-success-soft-foreground' : 'text-danger'
          }`}
        >
          Ganancia {formatCurrency(profit)}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-2 text-xs"
          >
            <dt className="text-muted">
              {row.label} <span className="text-muted/70">({row.detail})</span>
            </dt>
            <dd
              className={`font-medium tabular-nums ${
                row.amount < 0 ? 'text-danger' : 'text-foreground'
              }`}
            >
              {formatCurrency(row.amount)}
            </dd>
          </div>
        ))}
      </dl>
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
