import { Edit, Trash2, MoreHorizontal, Shield, User, ShoppingCart, Truck, Calculator, Megaphone, Clock, Phone, Hand, HandGrab, HandHelping, HandHeart, Handshake } from 'lucide-react';
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


// Datos de ejemplo para desarrollo
const mockUsers: CustomUser[] = [
  {
    id: 1,
    email: "admin@example.com",
    name: "Juan",
    last_name: "Pérez",
    home_address: "Calle Principal 123",
    phone_number: "+57 300 1234567",
    role: 'admin',
    agent_profit: 0,
    is_staff: true,
    is_active: true,
    is_verified: true,
    date_joined: "2024-01-15T10:30:00Z",
    sent_verification_email: true,
    full_name: "Juan Pérez",
    // extras para la tabla
    ordersCount: 0,
    lastAccess: "2024-01-20T15:45:00Z"
  },
  {
    id: 2,
    email: "maria.agent@example.com",
    name: "María",
    last_name: "García",
    home_address: "Avenida Secundaria 456",
    phone_number: "+57 301 9876543",
    role: 'agent',
    agent_profit: 15.5,
    is_staff: false,
    is_active: true,
    is_verified: true,
    date_joined: "2024-01-10T08:20:00Z",
    sent_verification_email: true,
    full_name: "María García",
    ordersCount: 45,
    lastAccess: "2024-01-20T14:30:00Z"
  },
  {
    id: 3,
    email: "carlos.buyer@example.com",
    name: "Carlos",
    last_name: "Rodríguez",
    home_address: "Carrera 10 #25-30",
    phone_number: "+57 302 5555555",
    role: 'buyer',
    agent_profit: 0,
    is_staff: false,
    is_active: true,
    is_verified: false,
    date_joined: "2024-01-08T12:15:00Z",
    sent_verification_email: false,
    full_name: "Carlos Rodríguez",
    ordersCount: 23,
    lastAccess: "2024-01-19T11:20:00Z"
  },
  {
    id: 4,
    email: "ana.logistics@example.com",
    name: "Ana",
    last_name: "López",
    home_address: "Zona Industrial 789",
    phone_number: "+57 303 7777777",
    role: 'logistical',
    agent_profit: 0,
    is_staff: false,
    is_active: false,
    is_verified: true,
    date_joined: "2024-01-05T16:45:00Z",
    sent_verification_email: true,
    full_name: "Ana López",
    lastAccess: "2024-01-18T09:10:00Z"
  },
  {
    id: 4,
    email: "ana.logistics@example.com",
    name: "Ana",
    last_name: "López",
    home_address: "Zona Industrial 789",
    phone_number: "+57 303 7777777",
    role: 'client',
    agent_profit: 0,
    is_staff: false,
    is_active: false,
    is_verified: true,
    date_joined: "2024-01-05T16:45:00Z",
    sent_verification_email: true,
    full_name: "Ana López",
    lastAccess: "2024-01-18T09:10:00Z"
  }
];


export default function UsersTable({
  users = mockUsers,
  onEditUser,
  onDeleteUser,
  onUserClick
}: UsersTableProps) {
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
            return (
              <TableRow
                key={user.id}
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
