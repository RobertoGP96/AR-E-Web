import { AsideNav } from './AsideNav';
import { Search, User, Settings, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

          {/* Barra de búsqueda */}
          <div className="hidden lg:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Buscar..."
                className="pl-10 h-10 bg-background/50 border-border focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Búsqueda móvil */}
            <button
              type="button"
              className="lg:hidden p-3 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {/* Notificaciones */}
            <NotificationsPopover />
            
            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center space-x-3 p-2 text-sm rounded-xl hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  >
                    <Avatar className="h-10 w-10 rounded-xl ring-2 ring-orange-500/20">
                      <AvatarImage src="" alt="Administrador" />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold rounded-xl">AD</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-0 shadow-xl bg-white">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-base font-semibold text-gray-800">Administrador</p>
                      <p className="text-sm text-gray-500">admin@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem 
                    className="p-3 cursor-pointer hover:bg-orange-50 rounded-lg mx-1 group"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="mr-3 h-5 w-5 text-gray-500 group-hover:text-orange-600" />
                    <span className="text-base group-hover:text-orange-700">Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="p-3 cursor-pointer hover:bg-orange-50 rounded-lg mx-1 group"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-3 h-5 w-5 text-gray-500 group-hover:text-orange-600" />
                    <span className="text-base group-hover:text-orange-700">Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem className="p-3 cursor-pointer hover:bg-red-50 rounded-lg mx-1 text-red-600">
                    <LogOut className="mr-3 h-5 w-5" />
                    <span className="text-base">Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
