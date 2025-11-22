import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  PackageCheck, 
  Truck, 
  ClipboardList, 
  Settings, 
  UserCircle, 
  FolderTree,
  type LucideIcon,
  Receipt,
  FileText,
  ChartColumn
} from 'lucide-react';

// Mapeo de rutas a iconos
const routeIcons: Record<string, LucideIcon> = {
  '/users': Users,
  '/shops': Store,
  '/products': Package,
  '/purchases': ShoppingCart,
  '/packages': PackageCheck,
  '/delivery': Truck,
  '/orders': ClipboardList,
  '/settings': Settings,
  '/profile': UserCircle,
  '/categories': FolderTree,
  '/invoices': FileText,
  '/analitics': ChartColumn,
  '/finances': Receipt,
};

// Mapeo de rutas a nombres legibles
const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Usuarios',
  '/shops': 'Tiendas',
  '/products': 'Productos',
  '/purchases': 'Compras',
  '/packages': 'Paquetes',
  '/delivery': 'Entrega',
  '/orders': 'Órdenes',
  '/settings': 'Configuración',
  '/profile': 'Mi Perfil',
  '/categories': 'Categorías',
  '/invoices': 'Facturas',
  '/analitics': 'Análisis',
  '/finances': 'Finanzas',
};

// Mapeo para rutas con detalles
const detailRoutes: Record<string, string> = {
  '/products': 'Detalles del Producto',
  '/purchases': 'Detalles de Compra',
  '/orders': 'Detalles de Orden',
};

export function BreadcrumbNavigation() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Construir los breadcrumbs (sin incluir Dashboard inicial)
  const pages: Array<{ name: string; href: string; current: boolean; icon?: LucideIcon }> = [];

  let currentPath = '';
  pathnames.forEach((pathname, index) => {
    currentPath += '/' + pathname;
    let name = routeNames[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

    // Si es el último segmento y parece un ID (número), usar el nombre de detalle
    if (index === pathnames.length - 1 && /^\d+$/.test(pathname)) {
      const parentPath = '/' + pathnames.slice(0, -1).join('/');
      name = detailRoutes[parentPath] || 'Detalles';
    }

    pages.push({ 
      name, 
      href: currentPath,
      current: index === pathnames.length - 1,
      icon: routeIcons[currentPath]
    });
  });

  // Si estamos en la raíz, no mostrar breadcrumbs
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex ml-2">
      <ol role="list" className="flex flex-row items-center justify-center space-x-4">
        <li>
          <div className="flex items-center">
            <Link to="/" className="text-gray-400 hover:text-gray-500">
              <Home aria-hidden="true" className="size-5 text-orange-400 shrink-0" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <li key={page.name}>
              <div className="flex items-center">
                <svg 
                  fill="currentColor" 
                  viewBox="0 0 20 20" 
                  aria-hidden="true" 
                  className="size-5 text-orange-400 shrink-0"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link
                  to={page.href}
                  aria-current={page.current ? 'page' : undefined}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  {Icon && <Icon className="size-4 text-orange-400 shrink-0" />}
                  {page.name}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}