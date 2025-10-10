import { UsersHeader, UsersFilters, UsersTable } from '@/components/users';
import { UserForm } from '@/components/users/UserForm';
import { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useVerifyUser, useToggleUserActive } from '@/hooks/user';
import type { UserRole, CustomUser } from '@/types/models/user';
import type { CreateUserData, UpdateUserData } from '@/types/models/user';
import type { UserFilterState } from '@/components/filters/user-filters';
import { toast } from 'sonner';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilters, setUserFilters] = useState<UserFilterState>({
    role: 'all',
    isActive: 'all',
    isVerified: 'all',
  });
  
  // Estado para el formulario de edición
  const [editingUser, setEditingUser] = useState<CustomUser | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Construir filtros para la API
  const apiFilters = useMemo(() => {
    const filters: {
      search?: string;
      role?: UserRole;
      is_active?: boolean;
      is_verified?: boolean;
    } = {};

    if (searchTerm) {
      filters.search = searchTerm;
    }

    if (userFilters.role !== 'all') {
      filters.role = userFilters.role as UserRole;
    }

    if (userFilters.isActive === 'active') {
      filters.is_active = true;
    } else if (userFilters.isActive === 'inactive') {
      filters.is_active = false;
    }

    if (userFilters.isVerified === 'verified') {
      filters.is_verified = true;
    } else if (userFilters.isVerified === 'unverified') {
      filters.is_verified = false;
    }

    return filters;
  }, [searchTerm, userFilters]);

  // Debug: Mostrar filtros que se están aplicando
  console.log('🔍 Filtros aplicados:', apiFilters);

  // Obtener usuarios con el hook
  const { data, isLoading, error } = useUsers(apiFilters);
  
  // Hooks para mutaciones
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const verifyUserMutation = useVerifyUser();
  const toggleUserActiveMutation = useToggleUserActive();

  // Manejador para crear usuario
  const handleCreateUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      await createUserMutation.mutateAsync(userData as CreateUserData);
    } catch (err) {
      console.error('Error al crear usuario:', err);
    }
  };

  // Manejador para editar usuario
  const handleEditUser = (user: CustomUser) => {
    setEditingUser(user);
    setIsEditFormOpen(true);
  };

  // Manejador para actualizar usuario
  const handleUpdateUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      await updateUserMutation.mutateAsync(userData as UpdateUserData);
      setIsEditFormOpen(false);
      setEditingUser(null);
      toast.success('Usuario actualizado correctamente', {
        description: 'Los cambios se han guardado exitosamente',
      });
    } catch (err: unknown) {
      
      // Extraer el mensaje de error del servidor
      let errorMessage = 'Ha ocurrido un error al actualizar el usuario';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: Record<string, unknown> } };
        const errorData = error.response?.data;
        
        if (errorData) {
          // Manejar errores específicos de campos
          if ('email' in errorData) {
            const emailError = typeof errorData.email === 'string' 
              ? errorData.email 
              : (errorData.email as { error?: string })?.error || (Array.isArray(errorData.email) ? errorData.email[0] : '');
            errorMessage = `Email: ${emailError}`;
          } else if ('phone_number' in errorData) {
            const phoneError = typeof errorData.phone_number === 'string'
              ? errorData.phone_number
              : (Array.isArray(errorData.phone_number) ? errorData.phone_number[0] : '');
            errorMessage = `Teléfono: ${phoneError}`;
          } else if ('detail' in errorData && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if ('message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        }
      }
      
      toast.error('Error al actualizar usuario', {
        description: errorMessage,
      });
      
      // Re-lanzar el error para que no cierre el formulario
      throw err;
    }
  };

  // Manejador para verificar usuario
  const handleVerifyUser = async (userId: number, isVerified: boolean) => {
    try {
      await verifyUserMutation.mutateAsync({ userId, verified: isVerified });
    } catch  {
      toast.error('Error al verificar usuario');
    }
  };

  // Manejador para activar/desactivar usuario
  const handleToggleUserActive = async (userId: number, isActive: boolean) => {
    try {
      await toggleUserActiveMutation.mutateAsync({ userId, isActive });
    } catch (err) {
      console.error('Error al cambiar estado del usuario:', err);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  return (
    <div className="space-y-6">
      <UsersHeader />
      <UsersFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={userFilters}
        onFiltersChange={setUserFilters}
        onCreateUser={handleCreateUser}
        isCreatingUser={createUserMutation.isPending}
        resultCount={data?.results?.length}
      />
      <UsersTable 
        users={data?.results}
        isLoading={isLoading}
        error={error ? String(error) : null}
        onEditUser={handleEditUser}
        onVerifyUser={handleVerifyUser}
        onToggleUserActive={handleToggleUserActive}
      />

      {/* Formulario de edición */}
      <UserForm
        mode="edit"
        user={editingUser ?? undefined}
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSubmit={handleUpdateUser}
        loading={updateUserMutation.isPending}
      />
    </div>
  );
};

export default Users;
