import React, { useState, useEffect } from 'react';
import type { Invoice, CreateInvoiceData, UpdateInvoiceData } from '../../types/models/invoice';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Save, Loader2, Trash2, Calculator, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Schema para tags
const tagSchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  weight: z.number().min(0, 'Peso debe ser positivo'),
  cost_per_lb: z.number().min(0, 'Costo por lb debe ser positivo'),
  fixed_cost: z.number().min(0, 'Costo fijo debe ser positivo'),
  subtotal: z.number().min(0, 'Subtotal debe ser positivo'),
});

// Schema para crear invoice con tags
const createInvoiceSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  total: z.number().min(0, 'Total debe ser positivo'),
  tags: z.array(tagSchema).min(1, 'Debe agregar al menos una tag'),
});

// Schema para editar invoice
const editInvoiceSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  total: z.number().min(0, 'Total debe ser positivo'),
  tags: z.array(tagSchema),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;

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
  const [isOpen, setIsOpen] = useState(open || false);

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
      total: invoice.total,
      tags: invoice.tags || [],
    } : {
      date: new Date().toISOString().split('T')[0],
      total: 0,
      tags: [],
    },
  });

  // Usar field array para gestionar las tags
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tags',
  });

  // Observar los cambios en las tags para calcular el total
  const watchedTags = watch('tags');

  // Calcular el total automáticamente cuando cambien las tags
  useEffect(() => {
    if (watchedTags && watchedTags.length > 0) {
      const calculatedTotal = watchedTags.reduce((sum, tag) => {
        return sum + (tag.subtotal || 0);
      }, 0);
      setValue('total', calculatedTotal);
    } else {
      setValue('total', 0);
    }
  }, [watchedTags, setValue]);

  // Función para calcular el subtotal de una tag
  const calculateSubtotal = (weight: number, costPerLb: number, fixedCost: number) => {
    return (weight * costPerLb) + fixedCost;
  };

  // Función para agregar una nueva tag
  const addTag = () => {
    append({
      type: '',
      weight: 0,
      cost_per_lb: 0,
      fixed_cost: 0,
      subtotal: 0,
    });
  };

  // Función para actualizar el subtotal de una tag específica
  const updateTagSubtotal = (index: number) => {
    const tags = watch('tags');
    if (tags && tags[index]) {
      const tag = tags[index];
      const subtotal = calculateSubtotal(tag.weight || 0, tag.cost_per_lb || 0, tag.fixed_cost || 0);
      setValue(`tags.${index}.subtotal` as `tags.${number}.subtotal`, subtotal);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  const onFormSubmit = async (data: CreateInvoiceFormData | EditInvoiceFormData) => {
    try {
      const submitData = mode === 'create'
        ? { ...data, date: new Date(data.date).toISOString() }
        : { ...data, id: invoice!.id, date: new Date(data.date).toISOString() };

      await onSubmit?.(submitData as CreateInvoiceData | UpdateInvoiceData);

      if (mode === 'create') {
        reset();
        setIsOpen(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
              Fecha de la Factura
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

          <div className="space-y-3">
            <Label htmlFor="total" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Total Calculado
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Automático
              </span>
            </Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              min="0"
              {...register('total', { valueAsNumber: true })}
              className="h-11 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-lg font-semibold text-green-700"
              readOnly
            />
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 Se calcula automáticamente sumando todos los subtotales de las tags
            </p>
          </div>
        </div>
      </div>

      {/* Gestión de Tags */}
      <Card className="border-2 border-dashed border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Detalles de la Factura (Tags)
              </CardTitle>
              <p className="text-sm text-gray-600">
                Agrega los diferentes conceptos que componen esta factura
              </p>
            </div>
            <Button
              type="button"
              onClick={addTag}
              size="sm"
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Concepto
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {fields.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay conceptos agregados
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Comienza agregando el primer concepto a esta factura. Cada concepto tendrá su propio cálculo de subtotal.
              </p>
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="border-2 border-dashed border-gray-300 hover:border-blue-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Concepto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800">Concepto {index + 1}</h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor={`tags.${index}.type`} className="text-sm font-medium text-gray-700">
                          Tipo de Concepto
                        </Label>
                        <Input
                          id={`tags.${index}.type`}
                          {...register(`tags.${index}.type` as const)}
                          placeholder="Ej: Envío, Producto A, Servicio..."
                          className={`h-10 ${errors.tags?.[index]?.type ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                        />
                        {errors.tags?.[index]?.type && (
                          <p className="text-xs text-red-600">{errors.tags[index]?.type?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`tags.${index}.weight`} className="text-sm font-medium text-gray-700">
                          Peso (lb)
                        </Label>
                        <Input
                          id={`tags.${index}.weight`}
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`tags.${index}.weight` as const, {
                            valueAsNumber: true,
                            onChange: () => updateTagSubtotal(index)
                          })}
                          placeholder="0.00"
                          className={`h-10 ${errors.tags?.[index]?.weight ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                        />
                        {errors.tags?.[index]?.weight && (
                          <p className="text-xs text-red-600">{errors.tags[index]?.weight?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`tags.${index}.cost_per_lb`} className="text-sm font-medium text-gray-700">
                          Costo por lb
                        </Label>
                        <Input
                          id={`tags.${index}.cost_per_lb`}
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`tags.${index}.cost_per_lb` as const, {
                            valueAsNumber: true,
                            onChange: () => updateTagSubtotal(index)
                          })}
                          placeholder="0.00"
                          className={`h-10 ${errors.tags?.[index]?.cost_per_lb ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                        />
                        {errors.tags?.[index]?.cost_per_lb && (
                          <p className="text-xs text-red-600">{errors.tags[index]?.cost_per_lb?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`tags.${index}.fixed_cost`} className="text-sm font-medium text-gray-700">
                          Costo Fijo
                        </Label>
                        <Input
                          id={`tags.${index}.fixed_cost`}
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`tags.${index}.fixed_cost` as const, {
                            valueAsNumber: true,
                            onChange: () => updateTagSubtotal(index)
                          })}
                          placeholder="0.00"
                          className={`h-10 ${errors.tags?.[index]?.fixed_cost ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'}`}
                        />
                        {errors.tags?.[index]?.fixed_cost && (
                          <p className="text-xs text-red-600">{errors.tags[index]?.fixed_cost?.message}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Subtotal Calculado</p>
                            <p className="text-sm text-gray-600">
                              Fórmula: (Peso × Costo/lb) + Costo Fijo
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`tags.${index}.subtotal` as const, { valueAsNumber: true })}
                            className="bg-white border-gray-300 w-32 h-10 text-lg font-bold text-green-700 text-right"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">USD</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Resumen Total */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Resumen de la Factura</h3>
                        <p className="text-sm text-gray-600">
                          {fields.length} concepto{fields.length !== 1 ? 's' : ''} • Total calculado automáticamente
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700">
                        ${watch('total')?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-gray-500">Total de la factura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {errors.tags && typeof errors.tags === 'object' && 'message' in errors.tags && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span className="text-xs">⚠️</span> {errors.tags.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogFooter className="flex gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={loading}
          className="h-11 px-6"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || fields.length === 0}
          className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
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
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}