import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Store,
  Tag,
  DollarSign,
  Package,
  Box,
  Truck,
  ShoppingBag,
  Edit2,
} from "lucide-react";
import { parseTagsFromDescriptionBlock } from "@/lib/tags";
import type { Product } from "@/types/models";
import QRLink from "./qr-link";

interface ProductRowProps {
  product: Product;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  selectable = false,
  isSelected = false,
  onSelect,
  onEdit,
}) => {
  const tags = parseTagsFromDescriptionBlock(product.description);

  const handleRowClick = (e: React.MouseEvent) => {
    // Evitar que el click se propague si se hizo en el checkbox
    if ((e.target as HTMLElement).closest("[data-checkbox]")) return;
    if (selectable) {
      onSelect?.(product);
    }
  };

  return (
    <Card
      className={`w-full transition-all duration-200 border-gray-200 bg-white group hover:border-orange-200 ${
        selectable ? "cursor-pointer hover:shadow-lg" : "hover:shadow-md"
      } ${isSelected ? "ring-2 ring-orange-500 bg-orange-50/10" : ""}`}
      onClick={handleRowClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox de selección */}
          {selectable && (
            <div className="pt-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(product)}
                className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                data-checkbox
              />
            </div>
          )}

          {/* Imagen del producto */}
          <div className="flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
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
                  {product.name}
                </h3>
                <QRLink
                  link={product.link || "https://arye-shipps.netlify.app"}
                />
              </div>
              {product.sku && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 font-mono text-gray-500 bg-gray-100 border-gray-200"
                >
                  {product.sku}
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
                  {product.shop}
                </span>
              </div>

              {product.category && (
                <div className="flex items-center gap-1.5" title="Categoría">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <span>{product.category}</span>
                </div>
              )}

              <div
                className="flex items-center gap-1.5"
                title="Cantidad Solicitada"
              >
                <Box className="h-3.5 w-3.5 text-orange-500 " />
                <span className="font-medium text-orange-700">
                  Solicitado: {product.amount_requested}
                </span>
              </div>

              <div
                className="flex items-center gap-1.5"
                title="Cantidad Comprada"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">
                  Comprado: {product.amount_purchased}
                </span>
              </div>

              <div
                className="flex items-center gap-1.5"
                title="Cantidad Recibida"
              >
                <Truck className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">
                  Recibido: {product.amount_received}
                </span>
              </div>
            </div>
          </div>

          {/* Costos y Acciones */}
          <div className="flex flex-col items-end gap-1 min-w-[100px]">
            <div className="flex items-center gap-1 text-lg font-bold text-gray-900 leading-none">
              <span className="text-xs font-normal text-gray-400 mr-1 self-end mb-1">
                Total
              </span>
              <DollarSign className="h-4 w-4 text-green-600 stroke-[2.5]" />
              <span className="text-green-700">
                {(product.total_cost || 0).toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              <Badge
                variant="outline"
                className="text-[10px] bg-gray-50 font-normal"
              >
                {product.status}
              </Badge>
            </div>

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="mt-2 h-7 px-2 text-xs text-gray-500 hover:text-orange-600 hover:bg-orange-50"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductRow;
