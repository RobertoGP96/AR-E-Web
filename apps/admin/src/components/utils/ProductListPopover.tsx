import React from "react";
import { Package, Search, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ProductBuyed } from "@/types/models/product-buyed";
import type { ProductReceived } from "@/types/models/product-received";
import type { ProductDelivery } from "@/types/models/product-delivery";
import type { Product } from "@/types/models/product";

/**
 * Interfaz estandarizada para los items que mostrará el popover
 */
export interface ProductItem {
  id: string | number;
  name: string;
  quantity: number;
  image?: string;
  price?: number;
  sku?: string;
  category?: string;
  link?: string;
  additionalInfo?: Record<string, unknown>;
  originalData?: unknown;
}

interface ProductListPopoverProps {
  products: ProductItem[];
  title?: string;
  showPrice?: boolean;
  showCategory?: boolean;
  showSku?: boolean;
  triggerVariant?: "outline" | "ghost" | "secondary" | "default" | "link";
  triggerClassName?: string;
  emptyMessage?: string;
  popoverWidth?: string;
  popoverMaxHeight?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
}

/**
 * Componente reutilizable para mostrar listas de productos en un Popover.
 * Ideal para usar en tablas de Compras, Paquetes, Entregas y Pedidos.
 */
export const ProductListPopover: React.FC<ProductListPopoverProps> = ({
  products = [],
  title = "Productos",
  showPrice = false,
  showCategory = true,
  showSku = true,
  triggerVariant = "outline",
  triggerClassName,
  emptyMessage = "No hay productos en esta lista",
  popoverWidth = "w-80",
  popoverMaxHeight = "max-h-[400px]",
  disabled = false,
  align = "center",
}) => {
  const totalQuantity = products.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );
  const itemCount = products.length;

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground opacity-50",
          triggerClassName,
        )}
      >
        <Package className="h-4 w-4" />
        <span>{totalQuantity}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={cn(
            "h-8 gap-2 font-medium transition-all hover:bg-muted",
            totalQuantity > 0
              ? "text-primary border-primary/20 bg-primary/5"
              : "text-muted-foreground",
            triggerClassName,
          )}
        >
          <Package
            className={cn("h-4 w-4", totalQuantity > 0 && "animate-pulse-slow")}
          />
          <span>{totalQuantity}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn("p-0 shadow-xl", popoverWidth)}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold leading-none">{title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "producto" : "productos"} ·
                Total: {totalQuantity}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className={cn("overflow-y-auto", popoverMaxHeight)}>
          <div className="p-2">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 rounded-full bg-muted p-3 text-muted-foreground/50">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {products.map((item, index) => (
                  <div
                    key={item.id ? `${item.id}-${index}` : index}
                    className="group relative flex flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50 hover:border-border"
                  >
                    <div className="flex gap-3">
                      {/* Imagen o Placeholder */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted shadow-sm">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            <Package className="h-5 w-5 opacity-30" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-tl-md bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                          {item.quantity}
                        </div>
                      </div>

                      {/* Info del Producto */}
                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5
                            className="truncate text-xs font-bold text-foreground leading-tight"
                            title={item.name}
                          >
                            {item.name}
                          </h5>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {showSku && item.sku && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded truncate max-w-[80px]">
                              {item.sku}
                            </span>
                          )}
                          {showCategory && item.category && (
                            <span className="text-[10px] font-medium text-primary/80">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {showPrice && item.price !== undefined && (
                          <div className="mt-1 text-xs font-semibold text-emerald-600">
                            $
                            {item.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        {products.length > 0 && totalQuantity > 0 && (
          <div className="border-t bg-muted/10 p-2 px-4 flex justify-end">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Fin de la lista
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

/**
 * Hook personalizado para adaptar diferentes estructuras de datos
 * al formato esperado por ProductListPopover
 */
export const useProductListAdapter = () => {
  /**
   * Adapta productos de una compra (ProductBuyed)
   */
  const adaptBuyedProducts = (buyedProducts: ProductBuyed[]): ProductItem[] => {
    return (buyedProducts || []).map((item) => {
      const details = item.original_product_details;
      return {
        id: item.id || Math.random(),
        name: details?.name || "Producto sin nombre",
        quantity: item.amount_buyed || 0,
        image: details?.image_url,
        price: details?.total_cost,
        sku: details?.sku,
        category: details?.category,
        link: details?.link,
        originalData: item,
      };
    });
  };

  /**
   * Adapta productos de una entrega (ProductDelivery)
   */
  const adaptDeliveredProducts = (
    deliveredProducts: ProductDelivery[],
  ): ProductItem[] => {
    return (deliveredProducts || []).map((item) => {
      const product = item.original_product;
      return {
        id: item.id || Math.random(),
        name: product?.name || "Producto sin nombre",
        quantity: item.amount_delivered || 0,
        image: product?.image_url,
        sku: product?.sku,
        category: product?.category,
        link: product?.link,
        originalData: item,
      };
    });
  };

  /**
   * Adapta productos de un paquete (ProductReceived)
   */
  const adaptReceivedProducts = (
    receivedProducts: ProductReceived[],
  ): ProductItem[] => {
    return (receivedProducts || []).map((item) => {
      const product = item.original_product;
      return {
        id: item.id || Math.random(),
        name: product?.name || "Producto sin nombre",
        quantity: item.amount_received || 0,
        image: product?.image_url,
        sku: product?.sku,
        category: product?.category,
        link: product?.link,
        originalData: item,
      };
    });
  };

  /**
   * Adapta productos de un pedido (Order)
   * En este caso, el objeto Order suele tener una propiedad 'products' que son de tipo Product
   */
  const adaptOrderProducts = (
    products: (Product | Record<string, unknown>)[],
  ): ProductItem[] => {
    return (products || []).map((item) => {
      const product = item as Product;
      return {
        id: product.id || Math.random(),
        name: product.name || "Producto sin nombre",
        quantity: product.amount_requested || 1, // En pedidos se usa amount_requested o default 1
        image: product.image_url,
        price: product.total_cost,
        sku: product.sku,
        category: product.category,
        link: product.link,
        originalData: item,
      };
    });
  };

  return {
    adaptBuyedProducts,
    adaptDeliveredProducts,
    adaptReceivedProducts,
    adaptOrderProducts,
  };
};
