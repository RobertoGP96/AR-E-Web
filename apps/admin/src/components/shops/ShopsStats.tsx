import { Store, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: 'store' | 'users' | 'mapPin' | 'clock';
  color: 'green' | 'blue' | 'orange' | 'purple';
}

interface ShopsStatsProps {
  stats?: StatCard[];
}

const defaultStats: StatCard[] = [
  {
    title: "Tiendas Activas",
    value: "12",
    description: "Operando normalmente",
    icon: "store",
    color: "green"
  },
  {
    title: "Total Empleados",
    value: "156",
    description: "En todas las tiendas",
    icon: "users",
    color: "blue"
  },
  {
    title: "Ventas del Mes",
    value: "$24.5M",
    description: "+15% vs mes anterior",
    icon: "mapPin",
    color: "orange"
  },
  {
    title: "Promedio Diario",
    value: "$816K",
    description: "Por tienda",
    icon: "clock",
    color: "purple"
  }
];

const iconMap = {
  store: Store,
  users: Users,
  mapPin: MapPin,
  clock: Clock
};

const colorMap = {
  green: {
    bg: "bg-green-100",
    icon: "text-green-600",
    text: "text-green-600"
  },
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    text: "text-blue-600"
  },
  orange: {
    bg: "bg-orange-100",
    icon: "text-orange-600",
    text: "text-orange-600"
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-600",
    text: "text-purple-600"
  }
};

export default function ShopsStats({ stats = defaultStats }: ShopsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = iconMap[stat.icon];
        const colors = colorMap[stat.color];
        
        return (
          <Card key={index} className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                </div>
              </div>
              <p className={`text-sm ${colors.text} mt-2`}>{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
