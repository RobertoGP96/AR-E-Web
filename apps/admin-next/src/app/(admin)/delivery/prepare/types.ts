// Datos serializados que la página server pasa al workspace de
// preparación de entregas (todos los BigInt/Date ya como string).

export type {
  ArrivalCandidate,
  CategoryChoice,
  PackageReception,
  ReviewPackage,
} from '../../packages/types';

/** Fila de una bolsa abierta (ProductDelivery de una entrega peso 0). */
export interface BagItem {
  /** id de la fila ProductDelivery (para ajustar/quitar). */
  id: string;
  productId: string;
  name: string;
  units: number;
}

/** Bolsa abierta: entrega «Pendiente» con peso 0 que se está llenando. */
export interface OpenBag {
  /** id de la DeliverReceip. */
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  /** clientShippingCharge de la categoría ($/lb) para el preview. */
  chargePerLb: number;
  items: BagItem[];
  units: number;
}

/** Entrega ya pesada del cliente aún sin entregar (Pendiente/En transito). */
export interface WeighedDelivery {
  id: string;
  status: string;
  categoryName: string | null;
  weight: number;
  weightCost: number;
  deliverDate: string;
}

/** Producto con unidades recibidas que no están en ninguna bolsa. */
export interface LooseProduct {
  id: string;
  name: string;
  orderId: string;
  categoryId: string | null;
  categoryName: string | null;
  requested: number;
  received: number;
  /** recibido − entregado: unidades sueltas que se pueden embolsar. */
  loose: number;
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
  /** Bolsas abiertas del cliente, una por categoría. */
  bags: OpenBag[];
  /** Recibido sin bolsa (llegó antes del auto-llenado o se retiró a mano). */
  loose: LooseProduct[];
  /** Entregas ya pesadas sin completar, como contexto. */
  weighed: WeighedDelivery[];
  unitsInBags: number;
  unitsLoose: number;
  /** Unidades del cliente aún en camino (todas sus compras sin recibir). */
  totalIncoming: number;
}
