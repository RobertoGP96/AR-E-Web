/**
 * Servicio específico para obtener listados de tiendas
 * Maneja operaciones de lectura y búsqueda de shops
 */

import { apiClient } from '@/lib/api-client';
import type { 
  PaginatedApiResponse, 
  BaseFilters 
} from '@/types/api';
import type { Shop } from '@/types/models/shop';

export interface GetShopsFilters extends BaseFilters {
  name?: string;
  link?: string;
  ordering?: 'name' | '-name' | 'id' | '-id';
}

/**
 * Servicio para obtener listados de tiendas
 */
export class GetShopsService {
  private readonly endpoint = '/api_data/shop/';

  /**
   * Obtiene todas las tiendas con filtros opcionales
   */
  async getAllShops(filters?: GetShopsFilters): Promise<PaginatedApiResponse<Shop>> {
    const params = {
      page: 1,
      per_page: 20,
      ...filters,
    };

    return apiClient.getPaginated<Shop>(this.endpoint, params);
  }

  /**
   * Obtiene tiendas con paginación específica
   */
  async getShopsPage(
    page: number = 1, 
    pageSize: number = 20, 
    filters?: Omit<GetShopsFilters, 'page' | 'per_page'>
  ): Promise<PaginatedApiResponse<Shop>> {
    return this.getAllShops({
      ...filters,
      page,
      per_page: pageSize,
    });
  }

  /**
   * Busca tiendas por nombre (búsqueda)
   */
  async searchShopsByName(query: string, limit: number = 10): Promise<PaginatedApiResponse<Shop>> {
    return this.getAllShops({
      search: query,
      per_page: limit,
      ordering: 'name',
    });
  }

  /**
   * Obtiene tiendas ordenadas por nombre
   */
  async getShopsOrderedByName(ascending: boolean = true): Promise<PaginatedApiResponse<Shop>> {
    return this.getAllShops({
      ordering: ascending ? 'name' : '-name',
      per_page: 100, // Obtener más resultados para listados completos
    });
  }

  /**
   * Obtiene tienda por nombre exacto
   */
  async getShopByName(name: string): Promise<PaginatedApiResponse<Shop>> {
    return this.getAllShops({
      name: name,
      per_page: 1,
    });
  }

  /**
   * Obtiene tienda por enlace exacto
   */
  async getShopByLink(link: string): Promise<PaginatedApiResponse<Shop>> {
    return this.getAllShops({
      link: link,
      per_page: 1,
    });
  }

  /**
   * Obtiene todas las tiendas sin paginación (útil para selects)
   */
  async getAllShopsForSelect(): Promise<Shop[]> {
    try {
      const response = await this.getAllShops({
        per_page: 1000, // Número alto para obtener todas
        ordering: 'name',
      });

      // Si hay más páginas, recopilar todas
      const totalPages = Math.ceil(response.count / 1000);
      if (response.next && totalPages > 1) {
        const allShops: Shop[] = [...(response.results || [])];
        
        for (let page = 2; page <= totalPages; page++) {
          const pageResponse = await this.getShopsPage(page, 1000);
          if (pageResponse.results) {
            allShops.push(...pageResponse.results);
          }
        }
        
        return allShops;
      }

      return response.results || [];
    } catch (error) {
      console.error('Error fetching all shops:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const getShopsService = new GetShopsService();
