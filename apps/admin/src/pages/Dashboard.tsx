import { BarChart3, Users, Package, ShoppingCart, TrendingUp, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useDashboardStats } from '../hooks/useApi';

const Dashboard = () => {
  const { data: apiResponse, isLoading, error } = useDashboardStats();

  // Datos por defecto para mostrar cuando no hay datos de la API
  const defaultMetrics = {
    orders: { total: 0, pending: 0, completed: 0, today: 0, this_week: 0, this_month: 0 },
    products: { total: 0, in_stock: 0, out_of_stock: 0, pending_delivery: 0 },
    users: { total: 0, active: 0, verified: 0, agents: 0 },
    revenue: { total: 0, today: 0, this_week: 0, this_month: 0, last_month: 0 }
  };

  // Extraer los datos de la respuesta de la API si están disponibles
  const metrics = apiResponse?.data || defaultMetrics;
  
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
      {/* Estado de conexión API */}
      {(isLoading || error) && (
        <div className={`rounded-lg p-3 ${
          error 
            ? 'bg-yellow-50 border border-yellow-200' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {error ? (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Mostrando datos de ejemplo - Error de conexión con la API
                </span>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">
                  Cargando datos actualizados...
                </span>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart placeholder */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <p className="text-gray-500 font-medium">Gráfico de ventas aquí</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Órdenes Recientes</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((order) => (
              <div key={order} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">#{order}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Orden #{1000 + order}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cliente #{order}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm font-semibold text-gray-900">
                  ${(Math.random() * 500 + 50).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default Dashboard;