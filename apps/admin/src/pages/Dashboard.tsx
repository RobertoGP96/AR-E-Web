import { Users, Package, ShoppingCart, TrendingUp, LayoutDashboard } from 'lucide-react';
import AdminFeatures from '@/components/admin/AdminFeatures';

const Dashboard = () => {
  // Datos por defecto para mostrar cuando no hay datos de la API
  const defaultMetrics = {
    orders: { total: 0, pending: 0, completed: 0, today: 0, this_week: 0, this_month: 0 },
    products: { total: 0, in_stock: 0, out_of_stock: 0, pending_delivery: 0 },
    users: { total: 0, active: 0, verified: 0, agents: 0 },
    revenue: { total: 0, today: 0, this_week: 0, this_month: 0, last_month: 0 }
  };

  // Extraer los datos de la respuesta de la API si están disponibles
  const metrics = defaultMetrics;

  const statCards = [
    {
      name: 'Total de Usuarios',
      value: metrics.users.total?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Total de Productos',
      value: metrics.products.total?.toLocaleString() || '0',
      icon: Package,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      name: 'Órdenes',
      value: metrics.orders.total?.toLocaleString() || '0',
      icon: ShoppingCart,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Ingresos',
      value: `$${metrics.revenue.total?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-8">

      {/* Header Section with Logo and Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-orange-500" />
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Resumen general del panel de administración
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <dt>
                <div className={`absolute ${card.color} rounded-md p-3 shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {card.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                  {card.change}
                </p>
                <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
                  <div className="text-sm">
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                      Ver detalles
                    </a>
                  </div>
                </div>
              </dd>
            </div>
          );
        })}
      </div>

      {/* Lista de funcionalidades del admin */}
      <AdminFeatures />






    </div>
  );
};

export default Dashboard;