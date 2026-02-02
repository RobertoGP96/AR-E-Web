"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Package,
  Search,
  Box,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  CreateProductReceivedData,
  Product,
  ProductReceived,
} from "@/types/models";

interface PackageProductSelectorProps {
  products: Product[];
  statusFilter?: string;
  initialCart?: ProductReceived[];
  onCartChange?: (
    cart: CreateProductReceivedData[],
    fullCartDetails?: ProductReceived[],
  ) => void;
  showSummary?: boolean;
  maxHeight?: string;
}

export function PackageProductSelector({
  products,
  statusFilter = "Comprado",
  initialCart = [],
  onCartChange,
  showSummary = true,
  maxHeight = "400px",
}: PackageProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<ProductReceived[]>(initialCart);

  // Filtrado optimizado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Filtro por estado
      if (product.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // 2. Filtro por búsqueda de texto (si existe)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower);

        return matchesSearch;
      }

      return true;
    });
  }, [products, statusFilter, searchTerm]);

  // Calcular totales
  const cartSummary = useMemo(() => {
    const totalItems = cart.reduce(
      (sum, item) => sum + item.amount_received,
      0,
    );
    return { totalItems };
  }, [cart]);

  // Convertir cart a formato CreateProductReceivedData
  const convertCartToCreateData = (
    cartItems: ProductReceived[],
  ): CreateProductReceivedData[] => {
    return cartItems.map((item) => ({
      original_product_id: item.original_product.id,
      amount_received: item.amount_received,
      observation: item.observation,
    }));
  };

  const updateCart = (newCart: ProductReceived[]) => {
    setCart(newCart);
    const createData = convertCartToCreateData(newCart);
    onCartChange?.(createData, newCart);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(
      (item) => item.original_product.id === product.id,
    );

    if (existingItem) {
      const newCart = cart.map((item) =>
        item.original_product.id === product.id
          ? { ...item, amount_received: item.amount_received + 1 }
          : item,
      );
      updateCart(newCart);
    } else {
      updateCart([
        ...cart,
        {
          id: 0, // Temp ID
          original_product: product,
          amount_received: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ProductReceived,
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    updateCart(cart.filter((item) => item.original_product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart
      .map((item) => {
        if (item.original_product.id === productId) {
          const newQuantity = item.amount_received + delta;
          if (newQuantity <= 0) return null;
          return { ...item, amount_received: newQuantity };
        }
        return item;
      })
      .filter(Boolean) as ProductReceived[];

    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const getCartQuantity = (productId: string) => {
    return (
      cart.find((item) => item.original_product.id === productId)
        ?.amount_received || 0
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Lista de productos disponibles */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="h-5 w-5 text-orange-500" />
            Productos Disponibles
          </CardTitle>
          <CardDescription>
            {statusFilter && `Mostrando productos con estado: ${statusFilter}`}
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 translate-y-[-25%] text-slate-400" />
            <Input
              placeholder="Buscar por nombre, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-orange-500"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <ScrollArea className="pr-4" style={{ height: maxHeight }}>
            <div className="grid gap-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    {searchTerm
                      ? "No se encontraron productos"
                      : "No hay productos listos para empacar"}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const cartQty = getCartQuantity(product.id);
                  return (
                    <div
                      key={product.id}
                      className={
                        "flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md " +
                        (cartQty > 0
                          ? "bg-orange-50/50 border-orange-200"
                          : "bg-white border-slate-100")
                      }
                    >
                      <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                        <Box className="h-7 w-7 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {product.sku}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{product.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          @{product.client_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cartQty > 0 ? (
                          <div className="flex items-center gap-1 bg-white rounded-xl border border-orange-200 p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-orange-100 hover:text-orange-600"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-orange-700">
                              {cartQty}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-orange-100 hover:text-orange-600"
                              disabled={cartQty >= product.amount_purchased}
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 font-bold"
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

      {/* Carrito de productos para el paquete */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              Contenido del Paquete
              {cart.length > 0 && (
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600">
                  {cart.length}
                </Badge>
              )}
            </CardTitle>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <CardDescription>
            Productos que se incluirán en este envío
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ScrollArea className="pr-4" style={{ height: maxHeight }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <ShoppingCart className="h-12 w-12 mb-4 text-slate-300" />
                <p className="font-bold text-slate-500">Paquete vacío</p>
                <p className="text-sm text-slate-400 mt-1">
                  Agrega productos desde la lista de la izquierda
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {cart.map((item) => (
                  <div
                    key={item.original_product.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Box className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">
                        {item.original_product.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Cantidad:{" "}
                        <span className="text-orange-600 font-bold">
                          {item.amount_received}
                        </span>{" "}
                        unidades
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white hover:text-orange-600"
                        onClick={() =>
                          updateQuantity(item.original_product.id, -1)
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center font-bold text-xs text-slate-700">
                        {item.amount_received}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white hover:text-orange-600"
                        onClick={() =>
                          updateQuantity(item.original_product.id, 1)
                        }
                        disabled={
                          item.original_product.amount_purchased -
                            item.amount_received <=
                          0
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Separator orientation="vertical" className="h-4 mx-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeFromCart(item.original_product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        {showSummary && cart.length > 0 && (
          <CardFooter className="flex-col items-start gap-4 border-t border-slate-100 pt-6 px-0 mt-4">
            <div className="w-full flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-lg shadow-slate-200">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Total Productos
                </p>
                <p className="text-xl font-black">
                  {cartSummary.totalItems}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    unidades
                  </span>
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
