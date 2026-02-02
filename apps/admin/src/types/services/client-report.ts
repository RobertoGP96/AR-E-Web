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
  total_balance: number;
  status: 'DEUDA' | 'SALDO A FAVOR' | 'AL DÍA';
  pending_to_pay: number;
  surplus_balance: number;
}

export interface ClientBalancesReportResponse {
  success: boolean;
  data: ClientBalanceEntry[];
  message: string;
}
