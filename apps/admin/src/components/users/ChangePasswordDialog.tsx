import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, XCircle, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  userId: number;
  userName: string;
  onChangePassword: (userId: number, newPassword: string) => Promise<void>;
  trigger?: React.ReactNode;
  loading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  userId,
  userName,
  onChangePassword,
  trigger,
  loading: externalLoading = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = externalLoading || internalLoading;

  // Control del estado del popover (controlado o no controlado)
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!data.newPassword || data.newPassword.length < 6) {
      toast.error('Error de validación', {
        description: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Error de validación', {
        description: 'Las contraseñas no coinciden',
      });
      return;
    }

    try {
      setInternalLoading(true);
      await onChangePassword(userId, data.newPassword);
      toast.success('Contraseña actualizada', {
        description: `La contraseña de ${userName} ha sido cambiada exitosamente`,
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar contraseña', {
        description: error instanceof Error ? error.message : 'Ha ocurrido un error inesperado',
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setOpen(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Cambiar contraseña
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Nueva contraseña para <span className="font-medium">{userName}</span>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="change-password-form">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  {...register('newPassword')}
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <span className="text-destructive text-xs flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.newPassword.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  {...register('confirmPassword')}
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <span className="text-destructive text-xs flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="gap-2"
                form="change-password-form"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Cambiar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
