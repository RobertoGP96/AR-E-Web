import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Expense } from '@/types/models/expenses';
import {
  createExpenseSchema,
  editExpenseSchema,
  type CreateExpenseFormData,
  type EditExpenseFormData,
} from '@/schemas/expenseSchemas';

export function useExpenseForm(mode: 'create' | 'edit', expense?: Expense) {
  const [isOpen, setIsOpen] = useState(false);

  const schema = mode === 'create' ? createExpenseSchema : editExpenseSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CreateExpenseFormData | EditExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && expense
        ? {
            date: new Date(expense.date).toISOString().split('T')[0],
            amount: expense.amount,
            category: expense.category,
            description: expense.description ?? '',
            recurrent: false,
          }
        : {
            date: new Date().toISOString().split('T')[0],
            amount: 0.0,
            category: 'Otro',
            description: '',
            recurrent: false,
          },
  });

  const handleOpenChange = (newOpen: boolean, onOpenChange?: (open: boolean) => void) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      // Reset form to default values based on mode
      if (mode === 'edit' && expense) {
        reset({
          date: new Date(expense.date).toISOString().split('T')[0],
          amount: expense.amount,
          category: expense.category,
          description: expense.description ?? '',
          recurrent: false,
        });
      } else {
        reset({
          date: new Date().toISOString().split('T')[0],
          amount: 0.0,
          category: 'Otro',
          description: '',
          recurrent: false,
        });
      }
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    control,
    isOpen,
    setIsOpen,
    handleOpenChange,
  } as const;
}
