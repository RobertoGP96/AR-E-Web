import { Route, User, Calendar, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DeliveryStats {
  activeRoutes: number;
  drivers: number;
  deliveriesToday: number;
  vehicles: number;
  activeRoutesChange?: string;
  driversChange?: string;
  deliveriesTodayChange?: string;
  vehiclesChange?: string;
}

interface DeliveryStatsProps {
  stats?: DeliveryStats;
}

const defaultStats: DeliveryStats = {
  activeRoutes: 12,
  drivers: 28,
  deliveriesToday: 156,
  vehicles: 15,
  activeRoutesChange: "En curso hoy",
  driversChange: "24 disponibles",
  deliveriesTodayChange: "89 completadas",
  vehiclesChange: "13 en servicio"
};

export default function DeliveryStats({ stats = defaultStats }: DeliveryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rutas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRoutes}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">{stats.activeRoutesChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conductores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.drivers}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">{stats.driversChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveriesToday}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">{stats.deliveriesTodayChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vehicles}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-2">{stats.vehiclesChange}</p>
        </CardContent>
      </Card>
    </div>
  );
}
