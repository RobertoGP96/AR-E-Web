/**
 * Servicio principal para la gestión de Shops
 * Proporciona métodos para obtener, crear, actualizar y eliminar tiendas
 */

import { apiClient } from '@/lib/api-client';
import type { 
  PaginatedApiResponse, 
  BaseFilters 
} from '@/types/api';
import type { 
  Shop, 
  CreateShopData, 
  UpdateShopData 
} from '@/types/models/shop';

// Filtros específicos para shops
export interface ShopFilters extends BaseFilters {
  name?: string;
  link?: string;
}

/**
 * Servicio para la gestión de tiendas
 */
export class ShopsService {
  private readonly baseUrl = '/api_data/shop';

  /**
   * Obtiene todas las tiendas con paginación y filtros
   */
  async getShops(filters?: ShopFilters): Promise<PaginatedApiResponse<Shop>> {
    return apiClient.getPaginated<Shop>(this.baseUrl + '/', filters);
  }

  /**
   * Obtiene una tienda específica por ID
   */
  async getShop(id: string | number): Promise<Shop> {
    return apiClient.get<Shop>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Crea una nueva tienda
   */
  async createShop(data: CreateShopData): Promise<Shop> {
    return apiClient.post<Shop>(`${this.baseUrl}/`, data);
  }

  /**
   * Actualiza una tienda existente
   */
  async updateShop(id: string | number, data: Partial<UpdateShopData>): Promise<Shop> {
    return apiClient.patch<Shop>(`${this.baseUrl}/${id}/`, data);
  }

  /**
   * Elimina una tienda
   */
  async deleteShop(id: string | number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Busca tiendas por nombre
   */
  async searchShops(query: string): Promise<PaginatedApiResponse<Shop>> {
    return this.getShops({ 
      search: query,
      per_page: 50 
    });
  }

  /**
   * Obtiene tiendas filtradas por nombre exacto
   */
  async getShopsByName(name: string): Promise<PaginatedApiResponse<Shop>> {
    return this.getShops({ 
      name: name 
    });
  }

  /**
   * Obtiene tiendas filtradas por enlace exacto
   */
  async getShopsByLink(link: string): Promise<PaginatedApiResponse<Shop>> {
    return this.getShops({ 
      link: link 
    });
  }
}

// Instancia singleton del servicio
export const shopsService = new ShopsService();
