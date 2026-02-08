import { Plus, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { UserForm } from './UserForm';
import { UserFilters, type UserFilterState } from '@/components/filters/user-filters';
import type { CreateUserData, UpdateUserData } from '../../types/models/user';

import { useUsers,  } from '@/hooks/user';
import { useQueryClient } from '@tanstack/react-query';

interface UsersFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  filters: UserFilterState;
  onFiltersChange: (filters: UserFilterState) => void;
  onCreateUser?: (data: CreateUserData | UpdateUserData) => void;
  isCreatingUser?: boolean;
  resultCount?: number;
}

export default function UsersFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onCreateUser,
  isCreatingUser = false,
  resultCount,
}: UsersFiltersProps) {
  const { isLoading, refetch } = useUsers();

  const queryClient = useQueryClient();
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }
  return (

    <div className="flex flex-col sm:flex-row gap-4">

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleRefresh()}
        disabled={isLoading}
        title="Actualizar lista"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>

      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200 shadow-sm"
          />
        </div>
      </div>

      <UserFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        resultCount={resultCount}
      />

      <UserForm
        mode="create"
        onSubmit={onCreateUser}
        loading={isCreatingUser}
        trigger={
          <Button className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            Agregar usuario
          </Button>
        }
      />
    </div>
  );
}
