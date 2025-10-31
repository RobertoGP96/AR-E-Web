/**
 * Hook principal para gestión de notificaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  Notification,
  NotificationFilters
} from '../../types/models';
import {
  getNotifications,
  getUnreadCount
} from '../../services/notifications';

interface UseNotificationsOptions {
  filters?: NotificationFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseNotificationsReturn {
  // Datos
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;

  // Estados de carga
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;

  // Paginación
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;

  // Acciones
  refetch: () => void;
  setFilters: (filters: NotificationFilters) => void;
  loadMore: () => void;
  refreshUnreadCount: () => void;

  // Utilidades
  getNotification: (id: number) => Notification | undefined;
  hasUnread: boolean;
}

export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const { filters = {}, enabled = true, refetchInterval } = options;
  const [currentFilters, setCurrentFilters] = useState<NotificationFilters>(filters);

  // Query para obtener notificaciones
  const {
    data: notificationsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', currentFilters],
    queryFn: () => getNotifications(currentFilters),
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 segundos
  });

  // Query para obtener conteo de no leídas
  const {
    data: unreadData,
    refetch: refetchUnreadCount,
  } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled,
    refetchInterval: 60000, // Cada minuto
    staleTime: 30000,
  });

  // Función para obtener una notificación específica
  const getNotification = useCallback((id: number): Notification | undefined => {
    return notificationsData?.results.find((notification: Notification) => notification.id === id);
  }, [notificationsData]);

  // Función para cargar más notificaciones (paginación)
  const loadMore = useCallback(() => {
    if (!notificationsData?.next) return;

    const nextPage = (currentFilters.page || 1) + 1;
    setCurrentFilters(prev => ({ ...prev, page: nextPage }));
  }, [notificationsData?.next, currentFilters.page]);

  // Función para actualizar filtros
  const setFilters = useCallback((newFilters: NotificationFilters) => {
    setCurrentFilters({ ...newFilters, page: 1 }); // Reset a página 1
  }, []);

  // Función para refrescar conteo de no leídas
  const refreshUnreadCount = useCallback(() => {
    refetchUnreadCount();
  }, [refetchUnreadCount]);

  // Efecto para invalidar queries cuando cambian los filtros
  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(currentFilters)) {
      setCurrentFilters(filters);
    }
  }, [filters, currentFilters]);

  // Valores calculados
  const notifications = notificationsData?.results || [];
  const unreadCount = (unreadData as any)?.unread_count || 0;
  const totalCount = notificationsData?.count || 0;
  const hasNextPage = !!notificationsData?.next;
  const hasPreviousPage = !!notificationsData?.previous;
  const currentPage = currentFilters.page || 1;
  const totalPages = Math.ceil(totalCount / (currentFilters.per_page || 20));
  const hasUnread = unreadCount > 0;

  return {
    // Datos
    notifications,
    unreadCount,
    totalCount,

    // Estados
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,

    // Paginación
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalPages,

    // Acciones
    refetch: refetchNotifications,
    setFilters,
    loadMore,
    refreshUnreadCount,

    // Utilidades
    getNotification,
    hasUnread,
  };
};