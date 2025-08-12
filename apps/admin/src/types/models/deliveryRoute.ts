/**
 * Interfaz para representar una ruta de entrega
 */
export interface DeliveryRouteData {
  /** ID único de la ruta */
  id: string;
  /** Nombre de la ruta */
  name: string;
  /** Zona de entrega */
  zone: string;
  /** Ciudad */
  city: string;
  /** Estado actual de la ruta */
  status: RouteStatus;
  /** Nombre del conductor */
  driverName: string;
  /** ID del conductor */
  driverId: string;
  /** Número de matrícula del vehículo */
  vehiclePlate: string;
  /** ID del vehículo */
  vehicleId: string;
  /** Número de paradas programadas */
  scheduledStops: number;
  /** Número de paradas completadas */
  completedStops: number;
  /** Hora de inicio */
  startTime?: string;
  /** Hora de finalización */
  endTime?: string;
  /** Fecha de la ruta */
  routeDate: string;
  /** Distancia total en km */
  totalDistance?: number;
  /** Tiempo estimado en horas */
  estimatedTime?: number;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Estados posibles de una ruta
 */
export type RouteStatus = 
  | 'planificada' 
  | 'en-curso' 
  | 'completada' 
  | 'cancelada'
  | 'pausada';

/**
 * Configuración de estados para mostrar en las tarjetas
 */
export const routeStatusConfig = {
  'planificada': {
    label: "Planificada",
    className: "bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100",
    progressBg: "bg-yellow-50",
    progressBar: "bg-yellow-400"
  },
  'en-curso': {
    label: "En Curso",
    className: "bg-blue-100/90 text-blue-800 hover:bg-blue-100",
    progressBg: "bg-blue-50",
    progressBar: "bg-gradient-to-r from-orange-500 to-amber-500"
  },
  'completada': {
    label: "Completada",
    className: "bg-green-100/90 text-green-800 hover:bg-green-100",
    progressBg: "bg-green-50",
    progressBar: "bg-gradient-to-r from-green-500 to-emerald-500"
  },
  'cancelada': {
    label: "Cancelada",
    className: "bg-red-100/90 text-red-800 hover:bg-red-100",
    progressBg: "bg-red-50",
    progressBar: "bg-red-400"
  },
  'pausada': {
    label: "Pausada",
    className: "bg-gray-100/90 text-gray-800 hover:bg-gray-100",
    progressBg: "bg-gray-50",
    progressBar: "bg-gray-400"
  }
} as const;

/**
 * Configuración de acciones disponibles según el estado
 */
export const routeActionConfig = {
  'planificada': ['start', 'edit', 'cancel'],
  'en-curso': ['view-map', 'contact', 'pause'],
  'completada': ['view-report', 'download'],
  'cancelada': ['view', 'reschedule'],
  'pausada': ['resume', 'cancel']
} as const;
