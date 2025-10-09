import { AsideNav } from './AsideNav';
import { useLocation} from 'react-router-dom';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';

interface AppSidebarWrapperProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Usuarios', href: '/users' },
  { name: 'Tiendas', href: '/shops' },
  { name: 'Productos', href: '/products' },
  { name: 'Compras', href: '/purchases' },
  { name: 'Paquetes', href: '/packages' },
  { name: 'Entrega', href: '/delivery' },
  { name: 'Órdenes', href: '/orders' },
  { name: 'Configuración', href: '/settings' },
  { name: 'Mi Perfil', href: '/profile' },
];

export function AppSidebarWrapper({ children }: AppSidebarWrapperProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar fijo */}
      <AsideNav />
      
      {/* Área principal */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="flex h-20 shrink-0 items-center gap-4 px-6 bg-background/95 backdrop-blur-sm shadow-sm border-0 w-full border-b border-border">
          {/* Título de la página */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-800 truncate">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-600 hidden sm:block">
                Gestiona tu panel de administración
              </p>
            </div>
          </div>

          

          {/* Acciones del header */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            
            {/* Notificaciones */}
            <NotificationsPopover />
          </div>
        </header>
        {/* Contenido */}
        <main className="flex-1 min-h-0 p-6 sm:p-8 xl:p-10 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
