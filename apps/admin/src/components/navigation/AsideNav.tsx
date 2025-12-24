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
  Truck,
  Tag,
  ReceiptIcon,
  ChartColumn,
  ReceiptText,
  BaggageClaim
} from 'lucide-react';
import { toast } from 'sonner';
import logoSvg from '@/assets/logo/f-logo.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '../ui/badge';
import useAuth from '@/hooks/auth/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigationGroups = [
  {
    title: 'Dashboard',
    items: [
      {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: 'Gestión',
    items: [
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
        name: 'Categorías',
        href: '/categories',
        icon: Tag
      }
    ]
  },
  {
    title: 'Órdenes y Productos',
    items: [
      {
        name: 'Órdenes',
        href: '/orders',
        icon: ShoppingCart
      },
      {
        name: 'Productos',
        href: '/products',
        icon: Package
      },
    ]
  },
  {
    title: 'Logística',
    items: [
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
      }
    ]
  },
  {
    title: 'Finanzas',
    items: [
      
      {
        name: 'Costos',
        href: '/invoices',
        icon: BaggageClaim
      },
      {
        name: 'Gastos',
        href: '/expenses',
        icon: ReceiptText
      },
      {
        name: 'Balance',
        href: '/balance',
        icon: ReceiptIcon
      },
      {
        name: 'Analisis',
        href: '/analytics',
        icon: ChartColumn
      },
    ]
  }
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
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    // Para la ruta raíz, solo se activa cuando es exactamente '/'
    if (path === '/') {
      return location.pathname === '/';
    }
    
    // Para otras rutas, se activa si el pathname comienza con el path
    // y el siguiente carácter es '/' o es el final de la cadena
    // Esto permite que rutas como /products/123 mantengan activo /products
    return location.pathname === path || 
           location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
      console.error('Logout error:', error);
    }
  };

  return (
    <Sidebar className=''>
      {/* Header */}
      <SidebarHeader className="border-b  border-orange-400 ">
        <div className="w-full flex h-16 items-center justify-center p-4 text-orange-400">
          <img src={logoSvg} alt="AR&E Shipps" className="h-15 aspect-auto" />
        </div>
      </SidebarHeader>
      {/* Navigation */}
      <SidebarContent className="pl-4 ">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[14px] uppercase text-orange-400/85 font-semibold">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.name}  >
                      <SidebarMenuButton asChild isActive={active} >
                        <Link to={item.href} >
                          <Icon className="h-7 w-7 " />
                          <span className='text-[15px]'>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.href}>
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Menu */}
      <SidebarFooter className=' border-t border-orange-400'>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt="Administrador" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">
                      {(user?.name?.charAt(0)?.toUpperCase() || '') + (user?.last_name?.charAt(0)?.toUpperCase() || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name + " " + user?.last_name.charAt(0).toUpperCase()}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.phone_number}</span>
                  </div>
                  <Badge variant="secondary" className="group-data-[collapsible=icon]:hidden text-xs">
                    {user?.role}
                  </Badge>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt="Administrador" />
                      <AvatarFallback className="rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">
                        {(user?.name?.charAt(0)?.toUpperCase() || '') + (user?.last_name?.charAt(0)?.toUpperCase() || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name + " " + user?.last_name.charAt(0).toUpperCase()}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.phone_number}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
