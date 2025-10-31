import { useState } from 'react';
import { useCreatePackage } from '@/hooks/package';
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

interface CreatePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePackageDialog({ open, onOpenChange }: CreatePackageDialogProps) {
  const createPackageMutation = useCreatePackage();

  // Estado del formulario
  const [formData, setFormData] = useState({
    agency_name: '',
    number_of_tracking: '',
    status_of_processing: 'Enviado',
    arrival_date: '',
  });

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

    // Validación básica - requerir todos los campos
    if (!formData.agency_name.trim() || !formData.number_of_tracking.trim() || !formData.arrival_date) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      await createPackageMutation.mutateAsync({
        agency_name: formData.agency_name.trim(),
        number_of_tracking: formData.number_of_tracking.trim(),
        status_of_processing: formData.status_of_processing,
        arrival_date: formData.arrival_date,
      });

      toast.success('Paquete creado exitosamente');

      // Resetear formulario y cerrar diálogo
      setFormData({
        agency_name: '',
        number_of_tracking: '',
        status_of_processing: 'Enviado',
        arrival_date: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('No se pudo crear el paquete. Por favor intenta de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Paquete</DialogTitle>
          <DialogDescription>
            Complete todos los datos del paquete. Todos los campos son obligatorios.
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
              <Label htmlFor="arrival_date">
                Fecha de Llegada <span className="text-red-500">*</span>
              </Label>
              <Input
                id="arrival_date"
                type="date"
                value={formData.arrival_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, arrival_date: e.target.value }))
                }
                className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
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
              disabled={createPackageMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createPackageMutation.isPending}>
              {createPackageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Paquete'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}