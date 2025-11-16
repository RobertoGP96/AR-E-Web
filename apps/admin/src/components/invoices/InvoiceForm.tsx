import React, { useMemo } from 'react';
import type { Invoice, CreateInvoiceData, UpdateInvoiceData } from '../../types/models/invoice';
import { useInvoiceForm } from '../../hooks/useInvoiceForm';
import { TagItem } from './TagItem';
import { InvoiceSummary } from './InvoiceSummary';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Loader2, FileText, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
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
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    fields,
    remove,
    addTag,
    updateTagSubtotal,
    isOpen,
    handleOpenChange,
  } = useInvoiceForm(mode, invoice);

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
  }, [calculatedTotal, setValue]);

  // Pasamos directamente `updateTagSubtotal` a TagItem (acepta callback opcional)
  React.useEffect(() => {
    if (open !== undefined) {
      handleOpenChange(open, onOpenChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onOpenChange]);

  const onFormSubmit: SubmitHandler<CreateInvoiceFormData | EditInvoiceFormData> = async (data) => {
    try {
      // Incluir el total calculado en los datos
      const dataWithTotal = { ...data, total: calculatedTotal };

      // Ya actualizamos `total` en el formulario con `setValue`; useForm + zodResolver realizará
      // la validación automáticamente antes de llegar aquí. No es necesario volver a validar.

      const submitData = mode === 'create'
        ? { ...dataWithTotal, date: new Date((data as CreateInvoiceFormData).date).toISOString() }
        : { ...dataWithTotal, id: invoice!.id, date: new Date((data as EditInvoiceFormData).date).toISOString() };

      await onSubmit?.(submitData as CreateInvoiceData | UpdateInvoiceData);

      if (mode === 'create') {
        reset();
        handleOpenChange(false, onOpenChange);
        toast.success('Factura creada correctamente');
      } else {
        toast.success('Factura actualizada correctamente');
      }
    } catch (error) {
      console.error('Error al guardar factura:', error);
      toast.error('Error al guardar la factura');
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
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={`h-11 ${errors.date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
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
            <Button
              type="button"
              onClick={addTag}
              size="sm"
              className="h-9 px-4 bg-orange-400 hover:bg-orange-500 text-white font-medium shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Concepto
            </Button>
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
                  remove={remove}
                  updateTagSubtotal={updateTagSubtotal}
                  errors={errors}
                />
              ))}

              {/* Resumen Total */}
              
            </div>
          )}

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