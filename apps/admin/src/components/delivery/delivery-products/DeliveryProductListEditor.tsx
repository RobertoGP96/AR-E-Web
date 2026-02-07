import { Package, Trash2, Plus, Minus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/models";

// Define locally to match structure
export interface DeliveryProductItem {
  product: Product;
  amount: number;
}

interface DeliveryProductListEditorProps {
  items: DeliveryProductItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onAddClick?: () => void;
  isAddDisabled?: boolean;
  isLoading?: boolean;
}

export function DeliveryProductListEditor({
  items,
  onUpdateQuantity,
  onRemove,
}: DeliveryProductListEditorProps) {
  const totalItems = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">
              No hay productos seleccionados
            </p>
            <p className="text-sm text-slate-400 max-w-[200px] text-center mt-1 font-medium">
              Agrega artículos del inventario para crear la entrega
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {items.map((item) => {
              const { product, amount } = item;
              const productId = product.id;

              return (
                <div
                  key={productId}
                  className="group flex flex-col sm:flex-row items-center gap-4 p-4 hover:bg-slate-50/30 transition-all duration-200"
                >
                  <div className="relative h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <p className="text-sm font-bold text-slate-900 truncate capitalize">
                        {product.name}
                      </p>
                      <Badge
                        variant="secondary"
                        className="w-fit mx-auto sm:mx-0 text-[10px] font-mono bg-slate-100/80 text-slate-500 border-none px-2 py-0"
                      >
                        {product.sku}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 font-medium">
                      <span className="text-orange-500 font-bold">
                        ${(product.total_cost || 0).toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {product.category || "General"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between w-full sm:w-auto gap-6 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-white hover:text-orange-600 shadow-none"
                        disabled={amount <= 1}
                        onClick={() => onUpdateQuantity(productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">
                        {amount}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-white hover:text-blue-600 shadow-none border-none"
                        onClick={() => onUpdateQuantity(productId, 1)}
                        disabled={
                          (item.product.amount_purchased || 0) <= amount
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-black text-slate-900">
                        P.Unit
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {(product.total_cost || 0).toFixed(2)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => onRemove(productId)}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Summary minimalist */}
            <div className="p-6 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Truck className="h-32 w-32 -mr-12 -mt-12" />
              </div>
              <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-black">
                    Resumen del Envío
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    <span className="text-white">{totalItems}</span> unidades
                    seleccionadas para este envío.
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">
                    Valor Mercancía
                  </p>
                  <p className="text-2xl font-black text-white tabular-nums">
                    <span className="text-orange-400 mr-1">$</span>
                    {totalItems}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
