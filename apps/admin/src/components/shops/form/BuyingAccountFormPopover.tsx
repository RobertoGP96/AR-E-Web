import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import type { BuyingAccount } from '@/types/models/buying-account';
import type { ID } from '@/types/models/base';

interface BuyingAccountFormPopoverProps {
  account?: BuyingAccount | null;
  shopId: ID;
  shopName: string;
  onSuccess?: (account: BuyingAccount) => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  mode?: 'create' | 'edit';
}

interface FormData {
  account_name: string;
}

interface FormErrors {
  account_name?: string;
}

export default function BuyingAccountFormPopover({
  account = null,
  shopName,
  onSuccess,
  onCancel,
  trigger,
  mode = account ? 'edit' : 'create'
}: BuyingAccountFormPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    account_name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Inicializar formulario cuando se abre o cambia la cuenta
  useEffect(() => {
    if (open) {
      setFormData({
        account_name: account?.account_name || ''
      });
      setErrors({});
    }
  }, [open, account]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre de cuenta
    if (!formData.account_name.trim()) {
      newErrors.account_name = 'El nombre de la cuenta es requerido';
    } else if (formData.account_name.trim().length < 3) {
      newErrors.account_name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.account_name.trim().length > 100) {
      newErrors.account_name = 'El nombre no puede exceder 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (value: string) => {
    setFormData({ account_name: value });

    // Limpiar error cuando el usuario empiece a escribir
    if (errors.account_name) {
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { buyingAccountService } = await import('@/services/api');
      let result: BuyingAccount;

      if (mode === 'edit' && account) {
        // Actualizar cuenta existente
        result = await buyingAccountService.updateBuyingAccount(account.id, {
          account_name: formData.account_name.trim(),
          shop: shopName
        });
        toast.success('Cuenta actualizada', {
          description: `"${result.account_name}" ha sido actualizada exitosamente`
        });
      } else {
        // Crear nueva cuenta
        result = await buyingAccountService.createBuyingAccount({
          account_name: formData.account_name.trim(),
          shop: shopName
        });
        toast.success('Cuenta creada', {
          description: `"${result.account_name}" ha sido creada exitosamente`
        });
      }

      onSuccess?.(result);
      setOpen(false);
      setFormData({ account_name: '' });

    } catch (error) {
      console.error('Error saving buying account:', error);
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error inesperado";
      toast.error('Error al guardar cuenta', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({ account_name: '' });
    setErrors({});
    onCancel?.();
  };

  const defaultTrigger = (
    <Button
      variant={mode === 'edit' ? 'ghost' : 'default'}
      size={mode === 'edit' ? 'sm' : 'sm'}
      className={mode === 'edit'
        ? "h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
        : "shadow-sm hover:shadow-md transition-all duration-200"
      }
    >
      {mode === 'edit' ? (
        <Edit className="h-4 w-4" />
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cuenta
        </>
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-xl border-0 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {mode === 'edit' ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {mode === 'edit' ? 'Editar Cuenta' : 'Nueva Cuenta de Compra'}
              </h3>
              <p className="text-sm text-white/90">
                {mode === 'edit'
                  ? 'Modifica los datos de la cuenta'
                  : `Para la tienda ${shopName}`
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="account_name" className="text-sm font-medium text-gray-700">
              Nombre de la cuenta *
            </Label>
            <Input
              id="account_name"
              type="text"
              value={formData.account_name}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Ej: Cuenta Principal, Cuenta Secundaria"
              className={`transition-colors ${
                errors.account_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
              }`}
              disabled={isLoading}
              autoFocus
            />
            {errors.account_name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.account_name}
              </p>
            )}
          </div>

          {mode === 'create' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                💡 <strong>Consejo:</strong> Usa nombres descriptivos como "Cuenta Personal" 
                o "Cuenta Empresa" para identificar fácilmente cada cuenta.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {mode === 'edit' ? 'Actualizar' : 'Crear Cuenta'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
