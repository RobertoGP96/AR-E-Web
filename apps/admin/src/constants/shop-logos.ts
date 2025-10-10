/**
 * Mapeo de logos de tiendas
 * Centraliza la lógica de selección de logos para mejor mantenibilidad
 */

import adidasLogo from '@/assets/stores/adidas.svg';
import aliexpressLogo from '@/assets/stores/aliexpress.svg';
import amazonLogo from '@/assets/stores/amazon.svg';
import ebayLogo from '@/assets/stores/ebay.svg';
import nikeLogo from '@/assets/stores/nike.svg';
import sheinLogo from '@/assets/stores/shein.svg';
import temuLogo from '@/assets/stores/temu.svg';
import wallmartLogo from '@/assets/stores/wallmart.svg';

export const SHOP_LOGOS: Record<string, string> = {
  adidas: adidasLogo,
  aliexpress: aliexpressLogo,
  amazon: amazonLogo,
  ebay: ebayLogo,
  nike: nikeLogo,
  shein: sheinLogo,
  temu: temuLogo,
  walmart: wallmartLogo,
  wallmart: wallmartLogo, // Alias para compatibilidad
};

export const DEFAULT_SHOP_LOGO = amazonLogo;

/**
 * Obtiene el logo de una tienda basándose en su nombre
 * @param shopName - Nombre de la tienda
 * @returns URL del logo o logo por defecto
 */
export function getShopLogo(shopName: string): string {
  const normalizedName = shopName.toLowerCase().trim();
  
  // Buscar coincidencia exacta o parcial
  for (const [key, logo] of Object.entries(SHOP_LOGOS)) {
    if (normalizedName.includes(key)) {
      return logo;
    }
  }
  
  return DEFAULT_SHOP_LOGO;
}
