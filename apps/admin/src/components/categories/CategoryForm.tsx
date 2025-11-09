import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  shipping_cost_per_pound: z.number().min(0, 'Debe ser >= 0'),
  client_shipping_charge: z.number().min(0, 'Debe ser >= 0'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialValues?: Partial<CategoryFormData>;
  loading?: boolean;
  onSubmit?: (data: CategoryFormData) => void | Promise<void>;
}

export default function CategoryForm({ initialValues, loading = false, onSubmit }: CategoryFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialValues?.name || '',
      shipping_cost_per_pound: initialValues?.shipping_cost_per_pound ?? 0,
      client_shipping_charge: initialValues?.client_shipping_charge ?? 0,
    },
  });

  const submit = async (data: CategoryFormData) => {
    if (onSubmit) await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Costo de envío por libra</Label>
        <Input type="number" step="0.01" {...register('shipping_cost_per_pound', { valueAsNumber: true })} />
        {errors.shipping_cost_per_pound && <p className="text-sm text-destructive">{errors.shipping_cost_per_pound.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Cobro al cliente por libra</Label>
        <Input type="number" step="0.01" {...register('client_shipping_charge', { valueAsNumber: true })} />
        {errors.client_shipping_charge && <p className="text-sm text-destructive">{errors.client_shipping_charge.message}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{loading ? 'Guardando...' : 'Guardar'}</span>
        </Button>
      </div>
    </form>
  );
}
