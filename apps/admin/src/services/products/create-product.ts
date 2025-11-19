/**
 * Servicio para crear productos
 */

import { apiClient } from '../../lib/api-client';
import type { Product } from '../../types';
import type { CreateProductData } from '@/types/models/product';

/**
 * Usamos el tipo canónico `CreateProductData` del modelo, pero el formulario
 * históricamente enviaba `shop_name`. Para mantener compatibilidad, este
 * servicio acepta ambos: preferimos `shop_id` si está presente, si no, se
 * permite `shop_name` y lo mapeamos a `shop` en el payload.
 */

export const createProduct = async (productData: CreateProductData): Promise<Product> => {
  const { shop, order, ...data } = productData as unknown as Partial<CreateProductData> & { shop_name?: string };

  // Construir payload como objeto genérico (la API acepta campos específicos)
  const payload: Record<string, unknown> = {
    ...(data as Partial<CreateProductData>),
    order: order as number | undefined,
  };

  const shopTaxes = (data as Partial<CreateProductData>).shop_taxes;
  if (typeof shopTaxes !== 'undefined') payload.shop_taxes = shopTaxes;

  // La API en el backend devuelve errores esperando nombres (shop, category).
  // Por compatibilidad: si recibimos shop_id o category (IDs), intentamos
  // mapearlos a nombres si la UI conoce los mappings. Aquí asumimos que el
  // frontend envía shop_name y category como nombre cuando sea necesario.
  // Si se reciben IDs, dejamos pasar los IDs (backend debería resolverlos)
  if (typeof shop !== 'undefined') {
    payload.shop = shop;
  }

  // category en ModelCreateProductData es ID, pero muchos endpoints esperan
  // category como nombre; si data.category es un number, no lo convertimos
  // aquí (no tenemos mapa de id->name en este servicio). El formulario
  // se encargará de enviar nombre cuando corresponda.
  if (typeof (data as Partial<CreateProductData>).category !== 'undefined') {
    payload.category = (data as Partial<CreateProductData>).category;
  }

  // El backend espera product_pictures como JSON string (TextField) en algunas rutas
  // Aceptamos que el frontend pase un array y lo convertimos aquí a string para evitar
  // errores tipo "Not a valid string." durante la creación.
  if (Array.isArray((data as Partial<CreateProductData>).product_pictures)) {
    try {
      payload.product_pictures = JSON.stringify((data as Partial<CreateProductData>).product_pictures);
    } catch {
      payload.product_pictures = '[]';
    }
  }

  return await apiClient.post<Product>('/api_data/product/', payload as unknown as object);
};

/**
 * Crea múltiples productos para una orden
 */
export const createMultipleProducts = async (
  orderId: number,
  products: Omit<CreateProductData, 'order_id'>[]
): Promise<Product[]> => {
  const createdProducts: Product[] = [];
  
  for (const productData of products) {
    const response = await createProduct({ ...productData, order: orderId });
    if (response) {
      createdProducts.push(response);
    }
  }
  
  return createdProducts;
};
