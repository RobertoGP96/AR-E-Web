import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Invoice } from '../../types/models/invoice';
import {
  createInvoiceSchema,
  editInvoiceSchema,
  type CreateInvoiceFormData,
  type EditInvoiceFormData
} from '../schemas/invoiceSchemas';

export function useInvoiceForm(mode: 'create' | 'edit', invoice?: Invoice) {
  const [isOpen, setIsOpen] = useState(false);

  const schema = mode === 'create' ? createInvoiceSchema : editInvoiceSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CreateInvoiceFormData | EditInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && invoice ? {
      date: new Date(invoice.date).toISOString().split('T')[0],
      tags: invoice.tags || [],
    } : {
      date: new Date().toISOString().split('T')[0],
      tags: [],
    },
  });

  // Usar field array para gestionar las tags
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tags',
  });

  // No calcular total aquí, se hace en el componente

  // Función para agregar una nueva tag
  const addTag = () => {
    append({
      type: 'pesaje',
      weight: 0,
      cost_per_lb: 0,
      fixed_cost: 0,
      subtotal: 0,
    });
  };

  // Función para actualizar el subtotal de una tag específica
  const updateTagSubtotal = (index: number, onUpdate?: () => void) => {
    const tags = watch('tags');
    if (tags && tags[index]) {
      const tag = tags[index];
      let subtotal = 0;

      if (tag.type === 'pesaje') {
        subtotal = (tag.weight || 0) * (tag.cost_per_lb || 0) + (tag.fixed_cost || 0);
      } else if (tag.type === 'nominal') {
        subtotal = tag.fixed_cost || 0;
      }

      setValue(`tags.${index}.subtotal` as `tags.${number}.subtotal`, subtotal);
      onUpdate?.();
    }
  };

  const handleOpenChange = (newOpen: boolean, onOpenChange?: (open: boolean) => void) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    fields,
    append,
    remove,
    addTag,
    updateTagSubtotal,
    isOpen,
    setIsOpen,
    handleOpenChange,
  };
}