import React, { useMemo } from 'react';
import type { Invoice, CreateInvoiceData, UpdateInvoiceData } from '../../types/models/invoice';
import { useInvoiceForm } from '../../hooks/useInvoiceForm';
import { useQueryClient } from '@tanstack/react-query';
import { invoiceKeys } from '@/hooks/invoice';
import { TagItem } from './tag-item';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NewTagForm } from './new-tag-form';
import { InvoiceSummary } from './invoices-summary';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/utils/DatePicker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Loader2, FileText, TriangleAlert } from 'lucide-react';
import { /*createInvoiceSchema, editInvoiceSchema*/ } from '../../schemas/invoiceSchemas';
import type { CreateInvoiceFormData, EditInvoiceFormData } from '../../schemas/invoiceSchemas';
import type { SubmitHandler } from 'react-hook-form';

interface InvoiceFormProps {
  mode: 'create' | 'edit';
  invoice?: Invoice;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: CreateInvoiceData | UpdateInvoiceData) => void;
  loading?: boolean;
  trigger?: React.ReactNode;
}

export function InvoiceForm({
  mode,
  invoice,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  trigger,
}: InvoiceFormProps) {
  const {
    // register provided by useInvoiceForm but not required here (we use controlled DatePicker)
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    fields,
    remove,
    append,
    updateTagSubtotal,
    isOpen,
    handleOpenChange,
  } = useInvoiceForm(mode, invoice);
  const [openTagIndex, setOpenTagIndex] = React.useState<number | null>(null);
  const [showNewTagPopover, setShowNewTagPopover] = React.useState(false);

  const queryClient = useQueryClient();

  // Calcular el total de la factura basado en los subtotales de las tags
  const watchedTags = watch('tags');

  const calculatedTotal = useMemo(() => {
    if (watchedTags && watchedTags.length > 0) {
      return watchedTags.reduce((sum, tag) => sum + (tag.subtotal || 0), 0);
    }
    return 0;
  }, [watchedTags]);

  // Mantener el total calculado sincronizado con el formulario para que el zodResolver lo valide
  React.useEffect(() => {
    // `total` es parte del schema y no está en el form por defecto; lo actualizamos aquí.
    // Redondeamos a 2 decimales y forzamos validación para que Zod muestre errores si los hay.
    const rounded = Math.round(calculatedTotal * 100) / 100;
    setValue('total' as const, rounded as number, { shouldValidate: true, shouldDirty: true });
    if (mode === 'edit' && invoice && invoice.id && isOpen) {
      try {
        queryClient.setQueryData<Invoice | undefined>(invoiceKeys.detail(invoice.id), (old) => {
          if (!old) return old;
          return { ...old, total: rounded } as Invoice;
        });
      } catch (err) {
        console.warn('No fue posible actualizar cache de invoices', err);
      }
    }
  }, [calculatedTotal, setValue, invoice, mode, queryClient, isOpen]);

  React.useEffect(() => {
    if (open !== undefined) {
      handleOpenChange(open, onOpenChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onOpenChange]);

  const onFormSubmit: SubmitHandler<CreateInvoiceFormData | EditInvoiceFormData> = async (data) => {
    try {
      const dataWithTotal = { ...data, total: calculatedTotal };
      
      const submitData = mode === 'create'
        ? { ...dataWithTotal, date: new Date((data as CreateInvoiceFormData).date).toISOString() }
        : { ...dataWithTotal, id: invoice!.id, date: new Date((data as EditInvoiceFormData).date).toISOString() };

      await onSubmit?.(submitData as CreateInvoiceData | UpdateInvoiceData);

      if (mode === 'create') {
        reset();
        handleOpenChange(false, onOpenChange);
      }
    } catch (error) {
      console.error('Error al guardar factura:', error);
      // Re-lanzamos para que el componente padre (hook de mutación) maneje el error y muestre toasts
      throw error;
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Información básica de la factura */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
              Fecha
            </Label>
            <DatePicker
              id="date"
              selected={watch('date') ? new Date(watch('date') as string) : undefined}
              onDateChange={(date) => setValue('date' as const, date ? date.toISOString().split('T')[0] : '', { shouldValidate: true, shouldDirty: true })}
              placeholder="Selecciona la fecha"
            />
            
            {errors.date && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="text-xs">⚠️</span> {errors.date.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Gestión de Tags */}
      <Card className="border-2 border-dashed border-gray-200 shadow-sm">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                
                Detalles
              </CardTitle>
              <p className="text-sm text-gray-600">
                Agrega los diferentes conceptos que componen esta factura
              </p>
            </div>
            <Popover open={showNewTagPopover} onOpenChange={(open) => setShowNewTagPopover(open)}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  onClick={() => setShowNewTagPopover(true)}
                  size="sm"
                  className="h-9 px-4 bg-orange-400 hover:bg-orange-500 text-white font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Concepto
                </Button>
              </PopoverTrigger>
              <PopoverContent className="!w-auto p-4 max-w-[380px]">
                  <NewTagForm
                  onCancel={() => setShowNewTagPopover(false)}
                  onSave={(t) => {
                    // Asegurarse de que el subtotal se almacene con 2 decimales
                    append({ ...t, subtotal: Number((t.subtotal).toFixed(2)) });
                    setShowNewTagPopover(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-4 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-md font-medium text-gray-600 mb-2">
                No hay conceptos agregados
              </h3>
              
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <TagItem
                  key={field.id}
                  index={index}
                  watch={watch}
                  setValue={setValue}
                  remove={(idx) => {
                    remove(idx);
                    // Cerrar el popover si estaba abierto para esta tag
                    if (openTagIndex === idx) setOpenTagIndex(null);
                  }}
                  updateTagSubtotal={updateTagSubtotal}
                  errors={errors}
                  open={openTagIndex === index}
                  onOpenChange={(open) => {
                    if (!open && openTagIndex === index) setOpenTagIndex(null);
                    if (open) setOpenTagIndex(index);
                  }}
                />
              ))}

              {/* Resumen Total */}
              
            </div>
          )}

          {/* NewTagForm ahora se integra dentro del Popover del botón de Agregar Concepto */}

          {errors.tags && typeof errors.tags === 'object' && 'message' in errors.tags && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" /> {errors.tags.message}
              </p>
            </div>
          )}
          
        </CardContent>
        <CardFooter >
          <InvoiceSummary fieldsLength={fields.length} calculatedTotal={calculatedTotal} />
        </CardFooter>
      </Card>

      <DialogFooter className="flex gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false, onOpenChange)}
          disabled={loading}
          className="h-11 px-6"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || fields.length === 0}
          className="h-11 px-8 bg-orange-400 hover:bg-orange-500 text-white font-medium shadow-sm"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Crear Factura
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Actualizar Factura
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={(newOpen) => handleOpenChange(newOpen, onOpenChange)}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Crea una nueva factura agregando fecha y conceptos con sus detalles.' 
                : 'Edita la factura existente modificando fecha y conceptos.'}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => handleOpenChange(newOpen, onOpenChange)}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea una nueva factura agregando fecha y conceptos con sus detalles.' 
              : 'Edita la factura existente modificando fecha y conceptos.'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}