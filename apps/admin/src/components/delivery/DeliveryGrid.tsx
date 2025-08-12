import { User, Truck, MapPin, Clock, Map, Phone, Play, Edit, FileText, Download, Calendar, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DeliveryRouteData } from '@/types/models/deliveryRoute';
import { routeStatusConfig, routeActionConfig } from '@/types/models/deliveryRoute';

interface DeliveryGridProps {
  routes?: DeliveryRouteData[];
  onStartRoute?: (route: DeliveryRouteData) => void;
  onViewMap?: (route: DeliveryRouteData) => void;
  onContactDriver?: (route: DeliveryRouteData) => void;
  onEditRoute?: (route: DeliveryRouteData) => void;
  onViewReport?: (route: DeliveryRouteData) => void;
  onDownloadReport?: (route: DeliveryRouteData) => void;
  onRouteClick?: (route: DeliveryRouteData) => void;
}

// Iconos para las acciones
const actionIcons = {
  start: Play,
  'view-map': Map,
  contact: Phone,
  edit: Edit,
  'view-report': FileText,
  download: Download,
  cancel: Calendar,
  pause: Pause,
  resume: Play,
  reschedule: RotateCcw,
  view: FileText
};

// Función para calcular el progreso
const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Función para formatear hora
const formatTime = (timeString?: string): string => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Datos de ejemplo
const mockRoutes: DeliveryRouteData[] = [
  {
    id: "1",
    name: "Ruta Norte #001",
    zone: "Norte",
    city: "Bogotá",
    status: "en-curso",
    driverName: "Carlos Mendoza",
    driverId: "DRV-001",
    vehiclePlate: "ABC-123",
    vehicleId: "VHC-001",
    scheduledStops: 12,
    completedStops: 8,
    startTime: "2024-01-20T08:30:00Z",
    routeDate: "2024-01-20",
    totalDistance: 45.2,
    estimatedTime: 6,
    notes: "Ruta prioritaria - zona residencial"
  },
  {
    id: "2",
    name: "Ruta Centro #002",
    zone: "Centro",
    city: "Bogotá",
    status: "completada",
    driverName: "Ana Rodríguez",
    driverId: "DRV-002",
    vehiclePlate: "DEF-456",
    vehicleId: "VHC-002",
    scheduledStops: 8,
    completedStops: 8,
    startTime: "2024-01-20T09:00:00Z",
    endTime: "2024-01-20T14:15:00Z",
    routeDate: "2024-01-20",
    totalDistance: 32.8,
    estimatedTime: 5,
    notes: "Ruta completada sin inconvenientes"
  },
  {
    id: "3",
    name: "Ruta Sur #003",
    zone: "Sur",
    city: "Bogotá",
    status: "planificada",
    driverName: "Luis González",
    driverId: "DRV-003",
    vehiclePlate: "GHI-789",
    vehicleId: "VHC-003",
    scheduledStops: 15,
    completedStops: 0,
    routeDate: "2024-01-21",
    totalDistance: 52.1,
    estimatedTime: 7,
    notes: "Ruta con paradas comerciales - inicio temprano"
  },
  {
    id: "4",
    name: "Ruta Oriente #004",
    zone: "Oriente",
    city: "Bogotá",
    status: "en-curso",
    driverName: "María López",
    driverId: "DRV-004",
    vehiclePlate: "JKL-012",
    vehicleId: "VHC-004",
    scheduledStops: 10,
    completedStops: 3,
    startTime: "2024-01-20T10:00:00Z",
    routeDate: "2024-01-20",
    totalDistance: 38.5,
    estimatedTime: 5.5,
    notes: "Ruta con entregas empresariales"
  }
];

export default function DeliveryGrid({
  routes = mockRoutes,
  onStartRoute,
  onViewMap,
  onContactDriver,
  onEditRoute,
  onViewReport,
  onDownloadReport,
  onRouteClick
}: DeliveryGridProps) {
  const handleAction = (action: string, route: DeliveryRouteData) => {
    switch (action) {
      case 'start':
        onStartRoute?.(route);
        break;
      case 'view-map':
        onViewMap?.(route);
        break;
      case 'contact':
        onContactDriver?.(route);
        break;
      case 'edit':
        onEditRoute?.(route);
        break;
      case 'view-report':
        onViewReport?.(route);
        break;
      case 'download':
        onDownloadReport?.(route);
        break;
      default:
        console.log(`Acción ${action} no implementada para:`, route);
    }
  };

  const getActionLabel = (action: string): string => {
    const actionLabels = {
      start: 'Iniciar Ruta',
      'view-map': 'Ver Mapa',
      contact: 'Contactar',
      edit: 'Editar',
      'view-report': 'Ver Reporte',
      download: 'Descargar',
      cancel: 'Cancelar',
      pause: 'Pausar',
      resume: 'Reanudar',
      reschedule: 'Reprogramar',
      view: 'Ver Detalles'
    };
    return actionLabels[action as keyof typeof actionLabels] || action;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {routes.map((route) => {
        const statusConfig = routeStatusConfig[route.status];
        const availableActions = routeActionConfig[route.status] || [];
        const progress = calculateProgress(route.completedStops, route.scheduledStops);

        return (
          <Card 
            key={route.id}
            className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => onRouteClick?.(route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {route.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Zona {route.zone} - {route.city}
                  </p>
                </div>
                <Badge className={`${statusConfig.className} rounded-full px-3 py-1`}>
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{route.driverName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm">Vehículo: {route.vehiclePlate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {route.scheduledStops} paradas programadas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {route.status === 'planificada' ? 'Inicio: ' : 
                     route.status === 'completada' ? 'Finalizada: ' : 'Iniciada: '}
                    {route.status === 'planificada' ? 'Mañana 9:00 AM' :
                     route.status === 'completada' ? formatTime(route.endTime) :
                     formatTime(route.startTime)}
                  </span>
                </div>
              </div>

              <div className={`${statusConfig.progressBg} rounded-lg p-4 mb-4`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${
                    route.status === 'completada' ? 'text-green-700' :
                    route.status === 'en-curso' ? 'text-gray-700' :
                    route.status === 'planificada' ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>
                    {route.status === 'completada' ? 'Completada' :
                     route.status === 'en-curso' ? 'Progreso' :
                     route.status === 'planificada' ? 'Planificada' :
                     'Estado'}
                  </span>
                  <span className={`text-sm ${
                    route.status === 'completada' ? 'text-green-600' :
                    route.status === 'en-curso' ? 'text-gray-600' :
                    route.status === 'planificada' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {route.completedStops} de {route.scheduledStops} 
                    {route.status === 'completada' ? ' entregadas' : ' paradas'}
                  </span>
                </div>
                <div className={`w-full ${
                  route.status === 'completada' ? 'bg-green-200' :
                  route.status === 'en-curso' ? 'bg-gray-200' :
                  route.status === 'planificada' ? 'bg-yellow-200' :
                  'bg-gray-200'
                } rounded-full h-2`}>
                  <div 
                    className={`${statusConfig.progressBar} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                {availableActions.slice(0, 2).map((action, index) => {
                  const ActionIcon = actionIcons[action as keyof typeof actionIcons];
                  const isPrimary = index === 0 && (action === 'start' || action === 'view-map');
                  
                  return (
                    <Button
                      key={action}
                      variant={isPrimary ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 ${isPrimary ? 
                        'bg-orange-50 text-orange-700 hover:bg-orange-100 border-0' : 
                        'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } rounded-lg transition-colors`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(action, route);
                      }}
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-1" />}
                      {getActionLabel(action)}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
