import { Edit, Trash2, MoreHorizontal, Shield, User, ShoppingCart, Truck, Calculator, Megaphone, Clock, Phone, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { CustomUser, UserRole } from '@/types/models/user';
import { roleLabels } from '@/types/models/user';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';

interface UsersTableProps {
  users?: CustomUser[];
  onEditUser?: (user: CustomUser) => void;
  onDeleteUser?: (user: CustomUser) => void;
  onUserClick?: (user: CustomUser) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Iconos para los roles
const roleIcons: Record<UserRole, React.ElementType> = {
  user: User,
  agent: Handshake,
  accountant: Calculator,
  buyer: ShoppingCart,
  logistical: Truck,
  community_manager: Megaphone,
  admin: Shield,
  client: User,
};


export default function UsersTable({
  users = [],
  onEditUser,
  onDeleteUser,
  onUserClick,
  isLoading = false,
  error = null
}: UsersTableProps) {
  // Estado de carga
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-orange-400"></div>
            <p className="text-sm text-gray-500">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="overflow-x-auto rounded-lg border border-red-200 bg-red-50 shadow">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">Error al cargar usuarios</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado vacío
  if (!users || users.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <User className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900">No hay usuarios registrados</p>
              <p className="text-xs text-gray-500 mt-1">Los usuarios aparecerán aquí cuando se registren</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">

      <Table>
        <TableHeader className='bg-gray-100 rounded-sm'>
          <TableRow>
            <TableHead className="text-center">#</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const RoleIcon = roleIcons[user.role];
            // Usar user_id si existe, sino usar id
            const userId = user.user_id ?? user.id;
            return (
              <TableRow
                key={userId}
                className="cursor-pointer group "
                onClick={() => onUserClick?.(user)}
              >
                <TableCell className="py-4 px-3 text-center w-16">
                  <span className="inline-flex items-center justify-center w-8 h-8 text-gray-700 text-sm font-medium">
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-200 font-semibold">
                        {user.name.charAt(0)}{user.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Phone className="h-4 w-4 inline-block mr-1" />
                    <span>{user.phone_number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={"secondary"} className="rounded-full px-3 py-1 flex items-center gap-1 w-fit">
                    <RoleIcon className="h-5 w-5" />
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge className={`rounded-full px-3 py-1 w-fit ${user.is_active ? (user.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700') : 'bg-gray-100 text-gray-500'}`}>
                    {user.is_active ? (user.is_verified ? 'Verificado' : 'Activo') : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex items-center'>
                    <Clock className="h-4 w-4 inline-block mr-1" />
                    <span>{formatDate(user.date_joined)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-200">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditUser?.(user);
                        }}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                        Editar usuario
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUser?.(user);
                        }}
                        className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar usuario
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
