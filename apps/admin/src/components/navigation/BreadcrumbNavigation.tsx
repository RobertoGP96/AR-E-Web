import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

  // Construir los breadcrumbs
  const breadcrumbs = [
    { name: 'Dashboard', href: '/' },
  ];

  let currentPath = '';
  pathnames.forEach((pathname, index) => {
    currentPath += '/' + pathname;
    let name = routeNames[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

    // Si es el último segmento y parece un ID (número), usar el nombre de detalle
    if (index === pathnames.length - 1 && /^\d+$/.test(pathname)) {
      const parentPath = '/' + pathnames.slice(0, -1).join('/');
      name = detailRoutes[parentPath] || 'Detalles';
    }

    breadcrumbs.push({ name, href: currentPath });
  });

  // Si estamos en la raíz, no mostrar breadcrumbs
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="mb-2">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}