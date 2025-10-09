/**
 * Servicio específico para actualizar tiendas existentes
 * Maneja operaciones de edición y modificación de shops
 */

import { apiClient } from '@/lib/api-client';
import type { 
  Shop, 
  UpdateShopData 
} from '@/types/models/shop';

// Usar directamente Partial<UpdateShopData> del modelo
export type UpdateShopPayload = Partial<UpdateShopData>;

/**
 * Servicio para actualizar tiendas existentes
 */
export class UpdateShopService {
  private readonly endpoint = '/api_data/shop';

  /**
   * Actualiza una tienda específica
   */
  async updateShop(id: string | number, data: UpdateShopPayload): Promise<Shop> {
    // Filtrar datos vacíos o undefined
    const cleanData = this.cleanUpdateData(data);
    
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    return apiClient.patch<Shop>(`${this.endpoint}/${id}/`, cleanData);
  }

  /**
   * Actualiza completamente una tienda (PUT)
   */
  async replaceShop(id: string | number, data: Required<UpdateShopPayload>): Promise<Shop> {
    // Validar que todos los campos requeridos estén presentes
    this.validateCompleteShopData(data);

    return apiClient.put<Shop>(`${this.endpoint}/${id}/`, data);
  }

  /**
   * Actualiza solo el nombre de una tienda
   */
  async updateShopName(id: string | number, name: string): Promise<Shop> {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }

    return this.updateShop(id, { name: name.trim() });
  }

  /**
   * Actualiza solo el enlace de una tienda
   */
  async updateShopLink(id: string | number, link: string): Promise<Shop> {
    if (!link || link.trim().length === 0) {
      throw new Error('El enlace no puede estar vacío');
    }

    // Validar formato de URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(link.trim())) {
      throw new Error('El enlace debe ser una URL válida (http:// o https://)');
    }

    return this.updateShop(id, { link: link.trim() });
  }

  /**
   * Obtiene una tienda antes de actualizarla (para verificar cambios)
   */
  async getShopForUpdate(id: string | number): Promise<Shop> {
    return apiClient.get<Shop>(`${this.endpoint}/${id}/`);
  }

  /**
   * Actualiza una tienda solo si ha cambiado
   */
  async updateShopIfChanged(
    id: string | number, 
    newData: UpdateShopPayload, 
    currentData: Shop
  ): Promise<Shop | null> {
    const changes = this.detectChanges(newData, currentData);
    
    if (Object.keys(changes).length === 0) {
      return null; // No hay cambios
    }

    return this.updateShop(id, changes);
  }

  /**
   * Limpia datos de actualización removiendo valores vacíos
   */
  private cleanUpdateData(data: UpdateShopPayload): UpdateShopPayload {
    const cleaned: UpdateShopPayload = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            (cleaned as Record<string, unknown>)[key] = trimmed;
          }
        } else {
          (cleaned as Record<string, unknown>)[key] = value;
        }
      }
    });

    return cleaned;
  }

  /**
   * Valida datos para reemplazo completo de tienda
   */
  private validateCompleteShopData(data: Required<UpdateShopPayload>): void {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre es requerido');
    }

    if (!data.link || data.link.trim().length === 0) {
      errors.push('El enlace es requerido');
    } else {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(data.link.trim())) {
        errors.push('El enlace debe ser una URL válida');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Detecta cambios entre datos nuevos y actuales
   */
  private detectChanges(newData: UpdateShopPayload, currentData: Shop): UpdateShopPayload {
    const changes: UpdateShopPayload = {};

    Object.entries(newData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const currentValue = currentData[key as keyof Shop];
        
        if (typeof value === 'string' && typeof currentValue === 'string') {
          if (value.trim() !== currentValue.trim()) {
            (changes as Record<string, unknown>)[key] = value.trim();
          }
        } else if (value !== currentValue) {
          (changes as Record<string, unknown>)[key] = value;
        }
      }
    });

    return changes;
  }
}

// Instancia singleton del servicio
export const updateShopService = new UpdateShopService();
