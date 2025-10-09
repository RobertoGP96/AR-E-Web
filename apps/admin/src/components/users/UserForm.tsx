import React, { useState } from 'react';
import type { CustomUser, CreateUserData, UpdateUserData } from '../../types/models/user';
import { roleLabels } from '../../types/models/user';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, Mail, Phone, MapPin, Shield, Percent, User2, Lock, CheckCircle, XCircle, UserCheck, UserX, UserPlus, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Schema para crear usuario (contraseña requerida)
const createUserSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  home_address: z.string().optional(),
  phone_number: z.string().min(7, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña requerida (mínimo 6 caracteres)'),
  role: z.string(),
  agent_profit: z.number().min(0).optional(),
});

// Schema para editar usuario (contraseña opcional)
const editUserSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  home_address: z.string().optional(),
  phone_number: z.string().min(7, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: z.string(),
  agent_profit: z.number().min(0).optional(),
});

type CreateUserFormSchema = z.infer<typeof createUserSchema>;
type EditUserFormSchema = z.infer<typeof editUserSchema>;
type UserFormSchema = CreateUserFormSchema | EditUserFormSchema;

interface UserFormProps {
  user?: CustomUser;
  onSubmit?: (data: CreateUserData | UpdateUserData) => void;
  onActivate?: (userId: number, isActive: boolean) => void;
  onVerify?: (userId: number, isVerified: boolean) => void;
  mode?: 'create' | 'edit' | 'view';
  loading?: boolean;
  error?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSubmit, 
  onActivate,
  onVerify,
  mode = 'create', 
  loading = false, 
  error,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const isEdit = mode === 'edit';
  const isView = mode === 'view';
  const isCreate = mode === 'create';

  const schema = isCreate ? createUserSchema : editUserSchema;

  const getDefaultValues = () => {
    if (isCreate) {
      return {
        email: '',
        name: '',
        last_name: '',
        home_address: '',
        phone_number: '',
        password: '',
        role: 'user',
        agent_profit: 0,
      };
    }
    if (user) {
      return {
        email: user.email,
        name: user.name,
        last_name: user.last_name,
        home_address: user.home_address,
        phone_number: user.phone_number,
        password: '',
        role: user.role,
        agent_profit: user.agent_profit,
      };
    }
    return {
      email: '',
      name: '',
      last_name: '',
      home_address: '',
      phone_number: '',
      password: '',
      role: 'user',
      agent_profit: 0,
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<UserFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // Observar el rol seleccionado para mostrar/ocultar ganancia de agente
  const selectedRole = watch('role');

  // Resetear el formulario cuando cambia el usuario o el modo
  React.useEffect(() => {
    const values = getDefaultValues();
    reset(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mode, reset]);

  // Mostrar toast cuando hay error desde las props
  React.useEffect(() => {
    if (error && error.trim() !== '') {
      toast.error('Error al guardar usuario', {
        description: error,
      });
    }
  }, [error]);

  const submitHandler = (data: UserFormSchema) => {
    if (!onSubmit) {
      toast.error('Error de configuración', {
        description: 'No se ha proporcionado una función para guardar el usuario',
      });
      return;
    }

    // Validar campos requeridos manualmente antes de enviar
    if (!data.name || data.name.trim().length < 2) {
      toast.error('Error de validación', {
        description: 'El nombre debe tener al menos 2 caracteres',
      });
      return;
    }

    if (!data.last_name || data.last_name.trim().length < 2) {
      toast.error('Error de validación', {
        description: 'El apellido debe tener al menos 2 caracteres',
      });
      return;
    }

    if (!data.phone_number || data.phone_number.trim().length < 7) {
      toast.error('Error de validación', {
        description: 'El teléfono debe tener al menos 7 caracteres',
      });
      return;
    }

    if (isCreate && (!data.password || data.password.length < 6)) {
      toast.error('Error de validación', {
        description: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        toast.error('Error de validación', {
          description: 'El email no es válido',
        });
        return;
      }
    }

    try {
      if (isEdit && user) {
        const updateData: UpdateUserData = {
          id: user.id,
          email: data.email || '',
          name: data.name,
          last_name: data.last_name,
          home_address: data.home_address || '',
          phone_number: data.phone_number,
          role: data.role as import('../../types/models/user').UserRole,
          agent_profit: data.agent_profit || 0,
        };
        // Solo incluir password si se proporcionó
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password;
        }
        
        onSubmit(updateData);
        
        toast.success('Usuario actualizado', {
          description: `Los datos de ${data.name} ${data.last_name} han sido actualizados correctamente`,
        });
      } else if (isCreate) {
        const createUserData: CreateUserData = {
          email: data.email || '',
          name: data.name,
          last_name: data.last_name,
          home_address: data.home_address || '',
          phone_number: data.phone_number,
          password: data.password ?? '',
          role: data.role as import('../../types/models/user').UserRole,
          agent_profit: data.agent_profit || 0,
        };

        onSubmit(createUserData);
        
        toast.success('Usuario creado exitosamente', {
          description: `${data.name} ${data.last_name} ha sido registrado como ${roleLabels[data.role as keyof typeof roleLabels]}`,
        });
        
        reset(getDefaultValues());
        setOpen(false);
      }
    } catch (err) {
      toast.error('Error al guardar', {
        description: err instanceof Error ? err.message : 'Ha ocurrido un error inesperado',
      });
    }
  };

  const handleActivateToggle = () => {
    if (user && onActivate) {
      onActivate(user.id, !user.is_active);
    }
  };

  const handleVerifyToggle = () => {
    if (user && onVerify) {
      onVerify(user.id, !user.is_verified);
    }
  };

  const getDialogTitle = () => {
    if (isView) return 'Detalles del usuario';
    if (isEdit) return 'Editar usuario';
    return 'Crear nuevo usuario';
  };

  const getDialogDescription = () => {
    if (isView) return 'Información completa del usuario';
    if (isEdit) return 'Modifica los datos del usuario';
    return 'Completa los datos para crear un nuevo usuario';
  };

  const getButtonText = () => {
    if (loading) return 'Guardando...';
    if (isEdit) return 'Actualizar usuario';
    return 'Crear usuario';
  };

  const getButtonIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isEdit) return <Save className="h-4 w-4" />;
    return <UserPlus className="h-4 w-4" />;
  };

  // Modo solo lectura - mostrar detalles del usuario con diseño mejorado
  if (isView && user) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium truncate mt-1">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <User2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Nombre completo</Label>
                  <p className="text-sm font-medium mt-1">{user.name} {user.last_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Teléfono</Label>
                  <p className="text-sm font-medium mt-1">{user.phone_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium text-muted-foreground">Dirección</Label>
                  <p className="text-sm font-medium mt-1">{user.home_address}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información del rol y permisos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-muted-foreground">Rol</Label>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-sm">
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Solo mostrar ganancia de agente si el rol es 'agent' */}
              {user.role === 'agent' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Percent className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-medium text-muted-foreground">Ganancia de agente</Label>
                    <p className="text-sm font-medium mt-1">{user.agent_profit}%</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Estado del usuario */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-3 block">Estado del usuario</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant={user.is_active ? "default" : "secondary"} className="gap-1">
                  {user.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={user.is_verified ? "default" : "secondary"} className="gap-1">
                  {user.is_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {user.is_verified ? 'Verificado' : 'No verificado'}
                </Badge>
                {user.is_staff && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Staff
                  </Badge>
                )}
              </div>
            </div>

            {/* Acciones rápidas */}
            {(onActivate || onVerify) && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-3 block">Acciones rápidas</Label>
                  <div className="flex flex-wrap gap-2">
                    {onActivate && (
                      <Button
                        variant={user.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={handleActivateToggle}
                        disabled={loading}
                        className="gap-2"
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Activar
                          </>
                        )}
                      </Button>
                    )}
                    {onVerify && (
                      <Button
                        variant={user.is_verified ? "outline" : "default"}
                        size="sm"
                        onClick={handleVerifyToggle}
                        disabled={loading}
                        className="gap-2"
                      >
                        {user.is_verified ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            Marcar como no verificado
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Verificar usuario
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Modo crear/editar - formulario con diseño mejorado
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Información de contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Información de contacto
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
             

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Nombre *
                  </Label>
                  <Input 
                    id="name"
                    type="text" 
                    placeholder="Juan" 
                    {...register('name')} 
                    disabled={loading}
                    className="h-10"
                  />
                  {errors.name && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Apellido *
                  </Label>
                  <Input 
                    id="last_name"
                    type="text" 
                    placeholder="Pérez" 
                    {...register('last_name')} 
                    disabled={loading}
                    className="h-10"
                  />
                  {errors.last_name && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.last_name.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Teléfono *
                </Label>
                <Input 
                  id="phone_number"
                  type="tel" 
                  placeholder="+1234567890" 
                  {...register('phone_number')} 
                  disabled={loading}
                  className="h-10"
                />
                {errors.phone_number && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.phone_number.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="home_address" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Dirección
                </Label>
                <Input 
                  id="home_address"
                  type="text" 
                  placeholder="Calle Principal #123, Ciudad, País (opcional)" 
                  {...register('home_address')} 
                  disabled={loading}
                  className="h-10"
                />
                {errors.home_address && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.home_address.message}
                  </span>
                )}
              </div>

               <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="usuario@ejemplo.com" 
                  {...register('email')} 
                  disabled={loading}
                  className="h-10"
                />
                {errors.email && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Seguridad */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              Seguridad
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Contraseña {isEdit && <span className="text-xs text-muted-foreground">(opcional - dejar vacío para no cambiar)</span>}
                {isCreate && <span className="text-destructive">*</span>}
              </Label>
              <Input 
                id="password"
                type="password" 
                placeholder={isEdit ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"} 
                {...register('password')} 
                disabled={loading}
                className="h-10"
              />
              {errors.password && (
                <span className="text-destructive text-xs flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Rol y permisos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Rol y permisos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Rol *
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.role.message}
                  </span>
                )}
              </div>

              {/* Solo mostrar ganancia de agente si el rol es 'agent' */}
              {selectedRole === 'agent' && (
                <div className="space-y-2">
                  <Label htmlFor="agent_profit" className="flex items-center gap-2">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    Ganancia de agente (%)
                  </Label>
                  <Input 
                    id="agent_profit"
                    type="number" 
                    placeholder="0" 
                    {...register('agent_profit', { valueAsNumber: true })} 
                    min={0}
                    max={100}
                    step={0.01}
                    disabled={loading}
                    className="h-10"
                  />
                  {errors.agent_profit && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errors.agent_profit.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="gap-2"
            >
              {getButtonIcon()}
              {getButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente de botón para ver detalles de usuario
interface ViewUserButtonProps {
  user: CustomUser;
}

export const ViewUserButton: React.FC<ViewUserButtonProps> = ({ user }) => {
  return (
    <UserForm 
      user={user} 
      mode="view"
      trigger={
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      }
    />
  );
};
