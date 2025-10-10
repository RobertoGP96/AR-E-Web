import { useState } from 'react';
import { Filter, X, CheckCircle, XCircle, Shield, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { roleLabels, type UserRole } from '@/types/models/user';

export interface UserFilterState {
  role: string;
  isActive: string;
  isVerified: string;
}

interface UserFiltersProps {
  filters: UserFilterState;
  onFiltersChange: (filters: UserFilterState) => void;
  resultCount?: number;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Contar filtros activos
  const activeFiltersCount = [
    filters.role !== 'all',
    filters.isActive !== 'all',
    filters.isVerified !== 'all',
  ].filter(Boolean).length;

  const handleFilterChange = (key: keyof UserFilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      role: 'all',
      isActive: 'all',
      isVerified: 'all',
    });
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
          {activeFiltersCount > 0 && (
            <Badge
              variant="default"
              className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="h-4 w-4" />
            <h4 className="font-semibold text-sm">Filtros de usuarios</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Filtra usuarios por rol, estado de activación y verificación
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Contador de resultados */}
          {resultCount !== undefined && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-semibold text-foreground">
                  {resultCount}
                </span>{' '}
                {resultCount === 1 ? 'usuario' : 'usuarios'}
              </p>
            </div>
          )}

          {/* Filtro por Rol */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Rol
            </Label>
            <Select
              value={filters.role}
              onValueChange={(value) => handleFilterChange('role', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <Separator className="my-1" />
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.role !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Shield className="h-3 w-3" />
                {roleLabels[filters.role as UserRole]}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Filtro por Estado Activo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Estado de activación
            </Label>
            <Select
              value={filters.isActive}
              onValueChange={(value) => handleFilterChange('isActive', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <Separator className="my-1" />
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-sm">Activos</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm">Inactivos</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {filters.isActive !== 'all' && (
              <Badge
                variant={filters.isActive === 'active' ? 'default' : 'secondary'}
                className="gap-1 text-xs"
              >
                {filters.isActive === 'active' ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Activos
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactivos
                  </>
                )}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Filtro por Estado de Verificación */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Estado de verificación
            </Label>
            <Select
              value={filters.isVerified}
              onValueChange={(value) => handleFilterChange('isVerified', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <Separator className="my-1" />
                <SelectItem value="verified">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-sm">Verificados</span>
                  </div>
                </SelectItem>
                <SelectItem value="unverified">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-yellow-600" />
                    <span className="text-sm">No verificados</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {filters.isVerified !== 'all' && (
              <Badge
                variant={filters.isVerified === 'verified' ? 'default' : 'secondary'}
                className="gap-1 text-xs"
              >
                {filters.isVerified === 'verified' ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Verificados
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    No verificados
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Resumen de filtros activos */}
          {hasActiveFilters && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Filtros activos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {filters.role !== 'all' && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Shield className="h-3 w-3" />
                      {roleLabels[filters.role as UserRole]}
                      <button
                        onClick={() => handleFilterChange('role', 'all')}
                        className="ml-0.5 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.isActive !== 'all' && (
                    <Badge
                      variant={filters.isActive === 'active' ? 'default' : 'secondary'}
                      className="gap-1 text-xs"
                    >
                      {filters.isActive === 'active' ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {filters.isActive === 'active' ? 'Activos' : 'Inactivos'}
                      <button
                        onClick={() => handleFilterChange('isActive', 'all')}
                        className="ml-0.5 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.isVerified !== 'all' && (
                    <Badge
                      variant={filters.isVerified === 'verified' ? 'default' : 'secondary'}
                      className="gap-1 text-xs"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {filters.isVerified === 'verified' ? 'Verificados' : 'No verificados'}
                      <button
                        onClick={() => handleFilterChange('isVerified', 'all')}
                        className="ml-0.5 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 p-3 border-t bg-muted/20">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Limpiar
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};