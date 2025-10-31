import { Bell, Check, AlertCircle, Package, Truck, ShoppingCart, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import type { Notification } from '@/types/models';
import { useNotificationActions } from '@/hooks/notifications/use-notification-actions';
import { useNotificationSSE } from '@/hooks/notifications/use-notification-sse';
import { useNotifications } from '@/hooks/notifications/use-notifications';

export function NotificationsPopover() {
  // Usar hooks de notificaciones
  const { notifications, unreadCount, isLoading } = useNotifications({
    filters: { page: 1, per_page: 10 }
  });
  const actions = useNotificationActions();

  // SSE para notificaciones en tiempo real
  const { isConnected } = useNotificationSSE();

  // Usar datos del backend directamente
  const displayNotifications = notifications || [];
  const displayUnreadCount = unreadCount || 0;

  const getNotificationIcon = (notification: Notification) => {
    // Mapear tipos de notificación a iconos
    switch (notification.notification_type) {
      case 'order_created':
      case 'order_status_changed':
      case 'order_assigned':
        return <ShoppingCart className="h-4 w-4" />;
      case 'package_shipped':
      case 'package_in_transit':
      case 'package_delivered':
        return <Package className="h-4 w-4" />;
      case 'package_delayed':
        return <Truck className="h-4 w-4" />;
      case 'payment_overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'user_registered':
        return <Check className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColors = (notificationType: string) => {
    // Mapear prioridades a colores
    switch (notificationType) {
      case 'urgent':
        return 'text-red-600 bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50';
      case 'high':
        return 'text-orange-600 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50';
      case 'normal':
        return 'text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50';
      default:
        return 'text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else if (hours < 24) {
      return `Hace ${hours}h`;
    } else {
      return `Hace ${days}d`;
    }
  };

  const handleMarkAllAsRead = () => {
    actions.markAllAsRead.mutate();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-3 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 relative group"
        >
          <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
          {displayUnreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full ring-2 ring-white flex items-center justify-center">
                <span className="text-xs font-bold text-white">{displayUnreadCount > 9 ? '9+' : displayUnreadCount}</span>
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full animate-ping opacity-75"></span>
            </>
          )}
          {/* Indicador de conexión SSE */}
          {isConnected && (
            <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-2xl border-0 bg-white rounded-2xl overflow-hidden" align="end" sideOffset={12}>
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl">Notificaciones</h3>
              <p className="text-orange-100 text-sm mt-1">
                {isConnected ? 'Conectado en tiempo real' : 'Mantente al día con las últimas actualizaciones'}
              </p>
            </div>
            {displayUnreadCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-semibold">{displayUnreadCount} nuevas</span>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-2 text-sm text-gray-500">Cargando notificaciones...</span>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h4 className="text-sm font-medium text-gray-900 mb-2">No hay notificaciones</h4>
              <p className="text-sm text-gray-500">Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="p-2">
              {displayNotifications.map((notification: Notification, index: number) => (
                <div key={notification.id}>
                  <div className={`group relative flex gap-4 p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                    !notification.is_read
                      ? 'border-l-orange-500 bg-gradient-to-r from-orange-50/30 to-amber-50/20'
                      : 'border-l-transparent hover:border-l-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 p-3 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md ${getNotificationColors(notification.priority)}`}>
                      {getNotificationIcon(notification)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold text-gray-900 leading-tight ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatTimestamp(new Date(notification.created_at))}
                          </span>
                          {!notification.is_read && (
                            <div className="h-2.5 w-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-sm"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  {index < displayNotifications.length - 1 && (
                    <div className="mx-4">
                      <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer con acciones */}
        <div className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="flex gap-3">
            {displayUnreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={actions.markAllAsRead.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {actions.markAllAsRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Marcar todas como leídas
              </Button>
            )}
            <Button
              variant="outline"
              className={`${displayUnreadCount > 0 ? 'flex-1' : 'w-full'} bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
            >
              Ver todas
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
