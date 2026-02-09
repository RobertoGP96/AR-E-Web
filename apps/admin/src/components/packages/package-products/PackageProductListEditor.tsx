"use client";

import { Box, Minus, Plus, Trash2, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ProductReceived } from "@/types/models";

interface PackageProductListEditorProps {
  items: ProductReceived[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  isLoading?: boolean;
}

export function PackageProductListEditor({
  items,
  onUpdateQuantity,
  onRemove,
  isLoading = false,
}: PackageProductListEditorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Cargando productos...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          No hay productos vinculados
        </h3>
        <p className="text-slate-500 mt-2 max-w-[280px]">
          Comienza agregando los productos que contiene este paquete físico.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.original_product.id}
          className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-white transition-all rounded-2xl sm:rounded-none first:rounded-t-[28px] last:rounded-b-[28px]"
        >
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50 group-hover:scale-110 transition-transform duration-300">
              <Box className="h-8 w-8 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-extrabold text-slate-900 truncate text-base leading-tight">
                  {item.original_product.name}
                </h4>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0 rounded-md border-slate-200 text-slate-500 shrink-0"
                >
                  {item.original_product.sku}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="text-orange-600 flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {item.original_product.shop}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-slate-500 font-bold">
                  @{item.original_product.client_name}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-slate-400">
                  {item.original_product.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white hover:text-orange-600 hover:shadow-sm transition-all"
                onClick={() => onUpdateQuantity(item.original_product.id, -1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-10 text-center">
                <span className="font-black text-slate-900 text-lg">
                  {item.amount_received}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-white hover:text-orange-600 hover:shadow-sm transition-all"
                onClick={() => onUpdateQuantity(item.original_product.id, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Separator
                orientation="vertical"
                className="h-8 hidden sm:block"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                onClick={() => onRemove(item.original_product.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
