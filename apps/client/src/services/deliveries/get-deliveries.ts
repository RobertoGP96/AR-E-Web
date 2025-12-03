/**
 * Servicio para obtener entregas
 */

import type { DeliverReceip } from '@/types/delivery';
import { apiClient } from '@/lib';
import type { BaseFilters } from '../../types/api';

/**
 * Obtiene una entrega específica por ID
 */
export const getDeliveryById = async (deliveryId: number) => {
  return await apiClient.get<DeliverReceip>(`/api_data/delivery_receips/${deliveryId}/`);
};

/**
 * Obtiene las entregas del usuario autenticado (cliente).
 * 
 * IMPORTANTE: 
 * - NO pasar client_id - el backend lo determina del token JWT
 * - El endpoint /my-deliveries/ solo acepta filtros (status, fecha, etc)
 * - SEGURIDAD: El backend valida que solo veas tus propias entregas
 * 
 * @param filters - Filtros opcionales (status, date_from, date_to)
 */
export const getMyDeliveries = async (filters?: { status?: string; date_from?: string; date_to?: string }) => {
  // ✅ SEGURIDAD: Advertir si alguien intenta pasar client_id
  if (filters && 'client_id' in filters) {
    console.warn('⚠️ SEGURIDAD: client_id debe ser determinado por el backend, no por el cliente');
    delete (filters as any).client_id;
  }

  return await apiClient.getPaginated<DeliverReceip>(
    '/api_data/delivery_receips/my-deliveries/', 
    filters as unknown as BaseFilters
  );
};
