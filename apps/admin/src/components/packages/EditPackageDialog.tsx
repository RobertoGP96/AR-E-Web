import { useState, useEffect } from 'react';
import { useUpdatePackage } from '@/hooks/package';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Truck, CheckCircle2 } from 'lucide-react';
import type { Package as PackageType } from '@/types';
import { DatePicker } from '../utils/DatePicker';

interface EditPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: PackageType | null;
}

export default function EditPackageDialog({ open, onOpenChange, package: pkg }: EditPackageDialogProps) {
  const updatePackageMutation = useUpdatePackage();

  // Estado del formulario
  const [formData, setFormData] = useState({
    agency_name: '',
    number_of_tracking: '',
    status_of_processing: 'Enviado',
    arrival_date: '',
  });

  // Actualizar el formulario cuando cambie el paquete
  useEffect(() => {
    if (pkg) {
      setFormData({
        agency_name: pkg.agency_name || '',
        number_of_tracking: pkg.number_of_tracking || '',
        status_of_processing: pkg.status_of_processing || 'Enviado',
        arrival_date: pkg.arrival_date ? pkg.arrival_date.split('T')[0] : '',
      });
    }
  }, [pkg]);

  // Funciones para obtener estilos según el estado
  const getPackageStatusStyles = (status: string) => {
    const styles = {
      'Enviado': 'bg-blue-50 border-blue-300 text-blue-800',
      'Recibido': 'bg-yellow-50 border-yellow-300 text-yellow-800',
      'Procesado': 'bg-green-50 border-green-300 text-green-800',
    };
    return styles[status as keyof typeof styles] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pkg) {
      toast.error('No se ha seleccionado un paquete');
      return;
    }

    // Validación básica
    if (!formData.agency_name.trim() || !formData.number_of_tracking.trim() || !formData.arrival_date) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      await updatePackageMutation.mutateAsync({
        id: pkg.id,
        data: {
          agency_name: formData.agency_name.trim(),
          number_of_tracking: formData.number_of_tracking.trim(),
          status_of_processing: formData.status_of_processing,
          arrival_date: formData.arrival_date,
        },
      });

      toast.success(`Paquete #${pkg.agency_name} actualizado exitosamente`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('No se pudo actualizar el paquete. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Paquete #{pkg?.agency_name}</DialogTitle>
          <DialogDescription>
            Modifica los datos del paquete. Los campos con (*) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Agencia */}
            <div className="grid gap-2">
              <Label htmlFor="agency_name">
                Agencia <span className="text-red-500">*</span>
              </Label>
              <Input
                id="agency_name"
                placeholder="Ej: DHL, FedEx, UPS..."
                value={formData.agency_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agency_name: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            {/* Número de Tracking */}
            <div className="grid gap-2">
              <Label htmlFor="number_of_tracking">
                Número de Tracking <span className="text-red-500">*</span>
              </Label>
              <Input
                id="number_of_tracking"
                placeholder="Ej: TRK123456789"
                value={formData.number_of_tracking}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, number_of_tracking: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>

            {/* Fecha de Llegada */}
            <div className="grid gap-2">
              <DatePicker
                value={formData.arrival_date ? new Date(formData.arrival_date) : undefined}
                onChange={(date: Date | undefined) => setFormData({ ...formData, arrival_date: date?.toISOString() || '' })}
              />

            </div>

            {/* Estado del Paquete */}
            <div className="grid gap-2">
              <Label htmlFor="status_of_processing">Estado del Paquete</Label>
              <Select
                value={formData.status_of_processing}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status_of_processing: value }))
                }
              >
                <SelectTrigger
                  id="status_of_processing"
                  className={`${getPackageStatusStyles(formData.status_of_processing)} font-medium`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enviado">
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      <span>Enviado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Recibido">
                    <div className="flex items-center gap-2">
                      <Package size={16} />
                      <span>Recibido</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Procesado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Procesado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={updatePackageMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePackageMutation.isPending}>
              {updatePackageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
