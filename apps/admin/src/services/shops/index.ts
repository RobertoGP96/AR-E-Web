/**
 * Índice de servicios para Shops
 * Exporta todos los servicios relacionados con la gestión de tiendas
 */

// Importar servicios específicos
import { getShopsService, type GetShopsFilters } from './get-shops.service';
import { createShopService, type CreateShopPayload, type CreateShopValidation } from './create-shop.service';
import { updateShopService, type UpdateShopPayload } from './update-shop.service';
import { deleteShopService, type DeleteShopOptions } from './delete-shop.service';

// Exportar servicios individuales
export { getShopsService, type GetShopsFilters };
export { createShopService, type CreateShopPayload, type CreateShopValidation };
export { updateShopService, type UpdateShopPayload };
export { deleteShopService, type DeleteShopOptions };

// Exportar tipos de los modelos
export type { 
  Shop, 
  CreateShopData, 
  UpdateShopData 
} from '@/types/models/shop';

// Crear un objeto consolidado con todos los servicios específicos
export const shopServices = {
  get: getShopsService,
  create: createShopService,
  update: updateShopService,
  delete: deleteShopService,
};

// Export por defecto del objeto consolidado
export default shopServices;
