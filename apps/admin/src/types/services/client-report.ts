/**
 * Tipos para el reporte de balances de clientes
 */

export interface ClientBalanceEntry {
  id: number;
  name: string;
  phone: string;
  email: string;
  agent_name: string;
  total_order_cost: number;
  total_order_received: number;
  total_deliver_cost: number;
  total_deliver_received: number;
  /** Posición neta (Σ efectivo − Σ costos). */
  total_balance: number;
  status: 'DEUDA' | 'SALDO A FAVOR' | 'AL DÍA';
  /** Deuda pendiente (RN-021 2.0.0). */
  pending_to_pay: number;
  /** Saldo a favor (RN-021 2.0.0, ≥ 0). */
  surplus_balance: number;
  /** Columnas cacheadas de CustomUser (si el backend las envía). */
  balance?: number;
  debt?: number;
}

export interface ClientBalancesReportResponse {
  success: boolean;
  data: ClientBalanceEntry[];
  message: string;
}
