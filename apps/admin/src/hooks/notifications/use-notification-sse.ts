/**
 * Hook para gestionar conexión SSE de notificaciones en tiempo real
 */

import { useEffect, useState, useCallback } from 'react';
import { getSSEClient, disconnectSSE } from '../../services/notifications';
import type { Notification, SSEState, SSEConfig } from '../../types/models';

interface UseNotificationSSEOptions {
  autoConnect?: boolean;
  config?: Partial<SSEConfig>;
}

interface UseNotificationSSEReturn {
  // Estado de la conexión
  isConnected: boolean;
  lastHeartbeat?: string;
  error?: string;

  // Notificación más reciente
  lastNotification?: Notification;

  // Controles de conexión
  connect: () => void;
  disconnect: () => void;

  // Callbacks
  setOnNotification: (callback: (notification: Notification) => void) => void;
  setOnConnected: (callback: () => void) => void;
  setOnDisconnected: (callback: () => void) => void;
  setOnError: (callback: (error: Event) => void) => void;
}

export const useNotificationSSE = (
  options: UseNotificationSSEOptions = {}
): UseNotificationSSEReturn => {
  const { autoConnect = true, config } = options;
  const [sseState, setSSEState] = useState<SSEState>({ isConnected: false });
  const [lastNotification, setLastNotification] = useState<Notification>();

  // Callbacks para manejar eventos SSE
  const handleNotification = useCallback((notification: Notification) => {
    setLastNotification(notification);
  }, []);



  const handleError = useCallback((error: Event) => {
    console.error('SSE: Error de conexión', error);
  }, []);

  const handleStateChange = useCallback((state: SSEState) => {
    setSSEState(state);
  }, []);

  // Función para conectar
  const connect = useCallback(() => {
    const client = getSSEClient(config);

    // Configurar callbacks
    client.setOnNotification(handleNotification);
    client.setOnError(handleError);
    client.setOnStateChange(handleStateChange);

    // Conectar
    client.connect();
  }, [config, handleNotification, handleStateChange, handleError]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    disconnectSSE();
  }, []);

  // Función para configurar callback de notificación
  const setOnNotification = useCallback((callback: (notification: Notification) => void) => {
    const client = getSSEClient();
    client.setOnNotification(callback);
  }, []);

  // Función para configurar callback de conexión
  const setOnConnected = useCallback((callback: () => void) => {
    const client = getSSEClient();
    client.setOnConnected(callback);
  }, []);

  // Función para configurar callback de desconexión
  const setOnDisconnected = useCallback((callback: () => void) => {
    const client = getSSEClient();
    client.setOnDisconnected(callback);
  }, []);

  // Función para configurar callback de error
  const setOnError = useCallback((callback: (error: Event) => void) => {
    const client = getSSEClient();
    client.setOnError(callback);
  }, []);

  // Efecto para conectar automáticamente
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup al desmontar
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // Estado
    isConnected: sseState.isConnected,
    lastHeartbeat: sseState.lastHeartbeat,
    error: sseState.error,

    // Notificación
    lastNotification,

    // Controles
    connect,
    disconnect,

    // Callbacks
    setOnNotification,
    setOnConnected,
    setOnDisconnected,
    setOnError,
  };
};