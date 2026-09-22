import { parseId } from '@/lib/action-helpers';
import { NewPurchaseClient } from './new-purchase-client';
import {
  loadPendingCandidates,
  loadPendingShopsOfOrder,
  loadShopOptions,
} from '../queries';

interface PageProps {
  searchParams: Promise<{ shop?: string; order?: string }>;
}

/**
 * Nueva compra a partir de los productos pendientes de una tienda
 * (ADR-0002). La tienda viaja en la URL (`?shop=`) para que la página
 * cargue solo sus candidatos; `?order=` preselecciona los productos de
 * esa orden y acota las tiendas a las que tienen pendientes en ella.
 */
export default async function NewPurchasePage({ searchParams }: PageProps) {
  const { shop, order } = await searchParams;
  const orderId = order ? parseId(order) : null;

  const [shopOptions, orderShops] = await Promise.all([
    loadShopOptions(),
    orderId ? loadPendingShopsOfOrder(orderId) : Promise.resolve(null),
  ]);

  // Tienda efectiva: la de la URL si existe; si viene una orden con una
  // sola tienda pendiente, esa.
  let shopId = shop ? parseId(shop) : null;
  if (!shopId && orderShops && orderShops.length === 1) {
    shopId = BigInt(orderShops[0].shopId);
  }
  const shopIdStr = shopId ? shopId.toString() : null;
  if (shopIdStr && !shopOptions.some((s) => s.id === shopIdStr)) {
    shopId = null;
  }

  const candidates = shopId ? await loadPendingCandidates(shopId) : null;

  return (
    <NewPurchaseClient
      shopOptions={shopOptions}
      shopId={shopId ? shopId.toString() : null}
      candidates={candidates}
      orderContext={
        orderId && orderShops
          ? { orderId: orderId.toString(), shops: orderShops }
          : null
      }
    />
  );
}
