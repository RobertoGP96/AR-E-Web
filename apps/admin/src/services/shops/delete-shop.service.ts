/**
 * Servicio específico para eliminar tiendas
 * Maneja operaciones de eliminación de shops
 */

import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type { Shop } from '@/types/models/shop';

export interface DeleteShopOptions {
  force?: boolean; // Eliminación forzada incluso si tiene productos asociados
}

/**
 * Servicio para eliminar tiendas
 */
export class DeleteShopService {
  private readonly endpoint = '/api_data/shop';

  /**
   * Elimina una tienda específica
   */
  async deleteShop(id: string | number, options?: DeleteShopOptions): Promise<ApiResponse<void>> {
    const params = new URLSearchParams();
    
    if (options?.force) {
      params.append('force', 'true');
    }

    const url = `${this.endpoint}/${id}/${params.toString() ? `?${params.toString()}` : ''}`;
    
    return apiClient.delete<void>(url);
  }

  /**
   * Verifica si una tienda puede ser eliminada de forma segura
   * Nota: Esta funcionalidad depende de que el backend implemente este endpoint
   */
  async canDeleteShop(id: string | number): Promise<{
    canDelete: boolean;
    reason?: string;
    hasProducts?: boolean;
    hasOrders?: boolean;
  }> {
    try {
      // Intentar obtener la tienda para verificar que existe
      const shopResponse = await apiClient.get<Shop>(`${this.endpoint}/${id}/`);
      
      if (!shopResponse.data) {
        return {
          canDelete: false,
          reason: 'La tienda no existe',
        };
      }

      // Por defecto, asumimos que se puede eliminar
      // El backend de Django manejará las validaciones necesarias
      return {
        canDelete: true,
      };
    } catch (error) {
      console.error('Error checking if shop can be deleted:', error);
      return {
        canDelete: false,
        reason: 'Error al verificar si la tienda puede ser eliminada',
      };
    }
  }

  /**
   * Elimina una tienda con confirmación previa
   */
  async deleteShopSafe(id: string | number, options?: DeleteShopOptions): Promise<ApiResponse<void>> {
    // Verificar si se puede eliminar
    const canDelete = await this.canDeleteShop(id);
    
    if (!canDelete.canDelete && !options?.force) {
      throw new Error(canDelete.reason || 'La tienda no puede ser eliminada');
    }

    return this.deleteShop(id, options);
  }
}

// Instancia singleton del servicio
export const deleteShopService = new DeleteShopService();
