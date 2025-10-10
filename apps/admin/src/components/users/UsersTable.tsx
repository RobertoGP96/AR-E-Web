import { Edit, Trash2, MoreHorizontal, Shield, User, ShoppingCart, Truck, Calculator, Megaphone, Clock, Phone, Handshake, Eye, CheckCircle, XCircle, UserCheck, Mail, Key, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { CustomUser, UserRole } from '@/types/models/user';
import { roleLabels } from '@/types/models/user';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';
import { useDeleteUser, useVerifyUser, useToggleUserActive, useChangePassword } from '@/hooks/user';
import { toast } from 'sonner';
import { useState } from 'react';
import UserDetailsDialog from './UserDetailsDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface UsersTableProps {
  users?: CustomUser[];
  onEditUser?: (user: CustomUser) => void;
  onDeleteUser?: (user: CustomUser) => void;
  onUserClick?: (user: CustomUser) => void;
  onVerifyUser?: (userId: number, isVerified: boolean) => void;
  onToggleUserActive?: (userId: number, isActive: boolean) => void;
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

// Tipos para el diálogo de confirmación
type DialogType = 'delete' | 'verify' | 'activate' | 'deactivate' | null;

interface DialogState {
  type: DialogType;
  user: CustomUser | null;
}


export default function UsersTable({
  users = [],
  onEditUser,
  onDeleteUser,
  onUserClick,
  onVerifyUser,
  onToggleUserActive,
  isLoading = false,
  error = null
}: UsersTableProps) {
  // Estados para los diálogos de confirmación
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    user: null
  });

  // Estado para el diálogo de detalles
  const [selectedUser, setSelectedUser] = useState<CustomUser | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Estado para el popover de cambio de contraseña
  const [showPasswordPopover, setShowPasswordPopover] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<CustomUser | null>(null);

  // Hooks de mutación (solo para eliminar desde la tabla)
  const deleteUserMutation = useDeleteUser();
  const verifyUserMutation = useVerifyUser();
  const toggleUserActiveMutation = useToggleUserActive();
  const changePasswordMutation = useChangePassword();

  // Manejador para ver detalles
  const handleViewDetails = (user: CustomUser) => {
    setSelectedUser(user);
    setShowDetails(true);
    onUserClick?.(user);
  };

  // Manejadores de acciones
  const handleDeleteConfirm = async () => {
    if (!dialogState.user) return;

    const userId = dialogState.user.id;
    
    // Debug: verificar que el ID sea válido
    if (!userId || userId === undefined) {
      console.error('Error: ID de usuario inválido', dialogState.user);
      toast.error('Error: ID de usuario inválido');
      setDialogState({ type: null, user: null });
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success('Usuario eliminado exitosamente');
      onDeleteUser?.(dialogState.user);
    } catch (error) {
      toast.error('Error al eliminar usuario');
      console.error('Error al eliminar usuario:', error);
    } finally {
      setDialogState({ type: null, user: null });
    }
  };

  const handleVerifyConfirm = async () => {
    if (!dialogState.user) return;

    try {
      // Usar prop si está disponible, sino usar mutación interna
      if (onVerifyUser) {
        await onVerifyUser(dialogState.user.id, true);
      } else {
        await verifyUserMutation.mutateAsync({
          userId: dialogState.user.id,
          verified: true
        });
      }
      toast.success('Usuario verificado exitosamente');
    } catch (error) {
      toast.error('Error al verificar usuario');
      console.error('Error al verificar usuario:', error);
    } finally {
      setDialogState({ type: null, user: null });
    }
  };

  const handleToggleActiveConfirm = async () => {
    if (!dialogState.user) return;

    const isActivating = dialogState.type === 'activate';

    try {
      // Usar prop si está disponible, sino usar mutación interna
      if (onToggleUserActive) {
        await onToggleUserActive(dialogState.user.id, isActivating);
      } else {
        await toggleUserActiveMutation.mutateAsync({
          userId: dialogState.user.id,
          isActive: isActivating
        });
      }
      toast.success(`Usuario ${isActivating ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      toast.error(`Error al ${isActivating ? 'activar' : 'desactivar'} usuario`);
      console.error(`Error al ${isActivating ? 'activar' : 'desactivar'} usuario:`, error);
    } finally {
      setDialogState({ type: null, user: null });
    }
  };

  const handleChangePassword = async (userId: number, newPassword: string) => {
    try {
      await changePasswordMutation.mutateAsync({
        userId,
        password: newPassword
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error; // Re-lanzar para que el popover lo maneje
    }
  };

  const handleConfirm = () => {
    switch (dialogState.type) {
      case 'delete':
        handleDeleteConfirm();
        break;
      case 'verify':
        handleVerifyConfirm();
        break;
      case 'activate':
      case 'deactivate':
        handleToggleActiveConfirm();
        break;
    }
  };

  const handleCancel = () => {
    setDialogState({ type: null, user: null });
  };

  // Función para obtener el contenido del diálogo según el tipo
  const getDialogContent = () => {
    if (!dialogState.user) return { title: '', description: '' };

    switch (dialogState.type) {
      case 'delete':
        return {
          title: '¿Eliminar usuario?',
          description: `¿Estás seguro de que deseas eliminar a ${dialogState.user.full_name}? Esta acción no se puede deshacer.`,
          actionText: 'Eliminar',
          variant: 'destructive' as const
        };
      case 'verify':
        return {
          title: '¿Verificar usuario?',
          description: `¿Deseas marcar a ${dialogState.user.full_name} como verificado?`,
          actionText: 'Verificar',
          variant: 'default' as const
        };
      case 'activate':
        return {
          title: '¿Activar usuario?',
          description: `¿Deseas activar la cuenta de ${dialogState.user.full_name}?`,
          actionText: 'Activar',
          variant: 'default' as const
        };
      case 'deactivate':
        return {
          title: '¿Desactivar usuario?',
          description: `¿Deseas desactivar la cuenta de ${dialogState.user.full_name}? El usuario no podrá acceder al sistema.`,
          actionText: 'Desactivar',
          variant: 'destructive' as const
        };
      default:
        return {
          title: '',
          description: '',
          actionText: 'Confirmar',
          variant: 'default' as const
        };
    }
  };

  const dialogContent = getDialogContent();
  // Estado de carga
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
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
              <TriangleAlert className="h-6 w-6 text-red-600" />
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
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Verificación</TableHead>
            <TableHead>Activación</TableHead>
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
                className="group"
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
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {user.phone_number}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {user.email || <span className="text-gray-400 italic">Sin email</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={"secondary"} className="rounded-full px-3 py-1 flex items-center gap-1 w-fit">
                    <RoleIcon className="h-5 w-5" />
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {user.is_verified ? (
                    <Badge className="rounded-full px-3 py-1 w-fit bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge className="rounded-full px-3 py-1 w-fit bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Sin verificar
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell>
                  {user.is_active ? (
                    <Badge className="rounded-full px-3 py-1 w-fit bg-blue-100 text-blue-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="rounded-full px-3 py-1 w-fit bg-gray-100 text-gray-600 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Inactivo
                    </Badge>
                  )}
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
                          handleViewDetails(user);
                        }}
                        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {!user.is_verified && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogState({ type: 'verify', user });
                          }}
                          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 rounded-lg"
                        >
                          <UserCheck className="h-4 w-4" />
                          Verificar usuario
                        </DropdownMenuItem>
                      )}
                      
                      {user.is_active ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogState({ type: 'deactivate', user });
                          }}
                          className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                        >
                          <XCircle className="h-4 w-4" />
                          Desactivar usuario
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogState({ type: 'activate', user });
                          }}
                          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Activar usuario
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
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
                          setUserToChangePassword(user);
                          setShowPasswordPopover(true);
                        }}
                        className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                      >
                        <Key className="h-4 w-4" />
                        Cambiar contraseña
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          // Validación: verificar que el usuario tenga un ID válido
                          if (!user || !user.id) {
                            console.error('Error: Usuario sin ID válido', user);
                            toast.error('Error: No se puede eliminar un usuario sin ID');
                            return;
                          }
                          
                          setDialogState({ type: 'delete', user });
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

      {/* Diálogo de confirmación */}
      <AlertDialog open={dialogState.type !== null} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={dialogContent.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {dialogContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de detalles del usuario */}
      <UserDetailsDialog
        user={selectedUser}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      {/* Diálogo para cambiar contraseña */}
      {userToChangePassword && showPasswordPopover && (
        <ChangePasswordDialog
          userId={userToChangePassword.id}
          userName={userToChangePassword.full_name}
          onChangePassword={handleChangePassword}
          loading={changePasswordMutation.isPending}
          open={showPasswordPopover}
          onOpenChange={(open) => {
            setShowPasswordPopover(open);
            if (!open) {
              setUserToChangePassword(null);
            }
          }}
        />
      )}
    </div>
  );
}
