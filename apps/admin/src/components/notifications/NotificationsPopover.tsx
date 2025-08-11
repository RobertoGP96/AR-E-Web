import { Bell, Check, Clock, AlertCircle, Package, Truck, ShoppingCart } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nueva orden recibida',
    message: 'Orden #ORD-001 por $450,000 necesita procesamiento',
    type: 'info',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
    read: false,
    icon: ShoppingCart
  },
  {
    id: '2',
    title: 'Paquete entregado',
    message: 'El paquete #PKG-001234 ha sido entregado exitosamente',
    type: 'success',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    read: false,
    icon: Package
  },
  {
    id: '3',
    title: 'Retraso en entrega',
    message: 'La ruta Norte #001 tiene un retraso de 45 minutos',
    type: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    read: true,
    icon: Truck
  },
  {
    id: '4',
    title: 'Problema con pago',
    message: 'Error en el procesamiento de pago para orden #ORD-045',
    type: 'error',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
    read: true,
    icon: AlertCircle
  },
  {
    id: '5',
    title: 'Nueva tienda registrada',
    message: 'Tienda "Mercado Central" se ha registrado exitosamente',
    type: 'success',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
    read: true
  }
];

export function NotificationsPopover() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) {
      const Icon = notification.icon;
      return <Icon className="h-4 w-4" />;
    }

    switch (notification.type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'success':
        return <Check className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50';
      case 'warning':
        return 'text-yellow-600 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200/50';
      case 'success':
        return 'text-green-600 bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50';
      default:
        return 'text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50';
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-3 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 relative group"
        >
          <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full ring-2 ring-white flex items-center justify-center">
                <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 rounded-full animate-ping opacity-75"></span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-2xl border-0 bg-white rounded-2xl overflow-hidden" align="end" sideOffset={12}>
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl">Notificaciones</h3>
              <p className="text-orange-100 text-sm mt-1">Mantente al día con las últimas actualizaciones</p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-semibold">{unreadCount} nuevas</span>
              </div>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          <div className="p-2">
            {mockNotifications.map((notification, index) => (
              <div key={notification.id}>
                <div className={`group relative flex gap-4 p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
                  !notification.read 
                    ? 'border-l-orange-500 bg-gradient-to-r from-orange-50/30 to-amber-50/20' 
                    : 'border-l-transparent hover:border-l-gray-200'
                }`}>
                  <div className={`flex-shrink-0 p-3 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md ${getNotificationColors(notification.type)}`}>
                    {getNotificationIcon(notification)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold text-gray-900 leading-tight ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 font-medium">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="h-2.5 w-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-sm"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
                {index < mockNotifications.length - 1 && (
                  <div className="mx-4">
                    <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Footer con acciones */}
        <div className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="flex gap-3">
            <button className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
              Marcar todas como leídas
            </button>
            <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
              Ver todas
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
