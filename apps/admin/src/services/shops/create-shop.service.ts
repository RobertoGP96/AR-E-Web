/**
 * Servicio específico para crear nuevas tiendas
 * Maneja validaciones y operaciones de creación de shops
 */

import { apiClient } from '@/lib/api-client';
import type { 
  Shop, 
  CreateShopData 
} from '@/types/models/shop';

// Usar directamente CreateShopData del modelo
export type CreateShopPayload = CreateShopData;

export interface CreateShopValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  link: {
    required: boolean;
    pattern: RegExp;
  };
}

/**
 * Servicio para crear nuevas tiendas
 */
export class CreateShopService {
  private readonly endpoint = '/api_data/shop/';

  // Configuración de validación
  private readonly validation: CreateShopValidation = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    link: {
      required: true,
      pattern: /^https?:\/\/.+/i,
    },
  };

  /**
   * Crea una nueva tienda
   */
  async createShop(data: CreateShopPayload): Promise<Shop> {
    // Validar datos antes de enviar
    this.validateShopData(data);

    return apiClient.post<Shop>(this.endpoint, data);
  }

  /**
   * Valida los datos de una tienda antes de crearla
   */
  private validateShopData(data: CreateShopPayload): void {
    const errors: string[] = [];

    // Validar nombre
    if (!data.name) {
      errors.push('El nombre de la tienda es requerido');
    } else if (data.name.length < this.validation.name.minLength) {
      errors.push(`El nombre debe tener al menos ${this.validation.name.minLength} caracteres`);
    } else if (data.name.length > this.validation.name.maxLength) {
      errors.push(`El nombre no puede exceder ${this.validation.name.maxLength} caracteres`);
    }

    // Validar enlace
    if (!data.link) {
      errors.push('El enlace de la tienda es requerido');
    } else if (!this.validation.link.pattern.test(data.link)) {
      errors.push('El enlace debe ser una URL válida (http:// o https://)');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  /**
   * Verifica si una tienda con el mismo nombre ya existe
   */
  async checkShopExists(name: string): Promise<boolean> {
    try {
      const response = await apiClient.getPaginated<Shop>(this.endpoint, {
        name: name.trim(),
        per_page: 1,
      });

      return (response.results && response.results.length > 0) || false;
    } catch (error) {
      console.error('Error checking shop existence:', error);
      return false;
    }
  }

  /**
   * Verifica si un enlace ya está siendo usado por otra tienda
   */
  async checkLinkExists(link: string): Promise<boolean> {
    try {
      const response = await apiClient.getPaginated<Shop>(this.endpoint, {
        link: link.trim(),
        per_page: 1,
      });

      return (response.results && response.results.length > 0) || false;
    } catch (error) {
      console.error('Error checking link existence:', error);
      return false;
    }
  }

  /**
   * Crea una tienda con verificación previa de duplicados
   */
  async createShopSafe(data: CreateShopPayload): Promise<Shop> {
    // Verificar si ya existe una tienda con el mismo nombre
    const nameExists = await this.checkShopExists(data.name);
    if (nameExists) {
      throw new Error(`Ya existe una tienda con el nombre "${data.name}"`);
    }

    // Verificar si ya existe una tienda con el mismo enlace
    const linkExists = await this.checkLinkExists(data.link);
    if (linkExists) {
      throw new Error(`Ya existe una tienda con el enlace "${data.link}"`);
    }

    return this.createShop(data);
  }
}

// Instancia singleton del servicio
export const createShopService = new CreateShopService();
