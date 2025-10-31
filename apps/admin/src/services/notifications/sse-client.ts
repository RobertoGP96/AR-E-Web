/**
 * Cliente SSE (Server-Sent Events) para notificaciones en tiempo real
 */

import type {
  SSEState,
  SSEConfig,
  Notification
} from '../../types/models';

export class NotificationSSEClient {
  private eventSource: EventSource | null = null;
  private config: Required<SSEConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;

  // Estado del cliente
  private state: SSEState = {
    isConnected: false,
  };

  // Callbacks
  private onNotification?: (notification: Notification) => void;
  private onConnected?: () => void;
  private onDisconnected?: () => void;
  private onError?: (error: Event) => void;
  private onStateChange?: (state: SSEState) => void;

  constructor(config: Partial<SSEConfig> = {}) {
    this.config = {
      url: config.url || '/arye_system/api_data/notifications/stream/',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatTimeout: config.heartbeatTimeout || 60000, // 1 minuto
    };
  }

  /**
   * Conecta al stream SSE
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource(this.config.url);

      // Evento de conexión
      this.eventSource.onopen = () => {
        console.log('SSE: Conectado al stream de notificaciones');
        this.state.isConnected = true;
        this.state.error = undefined;
        this.reconnectAttempts = 0;
        this.onConnected?.();
        this.onStateChange?.(this.state);
        this.startHeartbeatTimeout();
      };

      // Evento de notificación
      this.eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE: Nueva notificación recibida', data);
          this.onNotification?.(data);
          this.resetHeartbeatTimeout();
        } catch (error) {
          console.error('SSE: Error parseando notificación', error);
        }
      });

      // Evento de heartbeat
      this.eventSource.addEventListener('heartbeat', () => {
        this.state.lastHeartbeat = new Date().toISOString();
        this.resetHeartbeatTimeout();
      });

      // Evento de conexión confirmada
      this.eventSource.addEventListener('connected', (event) => {
        console.log('SSE: Conexión confirmada', event.data);
      });

      // Evento de error
      this.eventSource.onerror = (error) => {
        console.error('SSE: Error en la conexión', error);
        this.state.isConnected = false;
        this.state.error = 'Connection error';
        this.onError?.(error);
        this.onStateChange?.(this.state);
        this.handleReconnect();
      };

    } catch (error) {
      console.error('SSE: Error creando EventSource', error);
      this.handleReconnect();
    }
  }

  /**
   * Desconecta del stream SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    this.state.isConnected = false;
    this.onDisconnected?.();
    this.onStateChange?.(this.state);
  }

  /**
   * Maneja la reconexión automática
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('SSE: Máximo número de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`SSE: Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Inicia el timeout del heartbeat
   */
  private startHeartbeatTimeout(): void {
    this.resetHeartbeatTimeout();
  }

  /**
   * Resetea el timeout del heartbeat
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('SSE: Heartbeat timeout - reconectando...');
      this.state.error = 'Heartbeat timeout';
      this.onStateChange?.(this.state);
      this.handleReconnect();
    }, this.config.heartbeatTimeout);
  }

  /**
   * Obtiene el estado actual
   */
  getState(): SSEState {
    return { ...this.state };
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  // Setters para callbacks
  setOnNotification(callback: (notification: Notification) => void): void {
    this.onNotification = callback;
  }

  setOnConnected(callback: () => void): void {
    this.onConnected = callback;
  }

  setOnDisconnected(callback: () => void): void {
    this.onDisconnected = callback;
  }

  setOnError(callback: (error: Event) => void): void {
    this.onError = callback;
  }

  setOnStateChange(callback: (state: SSEState) => void): void {
    this.onStateChange = callback;
  }
}

// Instancia singleton del cliente SSE
let sseClient: NotificationSSEClient | null = null;

/**
 * Obtiene la instancia singleton del cliente SSE
 */
export const getSSEClient = (config?: Partial<SSEConfig>): NotificationSSEClient => {
  if (!sseClient) {
    sseClient = new NotificationSSEClient(config);
  }
  return sseClient;
};

/**
 * Conecta el cliente SSE
 */
export const connectSSE = (config?: Partial<SSEConfig>): NotificationSSEClient => {
  const client = getSSEClient(config);
  client.connect();
  return client;
};

/**
 * Desconecta el cliente SSE
 */
export const disconnectSSE = (): void => {
  if (sseClient) {
    sseClient.disconnect();
  }
};