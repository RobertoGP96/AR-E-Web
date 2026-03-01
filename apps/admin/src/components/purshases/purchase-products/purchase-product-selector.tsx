"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Package,
  Box,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  CreateProductBuyedData,
  Product,
  ProductBuyed,
} from "@/types/models";
import { calculateProductPurchaseCost } from "@/lib/purchase-calculations";
import { ProductCatalogSearchBar } from "./ProductCatalogSearchBar";

type SearchCriteria = "nombre" | "sku" | "cliente" | "categoria";

interface ProductSelectorProps {
  products: Product[];
  shopFilter?: string;
  statusFilter?: string;
  initialCart?: ProductBuyed[];
  onCartChange?: (
    cart: CreateProductBuyedData[],
    fullCartDetails?: ProductBuyed[],
  ) => void;
  showSummary?: boolean;
  maxHeight?: string;
}

export function ProductSelector({
  products,
  shopFilter,
  statusFilter = "Encargado",
  initialCart = [],
  onCartChange,
  showSummary = true,
  maxHeight = "400px",
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCriteria, setSelectedCriteria] =
    useState<SearchCriteria>("nombre");
  const [cart, setCart] = useState<ProductBuyed[]>(initialCart);

  // Filtrado optimizado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Filtro por tienda (si existe)
      if (shopFilter) {
        if (
          !product.shop ||
          product.shop.toLowerCase() !== shopFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // 2. Filtro por estado
      if (
        !product.status ||
        product.status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Filtro por búsqueda de texto (si existe)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        switch (selectedCriteria) {
          case "nombre":
            return product.name?.toLowerCase().includes(searchLower) || false;
          case "sku":
            return product.sku?.toLowerCase().includes(searchLower) || false;
          case "cliente":
            return product.client_name?.toLowerCase().includes(searchLower) || false;
          case "categoria":
            return product.category?.toLowerCase().includes(searchLower) || false;
          default:
            return false;
        }
      }

      // Si no hay búsqueda, el producto ya pasó los filtros anteriores
      return true;
    });
  }, [products, shopFilter, statusFilter, searchTerm, selectedCriteria]);

  // Calcular totales
  const cartSummary = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.amount_buyed, 0);
    const totalCost = cart.reduce(
      (sum, item) => sum + calculateProductPurchaseCost(item),
      0,
    );
    return { totalItems, totalCost };
  }, [cart]);

  // Convertir cart a formato CreateProductBuyedData
  const convertCartToCreateData = (
    cartItems: ProductBuyed[],
  ): CreateProductBuyedData[] => {
    return cartItems.map((item) => ({
      original_product: item.product_id as string,
      amount_buyed: item.amount_buyed,
    }));
  };

  const updateCart = (newCart: ProductBuyed[]) => {
    setCart(newCart);
    const createData = convertCartToCreateData(newCart);
    onCartChange?.(createData, newCart); // Enviar ambos: el formato para API y los detalles completos
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(
      (item) => item.product_id?.toString() === product.id?.toString(),
    );

    if (existingItem) {
      const newCart = cart.map((item) =>
        item.product_id?.toString() === product.id?.toString()
          ? { ...item, amount_buyed: item.amount_buyed + 1 }
          : item,
      );
      updateCart(newCart);
    } else {
      updateCart([
        ...cart,
        {
          product_id: product.id?.toString(),
          original_product_details: product,
          amount_buyed: 1,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string | number) => {
    updateCart(
      cart.filter(
        (item) => item.product_id?.toString() !== productId?.toString(),
      ),
    );
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    const newCart = cart
      .map((item) => {
        if (item.product_id?.toString() === productId?.toString()) {
          const newQuantity = item.amount_buyed + delta;
          if (newQuantity <= 0) return null;
          return { ...item, amount_buyed: newQuantity };
        }
        return item;
      })
      .filter(Boolean) as ProductBuyed[];

    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const getCartQuantity = (productId: string | number) => {
    return (
      cart.find((item) => item.product_id?.toString() === productId?.toString())
        ?.amount_buyed || 0
    );
  };

  const handleSearch = (query: string, criteria: SearchCriteria) => {
    setSearchTerm(query);
    setSelectedCriteria(criteria);
  };

  const handleSelectSuggestion = (product: Product) => {
    // Scroll al producto seleccionado y destacarlo
    setTimeout(() => {
      const element = document.getElementById(`product-${product.id}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.classList.add("ring-2", "ring-orange-500", "rounded-lg");
      setTimeout(() => {
        element?.classList.remove("ring-2", "ring-orange-500", "rounded-lg");
      }, 2500);
    }, 100);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Lista de productos disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Disponibles
          </CardTitle>
          <CardDescription>
            {shopFilter && `Tienda: ${shopFilter}`}
            {shopFilter && statusFilter && " • "}
            {statusFilter && `Estado: ${statusFilter}`}
            {!shopFilter &&
              !statusFilter &&
              "Selecciona productos para agregar a la compra"}
          </CardDescription>
          <div className="pt-4">
            <ProductCatalogSearchBar
              products={filteredProducts}
              onSearch={handleSearch}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-4" style={{ height: maxHeight }}>
            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron productos"
                      : "No hay productos disponibles"}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const cartQty = getCartQuantity(product.id);
                  return (
                    <div
                      key={product.id}
                      id={`product-${product.id}`}
                      className={
                        "flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 " +
                        (cartQty > 0 ? "bg-orange-50 border-orange-200" : "")
                      }
                    >
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono text-xs">
                            {product.sku}
                          </span>
                          {product.amount_requested && (
                            <Badge variant="secondary" className="text-xs">
                              <Box className="h-3 w-3 mr-1 inline-block" />
                              {product.amount_requested}
                            </Badge>
                          )}
                          {product.amount_requested && (
                            <Badge variant="secondary" className="text-xs">
                              <ShoppingBag className="h-3 w-3 mr-1 inline-block" />
                              {product.amount_purchased}
                            </Badge>
                          )}
                          {product.status}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-semibold text-primary">
                            @{product.client_name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <p className="text-sm font-semibold">
                            ${product.total_cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cartQty > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {cartQty}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={
                                cartQty >=
                                product.amount_requested -
                                  product.amount_purchased
                              }
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Carrito de compras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito de Compra
                {cart.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {cart.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <CardDescription>
            Productos seleccionados para tu compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-4" style={{ height: maxHeight }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">Carrito vacío</p>
                <p className="text-sm">Agrega productos desde la lista</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {item.original_product_details?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        $
                        {(
                          item.original_product_details?.total_cost || 0
                        ).toFixed(2)}{" "}
                        × {item.amount_buyed} =
                        <span className="font-semibold ml-1">
                          ${calculateProductPurchaseCost(item).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.product_id as string, -1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">
                        {item.amount_buyed}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.product_id as string, 1)
                        }
                        disabled={
                          (item.original_product_details?.amount_requested ||
                            0) -
                            (item.original_product_details?.amount_purchased ||
                              0) -
                            item.amount_buyed <=
                          0
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          removeFromCart(item.product_id as string)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        {showSummary && cart.length > 0 && (
          <CardFooter className="flex-col items-start gap-2 border-t pt-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total de productos:
                </span>
                <span className="font-medium">
                  {cartSummary.totalItems} unidades
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Total estimado:</span>
                <span className="font-bold text-lg">
                  ${cartSummary.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
