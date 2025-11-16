import { useRef, useState } from 'react';
import type { UseFormWatch, UseFormSetValue, UseFieldArrayRemove, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Trash2, Edit2, Check } from 'lucide-react';
import type { CreateInvoiceFormData, EditInvoiceFormData } from '../../schemas/invoiceSchemas';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface TagItemProps {
  index: number;
  watch: UseFormWatch<CreateInvoiceFormData | EditInvoiceFormData>;
  setValue: UseFormSetValue<CreateInvoiceFormData | EditInvoiceFormData>;
  remove: UseFieldArrayRemove;
  updateTagSubtotal: (index: number, onUpdate?: () => void) => void;
  errors: FieldErrors<CreateInvoiceFormData | EditInvoiceFormData>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TagItem({
  index,
  watch,
  setValue,
  remove,
  updateTagSubtotal,
  errors,
  open,
  onOpenChange,
}: TagItemProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const effectiveOpen = typeof open === 'boolean' ? open : internalOpen;
  const setEffectiveOpen = (val: boolean) => {
    if (typeof open !== 'boolean') setInternalOpen(val);
    onOpenChange?.(val);
  };
  // Debounce para actualizar subtotal mientras el usuario escribe
  const debounceRef = useRef<number | null>(null);

  const type = watch(`tags.${index}.type` as const);
  const subtotal = watch(`tags.${index}.subtotal` as const) || 0;

  const saveAndClose = () => {
    // Calcular subtotal y cerrar el popover inmediatamente
    updateTagSubtotal(index, () => setEffectiveOpen(false));
  };

  // Actualizar el subtotal inmediatamente cuando el usuario modifica campos
  const scheduleUpdate = () => {
    // Si el input se está tecleando, limpiamos cualquier debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // Actualizar sin demora para reflejar el cambio en el total del invoice
    updateTagSubtotal(index);
  };

  const renderForm = (
    <div className="space-y-4 w-[360px]">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Concepto {index + 1}</h4>
        <div className="flex items-center gap-2">
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
      </div>

      <div>
        <Label htmlFor={`tags.${index}.type`} className="text-sm font-medium text-gray-700">
          Tipo
        </Label>
        <Select
          value={type || ''}
          onValueChange={(value) => {
            setValue(`tags.${index}.type` as const, value as 'pesaje' | 'nominal');
            // Resetear campos cuando cambia el tipo
            setValue(`tags.${index}.weight` as const, 0);
            setValue(`tags.${index}.cost_per_lb` as const, 0);
            setValue(`tags.${index}.fixed_cost` as const, 0);
            updateTagSubtotal(index);
          }}
        >
          <SelectTrigger className={`h-10 ${errors.tags?.[index]?.type
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:ring-orange-200 focus:border-orange-400'
            }`}>
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pesaje">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Pesaje
              </div>
            </SelectItem>
            <SelectItem value="nominal">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Nominal
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'pesaje' && (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor={`tags.${index}.weight`} className="text-sm font-medium text-gray-700">
              Peso (lb)
            </Label>
            <InputGroup>
              <InputGroupInput
                id={`tags.${index}.weight`}
                type="number"
                step="0.01"
                min="0"
                value={watch(`tags.${index}.weight` as const) || ''}
                onChange={(e) => {
                  setValue(`tags.${index}.weight` as const, parseFloat(e.target.value) || 0);
                  scheduleUpdate();
                }}
                onBlur={() => {
                  if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current);
                    debounceRef.current = null;
                  }
                  updateTagSubtotal(index);
                }}
                placeholder="0.00"
                className={`h-10 ${errors.tags?.[index]?.weight
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-orange-400'
                  }`}
              />
              <InputGroupAddon align="inline-end">Lb</InputGroupAddon>
            </InputGroup>
          </div>

          <div>
            <Label htmlFor={`tags.${index}.cost_per_lb`} className="text-sm font-medium text-gray-700">
              Costo ($)
            </Label>
            <InputGroup>
              <InputGroupInput
                id={`tags.${index}.cost_per_lb`}
                type="number"
                step="0.01"
                min="0"
                value={watch(`tags.${index}.cost_per_lb` as const) || ''}
                onChange={(e) => {
                  setValue(`tags.${index}.cost_per_lb` as const, parseFloat(e.target.value) || 0);
                  scheduleUpdate();
                }}
                onBlur={() => {
                  if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current);
                    debounceRef.current = null;
                  }
                  updateTagSubtotal(index);
                }}
                placeholder="0.00"
                className={`h-10 ${errors.tags?.[index]?.cost_per_lb
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                  }`}
              />
              <InputGroupAddon align="inline-start">$</InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      )}

      {type === 'nominal' && (
        <div>
          <Label htmlFor={`tags.${index}.fixed_cost`} className="text-sm font-medium text-gray-700">
            Costo Fijo
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              id={`tags.${index}.fixed_cost`}
              type="number"
              step="0.01"
              min="0"
              value={watch(`tags.${index}.fixed_cost` as const) || ''}
              onChange={(e) => {
                setValue(`tags.${index}.fixed_cost` as const, parseFloat(e.target.value) || 0);
                scheduleUpdate();
              }}
              onBlur={() => {
                if (debounceRef.current) {
                  window.clearTimeout(debounceRef.current);
                  debounceRef.current = null;
                }
                updateTagSubtotal(index);
              }}
              placeholder="0.00"
              className={`h-10 pl-8 pr-3 w-full border rounded-md ${errors.tags?.[index]?.fixed_cost
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
                }`}
            />
          </div>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between border-t">
        <div className="text-sm text-gray-600">Subtotal</div>
        <div className="text-lg font-bold">${subtotal.toFixed(2)}</div>
      </div>

      <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEffectiveOpen(false)}
          className="h-9"
        >
          Cancel
        </Button>
          <Button
            type="button"
            onClick={saveAndClose}
          className="h-9 bg-orange-400 text-white hover:bg-orange-500"
        >
          <Check className="mr-2 h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  );

  return (
    <Popover open={effectiveOpen} onOpenChange={setEffectiveOpen}>
      <PopoverTrigger asChild>
        <Card className={`py-2.5 border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${type === 'pesaje' ? 'border-l-orange-400 ' : 'border-l-gray-300'
          }`}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className='space-y-2'>
                <h4 className="font-semibold text-gray-800">Concepto {index + 1}</h4>
                <Badge variant={"secondary"}>
                  <p className="text-sm text-gray-600">{type ? (type === 'pesaje' ? 'Pesaje' : 'Nominal') : 'Sin Tipo'}</p>
                </Badge>
              </div>
              {type === "pesaje" &&
                <div>
                  <p className="text-sm text-gray-600">
                    {watch(`tags.${index}.weight` as const) || 0} lb x ${watch(`tags.${index}.cost_per_lb` as const) || 0}
                  </p>
                </div>
              }
              <div className="text-right flex flex-row items-center justify-center gap-2">
                <div className="text-lg font-bold text-gray-500">${subtotal.toFixed(2)}</div>
                <div className="flex items-center gap">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEffectiveOpen(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverTrigger>

      <PopoverContent  className="!w-auto p-4">
        {renderForm}
      </PopoverContent>
    </Popover>
  );
}