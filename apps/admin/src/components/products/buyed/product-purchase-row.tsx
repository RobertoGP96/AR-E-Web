import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Store,
  Tag,
  Package,
  Box,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { parseTagsFromDescriptionBlock } from "@/lib/tags";
import type { ProductBuyed } from "@/types/models/product-buyed";
import QRLink from "../qr-link";
import { RefundBadge } from "./RefundBadge";
import { RefundPopover } from "./RefundPopover";

interface ProductBuyedShoppingProps {
  product: ProductBuyed;
}

const ProductPurchaseRow: React.FC<ProductBuyedShoppingProps> = ({
  product,
}) => {
  const tags = parseTagsFromDescriptionBlock(
    product.original_product_details?.description,
  );

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md border-gray-200 bg-white group hover:border-orange-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Imagen del producto */}
          <div className="flex-shrink-0">
              {product.original_product_details?.image_url ? (
              <img
                src={product.original_product_details?.image_url}
                alt={product.original_product_details?.name}
                className="w-16 h-16 object-contain rounded-lg border border-gray-100 bg-gray-50"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Información principal */}
          <div className="flex-1 min-w-0 grid gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[80%]">
                <h3 className="text-base font-semibold text-gray-900 truncate capitalize leading-tight">
                  {product.original_product_details?.name}
                </h3>
                <QRLink
                  link={
                    product.original_product_details?.link ||
                    "https://arye-shipps.netlify.app"
                  }
                />
                <RefundBadge
                  isRefunded={product.is_refunded as boolean}
                  refundDate={product.refund_date}
                  refundAmount={product.refund_amount}
                  refundNotes={product.refund_notes}
                />
              </div>
              {product.original_product_details?.sku && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 font-mono text-gray-500 bg-gray-100 border-gray-200"
                >
                  {product.original_product_details?.sku}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] px-2 py-0 h-5 border-gray-200 text-gray-600 bg-gray-50/50"
                  >
                    {tag.name}
                    {tag.value ? `: ${tag.value}` : ""}
                  </Badge>
                ))}
              </div>
            )}

            {/* Metadata Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1.5" title="Tienda">
                <Store className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-700">
                  {product.original_product_details?.shop}
                </span>
              </div>

              {product.original_product_details?.category && (
                <div className="flex items-center gap-1.5" title="Categoría">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <span>{product.original_product_details?.category}</span>
                </div>
              )}

              {product.original_product_details?.amount_requested && (
                <div
                  className="flex items-center gap-1.5"
                  title="Cantidad Solicitada"
                >
                  <Box className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    Solicitado:{" "}
                    {product.original_product_details?.amount_requested}
                  </span>
                </div>
              )}

              {product.amount_buyed && (
                <div
                  className="flex items-center gap-1.5"
                  title="Cantidad Comprada"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-orange-700 font-medium">
                    Comprado: {product.amount_buyed}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Costos y Acciones */}
          <div className="flex flex-col items-end gap-1 min-w-[120px]">
            <div className="flex items-center gap-1 text-lg font-bold text-gray-900 leading-none">
              <span className="text-xs font-normal text-gray-400 mr-1 self-end mb-1">
                Total
              </span>
              <DollarSign className="h-4 w-4 text-green-600 stroke-[2.5]" />
              <span
                className={
                  product.is_refunded
                    ? "text-gray-400 line-through decoration-gray-400"
                    : "text-green-700"
                }
              >
                {(
                  (product.original_product_details?.shop_cost || 0) *
                  (product.amount_buyed || 1)
                ).toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-gray-500 flex flex-col items-end gap-0.5">
              <span className="flex items-center gap-1">
                Envío: $
                {(
                  product.original_product_details?.shop_delivery_cost || 0
                ).toFixed(2)}
              </span>

              {product.is_refunded &&
                product.refund_amount &&
                product.refund_amount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 rounded-md">
                    - ${product.refund_amount.toFixed(2)}
                  </span>
                )}
            </div>

            <div className="mt-2 text-right">
              <RefundPopover productBuyed={product} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPurchaseRow;
