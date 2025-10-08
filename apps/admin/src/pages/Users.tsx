import { UsersHeader, UsersFilters, UsersTable } from '@/components/users';
import { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/user';
import type { UserRole } from '@/types/models/user';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
      />
      <UsersTable 
        users={data?.data}
        isLoading={isLoading}
        error={error ? String(error) : null}
      />
    </div>
  );
};

export default Users;
