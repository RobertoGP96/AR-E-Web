import React from 'react';
import type { Expense, CreateExpenseData, UpdateExpenseData } from '../../types/models/expenses';

import { DatePicker } from '@/components/utils/DatePicker';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Plus, Save, Loader2 } from 'lucide-react';
import type { SubmitHandler } from 'react-hook-form';
import type { CreateExpenseFormData, EditExpenseFormData } from '@/schemas/expenseSchemas';
import type { ExpenseCategory } from '@/types/models/expenses';
import { useExpenseForm } from '@/hooks/useExpenseForm';

interface ExpencesFormProps {
  mode: 'create' | 'edit';
  expense?: Expense;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: CreateExpenseData | UpdateExpenseData) => void;
  loading?: boolean;
  trigger?: React.ReactNode;
}

export function ExpencesForm({
  mode,
  expense,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  trigger,
}: ExpencesFormProps) {
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    isOpen,
    handleOpenChange,
  } = useExpenseForm(mode, expense);

  React.useEffect(() => {
    if (open !== undefined) {
      handleOpenChange(open, onOpenChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onOpenChange]);

  const onFormSubmit: SubmitHandler<CreateExpenseFormData | EditExpenseFormData> = async (data) => {
    try {
      const submitData = mode === 'create'
        ? (() => {
          const d = data as CreateExpenseFormData;
          const iso = d.date ? new Date(String(d.date)).toISOString() : undefined;
          const payload: CreateExpenseData = { amount: d.amount!, category: d.category as ExpenseCategory, description: d.description, date: iso, recurrent: d.recurrent };
          return payload;
        })()
        : (() => {
          const d = data as EditExpenseFormData;
          const iso = d.date ? new Date(String(d.date)).toISOString() : undefined;
          const payload: UpdateExpenseData = { id: expense!.id, date: iso, amount: d.amount, category: d.category as ExpenseCategory, description: d.description, recurrent: d.recurrent };
          return payload;
        })();

      await onSubmit?.(submitData as CreateExpenseData | UpdateExpenseData);

      if (mode === 'create') {
        reset();
        handleOpenChange(false, onOpenChange);
      }
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      throw err;
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <FieldGroup>
        <FieldSet>
          <div className="grid grid-cols-1 gap-6">
            <Field>
              <DatePicker
                id="date"
                selected={watch('date') ? new Date(watch('date') as string) : undefined}
                onDateChange={(date) => setValue('date' as const, date ? new Date(date).toISOString().split('T')[0] : '', { shouldValidate: true, shouldDirty: true })}
                placeholder="Selecciona la fecha"
              />
              {errors.date && (
                <FieldDescription className="text-red-600">{errors.date.message}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Categoría</FieldLabel>
              <Select
                value={watch('category') as string}
                onValueChange={(val) => setValue('category' as const, val as ExpenseCategory, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger className={`h-10 ${errors.category ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-orange-200 focus:border-orange-400'}`}>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Envio">Envio</SelectItem>
                  <SelectItem value="Tasas">Tasas</SelectItem>
                  <SelectItem value="Sueldo">Sueldo</SelectItem>
                  <SelectItem value="Publicidad">Publicidad</SelectItem>
                  <SelectItem value="Operativo">Operativo</SelectItem>
                  <SelectItem value="Entrega">Entrega</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <FieldDescription className="text-red-600">{errors.category.message}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Monto</FieldLabel>
              <InputGroup>
                <InputGroupInput id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...register('amount', { valueAsNumber: true })} className={`h-10 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`} />
                <InputGroupAddon align="inline-start">$</InputGroupAddon>
              </InputGroup>
              {errors.amount && (
                <FieldDescription className="text-red-600">{errors.amount.message}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea id="description" placeholder="Descripción opcional" {...register('description')} />
              {errors.description && (
                <FieldDescription className="text-red-600">{errors.description.message}</FieldDescription>
              )}
            </Field>
          </div>
        </FieldSet>

        <Field orientation="horizontal" className="justify-end space-x-2 ">
          <Button variant="outline" type="button" onClick={() => handleOpenChange(false, onOpenChange)} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>

            {loading && <Loader2 className="h-4 w-4 animate-spin" />}

            {
              !loading && (mode === 'create' ? (<Plus className="h-4 w-4" />) : (<Save className="h-4 w-4" />))
            }

            <p>
              {mode === 'create' ? ('Crear Gasto') : ('Actualizar Gasto')}
            </p>
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={(newOpen) => handleOpenChange(newOpen, onOpenChange)}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Nuevo Gasto' : 'Editar Gasto'}</DialogTitle>
            <DialogDescription>{mode === 'create' ? 'Registra un nuevo gasto del sistema.' : 'Edita los detalles del gasto.'}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => handleOpenChange(newOpen, onOpenChange)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nuevo Gasto' : 'Editar Gasto'}</DialogTitle>
          <DialogDescription>{mode === 'create' ? 'Registra un nuevo gasto del sistema.' : 'Edita los detalles del gasto.'}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

export default ExpencesForm;
