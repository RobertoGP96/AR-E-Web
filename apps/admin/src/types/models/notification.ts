/**
 * Tipos para el sistema de notificaciones del backend
 */

import type { ID, DateTime } from './base';
import type { BaseFilters } from '../api';

// Tipos de notificaciones disponibles
export type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'order_assigned'
  | 'order_completed'
  | 'order_cancelled'
  | 'product_added'
  | 'product_purchased'
  | 'product_received'
  | 'product_delivered'
  | 'product_out_of_stock'
  | 'payment_received'
  | 'payment_pending'
  | 'payment_overdue'
  | 'package_shipped'
  | 'package_in_transit'
  | 'package_delivered'
  | 'package_delayed'
  | 'user_registered'
  | 'user_verified'
  | 'user_role_changed'
  | 'system_message'
  | 'system_alert'
  | 'system_maintenance';

// Prioridades de notificaciones
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Modelo principal de Notificación
export interface Notification {
  id: ID;
  recipient: ID; // ID del usuario destinatario
  sender?: ID; // ID del usuario que generó la notificación (opcional)
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  read_at?: DateTime;
  metadata: Record<string, any>;
  created_at: DateTime;
  expires_at?: DateTime;

  // Campos computados/relaciones (opcionales para UI)
  recipient_details?: {
    id: ID;
    name: string;
    email?: string;
  };
  sender_details?: {
    id: ID;
    name: string;
    email?: string;
  };
}

// Datos para crear una notificación
export interface CreateNotificationData {
  recipient: ID;
  notification_type: NotificationType;
  title: string;
  message: string;
  sender?: ID;
  priority?: NotificationPriority;
  action_url?: string;
  metadata?: Record<string, any>;
  expires_at?: DateTime;
}

// Datos para actualizar una notificación
export interface UpdateNotificationData {
  is_read?: boolean;
  metadata?: Record<string, any>;
}

// Filtros para notificaciones
export interface NotificationFilters extends BaseFilters {
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  is_read?: boolean;
  created_from?: DateTime;
  created_to?: DateTime;
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

// Preferencias de notificación por usuario
export interface NotificationPreference {
  id: ID;
  user: ID;
  enabled_notification_types: NotificationType[];
  email_notifications: boolean;
  push_notifications: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  created_at: DateTime;
  updated_at: DateTime;
}

// Datos para actualizar preferencias
export interface UpdateNotificationPreferenceData {
  enabled_notification_types?: NotificationType[];
  email_notifications?: boolean;
  push_notifications?: boolean;
  digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'never';
}

// Grupo de notificaciones (para agrupación inteligente)
export interface NotificationGroup {
  id: ID;
  recipient: ID;
  notification_type: NotificationType;
  title: string;
  count: number;
  first_notification: ID;
  last_notification: ID;
  aggregated_data: any[];
  is_read: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

// Respuesta de notificaciones agrupadas
export interface GroupedNotificationsResponse {
  groups: NotificationGroup[];
  individual_notifications: Notification[];
  total_unread: number;
}

// Datos para marcar notificaciones como leídas
export interface MarkAsReadData {
  notification_ids?: ID[];
  // Si no se especifican IDs, marca todas como leídas
}

// Respuesta de conteo de notificaciones
export interface UnreadCountResponse {
  unread_count: number;
}

// Evento SSE de notificación
export interface NotificationSSEEvent {
  event: 'notification' | 'connected' | 'heartbeat' | 'error';
  data: any;
  timestamp: DateTime;
}

// Estado del cliente SSE
export interface SSEState {
  isConnected: boolean;
  lastHeartbeat?: DateTime;
  error?: string;
}

// Configuración del cliente SSE
export interface SSEConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatTimeout?: number;
}

// Etiquetas para mostrar en la UI
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_created: 'Orden creada',
  order_status_changed: 'Estado de orden cambiado',
  order_assigned: 'Orden asignada',
  order_completed: 'Orden completada',
  order_cancelled: 'Orden cancelada',
  product_added: 'Producto añadido',
  product_purchased: 'Producto comprado',
  product_received: 'Producto recibido',
  product_delivered: 'Producto entregado',
  product_out_of_stock: 'Producto agotado',
  payment_received: 'Pago recibido',
  payment_pending: 'Pago pendiente',
  payment_overdue: 'Pago vencido',
  package_shipped: 'Paquete enviado',
  package_in_transit: 'Paquete en tránsito',
  package_delivered: 'Paquete entregado',
  package_delayed: 'Paquete retrasado',
  user_registered: 'Usuario registrado',
  user_verified: 'Usuario verificado',
  user_role_changed: 'Rol de usuario cambiado',
  system_message: 'Mensaje del sistema',
  system_alert: 'Alerta del sistema',
  system_maintenance: 'Mantenimiento del sistema'
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

// Funciones de utilidad para verificar tipos
export const notificationTypeUtils = {
  isOrderRelated: (type: NotificationType): boolean => {
    return type.startsWith('order_');
  },

  isProductRelated: (type: NotificationType): boolean => {
    return type.startsWith('product_');
  },

  isPaymentRelated: (type: NotificationType): boolean => {
    return type.startsWith('payment_');
  },

  isPackageRelated: (type: NotificationType): boolean => {
    return type.startsWith('package_');
  },

  isUserRelated: (type: NotificationType): boolean => {
    return type.startsWith('user_');
  },

  isSystemRelated: (type: NotificationType): boolean => {
    return type.startsWith('system_');
  }
};

export const notificationPriorityUtils = {
  getColor: (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  getIconColor: (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  }
};