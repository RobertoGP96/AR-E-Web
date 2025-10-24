/**
 * Servicio para scraping de Amazon
 *
 * Este módulo proporciona funciones para hacer scraping de productos individuales
 * y carritos de compra de Amazon a través de la API del backend.
 */

import { apiClient } from '../../lib/api-client';

// Tipos para las respuestas del scraping de Amazon

export interface AmazonProductData {
  asin: string | null;
  title: string;
  price: number | null;
  currency: string;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  category: string;
  rating: number | null;
  reviews_count: number | null;
  availability: string;
  url: string;
}

export interface AmazonCartProduct {
  asin: string;
  title: string;
  price: string;
  quantity: number;
  image_url: string;
  product_url: string;
}

export interface AmazonCartData {
  type: 'cart';
  cart_url: string;
  total_items: number;
  total_price: string;
  product_count: number;
  products: AmazonCartProduct[];
}

export type AmazonScrapeData = AmazonProductData | AmazonCartData;

export interface AmazonScrapeResponse {
  success: boolean;
  data: AmazonScrapeData;
}

export interface AmazonScrapeError {
  success: false;
  error: string;
}

export type AmazonScrapeResult = AmazonScrapeResponse | AmazonScrapeError;

/**
 * Verifica si los datos de respuesta corresponden a un carrito
 */
export function isCartData(data: AmazonScrapeData): data is AmazonCartData {
  return 'type' in data && data.type === 'cart';
}

/**
 * Verifica si los datos de respuesta corresponden a un producto individual
 */
export function isProductData(data: AmazonScrapeData): data is AmazonProductData {
  return !('type' in data);
}

/**
 * Realiza scraping de una URL de Amazon (producto o carrito)
 *
 * @param url - URL del producto o carrito de Amazon a scrapear
 * @returns Promise con los datos scrapeados o error
 *
 * @example
 * ```typescript
 * const result = await scrapeAmazon('https://amazon.com/dp/B08N5WRWNW');
 * if (result.success) {
 *   if (isProductData(result.data)) {
 *     console.log('Producto:', result.data.title);
 *   } else if (isCartData(result.data)) {
 *     console.log('Carrito con', result.data.total_items, 'items');
 *   }
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function scrapeAmazon(url: string): Promise<AmazonScrapeResult> {
  try {
    const response = await apiClient.post<AmazonScrapeResult>('/amazon/scrape/', {
      url: url.trim(),
    });

    return response;
  } catch (error) {
    console.error('Error scraping Amazon:', error);

    // El apiClient ya maneja los errores y los formatea
    // Retornar un error genérico si no se puede determinar el tipo
    return {
      success: false,
      error: 'Error inesperado al hacer scraping de Amazon',
    };
  }
}

/**
 * Realiza scraping de un producto individual de Amazon
 *
 * @param productUrl - URL del producto de Amazon
 * @returns Promise con los datos del producto o error
 */
export async function scrapeAmazonProduct(productUrl: string): Promise<AmazonScrapeResponse | AmazonScrapeError> {
  const result = await scrapeAmazon(productUrl);

  if (!result.success) {
    return result;
  }

  if (isProductData(result.data)) {
    return result;
  }

  // Si es un carrito pero se esperaba un producto, devolver error
  return {
    success: false,
    error: 'La URL proporcionada corresponde a un carrito, no a un producto individual',
  };
}

/**
 * Realiza scraping de un carrito de compra de Amazon
 *
 * @param cartUrl - URL del carrito de Amazon
 * @returns Promise con los datos del carrito o error
 */
export async function scrapeAmazonCart(cartUrl: string): Promise<AmazonScrapeResponse | AmazonScrapeError> {
  const result = await scrapeAmazon(cartUrl);

  if (!result.success) {
    return result;
  }

  if (isCartData(result.data)) {
    return result;
  }

  // Si es un producto pero se esperaba un carrito, devolver error
  return {
    success: false,
    error: 'La URL proporcionada corresponde a un producto individual, no a un carrito',
  };
}

/**
 * Valida si una URL es de Amazon
 *
 * @param url - URL a validar
 * @returns true si es una URL válida de Amazon
 */
export function isValidAmazonUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Dominios soportados de Amazon
    const amazonDomains = [
      'amazon.com',
    ];

    return amazonDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Extrae el ASIN de una URL de producto de Amazon
 *
 * @param url - URL del producto de Amazon
 * @returns ASIN si se encuentra, null en caso contrario
 */
export function extractAsinFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Patrones comunes de URLs de Amazon
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/,  // /dp/ASIN
      /\/gp\/product\/([A-Z0-9]{10})/,  // /gp/product/ASIN
      /\/gp\/aw\/d\/([A-Z0-9]{10})/,  // /gp/aw/d/ASIN
    ];

    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}
