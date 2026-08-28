// Datos serializados que la página server pasa al workspace de
// preparación de entregas (todos los BigInt/Date ya como string).

export interface PendingDeliverySummary {
  id: string;
  status: string;
  deliverDate: string;
}

export interface PrepareProduct {
  id: string;
  name: string;
  orderId: string;
  requested: number;
  received: number;
  delivered: number;
  /** Unidades recibidas y aún no entregadas (siempre > 0 aquí). */
  ready: number;
  /** Paquetes (únicos) en los que se recibió el producto. */
  packages: { id: string; agency: string; tracking: string }[];
}

export interface PrepareClientGroup {
  clientId: string;
  clientName: string;
  phoneNumber: string;
  /** agent_profit del agente asignado (para el preview de ganancia). */
  agentProfit: number;
  products: PrepareProduct[];
  totalReady: number;
  /** Entregas del cliente aún en Pendiente / En transito. */
  pending: PendingDeliverySummary[];
}
