// Datos serializados que la página server pasa al workspace de
// preparación de entregas (todos los BigInt/Date ya como string).

export interface PendingDeliverySummary {
  id: string;
  status: string;
  deliverDate: string;
}

/** Recepción ya registrada en un paquete (fila de ProductReceived). */
export interface PackageReception {
  id: string;
  productId: string;
  productName: string;
  clientName: string;
  amount: number;
  observation: string | null;
}

/** Paquete listado en la fase de revisión (Enviado | Recibido | Procesado). */
export interface ReviewPackage {
  id: string;
  agency: string;
  tracking: string;
  status: string;
  arrivalDate: string;
  /** Llegadas ya marcadas en este paquete. */
  receptions: PackageReception[];
  /** Σ unidades de las recepciones del paquete. */
  unitsMarked: number;
}

/** Producto comprado con unidades aún sin marcar como llegadas. */
export interface ArrivalCandidate {
  id: string;
  name: string;
  orderId: string;
  clientId: string;
  clientName: string;
  requested: number;
  purchased: number;
  received: number;
  /** comprado − recibido: tope de unidades que se pueden marcar. */
  pendingArrival: number;
}

export interface PrepareProduct {
  id: string;
  name: string;
  orderId: string;
  requested: number;
  purchased: number;
  received: number;
  delivered: number;
  /** Unidades recibidas y aún no entregadas (siempre > 0 aquí). */
  ready: number;
  /** Unidades compradas todavía en camino (comprado − recibido). */
  incoming: number;
  /** Paquetes en los que se recibió el producto, con unidades por paquete. */
  packages: { id: string; agency: string; tracking: string; amount: number }[];
}

export interface PrepareClientGroup {
  clientId: string;
  clientName: string;
  phoneNumber: string;
  /** agent_profit del agente asignado (para el preview de ganancia). */
  agentProfit: number;
  products: PrepareProduct[];
  totalReady: number;
  /** Unidades del cliente aún en camino (todas sus compras sin recibir). */
  totalIncoming: number;
  /** Entregas del cliente aún en Pendiente / En transito. */
  pending: PendingDeliverySummary[];
}
