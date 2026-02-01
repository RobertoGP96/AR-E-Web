import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Store, Tag } from "lucide-react";
import ProductAmount from "./product-amount";
import ProductTimeline from "./product-timeline";
import { useProduct } from "@/hooks/product/useProduct";
import { parseTagsFromDescriptionBlock } from "@/lib/tags";
import LoadingSpinner from "../utils/LoadingSpinner";

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading, error } = useProduct(id || "");

  if (isLoading) {
    return (
      <LoadingSpinner size="lg" text="Cargando detalles del producto..." />
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {error?.message || "Producto no encontrado"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const description =
    product.description?.split("--TAGS--")[0] || "Sin descripción";
  const tags = parseTagsFromDescriptionBlock(product.description);

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Encabezado del Producto */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-100"
                />
              ) : (
                <div className="h-16 w-16 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-orange-400" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 capitalize">
                  {product.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    SKU: {product.sku}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      product.status === "Encargado"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : product.status === "Cancelado"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-700 block text-xs uppercase tracking-wider mb-0.5">
                  Pedido Asociado
                </span>
                <span className="font-mono text-gray-900 font-semibold">
                  #
                  {typeof product.order === "number"
                    ? product.order
                    : product.order?.id || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - Información */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Package className="h-5 w-5 text-gray-500" />
                Detalles Generales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    Tienda
                  </h4>
                  <p className="text-gray-900 font-medium">{product.shop}</p>
                </div>
                {product.category && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Categoría
                    </h4>
                    <p className="text-gray-900 font-medium">
                      {product.category}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Descripción
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  {description}
                </p>
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/50">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white border border-gray-200 text-gray-600"
                      >
                        {tag.name}
                        {tag.value ? `: ${tag.value}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {product.observation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Observaciones
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed italic bg-yellow-50/50 p-3 rounded border border-yellow-100">
                    "{product.observation}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Creado
                  </h4>
                  <p className="text-sm text-gray-900 font-mono">
                    {product.created_at
                      ? new Date(product.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Actualizado
                  </h4>
                  <p className="text-sm text-gray-900 font-mono">
                    {product.updated_at
                      ? new Date(product.updated_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <ProductAmount product={product} />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="pt-2">
            <ProductTimeline productId={id || ""} />
          </div>
        </div>

        {/* Columna Lateral - Financiera */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-6 border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-md bg-orange-50">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                Desglose Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Costo Base */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Precio en Tienda</span>
                  <span className="font-medium text-gray-900">
                    ${(product.shop_cost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Envío Tienda</span>
                  <span className="font-medium text-gray-900">
                    + ${(product.shop_delivery_cost || 0).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Subtotal Base
                  </span>
                  <span className="font-bold text-gray-900">
                    $
                    {(
                      (product.shop_cost || 0) +
                      (product.shop_delivery_cost || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Impuestos */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Impuestos
                </h4>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tienda</span>
                  <span className="font-medium text-gray-900">
                    + ${(product.shop_taxes || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Propio</span>
                  <span className="font-medium text-gray-900">
                    + ${(product.own_taxes || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Adicional</span>
                  <span className="font-medium text-gray-900">
                    + ${(product.added_taxes || 0).toFixed(2)}
                  </span>
                </div>

                {/* IVA */}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">IVA (7%)</span>
                    {(product.charge_iva ?? true) ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">
                        Aplicado
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-medium line-through">
                        Exento
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-medium ${(product.charge_iva ?? true) ? "text-gray-900" : "text-gray-400"}`}
                  >
                    + ${(product.base_tax || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Total Final */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Costo Total
                </p>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-3xl font-light text-gray-900 tracking-tight text-center">
                    ${(product.total_cost || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
