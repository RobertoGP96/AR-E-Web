/**
 * Cliente SSE (Server-Sent Events) para notificaciones en tiempo real
 * Usa fetch + ReadableStream para soportar Authorization headers con JWT
 */

import type {
  SSEState,
  SSEConfig,
  Notification
} from '../../types/models';

export class NotificationSSEClient {
  private abortController: AbortController | null = null;
  private isConnecting = false;
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
   * Conecta al stream SSE usando fetch con Authorization header
   */
  async connect(): Promise<void> {
    if (this.isConnecting) return;
    if (this.abortController) {
      this.disconnect();
    }

    this.isConnecting = true;

    try {
      const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'access_token';
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        console.warn('[SSE] No auth token found, skipping connection');
        this.isConnecting = false;
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const sseUrl = `${apiUrl}${this.config.url}`;

      this.abortController = new AbortController();

      const response = await fetch(sseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      this.state.isConnected = true;
      this.state.error = undefined;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onConnected?.();
      this.onStateChange?.(this.state);
      this.startHeartbeatTimeout();

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          // Handle heartbeat event
          if (chunk.includes('event: heartbeat')) {
            this.state.lastHeartbeat = new Date().toISOString();
            this.onStateChange?.(this.state);
            this.resetHeartbeatTimeout();
            continue;
          }

          const dataLine = chunk.split('\n').find(l => l.startsWith('data: '));
          if (dataLine) {
            try {
              const data = JSON.parse(dataLine.slice(6));
              this.onNotification?.(data);
              this.resetHeartbeatTimeout();
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('[SSE] Connection error:', error);
      this.state.isConnected = false;
      this.state.error = 'Connection error';
      this.isConnecting = false;
      this.onError?.(error as Event);
      this.onStateChange?.(this.state);
      this.handleReconnect();
    }
  }

  /**
   * Desconecta del stream SSE
   */
  disconnect(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.isConnecting = false;

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