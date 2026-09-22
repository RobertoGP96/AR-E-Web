// Datos serializados de recepción que comparten /packages/[id] y la
// fase «Paquetes» de /delivery/prepare (todos los BigInt/Date como string).

/** Recepción ya registrada en un paquete (fila de ProductReceived). */
export interface PackageReception {
  id: string;
  productId: string;
  productName: string;
  clientName: string;
  categoryName: string | null;
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
  packagePicture: string | null;
  /** Llegadas ya marcadas en este paquete. */
  receptions: PackageReception[];
  /** Σ unidades de las recepciones del paquete. */
  unitsMarked: number;
}

/** Producto comprado con unidades aún sin marcar como llegadas. */
export interface ArrivalCandidate {
  id: string;
  name: string;
  sku: string | null;
  orderId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  shopId: string;
  shopName: string;
  /** Compras (ShoppingReceip) en las que se compró el producto. */
  purchaseIds: string[];
  requested: number;
  purchased: number;
  received: number;
  /** comprado − recibido: tope de unidades que se pueden marcar. */
  pendingArrival: number;
  categoryId: string | null;
  /** null = sin categoría → no se puede procesar hasta asignarla. */
  categoryName: string | null;
}

export interface CategoryChoice {
  id: string;
  label: string;
}
