/**
 * Utilidad para calcular el estado de pago de una orden
 * 
 * IMPORTANTE: Esta lógica DEBE coincidir exactamente con la del backend
 * en backend/api/models/orders.py (métodos add_received_value y save)
 */

export type PayStatus = 'No pagado' | 'Pagado' | 'Parcial';

export interface PaymentStatusResult {
  newTotal: number;
  remaining: number;
  newStatus: PayStatus;
  statusColor: string;
}

/**
 * Calcula el estado de pago basado en la cantidad recibida y el costo total
 * 
 * @param currentReceived - Cantidad ya recibida
 * @param amountToAdd - Cantidad a agregar
 * @param totalCost - Costo total del pedido
 * @returns Objeto con el nuevo total, estado y color
 */
export function calculatePaymentStatus(
  currentReceived: number,
  amountToAdd: number,
  totalCost: number
): PaymentStatusResult {
  // Calcular el nuevo total
  const newTotal = currentReceived + amountToAdd;
  const remaining = totalCost - newTotal;

  // Redondear a 2 decimales para evitar problemas de precisión en punto flotante
  // Esta es la clave para que el frontend coincida con el backend
  const newTotalRounded = Math.round(newTotal * 100) / 100;
  const totalCostRounded = Math.round(totalCost * 100) / 100;

  // Determinar el estado de pago usando la misma lógica del backend
  let newStatus: PayStatus = 'No pagado';
  let statusColor = 'text-red-600';

  if (newTotalRounded >= totalCostRounded && totalCostRounded > 0) {
    newStatus = 'Pagado';
    statusColor = 'text-green-600';
  } else if (newTotalRounded > 0) {
    newStatus = 'Parcial';
    statusColor = 'text-yellow-600';
  }

  return {
    newTotal: newTotalRounded,
    remaining: Math.round(remaining * 100) / 100,
    newStatus,
    statusColor
  };
}

/**
 * Obtiene el color CSS basado en el estado de pago
 */
export function getPayStatusColor(status: PayStatus): string {
  const colors: Record<PayStatus, string> = {
    'No pagado': 'text-red-600',
    'Pagado': 'text-green-600',
    'Parcial': 'text-yellow-600'
  };
  return colors[status];
}

/**
 * Obtiene la etiqueta de texto basada en el estado de pago
 */
export function getPayStatusLabel(status: PayStatus): string {
  const labels: Record<PayStatus, string> = {
    'No pagado': 'No Pagado',
    'Pagado': 'Pagado',
    'Parcial': 'Pago Parcial'
  };
  return labels[status];
}
