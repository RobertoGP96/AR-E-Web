/**
 * Interfaz para representar un paquete en el sistema
 */
export interface PackageTableData {
  /** ID único del paquete */
  id: string;
  /** Código de seguimiento del paquete */
  trackingCode: string;
  /** Nombre del destinatario */
  recipient: string;
  /** Email del destinatario */
  recipientEmail?: string;
  /** Teléfono del destinatario */
  recipientPhone?: string;
  /** Dirección de entrega completa */
  address: string;
  /** Ciudad de entrega */
  city: string;
  /** Estado actual del paquete */
  status: PackageStatus;
  /** Fecha de última actualización */
  lastUpdate: string;
  /** Peso del paquete en kg */
  weight?: number;
  /** Dimensiones del paquete */
  dimensions?: string;
  /** Valor declarado del paquete */
  declaredValue?: number;
  /** Código de la orden relacionada */
  orderCode?: string;
  /** Transportadora encargada */
  carrier?: string;
  /** Notas adicionales */
  notes?: string;
}

/**
 * Estados posibles de un paquete
 */
export type PackageStatus = 
  | 'preparacion' 
  | 'transito' 
  | 'entrega' 
  | 'entregado' 
  | 'devuelto' 
  | 'perdido'
  | 'retenido';

/**
 * Configuración de estados para mostrar en la tabla
 */
export const packageStatusConfig = {
  'preparacion': {
    label: "En Preparación",
    className: "bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100"
  },
  'transito': {
    label: "En Tránsito",
    className: "bg-blue-100/90 text-blue-800 hover:bg-blue-100"
  },
  'entrega': {
    label: "Para Entrega",
    className: "bg-orange-100/90 text-orange-800 hover:bg-orange-100"
  },
  'entregado': {
    label: "Entregado",
    className: "bg-green-100/90 text-green-800 hover:bg-green-100"
  },
  'devuelto': {
    label: "Devuelto",
    className: "bg-purple-100/90 text-purple-800 hover:bg-purple-100"
  },
  'perdido': {
    label: "Perdido",
    className: "bg-red-100/90 text-red-800 hover:bg-red-100"
  },
  'retenido': {
    label: "Retenido",
    className: "bg-gray-100/90 text-gray-800 hover:bg-gray-100"
  }
} as const;

/**
 * Configuración de acciones disponibles según el estado
 */
export const packageActionConfig = {
  'preparacion': ['edit', 'cancel'],
  'transito': ['track', 'edit'],
  'entrega': ['track', 'deliver', 'edit'],
  'entregado': ['view', 'invoice'],
  'devuelto': ['view', 'resend'],
  'perdido': ['view', 'claim'],
  'retenido': ['view', 'resolve']
} as const;
