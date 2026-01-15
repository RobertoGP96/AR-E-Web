export interface CardOperation {
  date: string | null;
  type: OperationType;
  amount: number;
  status: PaymentStatusEnum;
  shop: string;
  shopping_account?: string;
  refunded_amount?: number;
  refund_count?: number;
  product?: string;
  notes?: string;
}

export interface CardOperationsData {
  card_id: string;
  total_purchases: number;
  total_refunded: number;
  net_amount: number;
  operations: CardOperation[];
}

export interface CardOperationsResponse {
  cards: CardOperationsData[];
  total_cards: number;
  start_date: string | null;
  end_date: string | null;
  card_filter: string | null;
}

export interface CardOperationsFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  cardId?: string;
}

export enum PaymentStatusEnum {
  PAGADO = 'PAGADO',
  PENDIENTE = 'PENDIENTE',
  CANCELADO = 'CANCELADO',
  REEMBOLSADO = 'REEMBOLSADO',
  NO_PAGADO = 'NO_PAGADO'
}

export enum OperationType {
  COMPRA = 'COMPRA',
  REEMBOLSO = 'REEMBOLSO'
}
