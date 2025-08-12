import React from 'react';
import type { CustomUser, CreateUserData, UpdateUserData } from '../../types/models/user';
import { roleLabels } from '../../types/models/user';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  home_address: z.string().min(2, 'Dirección requerida'),
  phone_number: z.string().min(7, 'Teléfono requerido'),
  password: z.string().min(6, 'Contraseña requerida').optional(),
  role: z.string(),
  agent_profit: z.number().min(0),
});

type UserFormSchema = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: CustomUser;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  isEdit?: boolean;
  loading?: boolean;
  error?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, isEdit = false, loading = false, error }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: isEdit && user
      ? {
          email: user.email,
          name: user.name,
          last_name: user.last_name,
          home_address: user.home_address,
          phone_number: user.phone_number,
          password: '',
          role: user.role,
          agent_profit: user.agent_profit,
        }
      : {
          email: '',
          name: '',
          last_name: '',
          home_address: '',
          phone_number: '',
          password: '',
          role: 'user',
          agent_profit: 0,
        },
  });

  const submitHandler = (data: UserFormSchema) => {
    if (isEdit && user) {
      onSubmit({ ...data, id: user.id, role: user.role as import('../../types/models/user').UserRole });
    } else {
      // Ensure the data matches CreateUserData type
      const createUserData: CreateUserData = {
        email: data.email,
        name: data.name,
        last_name: data.last_name,
        home_address: data.home_address,
        phone_number: data.phone_number,
        password: data.password ?? '',
        role: data.role as import('../../types/models/user').UserRole,
        agent_profit: data.agent_profit,
      };
      onSubmit(createUserData);
      reset();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{isEdit ? 'Editar usuario' : 'Crear usuario'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent>
            <form onSubmit={() => handleSubmit(submitHandler)} className="space-y-4">
              {error && <div className="text-red-500">{error}</div>}
              <div>
                <Input type="email" placeholder="Email" {...register('email')} disabled={loading} />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>
              <div>
                <Input type="text" placeholder="Nombre" {...register('name')} disabled={loading} />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>
              <div>
                <Input type="text" placeholder="Apellido" {...register('last_name')} disabled={loading} />
                {errors.last_name && <span className="text-red-500 text-xs">{errors.last_name.message}</span>}
              </div>
              <div>
                <Input type="text" placeholder="Dirección" {...register('home_address')} disabled={loading} />
                {errors.home_address && <span className="text-red-500 text-xs">{errors.home_address.message}</span>}
              </div>
              <div>
                <Input type="text" placeholder="Teléfono" {...register('phone_number')} disabled={loading} />
                {errors.phone_number && <span className="text-red-500 text-xs">{errors.phone_number.message}</span>}
              </div>
              {!isEdit && (
                <div>
                  <Input type="password" placeholder="Contraseña" {...register('password')} disabled={loading} />
                  {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                </div>
              )}
              <div>
                <select {...register('role')} className="w-full border rounded px-2 py-1" disabled={loading}>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.role && <span className="text-red-500 text-xs">{errors.role.message}</span>}
              </div>
              <div>
                <Input type="number" placeholder="Ganancia de agente" {...register('agent_profit', { valueAsNumber: true })} min={0} disabled={loading} />
                {errors.agent_profit && <span className="text-red-500 text-xs">{errors.agent_profit.message}</span>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar usuario' : 'Crear usuario'}
                </Button>
              </DialogFooter>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
