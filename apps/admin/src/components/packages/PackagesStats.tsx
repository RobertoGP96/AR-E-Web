import { Truck, MapPin, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PackageStats {
  inTransit: number;
  forDelivery: number;
  delivered: number;
  withProblems: number;
  inTransitChange?: string;
  forDeliveryChange?: string;
  deliveredChange?: string;
  withProblemsChange?: string;
}

interface PackagesStatsProps {
  stats?: PackageStats;
}

const defaultStats: PackageStats = {
  inTransit: 142,
  forDelivery: 56,
  delivered: 1234,
  withProblems: 7,
  inTransitChange: "+8 desde ayer",
  forDeliveryChange: "Hoy",
  deliveredChange: "Este mes",
  withProblemsChange: "Requieren atención"
};

export default function PackagesStats({ stats = defaultStats }: PackagesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Tránsito</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inTransit.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">{stats.inTransitChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Para Entrega</p>
              <p className="text-2xl font-bold text-gray-900">{stats.forDelivery.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">{stats.forDeliveryChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">{stats.deliveredChange}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Problemas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withProblems.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-red-600 mt-2">{stats.withProblemsChange}</p>
        </CardContent>
      </Card>
    </div>
  );
}
