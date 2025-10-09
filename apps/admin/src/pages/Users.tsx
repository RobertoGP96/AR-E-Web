import { UsersHeader, UsersFilters, UsersTable } from '@/components/users';
import { UserForm } from '@/components/users/UserForm';
import { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useVerifyUser, useToggleUserActive } from '@/hooks/user';
import type { UserRole, CustomUser } from '@/types/models/user';
import type { CreateUserData, UpdateUserData } from '@/types/models/user';
import { toast } from 'sonner';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estado para el formulario de edición
  const [editingUser, setEditingUser] = useState<CustomUser | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Construir filtros para la API
  const filters = useMemo(() => {
    const apiFilters: {
      search?: string;
      role?: UserRole;
      is_active?: boolean;
      is_verified?: boolean;
    } = {};

    if (searchTerm) {
      apiFilters.search = searchTerm;
    }

    if (roleFilter !== 'all') {
      apiFilters.role = roleFilter as UserRole;
    }

    if (statusFilter === 'active') {
      apiFilters.is_active = true;
    } else if (statusFilter === 'inactive') {
      apiFilters.is_active = false;
    } else if (statusFilter === 'verified') {
      apiFilters.is_verified = true;
    } else if (statusFilter === 'unverified') {
      apiFilters.is_verified = false;
    }

    return apiFilters;
  }, [searchTerm, roleFilter, statusFilter]);

  // Obtener usuarios con el hook
  const { data, isLoading, error } = useUsers(filters);
  
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
      toast.success('Usuario actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      toast.error('Error al actualizar usuario');
    }
  };

  // Manejador para verificar usuario
  const handleVerifyUser = async (userId: number, isVerified: boolean) => {
    try {
      await verifyUserMutation.mutateAsync({ userId, verified: isVerified });
    } catch (err) {
      console.error('Error al verificar usuario:', err);
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
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreateUser={handleCreateUser}
        isCreatingUser={createUserMutation.isPending}
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
