/**
 * Shop name → brand logo mapping (SVGs in /public/stores, ported from
 * the Vite admin's constants/shop-logos.ts). Matching is by substring
 * over the normalized shop name, so "Amazon US" or "SHEIN México"
 * still resolve. Unknown shops get no logo — the ShopAvatar component
 * falls back to a generic store icon instead of a wrong brand.
 */
const SHOP_LOGOS: Record<string, string> = {
  adidas: '/stores/adidas.svg',
  aliexpress: '/stores/aliexpress.svg',
  amazon: '/stores/amazon.svg',
  converse: '/stores/converse.svg',
  ebay: '/stores/ebay.svg',
  fashionnova: '/stores/fashionnova.svg',
  'fashion nova': '/stores/fashionnova.svg',
  newegg: '/stores/newegg.svg',
  nike: '/stores/nike.svg',
  shein: '/stores/shein.svg',
  temu: '/stores/temu.svg',
  walmart: '/stores/wallmart.svg',
  wallmart: '/stores/wallmart.svg',
  wish: '/stores/wish.svg',
};

export function getShopLogo(shopName: string): string | null {
  const normalized = shopName.toLowerCase().trim();
  for (const [key, logo] of Object.entries(SHOP_LOGOS)) {
    if (normalized.includes(key)) return logo;
  }
  return null;
}
