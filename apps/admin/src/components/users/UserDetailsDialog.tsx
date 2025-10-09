import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Truck,
  Calculator,
  Megaphone,
  Handshake
} from 'lucide-react';
import type { CustomUser, UserRole } from '@/types/models/user';
import { roleLabels } from '@/types/models/user';
import { formatDate } from '@/lib/format-date';

interface UserDetailsDialogProps {
  user: CustomUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null;

  const RoleIcon = roleIcons[user.role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
          <DialogDescription>
            Información completa del usuario y su cuenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección de perfil */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-200 text-2xl font-bold">
                {user.name.charAt(0)}{user.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{user.full_name}</h3>
                <p className="text-sm text-gray-500">ID: {user.id}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <RoleIcon className="h-4 w-4" />
                  {roleLabels[user.role]}
                </Badge>
                
                {user.is_active ? (
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Activo
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactivo
                  </Badge>
                )}
                
                {user.is_verified ? (
                  <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sin verificar
                  </Badge>
                )}

                {user.is_staff && (
                  <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Staff
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Información de Contacto
            </h4>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-medium text-gray-900">{user.phone_number}</span>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">Dirección:</span>
                <span className="font-medium text-gray-900 flex-1">{user.home_address}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de cuenta */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Información de Cuenta
            </h4>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Fecha de registro:</span>
                <span className="font-medium text-gray-900">{formatDate(user.date_joined)}</span>
              </div>
              
              {user.role === 'agent' && (
                <div className="flex items-center gap-3 text-sm">
                  <Handshake className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Comisión de agente:</span>
                  <span className="font-medium text-gray-900">{user.agent_profit}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          {(user.ordersCount !== undefined || user.lastAccess) && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Estadísticas
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {user.ordersCount !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{user.ordersCount}</div>
                      <div className="text-xs text-gray-500 mt-1">Órdenes totales</div>
                    </div>
                  )}
                  
                  {user.lastAccess && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900">{formatDate(user.lastAccess)}</div>
                      <div className="text-xs text-gray-500 mt-1">Último acceso</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Estado de verificación de email */}
          {user.sent_verification_email && !user.is_verified && (
            <>
              <Separator />
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-yellow-900">
                      Email de verificación enviado
                    </h5>
                    <p className="text-xs text-yellow-700 mt-1">
                      El usuario debe verificar su correo electrónico para activar completamente su cuenta.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
