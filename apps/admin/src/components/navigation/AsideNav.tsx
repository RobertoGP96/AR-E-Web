import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  User,
  LogOut,
  Store,
  ShoppingBag,
  Truck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Usuarios',
    href: '/users',
    icon: Users
  },
  {
    name: 'Tiendas',
    href: '/shops',
    icon: Store
  },
  {
    name: 'Productos',
    href: '/products',
    icon: Package
  },
  {
    name: 'Compras',
    href: '/purchases',
    icon: ShoppingBag
  },
  {
    name: 'Paquetes',
    href: '/packages',
    icon: Package
  },
  {
    name: 'Entrega',
    href: '/delivery',
    icon: Truck
  },
  {
    name: 'Órdenes',
    href: '/orders',
    icon: ShoppingCart
  },
];

const bottomNavigation = [
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings
  },
];

export function AsideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-lg border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex h-20 items-center px-6 border-b border-gray-700">
        <h1 className="text-md font-bold text-white flex justify-center items-center gap-2">
          <div className="w-10 h-10 bg-transparent rounded-lg flex items-center justify-center">
            <img src="/src/assets/logo/logo.svg" alt="AR&E Shipps" className="w-12 h-12" />
          </div>
          AR&E Shipps
        </h1>
        <Badge variant="default" className='bg-gray-800 text-gray-400'>Admin</Badge>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto flex flex-col">
        {/* Main Navigation */}
        <div className="space-y-2">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:shadow-sm group",
                    active
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-white" : "text-gray-400 group-hover:text-orange-400"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Spacer to push bottom navigation to the bottom */}
        <div className="flex-1"></div>

        {/* Bottom Navigation */}
        <div className="space-y-2 pt-4 border-t border-gray-700/50">
          <nav className="space-y-2">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:shadow-sm group",
                    active
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-white" : "text-gray-400 group-hover:text-orange-400"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer - User Menu */}
      <div className="p-4 border-t border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group">
              <Avatar className="h-10 w-10 rounded-xl ring-2 ring-orange-500/20">
                <AvatarImage src="" alt="Administrador" />
                <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <span className="block font-semibold text-base text-white">Administrador</span>
                <span className="block text-sm text-gray-400">admin@example.com</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl border-0 shadow-xl bg-white"
            side="right"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-xl ring-2 ring-orange-500/20">
                  <AvatarImage src="" alt="Administrador" />
                  <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-base text-gray-800">Administrador</span>
                  <span className="truncate text-sm text-gray-500">admin@example.com</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer hover:bg-orange-50 group" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5 text-gray-500 group-hover:text-orange-600" />
              <span className="group-hover:text-orange-700">Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer hover:bg-orange-50 group">
              <Settings className="h-5 w-5 text-gray-500 group-hover:text-orange-600" />
              <span className="group-hover:text-orange-700">Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="gap-3 px-3 py-3 text-base text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
